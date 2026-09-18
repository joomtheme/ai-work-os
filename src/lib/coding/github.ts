import { createHash } from "node:crypto";
import { safePath } from "./policy.ts";
export type SourceFile = { path: string; content: string; blobSha: string };
export async function limitedJson(
  response: Response,
  limit = 1_000_000,
): Promise<any> {
  if (!response.ok)
    throw new Error(`Remote request failed (HTTP ${response.status}).`);
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Empty remote response.");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const item = await reader.read();
      if (item.done) break;
      bytes += item.value.length;
      if (bytes > limit)
        throw new Error("Remote response exceeds the size limit.");
      chunks.push(item.value);
    }
  } finally {
    await reader.cancel();
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
export async function snapshot(
  repository: string,
  commit: string,
  paths: string[],
  request: typeof fetch = fetch,
): Promise<SourceFile[]> {
  if (
    !/^[\w.-]+\/[\w.-]+$/.test(repository) ||
    !/^[a-f0-9]{40}$/.test(commit) ||
    !paths.length ||
    paths.length > 12 ||
    !paths.every(safePath)
  )
    throw new Error("Invalid immutable repository scope.");
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN)
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const get = async (path: string) =>
    limitedJson(
      await request(`https://api.github.com/repos/${repository}/${path}`, {
        headers,
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      }),
      2_000_000,
    );
  const revision = await get(`git/commits/${commit}`);
  if (revision.sha !== commit || !revision.tree?.sha)
    throw new Error("GitHub did not return the requested commit.");
  const tree = await get(`git/trees/${revision.tree.sha}?recursive=1`);
  if (tree.truncated || !Array.isArray(tree.tree))
    throw new Error(
      "Repository tree is incomplete. Narrow the repository before running.",
    );
  const files: SourceFile[] = [];
  let total = 0;
  for (const path of paths) {
    const entry = tree.tree.find((e: any) => e.path === path);
    if (
      !entry ||
      entry.type !== "blob" ||
      !["100644", "100755"].includes(entry.mode) ||
      entry.size > 50000
    )
      throw new Error(`Unsupported or missing source file: ${path}`);
    const blob = await get(`git/blobs/${entry.sha}`);
    if (blob.encoding !== "base64" || typeof blob.content !== "string")
      throw new Error("Source blob encoding is unsupported.");
    const bytes = Buffer.from(blob.content, "base64");
    total += bytes.length;
    if (bytes.length > 50000 || total > 100000 || bytes.includes(0))
      throw new Error("Source scope is too large or includes binary data.");
    const sha = createHash("sha1")
      .update(`blob ${bytes.length}\0`)
      .update(bytes)
      .digest("hex");
    if (sha !== entry.sha)
      throw new Error("Source blob integrity check failed.");
    const content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    files.push({ path, content, blobSha: sha });
  }
  return files;
}
