export interface ToolContext {
  workspaceId: string;
  missionId: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  execute(context: ToolContext, input: unknown): Promise<unknown>;
}

export class MCPRuntime {
  private tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  async execute(name: string, context: ToolContext, input: unknown) {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Tool not found: ${name}`);
    return tool.execute(context, input);
  }
}
