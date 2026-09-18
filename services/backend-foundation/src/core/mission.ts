export type MissionStatus = "pending" | "running" | "completed" | "failed";

export interface Mission {
  id: string;
  workspaceId: string;
  goal: string;
  status: MissionStatus;
  createdAt: Date;
}

export function createMission(input: {
  id: string;
  workspaceId: string;
  goal: string;
}): Mission {
  return {
    id: input.id,
    workspaceId: input.workspaceId,
    goal: input.goal,
    status: "pending",
    createdAt: new Date(),
  };
}
