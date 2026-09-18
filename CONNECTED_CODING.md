# Connected coding worker

This increment connects the mission kernel to GitHub source reads, the OpenAI
Responses API, and a Docker verification runner. It produces an **unpublished
code proposal with real check results**. GitHub branch/PR writes are not enabled.
It is a bounded, single-attempt coding worker, not yet a general autonomous agent.

## Prerequisites

Use the PostgreSQL setup in DEVELOPMENT.md. The coding worker requires Docker,
a preloaded digest-pinned image, an OpenAI API key, and an explicitly reviewed
repository policy. Public GitHub repositories can be read without a token;
private repositories require a separate token with Contents read permission.
The GitHub connection in a ChatGPT conversation is not an application credential.

Do not paste keys into chat or commit them. Set OPENAI_API_KEY and, if needed,
GITHUB_TOKEN in the local .env. Copy coding-policy.example.json to the ignored
coding-policy.local.json and set CODING_POLICY_FILE to its path in .env.

The example intentionally contains invalid placeholders. Replace the image
reference with a digest you have reviewed and pulled, choose an available model
supporting Responses structured outputs, and enter its current input/output
prices in **US cents per million tokens**. For example, a price of $2 per million
is 200 cents per million. There is no silent model or pricing default.

The web server needs the policy and DATABASE_URL; the worker additionally needs
the provider credentials. Both processes must load identical policy contents.

## First real mission

The fixtures/coding directory contains a deliberately incorrect cart calculator
and immutable tests. It is separate from application tests and is expected to
fail until a proposed fix is applied in an isolated snapshot.

1. Publish this implementation branch to your repository and select its full
   40-character commit SHA. The commit must contain the two fixture files.
2. Review the policy: only cart.mjs is editable; cart.test.mjs stays unchanged.
   The default check command is node --test fixtures/coding/cart.test.mjs.
3. Start npm run dev and npm run worker:coding in separate terminals.
4. Create a Connected coding mission for that repository and commit. Example
   goal: "Fix the cart total so each item price is multiplied by its quantity."
   Criterion: "The supplied cart tests pass without changing the tests."
5. Review source paths, editable paths, model, image and command, then approve.
   Approval authorizes sending those source contents and mission text to OpenAI.
6. The worker records baseline results, requests one proposal, validates its
   file scope and runs the same checks on the changed snapshot.
7. Inspect the before/after contents, commit/blob references, command logs,
   provider response ID, token usage and artifact digest. Acceptance requires
   an explicit human review of every criterion; a passing test is not a blanket
   claim that the mission is correct.

Dependencies must already exist in the approved image or source scope. The
runner has no network, and it does not perform npm install. Small dependency-free
fixtures are the first supported evaluation target. This does not yet clone or
operate on arbitrary large repositories.

## Execution, interruption and accounting

- Only ordinary UTF-8 files at the approved commit are loaded. Symlinks,
  submodules, binary files, hidden paths, oversized blobs and truncated trees
  are rejected. Git blob hashes are checked before using content.
- Scope is limited to 12 files and 100 KB of source. Only existing allowed files
  may be replaced. The model cannot choose a shell command, image, network
  destination, credentials or additional tools.
- The runner uses a non-root container with no network, read-only root/source,
  restricted capabilities, CPU/memory/process limits, bounded temporary storage
  and a 60-second timeout. It stages files into an ephemeral work directory.
  No host credential or Docker socket is mounted into the container. Docker is
  a local development boundary, not a hardened public multi-tenant sandbox.
- Each plan gets one model attempt. Network failures, refusals, invalid changes
  and failed checks block the mission. There is no automatic paid retry or repair
  loop. Revise and approve the mission explicitly to attempt again.
- A conservative byte-based token estimate and configured rates gate dispatch.
  The estimate is accounted before sending the request and retained even if the
  response is lost. This is not a provider billing guarantee or actual invoice;
  token counts are recorded on success, runner costs are excluded, and rates
  must be maintained by the operator. Use provider-side spending controls too.
- Cancellation fences results and later stages. An already issued model request
  or container check can finish until its timeout; cancellation cannot promise
  a refund. A worker interruption older than ten minutes is marked blocked,
  requiring operator review rather than an automatic repeat of a paid request.
- Policy changes invalidate execution of already approved coding missions.
  Revision requires reviewing and approving the new policy snapshot.

## Validation and limitations

npm test covers provider request/response contracts, file integrity, policy
changes, scope enforcement, cancellation, accounting and criterion acceptance
using injected remote/runner fixtures. These tests are not live model runs.
The optional Docker test runs actual baseline and changed checks when
TEST_DOCKER_IMAGE contains a locally available digest reference.

```bash
npm run typecheck
npm test
npm run build
npm run test:http
# After loading your approved Docker image:
TEST_DOCKER_IMAGE='node@sha256:YOUR_DIGEST' npm test
```

Live provider quality, private-repository authentication, model cost estimates
and host-specific Docker behavior still require a credentialed end-to-end run.
No result from an offline test should be advertised as a model solving an issue.
Next steps: complete that run, add bounded repair with explicit budget policy,
then implement exact-action approval and reconciliation for PR publication.

API references used for the adapters:

- https://developers.openai.com/api/docs/guides/structured-outputs
- https://developers.openai.com/api/docs/guides/text
- https://docs.github.com/en/rest/git/blobs
- https://docs.github.com/en/rest/git/trees
