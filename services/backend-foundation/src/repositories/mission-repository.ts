export type MissionRecord = {
  id: string;
  workspaceId: string;
  goal: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
};

export interface MissionRepository {
  create(mission: MissionRecord): Promise<MissionRecord>;
  findById(id: string): Promise<MissionRecord | null>;
}
