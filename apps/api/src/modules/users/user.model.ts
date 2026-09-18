export interface User {
  id: string;
  email: string;
  name?: string;
  workspaceIds: string[];
}

export interface Workspace {
  id: string;
  ownerId: string;
  name: string;
  createdAt: Date;
}
