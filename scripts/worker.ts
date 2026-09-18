import { connect } from "../src/lib/db.ts";
import { Engine } from "../src/lib/engine.ts";
if (!process.env.DATABASE_URL)
  throw new Error(
    "Standalone worker requires DATABASE_URL. Embedded demos run in the web process.",
  );
const db = await connect({ url: process.env.DATABASE_URL });
const engine = new Engine(db);
let stop = false;
process.on("SIGINT", () => (stop = true));
process.on("SIGTERM", () => (stop = true));
console.log(
  "Demo worker ready. No AI calls or repository writes will be made.",
);
try {
  while (!stop) {
    try {
      const claim = await engine.claim("local-workspace");
      if (claim) {
        await new Promise((r) => setTimeout(r, 1200));
        await engine.finish(claim);
      }
    } catch (error) {
      console.error(
        "Worker step failed:",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
} finally {
  await db.close();
}
