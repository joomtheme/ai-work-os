# Agent Model

Status: proposed. Agents operate inside the mission engine defined in
[ARCHITECTURE.md](ARCHITECTURE.md).

## Roles and authority

An agent is a versioned worker configuration: role, skills, tools, model policy,
context access, output schema and execution limits. Role names are not permission
grants. Start with one execution worker and a separate verification run; activate
additional specialists only when evaluation shows a benefit.

| Role | Responsibility | Cannot do |
| --- | --- | --- |
| Planner | Translate contract into tasks, dependencies and estimates | Approve its plan or expand scope |
| Implementer | Produce a bounded patch and explanatory artifacts | Approve remote writes or declare success |
| Verifier | Evaluate frozen output against acceptance criteria | Silently edit output while verifying it |
| Delivery worker | Package evidence and execute approved publication | Merge or deploy in the MVP |
| Mission owner (human) | Approve scope, actions and accepted delivery | Bypass workspace policy without authorized policy change |

The deterministic orchestrator dispatches work, enforces invariants and records
events. It is not an unrestricted manager agent. A second model opinion is
useful evidence, but not proof of correctness or independence by itself.

## Input and output contracts

Every task input includes mission/plan/task IDs, workspace, input artifact
versions, acceptance criteria, approved capabilities, relevant memory references,
budget allocation, deadline and maximum attempts. Context assembly records the
exact source versions supplied to the model.

Each output must validate against a schema with:
- status: succeeded, blocked or failed;
- produced artifact references and content digests;
- acceptance-criterion evidence references;
- requested next actions with target and payload;
- uncertainty, blockers and remaining risks;
- usage and execution metadata.

A tool adapter, not the model, supplies authoritative usage and execution receipts.
Malformed output gets a bounded repair attempt and then blocks. Store concise
decision summaries and evidence, not private model reasoning.

## Execution policy

The planner proposes an acyclic task graph. The engine validates dependencies,
resource conflicts and cost before requesting plan approval. Each task receives
only the capabilities and context it needs. Model/tool routing must respect
workspace data residency and provider policy before price or speed.

Default pilot limits: one implementer at a time per mission, one verifier run,
and at most two repair cycles. These are adjustable proposal defaults, always
bounded by the mission budget. Two workers must not write the same branch or
artifact version concurrently. A specialist request creates an explicit task;
agents cannot recursively spawn an unlimited workforce.

Autonomy levels:
1. Observe: read approved resources and suggest a plan.
2. Prepare: create local artifacts and run isolated checks under an approved plan.
3. Publish with approval: execute the exact reviewed remote write.
4. Delegated routine actions: later, opt-in policies with scoped limits and expiry.

Level 4 is not MVP. No role can authorize itself or inherit another role's token.

## Verification and handoff

Verification operates on an immutable commit/artifact digest. Record checks,
commands, environment, exit codes, logs and criterion mapping. A passing test
suite only establishes what it tests; label unsupported requirements and
pre-existing failures explicitly. Subjective requirements require human review.

The verifier uses a separate run context and cannot mark its own edited output
verified. A change after verification requires relevant checks to run again.
The delivery worker publishes the verified revision after authorization, checks
the remote receipt and returns the evidence bundle for owner acceptance.

## Example mission

Goal: fix the reproduction described in an authorized GitHub issue.

1. Capture repository SHA, reproduction and acceptance criteria.
2. Propose a bounded plan and receive owner approval.
3. Implement in an isolated checkout; add a regression check when appropriate.
4. Run verification on the resulting revision. On failure, repair within limits.
5. Show diff, test evidence, known limitations, cost and exact publication action.
6. After approval, publish branch and PR through scoped gateway operations.
7. Verify PR identity and head SHA, then request owner acceptance of delivery.

If the issue is ambiguous, access is missing or a required check cannot run,
report a blocker. Never turn missing evidence into a passing result.

## Evaluation

Version prompts, role definitions, models, tool schemas and evaluation fixtures.
Compare the simplest worker configuration against additional agents using the
same task set. Measure accepted outcomes, rework, human minutes and total cost.
Keep multi-agent coordination only where its gain exceeds its coordination cost.

Memory read/write rules live in [MEMORY_SYSTEM.md](MEMORY_SYSTEM.md).
Pilot thresholds live in [ROADMAP.md](ROADMAP.md).
