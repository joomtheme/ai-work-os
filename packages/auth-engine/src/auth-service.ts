export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface Session {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
}

export function authorize(session: Session, required: WorkspaceRole[]): boolean {
  return required.includes(session.role);
}
