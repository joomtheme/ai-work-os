import { resolveCodingContract } from "../../../lib/coding/contract.ts";
import { database } from "../../../lib/db.ts";
import { Engine } from "../../../lib/engine.ts";
import {
  authorize,
  body,
  route,
  sameOrigin,
  WORKSPACE,
} from "../../../lib/http.ts";
export const runtime = "nodejs";
export const GET = () =>
  route(async () => {
    await authorize();
    return new Engine(await database()).list(WORKSPACE);
  });
export const POST = (request: Request) =>
  route(async () => {
    sameOrigin(request);
    await authorize();
    return new Engine(await database()).create(
      WORKSPACE,
      await resolveCodingContract(await body(request)),
    );
  });
