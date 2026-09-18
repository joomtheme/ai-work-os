export type ToolDefinition = {
  name: string;
  description: string;
  execute: (input: unknown) => Promise<unknown>;
};

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  get(name: string) {
    return this.tools.get(name);
  }
}
