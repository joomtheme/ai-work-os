import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { connect } from "../src/lib/db.ts";
import { Engine } from "../src/lib/engine.ts";
import {
  CodingService,
  productionDependencies,
} from "../src/lib/coding/service.ts";
import { snapshot, type SourceFile } from "../src/lib/coding/github.ts";
import {
  modelRequest,
  propose,
  validateProposal,
} from "../src/lib/coding/provider.ts";
import { dockerArgs } from "../src/lib/coding/runner.ts";
import { validatePolicy, type CodingPolicy } from "../src/lib/coding/policy.ts";
const policy: CodingPolicy = {
  repository: "team/example",
  paths: ["src/add.mjs", "tests/add.mjs"],
  editablePaths: ["src/add.mjs"],
  image: "node@sha256:" + "a".repeat(64),
  command: ["node", "--test", "tests/add.mjs"],
  model: "configured-test-model",
  inputCentsPerMillion: 100,
  outputCentsPerMillion: 200,
  maxOutputTokens: 1000,
};
const source: SourceFile[] = [
  {
    path: "src/add.mjs",
    content: "export const add=(a,b)=>a-b;",
    blobSha: "1".repeat(40),
  },
  {
    path: "tests/add.mjs",
    content: "// immutable test fixture",
    blobSha: "2".repeat(40),
  },
];
const proposal = {
  summary: "Correct addition",
  files: [{ path: "src/add.mjs", content: "export const add=(a,b)=>a+b;" }],
  risks: ["Only the selected checks were run."],
};
const contract = {
  goal: "Fix addition for positive inputs",
  repository: policy.repository,
  criteria: ["Addition returns the sum"],
  budgetCents: 100,
  mode: "coding",
  coding: { commit: "a".repeat(40), policy },
};
process.env.OPENAI_API_KEY = "test-only-placeholder";
async function setup(
  overrides: Partial<typeof productionDependencies> = {},
  input = contract,
) {
  const db = await connect({});
  const engine = new Engine(db);
  let calls = 0;
  let verifies = 0;
  const dependencies: typeof productionDependencies = {
    loadPolicy: async () => policy,
    snapshot: async () => source,
    preflight: async () => {},
    propose: async () => {
      calls++;
      return {
        proposal,
        responseId: "resp_test",
        inputTokens: 100,
        outputTokens: 50,
      };
    },
    verify: async () => ({
      exitCode: verifies++ === 0 ? 1 : 0,
      output: "fixture verification output",
      timedOut: false,
      image: policy.image,
      command: policy.command,
    }),
    ...overrides,
  };
  const service = new CodingService(db, dependencies);
  let m = await engine.create("a", input);
  m = await engine.act("a", m.id, "approve", m.version);
  return { db, engine, service, mission: m, calls: () => calls };
}
test("coding delivery uses approved scope and requires explicit human criterion review", async () => {
  const { db, engine, service, mission, calls } = await setup();
  try {
    assert.equal(
      await engine.claim("a"),
      null,
      "demo worker must not claim paid work",
    );
    const claim = await service.claim("a");
    assert.ok(claim);
    await service.execute(claim);
    let m = await engine.get("a", mission.id);
    assert.equal(
      m.state,
      "awaiting_acceptance",
      m.blockedReason ?? "Unexpected state",
    );
    assert.equal(calls(), 1);
    assert.equal(m.evidence[0].passed, false);
    const bundle = JSON.parse(m.artifact!.content);
    assert.equal(bundle.before.exitCode, 1);
    assert.equal(bundle.after.exitCode, 0);
    assert.equal(bundle.changes[0].before, source[0].content);
    assert.equal(bundle.commit, contract.coding.commit);
    await assert.rejects(
      engine.act("a", m.id, "accept", m.version),
      /reviewed/,
    );
    m = await engine.act("a", m.id, "accept", m.version, {
      reviewedCriteria: true,
    });
    assert.equal(m.state, "completed");
    assert.equal(m.evidence[0].passed, true);
  } finally {
    await db.close();
  }
});
test("missing runner blocks before model dispatch without simulated fallback", async () => {
  const { db, engine, service, mission, calls } = await setup({
    preflight: async () => {
      throw new Error("Docker unavailable");
    },
  });
  try {
    await service.execute((await service.claim("a"))!);
    const m = await engine.get("a", mission.id);
    assert.equal(m.state, "blocked");
    assert.equal(m.spentCents, 0);
    assert.equal(calls(), 0);
    assert.equal(m.artifact, undefined);
  } finally {
    await db.close();
  }
});
test("failed verification prevents acceptance and retains the changed artifact", async () => {
  const { db, engine, service, mission } = await setup({
    verify: async () => ({
      exitCode: 1,
      output: "failing test",
      timedOut: false,
      image: policy.image,
      command: policy.command,
    }),
  });
  try {
    await service.execute((await service.claim("a"))!);
    const m = await engine.get("a", mission.id);
    assert.equal(m.state, "blocked");
    assert.ok(m.artifact);
    await assert.rejects(
      engine.act("a", m.id, "accept", m.version, { reviewedCriteria: true }),
      /delivery/,
    );
  } finally {
    await db.close();
  }
});
test("uncertain model result consumes accounted estimate and cannot auto-retry", async () => {
  const { db, engine, service, mission } = await setup({
    propose: async () => {
      throw new Error("Request timed out");
    },
  });
  try {
    await service.execute((await service.claim("a"))!);
    const m = await engine.get("a", mission.id);
    assert.equal(m.state, "blocked");
    assert.ok(m.spentCents > 0);
    assert.equal(m.codeRun?.dispatched, true);
    assert.equal(await service.claim("a"), null);
    await assert.rejects(engine.act("a", m.id, "resume", m.version), /revise/);
  } finally {
    await db.close();
  }
});
test("policy drift blocks before reads, execution or model billing", async () => {
  const { db, engine, service, mission, calls } = await setup({
    loadPolicy: async () => ({ ...policy, model: "changed-model" }),
  });
  try {
    await service.execute((await service.claim("a"))!);
    const m = await engine.get("a", mission.id);
    assert.equal(m.state, "blocked");
    assert.match(m.blockedReason!, /policy changed/);
    assert.equal(calls(), 0);
  } finally {
    await db.close();
  }
});
test("cancellation fences a dispatched model result while retaining accounted cost", async () => {
  let cancel: () => Promise<void> = async () => {};
  const { db, engine, service, mission } = await setup({
    propose: async () => {
      await cancel();
      return {
        proposal,
        responseId: "resp_test",
        inputTokens: 100,
        outputTokens: 50,
      };
    },
  });
  cancel = async () => {
    const m = await engine.get("a", mission.id);
    await engine.act("a", m.id, "cancel", m.version);
  };
  try {
    await service.execute((await service.claim("a"))!);
    const m = await engine.get("a", mission.id);
    assert.equal(m.state, "cancelled");
    assert.equal(m.artifact, undefined);
    assert.ok(m.spentCents > 0);
  } finally {
    await db.close();
  }
});
test("abandoned coding runs require review; competing workers cannot claim twice", async () => {
  const { db, engine, service, mission } = await setup();
  try {
    const now = new Date();
    const claims = await Promise.all([
      service.claim("a", now),
      service.claim("a", now),
    ]);
    assert.equal(claims.filter(Boolean).length, 1);
    await service.recover("a", new Date(now.getTime() + 600001));
    const m = await engine.get("a", mission.id);
    assert.equal(m.state, "blocked");
    assert.equal(await service.claim("a"), null);
  } finally {
    await db.close();
  }
});
test("provider validates strict schema, refuses arbitrary paths, and never retries", async () => {
  const req = modelRequest(contract.goal, contract.criteria, source, policy);
  let calls = 0;
  const mock: typeof fetch = async (url, init) => {
    calls++;
    assert.equal(url, "https://api.openai.com/v1/responses");
    const sent = JSON.parse(String(init?.body));
    assert.equal(sent.store, false);
    assert.equal(sent.text.format.strict, true);
    assert.equal(sent.max_output_tokens, 1000);
    return Response.json({
      id: "resp_test",
      status: "completed",
      usage: { input_tokens: 123, output_tokens: 45 },
      output: [
        { type: "reasoning" },
        {
          type: "message",
          content: [{ type: "output_text", text: JSON.stringify(proposal) }],
        },
      ],
    });
  };
  const result = await propose(req, policy, mock);
  assert.equal(result.inputTokens, 123);
  assert.equal(calls, 1);
  assert.throws(
    () =>
      validateProposal(
        { ...proposal, files: [{ path: "../escape", content: "bad" }] },
        policy,
      ),
    /scope/,
  );
  assert.throws(() =>
    validateProposal(
      { ...proposal, files: [proposal.files[0], proposal.files[0]] },
      policy,
    ),
  );
  let attempts = 0;
  await assert.rejects(
    propose(req, policy, async () => {
      attempts++;
      throw new Error("network timeout");
    }),
  );
  assert.equal(attempts, 1);
  await assert.rejects(
    propose(req, policy, async () =>
      Response.json({ id: "resp_test", status: "incomplete" }),
    ),
    /incomplete/,
  );
});
test("GitHub source is pinned and blob hashes are verified; symlinks are rejected", async () => {
  const content = "export const x=1;";
  const sha = createHash("sha1")
    .update(`blob ${Buffer.byteLength(content)}\0`)
    .update(content)
    .digest("hex");
  let mode = "100644";
  let tamper = false;
  const urls: string[] = [];
  const mock: typeof fetch = async (url) => {
    urls.push(String(url));
    if (String(url).includes("/git/commits/"))
      return Response.json({
        sha: "a".repeat(40),
        tree: { sha: "b".repeat(40) },
      });
    if (String(url).includes("/git/trees/"))
      return Response.json({
        truncated: false,
        tree: [
          { path: "src/x.mjs", type: "blob", mode, sha, size: content.length },
        ],
      });
    return Response.json({
      encoding: "base64",
      content: Buffer.from(tamper ? "wrong" : content).toString("base64"),
    });
  };
  const files = await snapshot(
    "team/example",
    "a".repeat(40),
    ["src/x.mjs"],
    mock,
  );
  assert.equal(files[0].content, content);
  assert.ok(urls[0].endsWith("a".repeat(40)));
  mode = "120000";
  await assert.rejects(
    snapshot("team/example", "a".repeat(40), ["src/x.mjs"], mock),
    /Unsupported/,
  );
  mode = "100644";
  tamper = true;
  await assert.rejects(
    snapshot("team/example", "a".repeat(40), ["src/x.mjs"], mock),
    /integrity/,
  );
  await assert.rejects(
    snapshot("team/example", "main", ["src/x.mjs"], mock),
    /immutable/,
  );
});
test("runner has no network, credentials, host writes, or model-selected command", () => {
  const args = dockerArgs("test", "/approved/workdir", policy);
  for (const flag of [
    "--network=none",
    "--read-only",
    "--cap-drop=ALL",
    "--security-opt=no-new-privileges",
    "--pull=never",
  ])
    assert.ok(args.includes(flag));
  assert.ok(
    args.includes("type=bind,source=/approved/workdir,target=/source,readonly"),
  );
  assert.equal(args.includes("--env"), false);
  assert.deepEqual(args.slice(-3), policy.command);
  assert.throws(() => validatePolicy({ ...policy, paths: ["../escape"] }));
  assert.throws(() => validatePolicy({ ...policy, image: "node:latest" }));
});

test("insufficient estimated budget prevents a paid request", async () => {
  const { db, engine, service, mission, calls } = await setup(
    {
      snapshot: async () => [
        { ...source[0], content: " ".repeat(40000) },
        source[1],
      ],
    },
    { ...contract, budgetCents: 1 },
  );
  try {
    await service.execute((await service.claim("a"))!);
    const m = await engine.get("a", mission.id);
    assert.equal(m.state, "blocked");
    assert.match(m.blockedReason!, /budget/);
    assert.equal(calls(), 0);
    assert.equal(m.spentCents, 0);
  } finally {
    await db.close();
  }
});
