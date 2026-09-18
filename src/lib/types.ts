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
