export type MissionCreateInput = {
  title: string;
  objective: string;
};

export type MissionCreateResult = {
  missionId: string;
  status: 'QUEUED';
};

export async function createMission(input: MissionCreateInput): Promise<MissionCreateResult> {
  return {
    missionId: crypto.randomUUID(),
    status: 'QUEUED'
  };
}
