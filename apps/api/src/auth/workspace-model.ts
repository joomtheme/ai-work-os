export interface Workspace {
  id: string;
  name: string;
}

export interface Member {
  userId: string;
  workspaceId: string;
  role: 'owner' | 'member' | 'agent';
}
