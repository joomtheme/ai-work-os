export type RuntimeStatus = "ready" | "running" | "completed" | "failed";

export interface MissionExecution {
  missionId: string;
  status: RuntimeStatus;
  output?: string;
}

export function createExecution(missionId: string): MissionExecution {
  return {
    missionId,
    status: "ready"
  };
}
