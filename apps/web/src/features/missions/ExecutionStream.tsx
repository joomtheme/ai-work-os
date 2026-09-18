export function ExecutionStream() {
  return {
    component: 'ExecutionStream',
    events: ['MISSION_STARTED', 'AGENT_RUNNING', 'TOOL_EXECUTED', 'MISSION_COMPLETED'],
  };
}
