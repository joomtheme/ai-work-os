import { cookies } from "next/headers";
import {
  authorize,
  body,
  route,
  sameOrigin,
  session,
  validToken,
} from "../../../lib/http.ts";
import { DomainError } from "../../../lib/engine.ts";
export const runtime = "nodejs";
export const GET = () =>
  route(async () => {
    await authorize();
    return {
      authenticated: true,
      embedded: !!process.env.PGLITE_DATA_DIR && !process.env.DATABASE_URL,
    };
  });
export const POST = (request: Request) =>
  route(async () => {
    sameOrigin(request);
    const input = await body(request);
    if (typeof input?.token !== "string" || !validToken(input.token))
      throw new DomainError("Invalid workspace token.", 401);
    (await cookies()).set("workos-session", session(), {
      httpOnly: true,
      sameSite: "strict",
      secure: (process.env.APP_ORIGIN ?? "").startsWith("https://"),
      path: "/",
      maxAge: 8 * 60 * 60,
    });
    return { authenticated: true };
  });
export const DELETE = (request: Request) =>
  route(async () => {
    sameOrigin(request);
    (await cookies()).delete("workos-session");
    return { authenticated: false };
  });
