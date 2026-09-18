export type AuthContext = {
  userId: string;
};

export function authenticate(token?: string): AuthContext | null {
  if (!token) return null;

  return {
    userId: token,
  };
}
