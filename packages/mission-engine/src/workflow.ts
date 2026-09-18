export type MissionStep = {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
};

export type MissionWorkflow = {
  missionId: string;
  steps: MissionStep[];
};

export function createWorkflow(missionId: string, steps: string[]): MissionWorkflow {
  return {
    missionId,
    steps: steps.map((name, index) => ({
      id: `${missionId}-${index}`,
      name,
      status: 'pending',
    })),
  };
}
