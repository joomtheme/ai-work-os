export type ExecutionRequest = {
  missionId: string;
  agentId: string;
};

export type ExecutionResult = {
  id: string;
  missionId: string;
  agentId: string;
  status: "queued" | "running" | "completed";
};

export class ExecutionService {
  startExecution(input: ExecutionRequest): ExecutionResult {
    return {
      id: crypto.randomUUID(),
      missionId: input.missionId,
      agentId: input.agentId,
      status: "queued",
    };
  }
}
