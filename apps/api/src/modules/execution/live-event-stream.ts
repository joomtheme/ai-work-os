export type ExecutionEvent = {
  missionId: string;
  type: string;
  timestamp: string;
};

export function createExecutionEvent(event: ExecutionEvent) {
  return event;
}
