# Roadmap

Status: proposed, outcome-gated roadmap. No implementation or competitive
superiority is claimed. Staffing and budget are not yet established, so phases
are ordered by dependencies rather than promised calendar dates.

## Why a team would choose AI Work OS

Product hypothesis: a small GitHub-based software team will choose AI Work OS
when it reliably converts a bounded goal into an accepted deliverable with less
human handling, visible evidence and predictable cost.

Buzz is a serious reference, not a plain chatbot. Its README describes shared
human/agent workspaces, agent tooling, workflows, Git events, search and audit
history. It distinguishes working capabilities from unfinished approval wiring.
These are documentation claims, not independently tested results.
Source reviewed 2026-09-18: [Buzz README](https://github.com/block/buzz/blob/main/README.md),
blob SHA 56439f00bc1565ce7aca273a886eecdc12df5c1d.

We cannot establish that Buzz lacks mission-like behavior from its README alone.
Our differentiation must survive side-by-side testing, even if Buzz adds similar
terminology or features.

| Decision factor | AI Work OS product bet | Proof needed |
| --- | --- | --- |
| Delegation | Goal, criteria, budget and permissions in one mission contract | User can delegate without repeatedly restating scope |
| Delivery trust | Criterion-level evidence tied to delivered revision | Failures and stale evidence prevent acceptance |
| Control | Clear approval inbox and bounded execution | No out-of-policy actions; useful recovery after interruptions |
| Continuity | Reviewed knowledge reused across missions | Less repeated clarification without stale or leaked context |
| Economics | Visible cost per accepted outcome | Less human handling at acceptable total cost |
| Adoption | Work with the team's existing GitHub repository | First accepted mission with low setup effort |

Mission UI and agent role names are easy to copy. The potential durable advantage
is a growing set of evaluated workflows, integration reliability and trusted
project knowledge that measurably improves delivery. This is a hypothesis.

## Initial scope

Pilot users: small software teams and agencies maintaining GitHub repositories.
First mission template: bounded issue to verified pull request.
First experience: connect one repository, choose an issue, confirm success
criteria and limits, approve the plan, review the delivery evidence.

Defer general-purpose business automation, native chat/voice, mobile apps,
a new Git forge, marketplaces, cross-company agent networks and unrestricted
autonomous deployment. Expansion follows evidence of repeated useful delivery.

## Phase 0 — Validate the wedge

Deliver: interview notes from 5 target teams, a 20-task benchmark of bounded
realistic issues, written acceptance criteria, and baseline measurements.

Compare AI Work OS's proposed flow against the team's current workflow and a
configured Buzz workflow where feasible. Record Buzz commit, agent/model,
permissions, setup effort and operator experience. Use identical repository
snapshots and acceptance rubrics; alternate order or use matched task variants
to limit learning effects. If Buzz cannot be evaluated, report the limitation
and do not claim superiority.

Exit: at least 3 teams agree to pilot this exact workflow; obtain allowed test
repositories. Failure to reach this gate triggers a target/use-case revision.

## Phase 1 — Build the mission kernel

Deliver: web mission form/detail, authentication, workspace scope, mission/task
state machine, versioned plans, event history, durable job runner, cancellation,
budget reservation and an approval inbox. Use a deterministic fake worker first.

Exit: lifecycle and isolation checks from ARCHITECTURE.md pass, including process
restart, stale approvals and duplicate delivery. UI shows blocked versus failed
versus waiting for approval unambiguously.

## Phase 2 — Complete one real delivery loop

Deliver: read-only GitHub ingestion, one isolated implementation worker,
verification pipeline, artifact store and approved branch/PR publication.
Ship one model adapter first; keep its contract provider-neutral.

Exit: complete at least 10 bounded test missions with retained evidence; failed
criteria cannot complete a mission. Inject remote-write timeouts and reconcile
without duplicate PRs. Merge/deploy remain outside the delivery contract.

## Phase 3 — Add useful memory and harden the pilot

Deliver: scoped project records, provenance, reviewed promotion, freshness,
deletion, redacted observability, cost reporting and restore procedures.
Add a second model adapter only if it validates portability or improves results.

Exit: security and memory fixtures pass; restore is demonstrated; each of
3 pilot teams completes at least 5 eligible missions. Record every failure and
manual rescue, not only successful demos.

## Phase 4 — Prove preference

Run the held-out 20-task benchmark and pilot comparison using the same acceptance
criteria. Report counts, medians, ranges, exclusions and setup time. Separate
active human work from waiting for approval or CI. Small pilots establish a
direction, not universal statistical superiority.

Proposed go/no-go targets (not measured results):
- At least 80% accepted missions on the predefined eligible task set.
- At least 50% lower median active human minutes per accepted mission than the
  measured baseline, with comparable acceptance quality.
- Total model/tool/runner cost per accepted mission below a ceiling agreed with
  pilot users before evaluation; include failed attempts in the numerator.
- Zero unauthorized writes or tenant-isolation failures in the test suite/pilot.
- At least 2 of 3 pilot teams voluntarily use it again the following week.

If quality or control fails, stop scope expansion. If efficiency fails, simplify
the workflow or change the mission category before adding agents. A cost target
cannot be marked passed while its agreed ceiling is still unspecified.

## Phase 5 — Expand from demonstrated demand

Candidate next missions: release preparation, dependency upgrades and incident
investigation. Add integrations based on repeated pilot requests, then evaluate
delegated routine actions and reusable playbooks. Decide hosted versus self-hosted
packaging, pricing and licensing after adoption and operational costs are known.

## First implementation backlog

1. Scaffold the TypeScript workspace and local Postgres development environment.
2. Define mission/plan/task/action/approval/evidence schemas and tenant policies.
3. Implement guarded transitions and event/outbox transaction boundaries.
4. Add a fake worker with leases, restart recovery and spend reservations.
5. Build mission detail and approval views around those real states.
6. Add GitHub snapshot ingestion, isolated execution and verification.
7. Add exact-action approval, publication reconciliation and acceptance.

Architecture, roles and memory are specified in [ARCHITECTURE.md](ARCHITECTURE.md),
[AGENT_MODEL.md](AGENT_MODEL.md) and [MEMORY_SYSTEM.md](MEMORY_SYSTEM.md).
