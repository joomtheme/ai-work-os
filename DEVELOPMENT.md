# Mission kernel development

This is a working development slice of the proposed architecture. It implements
mission contracts, plan approval, a deterministic two-step worker, persistent
checkpoints, simulated budget accounting, evidence inspection and owner acceptance.
All interface text and repository content are in English. This guide describes
the demo mode. See CONNECTED_CODING.md for the separate real provider/runner path.

**No AI provider is called, no repository is read or changed, and no real costs are
incurred.** Demo verification checks that criteria appear in a generated artifact.
It does not demonstrate that the requested software change works.

## Requirements

Node.js 24+, npm, and Docker for the normal PostgreSQL setup. Dependency versions
are pinned in package-lock.json. The app binds to 127.0.0.1 by default.

## PostgreSQL setup

```bash
npm ci
cp .env.example .env
# Edit WORKSPACE_TOKEN: use a random value of at least 32 characters.
docker compose up -d --wait
npm run dev
```

In another terminal, from the same project directory:

```bash
npm run worker
```

Open http://localhost:3000 and sign in using the token you set in .env.
The worker continues independently of the browser. Stop it and restart it to
exercise lease recovery; interrupted steps become reclaimable after 30 seconds.
Database tables are created idempotently when the app or worker connects.

## Local embedded demo (no Docker)

Copy .env.example to .env, remove DATABASE_URL, set PGLITE_DATA_DIR=.data/demo,
and set a random WORKSPACE_TOKEN of at least 32 characters. Run npm ci and
npm run dev. The embedded database persists on disk across app restarts.

Keep the browser open to dispatch demo steps. This mode uses the authenticated
/api/worker endpoint in the web process; do not start the standalone worker.
Use exactly one web process for the embedded data directory. PostgreSQL is the
normal deployment path; the embedded mode is for local exploration and tests.

## Try the flow

1. Create a mission with owner/repository, an outcome, criteria and a $1 demo budget.
2. Review and approve the two-step plan.
3. Observe worker activity, artifact creation and verification checkpoints.
4. Inspect the artifact, its SHA-256 and the explicitly simulated criterion checks.
5. Accept the simulated delivery. Completion requires this explicit owner action.
6. Try a $0.05 budget to trigger a blocker before the second step.
7. Pause, revise the budget, approve the new plan and run again. Revision
   invalidates prior approval and evidence; cumulative spent budget is retained.

## Engineering boundaries

- Single development workspace and one shared owner credential, not production
  multi-user identity. Eight-hour signed HttpOnly sessions, SameSite=Strict, exact
  origin validation for mutations. HTTPS origins enable Secure cookies.
- All mission and job queries include workspace scope. Tests exercise isolation;
  there is no tenant administration or database row-level security yet.
- Contracts and event history live in a versioned JSONB aggregate. Mutations lock
  the mission row and compare its version. Mission approval and job creation use
  one transaction; no separate queue can lose that handoff.
- Workers claim durable jobs with a 30-second lease and a unique fencing token.
  Completion checks that token and lease under the mission lock. Pause/cancel
  delete the job, revoking in-flight completion. Retrying a completed step cannot
  charge it twice. Simulated work has no external side effects.
- A $0.05 reservation is held during each step and converted into simulated spend
  on successful checkpointing. Expired leases reuse that reservation.
- Revisions create a new plan digest; acceptance validates current plan approval,
  artifact digest, task completion and criterion evidence.
- Local artifact contents are stored in the mission record for this small demo.
  Large artifacts/object storage, real agent runs, GitHub writes/reconciliation,
  timeouts for real tools, multi-user RBAC, rate limiting, retention and formal
  schema migrations remain future work. Do not expose this development build as
  a public or multi-tenant service.

## Validation

```bash
npm run typecheck
npm test
npm run build
npm run test:http
```

Tests use the embedded PostgreSQL engine, not an in-memory mock of the domain.
The production HTTP smoke test also exercises sign-in, access denial, the full
mission flow and cross-origin rejection. It starts and stops its own local server.
The domain tests cover approval gates, stale revisions, evidence tampering, cancellation,
recovery, budget exhaustion, scope isolation, competing claims and disk restart.
Set TEST_DATABASE_URL to run the main lifecycle suite against a dedicated
PostgreSQL test database; each test creates and removes its own schema. The disk
restart test always uses PGlite. Never point test settings at production.

The proposed long-term design is in ARCHITECTURE.md, AGENT_MODEL.md,
MEMORY_SYSTEM.md and ROADMAP.md (documentation PR #1). This slice does not
implement all of those documents. Next: multi-user identity, real isolated
execution, repository snapshots and meaningful repository verification.
