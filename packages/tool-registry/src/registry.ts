export type ToolDefinition = {
  name: string;
  description: string;
  permission: 'read' | 'write' | 'execute';
};

export class ToolRegistry {
  private tools: ToolDefinition[] = [];

  register(tool: ToolDefinition) {
    this.tools.push(tool);
  }

  list() {
    return this.tools;
  }
}
