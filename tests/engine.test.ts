import test from "node:test";
import assert from "node:assert/strict";
import { connect } from "../src/lib/db.ts";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { Engine, DomainError } from "../src/lib/engine.ts";
const contract = {
  goal: "Fix the checkout regression",
  repository: "team/store",
  criteria: ["A reproduction is documented", "Regression check passes"],
  budgetCents: 100,
};
async function setup() {
  if (!process.env.TEST_DATABASE_URL) {
    const db = await connect({});
    return { db, engine: new Engine(db) };
  }
  const schema = "test_" + randomUUID().replaceAll("-", "");
  const admin = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  await admin.query(`CREATE SCHEMA ${schema}`);
  const url = new URL(process.env.TEST_DATABASE_URL);
  url.searchParams.set("options", `-c search_path=${schema}`);
  const db = await connect({ url: url.toString() });
  const close = db.close;
  db.close = async () => {
    await close();
    await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    await admin.end();
  };
  return { db, engine: new Engine(db) };
}
async function approved(engine: Engine, budgetCents = 100) {
  const m = await engine.create("a", { ...contract, budgetCents });
  return engine.act("a", m.id, "approve", m.version);
}
async function step(engine: Engine) {
  const c = await engine.claim("a");
  assert.ok(c);
  assert.equal(await engine.finish(c), true);
  return c;
}
test("requires approval, records evidence, and only completes after explicit acceptance", async () => {
  const { db, engine } = await setup();
  try {
    let m = await engine.create("a", contract);
    assert.equal(await engine.claim("a"), null);
    await assert.rejects(
      engine.act("a", m.id, "accept", m.version),
      DomainError,
    );
    m = await engine.act("a", m.id, "approve", m.version);
    await step(engine);
    await step(engine);
    m = await engine.get("a", m.id);
    assert.equal(m.state, "awaiting_acceptance");
    assert.equal(m.spentCents, 10);
    assert.equal(m.reservedCents, 0);
    assert.equal(m.evidence.length, 2);
    m = await engine.act("a", m.id, "accept", m.version);
    assert.equal(m.state, "completed");
    await assert.rejects(
      engine.act("a", m.id, "resume", m.version),
      DomainError,
    );
  } finally {
    await db.close();
  }
});
test("stale approval is rejected and contract revision invalidates evidence", async () => {
  const { db, engine } = await setup();
  try {
    const original = await engine.create("a", contract);
    let m = await engine.act("a", original.id, "revise", original.version, {
      ...contract,
      goal: "Fix a different checkout regression",
    });
    await assert.rejects(
      engine.act("a", m.id, "approve", original.version),
      /changed/,
    );
    m = await engine.act("a", m.id, "approve", m.version);
    await step(engine);
    await step(engine);
    m = await engine.get("a", m.id);
    m = await engine.act("a", m.id, "revise", m.version, contract);
    assert.equal(m.approvedDigest, undefined);
    assert.equal(m.artifact, undefined);
    assert.deepEqual(m.evidence, []);
    assert.equal(m.state, "awaiting_plan_approval");
  } finally {
    await db.close();
  }
});
test("cancel revokes an in-flight worker and duplicate completion cannot charge twice", async () => {
  const { db, engine } = await setup();
  try {
    let m = await approved(engine);
    const c = await engine.claim("a");
    assert.ok(c);
    m = await engine.get("a", m.id);
    await engine.act("a", m.id, "cancel", m.version);
    assert.equal(await engine.finish(c), false);
    m = await engine.get("a", m.id);
    assert.equal(m.state, "cancelled");
    assert.equal(m.spentCents, 0);
    assert.equal(m.reservedCents, 0);
    const second = await approved(engine);
    const finished = await step(engine);
    assert.equal(await engine.finish(finished), false);
    assert.equal((await engine.get("a", second.id)).spentCents, 5);
  } finally {
    await db.close();
  }
});
test("expired lease recovers with fencing and no duplicate reservation", async () => {
  const { db, engine } = await setup();
  try {
    const m = await approved(engine);
    const now = new Date();
    const c = await engine.claim("a", now);
    assert.ok(c);
    assert.equal(await engine.claim("a", now), null);
    const later = new Date(now.getTime() + 31000);
    const recovered = await new Engine(db).claim("a", later);
    assert.ok(recovered);
    assert.notEqual(c.token, recovered.token);
    assert.equal(await engine.finish(c, later), false);
    assert.equal(await engine.finish(recovered, later), true);
    const saved = await engine.get("a", m.id);
    assert.equal(saved.spentCents, 5);
    assert.equal(saved.reservedCents, 0);
  } finally {
    await db.close();
  }
});
test("pause resumes from checkpoint and budget exhaustion blocks dispatch", async () => {
  const { db, engine } = await setup();
  try {
    let m = await approved(engine);
    await step(engine);
    m = await engine.get("a", m.id);
    m = await engine.act("a", m.id, "pause", m.version);
    assert.equal(await engine.claim("a"), null);
    m = await engine.act("a", m.id, "resume", m.version);
    await step(engine);
    assert.equal((await engine.get("a", m.id)).spentCents, 10);
    const low = await approved(engine, 5);
    await step(engine);
    assert.equal(await engine.claim("a"), null);
    const blocked = await engine.get("a", low.id);
    assert.equal(blocked.state, "blocked");
    assert.equal(blocked.spentCents, 5);
    await assert.rejects(
      engine.act("a", low.id, "resume", blocked.version),
      /budget/,
    );
  } finally {
    await db.close();
  }
});
test("workspace isolation and input validation reject invalid requests", async () => {
  const { db, engine } = await setup();
  try {
    const m = await engine.create("a", contract);
    assert.deepEqual(await engine.list("b"), []);
    await assert.rejects(engine.get("b", m.id), /not found/);
    await assert.rejects(
      engine.act("b", m.id, "approve", m.version),
      /not found/,
    );
    await assert.rejects(
      engine.create("a", { ...contract, budgetCents: -1 }),
      /Budget/,
    );
    await assert.rejects(
      engine.create("a", { ...contract, criteria: [] }),
      /criteria/,
    );
    await assert.rejects(
      engine.create("a", {
        ...contract,
        repository: "https://github.com/team/store",
      }),
      /Repository/,
    );
  } finally {
    await db.close();
  }
});
test("tampered or failed evidence cannot be accepted", async () => {
  const { db, engine } = await setup();
  try {
    const m = await approved(engine);
    await step(engine);
    await step(engine);
    const saved = await engine.get("a", m.id);
    saved.evidence[0].passed = false;
    await db.query(
      "UPDATE missions SET document=$3::jsonb WHERE workspace=$1 AND id=$2",
      ["a", m.id, JSON.stringify(saved)],
    );
    await assert.rejects(
      engine.act("a", m.id, "accept", saved.version),
      /evidence/,
    );
    saved.evidence[0].passed = true;
    saved.artifact!.content += " tampered";
    await db.query(
      "UPDATE missions SET document=$3::jsonb WHERE workspace=$1 AND id=$2",
      ["a", m.id, JSON.stringify(saved)],
    );
    await assert.rejects(
      engine.act("a", m.id, "accept", saved.version),
      /evidence/,
    );
  } finally {
    await db.close();
  }
});
test("two simultaneous claimers cannot both acquire the same mission", async () => {
  const { db, engine } = await setup();
  try {
    await approved(engine);
    const claims = await Promise.all([engine.claim("a"), engine.claim("a")]);
    assert.equal(claims.filter(Boolean).length, 1);
  } finally {
    await db.close();
  }
});
test("on-disk checkpoints survive closing and reopening the database", async () => {
  const { mkdtemp, rm } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const directory = await mkdtemp(join(process.cwd(), ".data-test-"));
  let db = await connect({ directory });
  try {
    let engine = new Engine(db);
    let m = await approved(engine);
    await step(engine);
    await db.close();
    db = await connect({ directory });
    engine = new Engine(db);
    m = await engine.get("a", m.id);
    assert.equal(m.tasks[0].done, true);
    assert.equal(m.spentCents, 5);
    await step(engine);
    assert.equal((await engine.get("a", m.id)).state, "awaiting_acceptance");
  } finally {
    await db.close();
    await rm(directory, { recursive: true, force: true });
  }
});
