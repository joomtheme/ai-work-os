# AI Work OS

## The Operating System for Human + AI Collaboration

AI Work OS is a next-generation platform where humans define missions and intelligent AI teams plan, execute, verify, and deliver outcomes.

## Core Idea

Traditional software helps people manage work. AI Work OS helps people accomplish work.

```text
Intent
  ↓
Mission
  ↓
AI Team Planning
  ↓
Execution
  ↓
Verification
  ↓
Outcome
```

## Principles

- Outcome first
- Evidence based intelligence
- Human controlled automation
- Specialized AI teams
- Persistent organizational memory

## Vision

Build the operating system where humans define the future and AI teams make it happen.

## Development preview

The first mission kernel is available: create a mission, approve its plan,
run a deterministic worker, inspect simulated evidence, and accept delivery.
The preview includes a responsive web workspace and persistent PostgreSQL storage.
An embedded PostgreSQL option is available for local demos.

The default demo mode uses simulated outputs and costs. Connected coding is
an explicit, separately configured mode described below.

See [DEVELOPMENT.md](DEVELOPMENT.md) for setup, commands, tests and current limits.

## Connected coding (opt-in)

A separate worker can read approved files at an immutable GitHub commit, request
a code change from a configured OpenAI model, and run baseline/changed checks in
Docker. It returns an unpublished proposal for human review. Provider credentials,
PostgreSQL and Docker are required; there is no simulation fallback.

See [CONNECTED_CODING.md](CONNECTED_CODING.md) for setup and limitations.
