export type AIProvider = {
  name: string;
  execute(prompt: string): Promise<string>;
};

export class ProviderRegistry {
  private providers = new Map<string, AIProvider>();

  register(provider: AIProvider) {
    this.providers.set(provider.name, provider);
  }

  get(name: string) {
    return this.providers.get(name);
  }
}
