export interface Workspace {
  id: string;
  ownerId: string;
  name: string;
  createdAt: Date;
}

export function createWorkspace(ownerId: string, name: string): Workspace {
  return {
    id: crypto.randomUUID(),
    ownerId,
    name,
    createdAt: new Date(),
  };
}
