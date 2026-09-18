import { database } from "../../../../lib/db.ts";
import { Engine } from "../../../../lib/engine.ts";
import {
  authorize,
  body,
  route,
  sameOrigin,
  WORKSPACE,
} from "../../../../lib/http.ts";
export const runtime = "nodejs";
export const POST = (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) =>
  route(async () => {
    sameOrigin(request);
    await authorize();
    const input = await body(request);
    return new Engine(await database()).act(
      WORKSPACE,
      (await params).id,
      input?.action,
      input?.version,
      input?.contract,
    );
  });
