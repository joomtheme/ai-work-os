export type MissionRequest = {
  workspaceId: string;
  goal: string;
};

export type MissionResult = {
  missionId: string;
  status: "queued" | "running" | "completed";
};

export function createMission(input: MissionRequest): MissionResult {
  return {
    missionId: crypto.randomUUID(),
    status: "queued",
  };
}
