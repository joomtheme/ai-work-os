import { createHash, randomUUID } from "node:crypto";
import type { Database, Queryable } from "./db.ts";
import type { Mission, Action } from "./types.ts";

export class DomainError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export const digest = (content: string) =>
  createHash("sha256").update(content).digest("hex");
const event = (m: Mission, actor: string, message: string) =>
  m.events.push({ at: new Date().toISOString(), actor, message });
const planDigest = (m: Mission) =>
  digest(
    JSON.stringify([
      m.goal,
      m.repository,
      m.criteria,
      m.budgetCents,
      m.planVersion,
      m.tasks.map((t) => t.title),
    ]),
  );
function contract(input: unknown) {
  if (!input || typeof input !== "object")
    throw new DomainError("A mission contract is required.");
  const p = input as Record<string, unknown>;
  if (
    typeof p.goal !== "string" ||
    p.goal.trim().length < 8 ||
    p.goal.length > 2000
  )
    throw new DomainError("Goal must contain 8–2000 characters.");
  if (
    typeof p.repository !== "string" ||
    !/^[\w.-]+\/[\w.-]+$/.test(p.repository) ||
    p.repository.length > 200
  )
    throw new DomainError("Repository must use owner/name format.");
  if (
    !Array.isArray(p.criteria) ||
    p.criteria.length < 1 ||
    p.criteria.length > 10 ||
    p.criteria.some((c) => typeof c !== "string" || !c.trim() || c.length > 500)
  )
    throw new DomainError(
      "Provide 1–10 acceptance criteria, up to 500 characters each.",
    );
  if (
    !Number.isSafeInteger(p.budgetCents) ||
    Number(p.budgetCents) < 1 ||
    Number(p.budgetCents) > 100000
  )
    throw new DomainError("Budget must be between $0.01 and $1,000.");
  return {
    goal: p.goal.trim(),
    repository: p.repository,
    criteria: [...new Set((p.criteria as string[]).map((c) => c.trim()))],
    budgetCents: p.budgetCents as number,
  };
}
async function read(
  tx: Queryable,
  workspace: string,
  id: string,
  lock = false,
) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    throw new DomainError("Mission not found.", 404);
  const { rows } = await tx.query<{ document: Mission }>(
    `SELECT document FROM missions WHERE workspace=$1 AND id=$2 ${lock ? "FOR UPDATE" : ""}`,
    [workspace, id],
  );
  if (!rows[0]) throw new DomainError("Mission not found.", 404);
  return rows[0].document;
}
async function save(tx: Queryable, m: Mission) {
  m.version++;
  await tx.query(
    "UPDATE missions SET document=$3::jsonb WHERE workspace=$1 AND id=$2",
    [m.workspace, m.id, JSON.stringify(m)],
  );
}
async function enqueue(tx: Queryable, m: Mission) {
  const step = m.tasks.filter((t) => t.done).length;
  await tx.query(
    "INSERT INTO jobs(workspace,mission_id,step) VALUES($1,$2,$3) ON CONFLICT(workspace,mission_id) DO NOTHING",
    [m.workspace, m.id, step],
  );
}
export class Engine {
  constructor(public db: Database) {}
  async list(workspace: string) {
    return (
      await this.db.query<{ document: Mission }>(
        "SELECT document FROM missions WHERE workspace=$1 ORDER BY document->>'createdAt' DESC",
        [workspace],
      )
    ).rows.map((r) => r.document);
  }
  get(workspace: string, id: string) {
    return read(this.db, workspace, id);
  }
  async create(workspace: string, input: unknown) {
    const m: Mission = {
      ...contract(input),
      id: randomUUID(),
      workspace,
      spentCents: 0,
      reservedCents: 0,
      version: 1,
      planVersion: 1,
      planDigest: "",
      state: "awaiting_plan_approval",
      createdAt: new Date().toISOString(),
      tasks: [
        { title: "Prepare a simulated delivery artifact", done: false },
        { title: "Verify the demo artifact and attach evidence", done: false },
      ],
      evidence: [],
      events: [],
    };
    m.planDigest = planDigest(m);
    event(m, "owner", "Mission created. Demo plan is waiting for approval.");
    await this.db.query(
      "INSERT INTO missions(workspace,id,document) VALUES($1,$2,$3::jsonb)",
      [workspace, m.id, JSON.stringify(m)],
    );
    return m;
  }
  async act(
    workspace: string,
    id: string,
    action: Action,
    version: number,
    input?: unknown,
  ) {
    return this.db.transaction(async (tx) => {
      const m = await read(tx, workspace, id, true);
      if (m.version !== version)
        throw new DomainError(
          "This mission changed. Refresh before acting.",
          409,
        );
      if (["completed", "cancelled"].includes(m.state))
        throw new DomainError("This mission is closed.", 409);
      if (action === "approve") {
        if (m.state !== "awaiting_plan_approval")
          throw new DomainError("No plan is awaiting approval.", 409);
        m.approvedDigest = m.planDigest;
        m.state = "ready";
        await enqueue(tx, m);
        event(
          m,
          "owner",
          `Plan v${m.planVersion} approved (${m.planDigest.slice(0, 12)}).`,
        );
      } else if (action === "pause") {
        if (!["ready", "running", "verifying"].includes(m.state))
          throw new DomainError("Only active missions can be paused.", 409);
        m.resumeState = m.tasks[0].done ? "verifying" : "ready";
        m.state = "blocked";
        m.blockedReason = "Paused by owner.";
        m.reservedCents = 0;
        await tx.query(
          "DELETE FROM jobs WHERE workspace=$1 AND mission_id=$2",
          [workspace, id],
        );
        event(m, "owner", "Execution paused. Active worker lease revoked.");
      } else if (action === "resume") {
        if (m.state !== "blocked")
          throw new DomainError("Mission is not blocked.", 409);
        if (m.approvedDigest !== m.planDigest)
          throw new DomainError("The current plan needs approval.", 409);
        if (m.spentCents + 5 > m.budgetCents)
          throw new DomainError(
            "Increase the budget by revising the plan before resuming.",
            409,
          );
        m.state = m.resumeState ?? "ready";
        delete m.blockedReason;
        await enqueue(tx, m);
        event(m, "owner", "Execution resumed from its checkpoint.");
      } else if (action === "cancel") {
        m.state = "cancelled";
        m.reservedCents = 0;
        await tx.query(
          "DELETE FROM jobs WHERE workspace=$1 AND mission_id=$2",
          [workspace, id],
        );
        event(m, "owner", "Mission cancelled.");
      } else if (action === "revise") {
        if (
          ![
            "awaiting_plan_approval",
            "blocked",
            "awaiting_acceptance",
          ].includes(m.state)
        )
          throw new DomainError(
            "Pause execution before revising the contract.",
            409,
          );
        Object.assign(m, contract(input));
        m.planVersion++;
        m.tasks.forEach((t) => (t.done = false));
        m.evidence = [];
        delete m.artifact;
        delete m.approvedDigest;
        delete m.blockedReason;
        delete m.resumeState;
        m.reservedCents = 0;
        m.state = "awaiting_plan_approval";
        m.planDigest = planDigest(m);
        await tx.query(
          "DELETE FROM jobs WHERE workspace=$1 AND mission_id=$2",
          [workspace, id],
        );
        event(
          m,
          "owner",
          "Contract revised. Previous approval and evidence invalidated.",
        );
      } else if (action === "accept") {
        if (
          m.state !== "awaiting_acceptance" ||
          !m.artifact ||
          digest(m.artifact.content) !== m.artifact.digest ||
          m.approvedDigest !== m.planDigest ||
          !m.tasks.every((t) => t.done) ||
          m.evidence.length !== m.criteria.length ||
          !m.evidence.every(
            (e, i) =>
              e.passed &&
              e.criterion === m.criteria[i] &&
              e.artifactDigest === m.artifact!.digest,
          )
        )
          throw new DomainError(
            "Current evidence does not support acceptance.",
            409,
          );
        m.state = "completed";
        event(
          m,
          "owner",
          "Demo delivery accepted. No repository code was changed.",
        );
      } else throw new DomainError("Unknown action.");
      await save(tx, m);
      return m;
    });
  }
  // The mission lock is always acquired before the job lock, including cancellation.
  async claim(workspace: string, now = new Date()) {
    return this.db.transaction(async (tx) => {
      const { rows } = await tx.query<{ id: string }>(
        "SELECT m.id FROM missions m JOIN jobs j ON j.workspace=m.workspace AND j.mission_id=m.id WHERE m.workspace=$1 AND (j.lease_until IS NULL OR j.lease_until <= $2) ORDER BY m.id FOR UPDATE OF m SKIP LOCKED LIMIT 1",
        [workspace, now],
      );
      if (!rows[0]) return null;
      const m = await read(tx, workspace, rows[0].id);
      const job = (
        await tx.query<{ step: number; token: string | null }>(
          "SELECT step,token FROM jobs WHERE workspace=$1 AND mission_id=$2 FOR UPDATE",
          [workspace, m.id],
        )
      ).rows[0];
      if (
        !["ready", "running", "verifying"].includes(m.state) ||
        m.approvedDigest !== m.planDigest
      )
        throw new DomainError("Invalid queued mission.", 409);
      if (!job.token && m.spentCents + 5 > m.budgetCents) {
        m.resumeState = m.tasks[0].done ? "verifying" : "ready";
        m.state = "blocked";
        m.blockedReason =
          "Demo budget exhausted. Revise the budget and approve the new plan.";
        await tx.query(
          "DELETE FROM jobs WHERE workspace=$1 AND mission_id=$2",
          [workspace, m.id],
        );
        event(m, "engine", m.blockedReason);
        await save(tx, m);
        return null;
      }
      const token = randomUUID();
      m.reservedCents = 5;
      m.state = job.step === 0 ? "running" : "verifying";
      await tx.query(
        "UPDATE jobs SET token=$3,lease_until=$4 WHERE workspace=$1 AND mission_id=$2",
        [workspace, m.id, token, new Date(now.getTime() + 30000)],
      );
      event(
        m,
        "worker",
        job.token
          ? "Expired lease recovered; checkpoint retained."
          : `Started demo step ${job.step + 1}.`,
      );
      await save(tx, m);
      return { id: m.id, workspace, token, step: job.step, mission: m };
    });
  }
  async finish(
    claim: NonNullable<Awaited<ReturnType<Engine["claim"]>>>,
    now = new Date(),
  ) {
    return this.db.transaction(async (tx) => {
      const m = await read(tx, claim.workspace, claim.id, true);
      const job = (
        await tx.query<{ token: string; lease_until: Date; step: number }>(
          "SELECT token,lease_until,step FROM jobs WHERE workspace=$1 AND mission_id=$2 FOR UPDATE",
          [claim.workspace, claim.id],
        )
      ).rows[0];
      if (
        !job ||
        job.token !== claim.token ||
        new Date(job.lease_until) <= now ||
        !["running", "verifying"].includes(m.state)
      )
        return false;
      if (job.step === 0) {
        const content = `SIMULATED DELIVERY — no repository access or code changes\nGoal: ${m.goal}\nRepository: ${m.repository}\nAcceptance checklist:\n${m.criteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}\nPlan: ${m.planDigest}`;
        m.artifact = { content, digest: digest(content) };
        m.tasks[0].done = true;
        m.state = "verifying";
        await tx.query(
          "UPDATE jobs SET step=1,token=NULL,lease_until=NULL WHERE workspace=$1 AND mission_id=$2",
          [m.workspace, m.id],
        );
      } else {
        if (!m.artifact || digest(m.artifact.content) !== m.artifact.digest)
          throw new DomainError("Artifact integrity check failed.", 409);
        m.evidence = m.criteria.map((criterion) => ({
          criterion,
          passed: m.artifact!.content.includes(criterion),
          artifactDigest: m.artifact!.digest,
          detail:
            "Demo check only: criterion is present in the simulated artifact. This does not verify repository behavior.",
        }));
        m.tasks[1].done = true;
        m.state = m.evidence.every((e) => e.passed)
          ? "awaiting_acceptance"
          : "blocked";
        if (m.state === "blocked")
          m.blockedReason =
            "Demo verification failed. Revise the contract to retry.";
        await tx.query(
          "DELETE FROM jobs WHERE workspace=$1 AND mission_id=$2",
          [m.workspace, m.id],
        );
      }
      m.spentCents += m.reservedCents;
      m.reservedCents = 0;
      event(
        m,
        "worker",
        `Demo step ${job.step + 1} saved with evidence. Simulated cost: $0.05.`,
      );
      await save(tx, m);
      return true;
    });
  }
}
