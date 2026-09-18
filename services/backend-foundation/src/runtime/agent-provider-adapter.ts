export interface AgentProviderAdapter {
  execute(input: string): Promise<string>;
}

export class MockAgentProvider implements AgentProviderAdapter {
  async execute(input: string): Promise<string> {
    return `Agent completed task: ${input}`;
  }
}
