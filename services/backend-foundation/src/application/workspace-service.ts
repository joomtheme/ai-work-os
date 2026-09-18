export type Workspace = {
  id: string;
  ownerId: string;
  name: string;
};

export class WorkspaceService {
  create(ownerId: string, name: string): Workspace {
    return {
      id: crypto.randomUUID(),
      ownerId,
      name,
    };
  }
}
