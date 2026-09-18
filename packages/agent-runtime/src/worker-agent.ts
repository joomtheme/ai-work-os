export interface AgentTaskResult {
  taskId: string;
  status: 'completed' | 'failed';
  output: string;
}

export class WorkerAgent {
  async execute(taskId: string): Promise<AgentTaskResult> {
    return {
      taskId,
      status: 'completed',
      output: 'Task executed by worker agent'
    };
  }
}
