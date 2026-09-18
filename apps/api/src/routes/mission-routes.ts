export interface MissionRequest {
  workspaceId: string;
  goal: string;
}

export function createMissionRequest(input: MissionRequest) {
  return {
    ...input,
    createdAt: new Date().toISOString()
  };
}
