import { createHmac, timingSafeEqual, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { DomainError } from "./engine.ts";
export const WORKSPACE = "local-workspace";
function secret() {
  const value = process.env.WORKSPACE_TOKEN;
  if (!value || value.length < 32)
    throw new Error("Configure a WORKSPACE_TOKEN of at least 32 characters.");
  return value;
}
export function validToken(token: string) {
  return timingSafeEqual(
    createHash("sha256").update(token).digest(),
    createHash("sha256").update(secret()).digest(),
  );
}
export function session() {
  const expiry = String(Date.now() + 8 * 60 * 60 * 1000);
  return (
    expiry + "." + createHmac("sha256", secret()).update(expiry).digest("hex")
  );
}
export async function authorize() {
  const value = (await cookies()).get("workos-session")?.value ?? "";
  const [expiry, signature] = value.split(".");
  if (
    !expiry ||
    !signature ||
    !/^[a-f0-9]{64}$/.test(signature) ||
    !/^\d+$/.test(expiry) ||
    Number(expiry) < Date.now()
  )
    throw new DomainError("Sign in to your workspace.", 401);
  const expected = createHmac("sha256", secret()).update(expiry).digest("hex");
  if (
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  )
    throw new DomainError("Sign in to your workspace.", 401);
}
export function sameOrigin(request: Request) {
  if (
    request.headers.get("origin") !==
    (process.env.APP_ORIGIN ?? "http://localhost:3000")
  )
    throw new DomainError("Request origin is not allowed.", 403);
}
export async function body(request: Request) {
  const text = await request.text();
  if (text.length > 20000) throw new DomainError("Request is too large.", 413);
  try {
    return JSON.parse(text);
  } catch {
    throw new DomainError("Invalid JSON.");
  }
}
export async function route(fn: () => Promise<unknown>) {
  try {
    return Response.json(await fn(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof DomainError)
      return Response.json({ error: error.message }, { status: error.status });
    console.error(
      "Mission request failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return Response.json(
      {
        error:
          "The workspace could not process this request. Check server configuration and try again.",
      },
      { status: 500 },
    );
  }
}
