export type AgentTask = {
  id: string;
  objective: string;
};

export type AgentResult = {
  success: boolean;
  summary: string;
};

export async function runAgent(task: AgentTask): Promise<AgentResult> {
  return {
    success: true,
    summary: `Agent completed task: ${task.objective}`,
  };
}
