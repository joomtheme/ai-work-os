export type MissionRequest = {
  workspaceId: string;
  goal: string;
};

export type MissionResult = {
  id: string;
  workspaceId: string;
  goal: string;
  status: "created" | "running" | "completed";
};

export class MissionService {
  createMission(input: MissionRequest): MissionResult {
    return {
      id: crypto.randomUUID(),
      workspaceId: input.workspaceId,
      goal: input.goal,
      status: "created",
    };
  }
}
