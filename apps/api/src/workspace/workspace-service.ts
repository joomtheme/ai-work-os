export type Workspace = {
  id: string;
  name: string;
};

export class WorkspaceService {
  create(name: string): Workspace {
    return {
      id: crypto.randomUUID(),
      name,
    };
  }
}
