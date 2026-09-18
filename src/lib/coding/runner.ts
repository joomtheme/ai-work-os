import { spawn } from "node:child_process";
import { mkdir, mkdtemp, writeFile, chmod, rm } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import type { CodingPolicy } from "./policy.ts";
import { safePath } from "./policy.ts";
export type CheckResult = {
  exitCode: number;
  output: string;
  timedOut: boolean;
  image: string;
  command: string[];
};
export async function command(
  executable: string,
  args: string[],
  timeoutMs: number,
) {
  return new Promise<{ exitCode: number; output: string; timedOut: boolean }>(
    (resolveResult, reject) => {
      const child = spawn(executable, args, {
        stdio: ["ignore", "pipe", "pipe"],
        env: {
          PATH: process.env.PATH,
          HOME: process.env.HOME,
          NODE_ENV: "production",
        },
      });
      let output = "",
        timedOut = false;
      const append = (chunk: Buffer) => {
        if (output.length < 32000)
          output += chunk.toString("utf8").slice(0, 32000 - output.length);
      };
      child.stdout.on("data", append);
      child.stderr.on("data", append);
      const timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGKILL");
      }, timeoutMs);
      child.once("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
      child.once("close", (code) => {
        clearTimeout(timer);
        resolveResult({ exitCode: code ?? -1, output, timedOut });
      });
    },
  );
}
export async function preflight(policy: CodingPolicy) {
  const result = await command(
    "docker",
    ["image", "inspect", policy.image],
    10000,
  ).catch(() => {
    throw new Error(
      "Docker is unavailable. Install Docker and preload the approved image.",
    );
  });
  if (result.exitCode !== 0)
    throw new Error(
      "The approved Docker image is not available locally. Pull its exact digest before running.",
    );
}
export function dockerArgs(
  name: string,
  directory: string,
  policy: CodingPolicy,
) {
  return [
    "run",
    "--name",
    name,
    "--pull=never",
    "--rm",
    "--network=none",
    "--read-only",
    "--cap-drop=ALL",
    "--security-opt=no-new-privileges",
    "--user=65534:65534",
    "--pids-limit=128",
    "--memory=512m",
    "--cpus=1",
    "--ulimit",
    "fsize=65536:65536",
    "--tmpfs",
    "/tmp:rw,nosuid,size=32m,mode=1777",
    "--tmpfs",
    "/work:rw,nosuid,size=64m,mode=1777",
    "--mount",
    `type=bind,source=${directory},target=/source,readonly`,
    "--workdir=/work",
    "--entrypoint=/bin/sh",
    policy.image,
    "-c",
    'cp -R /source/. /work/ && exec "$@"',
    "runner",
    ...policy.command,
  ];
}
export async function verify(
  files: { path: string; content: string }[],
  policy: CodingPolicy,
): Promise<CheckResult> {
  const root = resolve(".work-os-runs");
  await mkdir(root, { recursive: true, mode: 0o700 });
  const directory = await mkdtemp(join(root, "run-"));
  await chmod(directory, 0o755);
  const name = `workos-${randomUUID()}`;
  try {
    for (const file of files) {
      if (!safePath(file.path)) throw new Error("Unsafe runner path.");
      const target = join(directory, file.path);
      await mkdir(dirname(target), { recursive: true, mode: 0o755 });
      await writeFile(target, file.content, { mode: 0o644, flag: "wx" });
    }
    const result = await command(
      "docker",
      dockerArgs(name, directory, policy),
      60000,
    );
    return { ...result, image: policy.image, command: policy.command };
  } finally {
    await command("docker", ["rm", "--force", name], 5000).catch(() => {});
    await rm(directory, { recursive: true, force: true });
  }
}
