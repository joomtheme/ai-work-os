export type ExecutionStatus =
  | 'queued'
  | 'running'
  | 'waiting_approval'
  | 'completed'
  | 'failed';

export interface RuntimeExecution {
  missionId: string;
  status: ExecutionStatus;
  events: string[];
}

export function createRuntimeExecution(missionId: string): RuntimeExecution {
  return {
    missionId,
    status: 'queued',
    events: ['MISSION_CREATED'],
  };
}
