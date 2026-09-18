import { connect } from "../src/lib/db.ts";
import { CodingService } from "../src/lib/coding/service.ts";
if (!process.env.DATABASE_URL)
  throw new Error(
    "Coding worker requires DATABASE_URL; embedded mode is demo-only.",
  );
if (!process.env.OPENAI_API_KEY || !process.env.CODING_POLICY_FILE)
  throw new Error(
    "Configure OPENAI_API_KEY and CODING_POLICY_FILE before starting the coding worker.",
  );
const db = await connect({ url: process.env.DATABASE_URL });
const service = new CodingService(db);
let stop = false;
process.on("SIGINT", () => (stop = true));
process.on("SIGTERM", () => (stop = true));
console.log(
  "Coding worker ready. Approved missions may incur model charges. No GitHub writes are enabled.",
);
try {
  while (!stop) {
    try {
      await service.recover("local-workspace");
      const claim = await service.claim("local-workspace");
      if (claim) await service.execute(claim);
    } catch {
      console.error("Coding worker could not access mission state.");
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
} finally {
  await db.close();
}
