export interface ExecutionWorker {
  run(task: string): Promise<string>;
}

export function createExecutionWorker(agent: (task: string) => Promise<string>): ExecutionWorker {
  return {
    run(task: string) {
      return agent(task);
    },
  };
}
