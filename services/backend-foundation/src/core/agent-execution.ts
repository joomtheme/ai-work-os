export type ExecutionStatus = "queued" | "running" | "completed" | "failed";

export interface AgentExecution {
  id: string;
  missionId: string;
  agentId: string;
  status: ExecutionStatus;
  output?: string;
}

export function queueExecution(input: {
  id: string;
  missionId: string;
  agentId: string;
}): AgentExecution {
  return {
    id: input.id,
    missionId: input.missionId,
    agentId: input.agentId,
    status: "queued",
  };
}
