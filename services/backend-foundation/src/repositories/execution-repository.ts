export type ExecutionRecord = {
  id: string;
  missionId: string;
  agentId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  output?: string;
};

export interface ExecutionRepository {
  create(execution: ExecutionRecord): Promise<ExecutionRecord>;
  findByMissionId(missionId: string): Promise<ExecutionRecord[]>;
}
