export type ExecutionEvent = {
  type: string;
  missionId: string;
  createdAt: string;
};

export function publishExecutionEvent(event: ExecutionEvent) {
  return {
    ...event,
    delivered: true,
  };
}
