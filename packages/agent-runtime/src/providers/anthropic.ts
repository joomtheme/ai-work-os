export interface AnthropicRequest {
  prompt: string;
  model?: string;
}

export class AnthropicProvider {
  constructor(private readonly model = "claude") {}

  async execute(request: AnthropicRequest) {
    return {
      content: `Provider placeholder execution: ${request.prompt}`,
      model: this.model,
    };
  }
}
