export async function runDemoMission(goal: string) {
  return {
    mission: goal,
    status: 'completed',
    evidence: ['mission-created', 'agent-executed', 'result-generated'],
  };
}
