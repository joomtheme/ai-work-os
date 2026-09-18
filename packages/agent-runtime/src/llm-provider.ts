export interface LLMProvider {
  complete(prompt: string): Promise<string>;
}

export class MockLLMProvider implements LLMProvider {
  async complete(prompt: string): Promise<string> {
    return `Generated response for: ${prompt}`;
  }
}
