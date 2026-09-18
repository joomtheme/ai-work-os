import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
export type CodingPolicy = {
  repository: string;
  paths: string[];
  editablePaths: string[];
  image: string;
  command: string[];
  model: string;
  inputCentsPerMillion: number;
  outputCentsPerMillion: number;
  maxOutputTokens: number;
};
export const fingerprint = (value: unknown) =>
  createHash("sha256")
    .update(
      JSON.stringify(value, (_key, item) => {
        if (item && typeof item === "object" && !Array.isArray(item))
          return Object.fromEntries(
            Object.entries(item).sort(([a], [b]) => a.localeCompare(b)),
          );
        return item;
      }),
    )
    .digest("hex");
export function safePath(path: unknown): path is string {
  return (
    typeof path === "string" &&
    path.length <= 200 &&
    /^[a-zA-Z0-9_./-]+$/.test(path) &&
    path
      .split("/")
      .every((p) => p !== "" && p !== "." && p !== ".." && !p.startsWith("."))
  );
}
export function validatePolicy(value: unknown): CodingPolicy {
  const p = value as CodingPolicy;
  if (
    !p ||
    !/^[\w.-]+\/[\w.-]+$/.test(p.repository) ||
    !Array.isArray(p.paths) ||
    p.paths.length < 1 ||
    p.paths.length > 12 ||
    !p.paths.every(safePath) ||
    new Set(p.paths).size !== p.paths.length ||
    !Array.isArray(p.editablePaths) ||
    !p.editablePaths.length ||
    !p.editablePaths.every((x) => p.paths.includes(x)) ||
    !Array.isArray(p.command) ||
    !p.command.length ||
    p.command.length > 20 ||
    !p.command.every(
      (x) => typeof x === "string" && x.length > 0 && x.length < 500,
    ) ||
    typeof p.image !== "string" ||
    !/^[-\w./:]+@sha256:[a-f0-9]{64}$/.test(p.image) ||
    typeof p.model !== "string" ||
    !p.model.trim() ||
    p.model.length > 100 ||
    !Number.isFinite(p.inputCentsPerMillion) ||
    p.inputCentsPerMillion <= 0 ||
    !Number.isFinite(p.outputCentsPerMillion) ||
    p.outputCentsPerMillion <= 0 ||
    !Number.isSafeInteger(p.maxOutputTokens) ||
    p.maxOutputTokens < 128 ||
    p.maxOutputTokens > 16000
  )
    throw new Error(
      "Invalid coding policy. Configure exact paths, a digest-pinned image, command, model and positive token rates.",
    );
  // Normalize away extra fields; secrets must never enter the mission contract.
  return {
    repository: p.repository,
    paths: p.paths,
    editablePaths: p.editablePaths,
    image: p.image,
    command: p.command,
    model: p.model,
    inputCentsPerMillion: p.inputCentsPerMillion,
    outputCentsPerMillion: p.outputCentsPerMillion,
    maxOutputTokens: p.maxOutputTokens,
  };
}
export async function loadPolicy(repository: string) {
  if (!process.env.CODING_POLICY_FILE)
    throw new Error(
      "Configure CODING_POLICY_FILE before creating a coding mission.",
    );
  const policies: unknown = JSON.parse(
    await readFile(process.env.CODING_POLICY_FILE, "utf8"),
  );
  if (!Array.isArray(policies))
    throw new Error("Coding policy must be an array.");
  const policy = policies
    .map(validatePolicy)
    .find((p) => p.repository === repository);
  if (!policy)
    throw new Error("Repository is not enabled in the coding policy.");
  return policy;
}
