import test from "node:test";
import assert from "node:assert/strict";
import { verify, preflight } from "../src/lib/coding/runner.ts";
import type { CodingPolicy } from "../src/lib/coding/policy.ts";
test(
  "real Docker runner preserves source, denies network and runs baseline/fixed checks",
  { skip: !process.env.TEST_DOCKER_IMAGE },
  async () => {
    const policy: CodingPolicy = {
      repository: "test/fixture",
      paths: ["value.mjs", "value.test.mjs"],
      editablePaths: ["value.mjs"],
      image: process.env.TEST_DOCKER_IMAGE!,
      command: ["node", "--test", "value.test.mjs"],
      model: "unused",
      inputCentsPerMillion: 1,
      outputCentsPerMillion: 1,
      maxOutputTokens: 128,
    };
    const tests = `import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs'; import { value } from './value.mjs'; test('correct result',()=>assert.equal(value,2)); test('source is read-only',()=>assert.throws(()=>fs.writeFileSync('/source/value.mjs','bad'))); test('no credential',()=>assert.equal(process.env.OPENAI_API_KEY,undefined)); test('no network route',()=>assert.equal(fs.readFileSync('/proc/net/route','utf8').trim().split(String.fromCharCode(10)).length,1));`;
    const files = [
      { path: "value.mjs", content: "export const value=1;" },
      { path: "value.test.mjs", content: tests },
    ];
    await preflight(policy);
    const baseline = await verify(files, policy);
    assert.equal(baseline.exitCode, 1);
    assert.equal(baseline.timedOut, false);
    const fixed = await verify(
      [{ path: "value.mjs", content: "export const value=2;" }, files[1]],
      policy,
    );
    assert.equal(fixed.exitCode, 0, fixed.output);
    assert.equal(fixed.timedOut, false);
  },
);
