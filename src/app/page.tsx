"use client";
import { useEffect, useRef, useState } from "react";
import type { Mission, Action } from "../lib/types";
const money = (c: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    c / 100,
  );
const labels: Record<string, string> = {
  awaiting_plan_approval: "Plan approval",
  ready: "Queued",
  running: "In progress",
  blocked: "Blocked",
  verifying: "Verifying",
  awaiting_acceptance: "Delivery review",
  completed: "Completed",
  cancelled: "Cancelled",
};
async function api(path: string, method = "GET", data?: unknown) {
  const res = await fetch("/api/" + path, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error ?? "Request failed.");
  return result;
}
export default function Home() {
  const [authenticated, setAuthenticated] = useState(false),
    [checked, setChecked] = useState(false),
    [embedded, setEmbedded] = useState(false);
  const [missions, setMissions] = useState<Mission[]>([]),
    [selected, setSelected] = useState<string>(),
    [view, setView] = useState<"all" | "approvals">("all");
  const [form, setForm] = useState(false),
    [editing, setEditing] = useState<Mission>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const workerBusy = useRef(false);
  const current = missions.find((m) => m.id === selected);
  const approvals = missions.filter((m) =>
    ["awaiting_plan_approval", "awaiting_acceptance"].includes(m.state),
  );
  async function refresh() {
    setMissions(await api("missions"));
  }
  useEffect(() => {
    api("session")
      .then((s) => {
        setAuthenticated(true);
        setEmbedded(s.embedded);
      })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, []);
  useEffect(() => {
    if (!authenticated) return;
    let alive = true;
    const load = () =>
      api("missions")
        .then((m) => {
          if (alive) setMissions(m);
        })
        .catch((e) => {
          if (alive) setError(e.message);
        });
    void load();
    const timer = setInterval(load, 1500);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [authenticated]);
  useEffect(() => {
    if (!authenticated || !embedded) return;
    const timer = setInterval(async () => {
      if (workerBusy.current) return;
      workerBusy.current = true;
      try {
        await api("worker", "POST");
      } catch (e) {
        setError((e as Error).message);
      } finally {
        workerBusy.current = false;
      }
    }, 2500);
    return () => clearInterval(timer);
  }, [authenticated, embedded]);
  async function perform(action: Action, contract?: unknown) {
    if (!current) return;
    setBusy(true);
    setError("");
    try {
      await api(`missions/${current.id}`, "POST", {
        action,
        version:
          action === "revise" && editing ? editing.version : current.version,
        contract,
      });
      setEditing(undefined);
      setForm(false);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
      await refresh();
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const contract = {
      goal: data.get("goal"),
      repository: data.get("repository"),
      criteria: String(data.get("criteria"))
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      budgetCents: Math.round(Number(data.get("budget")) * 100),
    };
    if (editing) {
      await perform("revise", contract);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const m = await api("missions", "POST", contract);
      await refresh();
      setSelected(m.id);
      setForm(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!checked)
    return (
      <main className="login">
        <p>Opening your workspace…</p>
      </main>
    );
  if (!authenticated)
    return (
      <main className="login">
        <div className="login-card">
          <div className="brand">
            <span className="mark">W</span> AI WORK OS
          </div>
          <p className="eyebrow">YOUR NEXT OUTCOME STARTS HERE</p>
          <h1>
            Work with
            <br />a clear finish line.
          </h1>
          <p className="muted">
            Sign in to define missions, approve plans, and review delivery
            evidence.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                await api("session", "POST", {
                  token: new FormData(e.currentTarget).get("token"),
                });
                const s = await api("session");
                setEmbedded(s.embedded);
                setAuthenticated(true);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Workspace token
              <input
                name="token"
                type="password"
                required
                autoComplete="current-password"
                placeholder="Enter your workspace token"
              />
            </label>
            <button disabled={busy}>
              {busy ? "Signing in…" : "Enter workspace →"}
            </button>
          </form>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <small>
            Private development workspace · Deterministic demo worker
          </small>
        </div>
      </main>
    );
  const filtered = view === "approvals" ? approvals : missions;
  return (
    <div className="shell">
      <aside>
        <div className="brand">
          <span className="mark">W</span>
          <span>
            AI WORK OS<small>Mission control</small>
          </span>
        </div>
        <div className="workspace">
          <span className="avatar">LW</span>
          <div>
            Local workspace<small>Development edition</small>
          </div>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <button
          className={"nav " + (view === "all" ? "active" : "")}
          onClick={() => setView("all")}
        >
          ◈ <span>Missions</span>
          <b>{missions.length}</b>
        </button>
        <button
          className={"nav " + (view === "approvals" ? "active" : "")}
          onClick={() => setView("approvals")}
        >
          ✓ <span>Approvals</span>
          <b>{approvals.length}</b>
        </button>
        <div className="sidebar-bottom">
          <span className="dot" /> Demo worker
          <small>
            Simulated outputs and costs.
            <br />
            No repository changes.
          </small>
          <button
            className="text-button"
            onClick={async () => {
              try {
                await api("session", "DELETE");
                setAuthenticated(false);
                setMissions([]);
                setSelected(undefined);
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Sign out ↗
          </button>
        </div>
      </aside>
      <main className="main">
        <header>
          <span>
            Workspace <span className="slash">/</span>{" "}
            {view === "all" ? "Missions" : "Approvals"}
          </span>
          <span className="pill">LOCAL PREVIEW</span>
        </header>
        <section className="content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">DEFINE. DELEGATE. DELIVER.</p>
              <h1>
                {view === "all" ? "Mission control" : "Your decisions matter."}
              </h1>
              <p className="muted">
                {view === "all"
                  ? "Move from intent to an outcome you can inspect."
                  : "Review the plan. Inspect the evidence. Give the go-ahead."}
              </p>
            </div>
            <button
              onClick={() => {
                setEditing(undefined);
                setForm(true);
                setError("");
              }}
            >
              + New mission
            </button>
          </div>
          <div className="stats">
            <div>
              <span>Active missions</span>
              <strong>
                {
                  missions.filter((m) =>
                    ["ready", "running", "verifying"].includes(m.state),
                  ).length
                }
              </strong>
              <small>Moving toward delivery</small>
            </div>
            <div>
              <span>Awaiting your decision</span>
              <strong>{approvals.length}</strong>
              <small>Plans and delivery reviews</small>
            </div>
            <div>
              <span>Accepted outcomes</span>
              <strong>
                {missions.filter((m) => m.state === "completed").length}
              </strong>
              <small>Reviewed by you</small>
            </div>
            <div>
              <span>Simulated spend</span>
              <strong>
                {money(missions.reduce((s, m) => s + m.spentCents, 0))}
              </strong>
              <small>No actual charges</small>
            </div>
          </div>
          <div className="demo-notice">
            <span>◉</span>
            <div>
              <b>A working foundation, with a demo workforce.</b> Every output
              is simulated.{" "}
              {embedded
                ? "Keep this workspace open to run steps."
                : "Start the standalone worker to run queued missions."}
            </div>
          </div>
          {error && (
            <div className="error" role="alert">
              {error}
              <button className="text-button" onClick={() => setError("")}>
                Dismiss
              </button>
            </div>
          )}
          {form ? (
            <section className="panel form-panel">
              <div className="section-heading">
                <h2>
                  {editing ? "Revise mission contract" : "Define a new mission"}
                </h2>
                <button
                  className="secondary"
                  onClick={() => {
                    setForm(false);
                    setEditing(undefined);
                  }}
                >
                  Close
                </button>
              </div>
              <p className="muted">
                Describe the finish line. You will review the plan before
                execution begins.
              </p>
              <form onSubmit={submit} key={editing?.id ?? "new"}>
                <label>
                  Outcome
                  <textarea
                    name="goal"
                    required
                    minLength={8}
                    maxLength={2000}
                    defaultValue={editing?.goal}
                    placeholder="Fix the checkout error and prepare a reviewed pull request."
                  />
                </label>
                <div className="two-col">
                  <label>
                    GitHub repository
                    <input
                      name="repository"
                      required
                      pattern="[\w.\-]+/[\w.\-]+"
                      defaultValue={editing?.repository}
                      placeholder="owner/repository"
                    />
                    <small>
                      Reference only in this demo. No access is requested.
                    </small>
                  </label>
                  <label>
                    Simulated budget (USD)
                    <input
                      name="budget"
                      type="number"
                      min="0.01"
                      max="1000"
                      step="0.01"
                      defaultValue={editing ? editing.budgetCents / 100 : 1}
                      required
                    />
                    <small>
                      Each demo step uses $0.05 of simulated budget.
                    </small>
                  </label>
                </div>
                <label>
                  Acceptance criteria
                  <textarea
                    name="criteria"
                    required
                    defaultValue={editing?.criteria.join("\n")}
                    placeholder={
                      "The reproduction is documented\nThe regression check passes"
                    }
                  />
                  <small>
                    One criterion per line, up to 10. Demo checks only confirm
                    inclusion in an artifact.
                  </small>
                </label>
                <button disabled={busy}>
                  {busy
                    ? "Saving…"
                    : editing
                      ? "Save revised contract"
                      : "Create mission →"}
                </button>
              </form>
            </section>
          ) : (
            <div className="mission-layout">
              <section className="panel mission-list">
                <div className="section-heading">
                  <h2>{view === "all" ? "All missions" : "Approval inbox"}</h2>
                  <span className="count">{filtered.length}</span>
                </div>
                {filtered.length === 0 ? (
                  <div className="empty">
                    <div className="empty-icon">◈</div>
                    <h3>
                      {view === "all"
                        ? "Make room for your next outcome."
                        : "You are all caught up."}
                    </h3>
                    <p>
                      {view === "all"
                        ? "Create a mission to turn a clear goal into a plan you can approve."
                        : "Plans and deliveries needing a decision will appear here."}
                    </p>
                    {view === "all" && (
                      <button
                        className="secondary"
                        onClick={() => setForm(true)}
                      >
                        Create your first mission
                      </button>
                    )}
                  </div>
                ) : (
                  filtered.map((m) => (
                    <button
                      className={
                        "mission-row " +
                        (current?.id === m.id ? "selected" : "")
                      }
                      key={m.id}
                      onClick={() => setSelected(m.id)}
                    >
                      <span className={"status " + m.state}>
                        {labels[m.state]}
                      </span>
                      <h3>{m.goal}</h3>
                      <span className="repo">{m.repository}</span>
                      <div className="row-meta">
                        <span>
                          {m.tasks.filter((t) => t.done).length}/
                          {m.tasks.length} steps
                        </span>
                        <span>
                          {money(m.spentCents)} / {money(m.budgetCents)}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </section>
              <section className="panel detail">
                {!current ? (
                  <div className="empty detail-empty">
                    <div className="empty-icon">↗</div>
                    <h2>Clarity at every step.</h2>
                    <p>
                      Select a mission to review its plan,
                      <br />
                      track progress, and inspect the evidence.
                    </p>
                    <div className="flow-labels">
                      <span>Plan</span>
                      <span>Execute</span>
                      <span>Verify</span>
                      <span>Accept</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="section-heading">
                      <span className={"status " + current.state}>
                        {labels[current.state]}
                      </span>
                      <span className="muted">Plan v{current.planVersion}</span>
                    </div>
                    <h2 className="mission-title">{current.goal}</h2>
                    <p className="repo">{current.repository}</p>
                    {current.blockedReason && (
                      <div className="error">{current.blockedReason}</div>
                    )}
                    <div className="budget">
                      <span>Simulated budget</span>
                      <b>
                        {money(current.spentCents)}{" "}
                        <span className="muted">
                          / {money(current.budgetCents)}
                        </span>
                      </b>
                      <progress
                        value={current.spentCents + current.reservedCents}
                        max={current.budgetCents}
                      />
                      <small>
                        {money(current.reservedCents)} reserved ·{" "}
                        {money(
                          Math.max(
                            0,
                            current.budgetCents -
                              current.spentCents -
                              current.reservedCents,
                          ),
                        )}{" "}
                        available
                      </small>
                    </div>
                    <h3>Execution plan</h3>
                    <ol className="tasks">
                      {current.tasks.map((t, i) => (
                        <li key={t.title}>
                          <span className={t.done ? "done" : ""}>
                            {t.done ? "✓" : i + 1}
                          </span>
                          <div>
                            {t.title}
                            <small>
                              {t.done
                                ? "Checkpoint saved"
                                : "Waiting for execution"}
                            </small>
                          </div>
                        </li>
                      ))}
                    </ol>
                    <h3>Acceptance criteria</h3>
                    <ul className="criteria">
                      {current.criteria.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                    <div className="actions">
                      {current.state === "awaiting_plan_approval" && (
                        <button
                          disabled={busy}
                          onClick={() => perform("approve")}
                        >
                          Approve demo plan →
                        </button>
                      )}
                      {["ready", "running", "verifying"].includes(
                        current.state,
                      ) && (
                        <button
                          className="secondary"
                          disabled={busy}
                          onClick={() => perform("pause")}
                        >
                          Pause execution
                        </button>
                      )}
                      {current.state === "blocked" && (
                        <button
                          disabled={busy}
                          onClick={() => perform("resume")}
                        >
                          Resume execution
                        </button>
                      )}
                      {current.state === "awaiting_acceptance" && (
                        <button
                          disabled={busy}
                          onClick={() => perform("accept")}
                        >
                          Accept simulated delivery
                        </button>
                      )}
                      {[
                        "awaiting_plan_approval",
                        "blocked",
                        "awaiting_acceptance",
                      ].includes(current.state) && (
                        <button
                          className="secondary"
                          onClick={() => {
                            setEditing(current);
                            setForm(true);
                          }}
                        >
                          Revise contract
                        </button>
                      )}
                      {!["completed", "cancelled"].includes(current.state) && (
                        <button
                          className="text-button danger"
                          disabled={busy}
                          onClick={() => {
                            if (
                              confirm(
                                "Cancel this mission? This stops further execution.",
                              )
                            )
                              void perform("cancel");
                          }}
                        >
                          Cancel mission
                        </button>
                      )}
                    </div>
                    {current.artifact && (
                      <section className="evidence">
                        <h3>
                          Delivery evidence{" "}
                          <span className="pill">SIMULATED</span>
                        </h3>
                        <p className="muted">
                          These checks verify the demo artifact, not repository
                          behavior.
                        </p>
                        {current.evidence.map((e) => (
                          <div className="evidence-row" key={e.criterion}>
                            <b>
                              {e.passed ? "✓" : "!"} {e.criterion}
                            </b>
                            <small>{e.detail}</small>
                          </div>
                        ))}
                        <details>
                          <summary>Inspect artifact and SHA-256</summary>
                          <pre>{current.artifact.content}</pre>
                          <code className="hash">
                            {current.artifact.digest}
                          </code>
                        </details>
                      </section>
                    )}
                    <h3>Activity</h3>
                    <ol className="activity">
                      {[...current.events].reverse().map((e, i) => (
                        <li key={i}>
                          <span className="activity-dot" />
                          <div>
                            {e.message}
                            <small>
                              {e.actor} · {new Date(e.at).toLocaleTimeString()}
                            </small>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </>
                )}
              </section>
            </div>
          )}
          <footer>
            AI Work OS{" "}
            <span>
              Human direction. Visible evidence. Accountable execution.
            </span>
          </footer>
        </section>
      </main>
    </div>
  );
}
