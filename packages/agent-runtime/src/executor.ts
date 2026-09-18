export type AgentTask = {
  id: string;
  agent: string;
  objective: string;
};

export type AgentEvent = {
  type: string;
  message: string;
  timestamp: string;
};

export async function executeAgent(task: AgentTask): Promise<AgentEvent[]> {
  return [
    {
      type: 'AGENT_STARTED',
      message: `${task.agent} started: ${task.objective}`,
      timestamp: new Date().toISOString(),
    },
    {
      type: 'AGENT_COMPLETED',
      message: `${task.agent} completed execution`,
      timestamp: new Date().toISOString(),
    },
  ];
}
