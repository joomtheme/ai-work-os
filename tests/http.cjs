const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const root = process.cwd();
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3100",
  ],
  {
    cwd: root,
    env: {
      ...process.env,
      DATABASE_URL: "",
      PGLITE_DATA_DIR: root + "/.data/http-test",
      WORKSPACE_TOKEN: "development-test-token-only-123456789",
      APP_ORIGIN: "http://127.0.0.1:3100",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
server.stderr.on("data", (b) => process.stderr.write(b));
const base = "http://127.0.0.1:3100";
(async () => {
  try {
    await new Promise((resolve, reject) => {
      const t = setTimeout(
        () => reject(new Error("Server did not start")),
        20000,
      );
      server.stdout.on("data", (b) => {
        if (b.toString().includes("Ready")) {
          clearTimeout(t);
          resolve();
        }
      });
      server.on("exit", (c) => reject(new Error("Server exited " + c)));
    });
    let r = await fetch(base + "/api/missions");
    assert.equal(r.status, 401);
    r = await fetch(base + "/api/session", {
      method: "POST",
      headers: { "content-type": "application/json", origin: base },
      body: JSON.stringify({ token: "development-test-token-only-123456789" }),
    });
    assert.equal(r.status, 200);
    const cookie = r.headers.get("set-cookie")?.split(";")[0];
    assert.ok(cookie);
    const headers = {
      "content-type": "application/json",
      origin: base,
      cookie,
    };
    r = await fetch(base + "/api/missions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        goal: "Verify the HTTP mission lifecycle",
        repository: "joomtheme/ai-work-os",
        criteria: ["Demo outcome is recorded"],
        budgetCents: 100,
      }),
    });
    let m = await r.json();
    assert.equal(r.status, 200, JSON.stringify(m));
    const act = async (action) => {
      const res = await fetch(base + "/api/missions/" + m.id, {
        method: "POST",
        headers,
        body: JSON.stringify({ action, version: m.version }),
      });
      m = await res.json();
      assert.equal(res.status, 200, JSON.stringify(m));
    };
    await act("approve");
    for (let i = 0; i < 2; i++) {
      r = await fetch(base + "/api/worker", { method: "POST", headers });
      assert.equal(r.status, 200, await r.text());
    }
    r = await fetch(base + "/api/missions", { headers });
    m = (await r.json()).find((x) => x.id === m.id);
    assert.equal(m.state, "awaiting_acceptance");
    await act("accept");
    assert.equal(m.state, "completed");
    r = await fetch(base + "/api/missions", {
      method: "POST",
      headers: { ...headers, origin: "https://evil.example" },
      body: "{}",
    });
    assert.equal(r.status, 403);
    r = await fetch(base + "/api/missions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        mode: "coding",
        repository: "team/example",
        goal: "Attempt an unconfigured coding mission",
        criteria: ["Check result"],
        budgetCents: 100,
        commit: "a".repeat(40),
        coding: { policy: { repository: "team/example" } },
      }),
    });
    assert.equal(
      r.status,
      409,
      "Embedded mode must reject connected execution even if a client supplies a policy",
    );
    r = await fetch(base + "/");
    assert.equal(r.status, 200);
    assert.match(await r.text(), /AI Work OS/);
    console.log(
      "PASS: production HTTP login, unauthorized rejection, mission creation, plan approval, worker execution, acceptance, origin rejection and page response.",
    );
  } finally {
    server.kill("SIGTERM");
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
