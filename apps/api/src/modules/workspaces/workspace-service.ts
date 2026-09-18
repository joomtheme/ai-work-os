export class WorkspaceService {
  createWorkspace(ownerId: string, name: string) {
    return {
      id: crypto.randomUUID(),
      ownerId,
      name,
      createdAt: new Date(),
    };
  }

  listUserWorkspaces(userId: string) {
    return [];
  }
}
