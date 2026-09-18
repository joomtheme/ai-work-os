export interface MissionPlan {
  missionId: string;
  steps: string[];
}

export class PlannerAgent {
  createPlan(missionId: string, objective: string): MissionPlan {
    return {
      missionId,
      steps: [
        `Analyze: ${objective}`,
        'Assign specialist agents',
        'Execute tasks',
        'Verify result'
      ]
    };
  }
}
