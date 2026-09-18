import type { CodingPolicy } from "./coding/policy.ts";
export type State =
  | "awaiting_plan_approval"
  | "ready"
  | "running"
  | "blocked"
  | "verifying"
  | "awaiting_acceptance"
  | "completed"
  | "cancelled";
export type Mission = {
  mode?: "demo" | "coding";
  coding?: { commit: string; policy: CodingPolicy };
  codeRun?: {
    id: string;
    startedAt: string;
    dispatched: boolean;
    accountedCents: number;
  };
  id: string;
  workspace: string;
  goal: string;
  repository: string;
  criteria: string[];
  budgetCents: number;
  spentCents: number;
  reservedCents: number;
  version: number;
  planVersion: number;
  planDigest: string;
  approvedDigest?: string;
  state: State;
  blockedReason?: string;
  resumeState?: "ready" | "verifying";
  createdAt: string;
  tasks: { title: string; done: boolean }[];
  artifact?: { content: string; digest: string };
  evidence: {
    criterion: string;
    passed: boolean;
    artifactDigest: string;
    detail: string;
  }[];
  events: { at: string; actor: string; message: string }[];
};
export type Action =
  "approve" | "pause" | "resume" | "cancel" | "accept" | "revise";
