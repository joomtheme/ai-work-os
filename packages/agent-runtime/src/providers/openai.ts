export interface AIProviderRequest {
  prompt: string;
  model?: string;
}

export interface AIProviderResponse {
  content: string;
  model: string;
}

export class OpenAIProvider {
  constructor(private readonly model = "gpt-5") {}

  async execute(request: AIProviderRequest): Promise<AIProviderResponse> {
    return {
      content: `Provider placeholder execution: ${request.prompt}`,
      model: this.model,
    };
  }
}
