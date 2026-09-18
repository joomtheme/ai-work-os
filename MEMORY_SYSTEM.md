# Memory System

Status: proposed. Memory supports evidence-based work; it does not authorize
actions or replace the mission's authoritative state.

## Memory layers

| Layer | Content | Lifetime and authority |
| --- | --- | --- |
| Run context | Current task inputs and temporary notes | Run-scoped; no automatic promotion |
| Mission record | Plans, artifacts, approvals, evidence and outcomes | Durable operational record |
| Project knowledge | Architecture, conventions, decisions, known incidents | Scoped, versioned and reviewed |
| Workspace policy | Approved preferences and operating constraints | Edited by authorized people |
| Reusable playbooks | Validated procedures and mission templates | Versioned, evaluated before adoption |

Begin with Postgres records and full-text search. Embeddings are a later retrieval
index, not the authoritative store. Do not implement a knowledge graph solely
because the product has agents.

## Record contract

A memory record contains:
- ID, workspace and optional project/repository/mission scope;
- type, content, author/producing run and sensitivity;
- source URI, source revision or artifact digest, and evidence references;
- created_at, observed_at, valid_from, optional valid_until and review_after;
- status: candidate, verified, disputed, superseded, expired or deleted;
- reviewer, supersedes relation, access policy and retention class.

A model confidence score does not establish truth. Verified means an authorized
review or deterministic evidence check supported the specified claim at the
recorded source version. It does not mean universally or permanently correct.

## Write path

1. A run proposes a candidate with source evidence.
2. Validate scope, provenance, schema and secret redaction.
3. Compare with existing records; preserve disagreements.
4. A permitted reviewer or narrowly defined deterministic check verifies it.
5. Commit the record and an audit event, then update retrieval indexes.

Unverified generated summaries cannot become workspace policy. Completing a
mission may propose lessons, but does not silently rewrite organizational facts.
Failure records are valuable: preserve symptom, attempted fixes and the evidence
showing why they failed.

## Read path

Resolve identity and workspace first. Filter by workspace, project, ACL, status
and validity before ranking. Retrieve only authorized candidates, then rank by
relevance, source version, freshness and evidence quality. Recheck access before
returning the payload. Cache keys include authorization scope and policy version.

Return excerpts with source links, revision, date and status. Log which memory
versions informed each run. Token limits should favor direct evidence and explicit
decisions over long summaries. If no reliable evidence exists, return unknown.

Retrieved text cannot change tool permissions, override system policy or issue
executable instructions. All actions still pass through the gateway.

## Freshness, conflicts and deletion

A repository decision tied to one commit may be obsolete after a relevant change.
Invalidation events mark affected records for review; critical decisions recheck
the live source even if an index has not caught up. Expired data may be displayed
as historical context, clearly labeled, but cannot silently support a current claim.

For contradictions, retain both sources and mark the claim disputed. Prefer a
current authoritative source where available; otherwise request human resolution.
A new record supersedes the old one without rewriting history.

Access revocation immediately removes retrieval access and invalidates caches.
Deletion removes content from primary records, search indexes, embeddings and
caches; derived summaries referencing it are invalidated and rebuilt or removed.
Retain only policy-permitted metadata tombstones. Backups follow documented
expiry; restore procedures reapply deletion tombstones before enabling reads.
Set retention durations with the pilot workspace owner before ingestion.

## Evaluation gates

Use fixtures covering exact retrieval, stale decisions, conflicting claims,
deleted sources, revoked users and adversarial source instructions. Require
zero cross-workspace or revoked-content disclosures in the pilot security suite.

For usefulness, measure cited-source correctness, supported-answer rate,
freshness errors and reduction in repeated clarification. Compare repeated
missions with memory enabled and disabled. Only add semantic search if it improves
these metrics without weakening access controls.

See [ARCHITECTURE.md](ARCHITECTURE.md) for tenant boundaries and
[ROADMAP.md](ROADMAP.md) for implementation order.
