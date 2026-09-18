export type MissionPlan = {
  missionId: string;
  steps: string[];
};

export function createPlan(missionId: string, goal: string): MissionPlan {
  return {
    missionId,
    steps: [
      `Analyze: ${goal}`,
      "Execute assigned agent tasks",
      "Verify outcome",
      "Prepare evidence report",
    ],
  };
}
