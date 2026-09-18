import { randomUUID } from "node:crypto";
import { read, save, event, digest, DomainError } from "../engine.ts";
import type { Database } from "../db.ts";
import type { Mission } from "../types.ts";
import { loadPolicy, fingerprint } from "./policy.ts";
import { snapshot } from "./github.ts";
import { modelRequest, estimatedCeiling, propose } from "./provider.ts";
import { preflight, verify } from "./runner.ts";
export const productionDependencies = {
  loadPolicy,
  snapshot,
  propose,
  preflight,
  verify,
};
export class CodingService {
  constructor(
    public db: Database,
    private dependencies = productionDependencies,
  ) {}
  async claim(workspace: string, now = new Date()) {
    return this.db.transaction(async (tx) => {
      const row = (
        await tx.query<{ document: Mission }>(
          "SELECT document FROM missions WHERE workspace=$1 AND document->>'mode'='coding' AND document->>'state'='ready' ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1",
          [workspace],
        )
      ).rows[0];
      if (!row) return null;
      const m = row.document;
      if (!m.coding || m.approvedDigest !== m.planDigest)
        throw new DomainError("Coding plan is not approved.", 409);
      m.codeRun = {
        id: randomUUID(),
        startedAt: now.toISOString(),
        dispatched: false,
        accountedCents: 0,
      };
      m.state = "running";
      event(m, "coding-worker", "Claimed a single-attempt coding run.");
      await save(tx, m);
      return m;
    });
  }
  private async update(claim: Mission, change: (m: Mission) => void) {
    return this.db.transaction(async (tx) => {
      const m = await read(tx, claim.workspace, claim.id, true);
      if (
        !m.codeRun ||
        m.codeRun.id !== claim.codeRun?.id ||
        !["running", "verifying"].includes(m.state) ||
        m.planDigest !== claim.planDigest
      )
        throw new Error("Run was cancelled, superseded or interrupted.");
      change(m);
      await save(tx, m);
      return m;
    });
  }
  async recover(workspace: string, now = new Date()) {
    await this.db.transaction(async (tx) => {
      const rows = (
        await tx.query<{ document: Mission }>(
          "SELECT document FROM missions WHERE workspace=$1 AND document->>'mode'='coding' AND document->>'state' IN ('running','verifying') FOR UPDATE",
          [workspace],
        )
      ).rows;
      for (const { document: m } of rows) {
        if (
          m.codeRun &&
          now.getTime() - Date.parse(m.codeRun.startedAt) > 600000
        ) {
          m.state = "blocked";
          m.blockedReason =
            "Coding worker was interrupted. Any dispatched model request may have been charged. Review provider usage and revise the contract to retry.";
          event(m, "engine", m.blockedReason);
          await save(tx, m);
        }
      }
    });
  }
  async execute(claim: Mission) {
    try {
      const scope = claim.coding!;
      const policy = await this.dependencies.loadPolicy(claim.repository);
      if (fingerprint(policy) !== fingerprint(scope.policy))
        throw new Error(
          "Coding policy changed. Revise the mission and approve the new scope.",
        );
      if (!process.env.OPENAI_API_KEY)
        throw new Error("Configure OPENAI_API_KEY on the coding worker.");
      await this.dependencies.preflight(policy);
      const sources = await this.dependencies.snapshot(
        claim.repository,
        scope.commit,
        policy.paths,
      );
      await this.update(claim, (m) =>
        event(
          m,
          "coding-worker",
          `Loaded ${sources.length} files from commit ${scope.commit}.`,
        ),
      );
      const before = await this.dependencies.verify(sources, policy);
      if (
        before.timedOut ||
        before.exitCode < 0 ||
        [125, 126, 127].includes(before.exitCode)
      )
        throw new Error(
          "Baseline runner failed or timed out. Fix the verification environment before spending model budget.",
        );
      const request = modelRequest(claim.goal, claim.criteria, sources, policy);
      const ceiling = estimatedCeiling(request, policy);
      // Account the conservative estimate BEFORE dispatch. Never blindly retry paid calls.
      await this.update(claim, (m) => {
        if (m.spentCents + ceiling > m.budgetCents)
          throw new Error(
            "Estimated model request exceeds the remaining budget.",
          );
        m.spentCents += ceiling;
        m.codeRun!.accountedCents = ceiling;
        m.codeRun!.dispatched = true;
        event(
          m,
          "coding-worker",
          `Dispatching one model request. Budget accounted at a conservative estimate of ${ceiling} cents; actual invoice may differ.`,
        );
      });
      const response = await this.dependencies.propose(request, policy);
      const changed = sources.map((file) => ({
        ...file,
        content:
          response.proposal.files.find((f) => f.path === file.path)?.content ??
          file.content,
      }));
      if (changed.every((f, i) => f.content === sources[i].content))
        throw new Error("The model returned no source changes.");
      await this.update(claim, (m) => {
        m.tasks[0].done = true;
        m.state = "verifying";
        event(
          m,
          "coding-worker",
          "Proposal received. Running the unchanged verification command against the changed snapshot.",
        );
      });
      const after = await this.dependencies.verify(changed, policy);
      const delivery = {
        kind: "coding-delivery",
        planDigest: claim.planDigest,
        repository: claim.repository,
        commit: scope.commit,
        model: policy.model,
        responseId: response.responseId,
        usage: {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
        },
        accountedEstimateCents: ceiling,
        summary: response.proposal.summary,
        risks: response.proposal.risks,
        changes: response.proposal.files.map((f) => ({
          path: f.path,
          before: sources.find((s) => s.path === f.path)!.content,
          after: f.content,
        })),
        sourceBlobs: sources.map(({ path, blobSha }) => ({ path, blobSha })),
        before,
        after,
      };
      const content = JSON.stringify(delivery, null, 2);
      await this.update(claim, (m) => {
        m.artifact = { content, digest: digest(content) };
        m.tasks[1].done = true;
        m.evidence = m.criteria.map((criterion) => ({
          criterion,
          passed: false,
          artifactDigest: m.artifact!.digest,
          detail: `Observed baseline exit ${before.exitCode}; changed snapshot exit ${after.exitCode}. This criterion requires human review; a passing command alone is not proof.`,
        }));
        m.state =
          after.exitCode === 0 && !after.timedOut
            ? "awaiting_acceptance"
            : "blocked";
        if (m.state === "blocked")
          m.blockedReason =
            "Changed snapshot checks failed or timed out. Inspect the delivery bundle before revising.";
        event(
          m,
          "coding-worker",
          m.state === "awaiting_acceptance"
            ? "Checks passed. Delivery awaits explicit human criterion review."
            : "Checks failed. Delivery cannot be accepted.",
        );
      });
    } catch (error) {
      // Never persist provider bodies, environment values or arbitrary raw errors.
      const allowed =
        error instanceof Error ? error.message : "Coding run failed.";
      const message = allowed
        .replace(/sk-[A-Za-z0-9_-]+|gh[pousr]_[A-Za-z0-9_]+/g, "[redacted]")
        .slice(0, 500);
      await this.update(claim, (m) => {
        m.state = "blocked";
        m.blockedReason = message;
        event(m, "coding-worker", message);
      }).catch(() => {});
    }
  }
}
