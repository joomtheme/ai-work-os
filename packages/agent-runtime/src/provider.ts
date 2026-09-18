export type ModelProvider = {
  name: string;
  complete(prompt: string): Promise<string>;
};

export class MockProvider implements ModelProvider {
  name = "mock";

  async complete(prompt: string): Promise<string> {
    return `Execution proposal generated for: ${prompt}`;
  }
}
