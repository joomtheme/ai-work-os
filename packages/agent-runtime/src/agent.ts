export type AgentTask = {
  missionId: string;
  objective: string;
};

export async function executeAgent(task: AgentTask) {
  return {
    missionId: task.missionId,
    status: 'completed',
    evidence: []
  };
}
