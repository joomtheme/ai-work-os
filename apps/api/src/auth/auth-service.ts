export type UserSession = {
  userId: string;
  createdAt: string;
};

export function createSession(userId: string): UserSession {
  return {
    userId,
    createdAt: new Date().toISOString(),
  };
}
