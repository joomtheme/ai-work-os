export type AgentExecution = {
  executionId: string;
  missionId: string;
  status: "queued" | "running" | "completed";
};

export function startExecution(missionId: string): AgentExecution {
  return {
    executionId: crypto.randomUUID(),
    missionId,
    status: "queued",
  };
}
