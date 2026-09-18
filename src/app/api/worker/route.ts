import { database } from "../../../lib/db.ts";
import { Engine, DomainError } from "../../../lib/engine.ts";
import { authorize, route, sameOrigin, WORKSPACE } from "../../../lib/http.ts";
export const runtime = "nodejs";
// Embedded demo only: the browser asks for one durable step while it is open.
// PostgreSQL deployments use scripts/worker.ts, independent of any browser.
export const POST = (request: Request) =>
  route(async () => {
    sameOrigin(request);
    await authorize();
    if (!process.env.PGLITE_DATA_DIR || process.env.DATABASE_URL)
      throw new DomainError("Use the standalone worker with PostgreSQL.", 404);
    const engine = new Engine(await database());
    const claim = await engine.claim(WORKSPACE);
    if (claim) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await engine.finish(claim);
    }
    return { worked: !!claim };
  });
