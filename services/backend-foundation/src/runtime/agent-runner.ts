export type AgentTask = {
  missionId: string;
  instruction: string;
};

export type AgentResult = {
  missionId: string;
  status: 'completed' | 'failed';
  output: string;
};

export async function runAgent(task: AgentTask): Promise<AgentResult> {
  return {
    missionId: task.missionId,
    status: 'completed',
    output: `Agent completed mission: ${task.instruction}`,
  };
}
