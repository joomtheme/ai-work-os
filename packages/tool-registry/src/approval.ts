export interface ToolApproval {
  toolName: string;
  requiresHumanApproval: boolean;
}

export function canExecute(tool: ToolApproval): boolean {
  return !tool.requiresHumanApproval;
}
