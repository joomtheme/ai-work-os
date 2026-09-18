import { DomainError } from "../engine.ts";
import { loadPolicy } from "./policy.ts";
export async function resolveCodingContract(input: any) {
  if (input?.mode !== "coding") return input;
  if (!process.env.DATABASE_URL)
    throw new DomainError(
      "Coding missions require PostgreSQL and the standalone coding worker.",
      409,
    );
  try {
    const policy = await loadPolicy(input.repository);
    return { ...input, coding: { commit: input.commit, policy } };
  } catch (error) {
    throw new DomainError(
      error instanceof Error
        ? error.message
        : "Coding configuration is invalid.",
      409,
    );
  }
}
