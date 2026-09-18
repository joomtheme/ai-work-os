export type ExecutionEvent = {
  missionId: string;
  type:
    | 'MISSION_CREATED'
    | 'AGENT_STARTED'
    | 'TOOL_EXECUTED'
    | 'RESULT_CREATED';
  timestamp: string;
};

export function createExecutionEvent(
  missionId: string,
  type: ExecutionEvent['type']
): ExecutionEvent {
  return {
    missionId,
    type,
    timestamp: new Date().toISOString()
  };
}
