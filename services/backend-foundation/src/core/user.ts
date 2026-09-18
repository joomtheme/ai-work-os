export interface User {
  id: string;
  email: string;
  createdAt: Date;
}

export function createUser(email: string): User {
  return {
    id: crypto.randomUUID(),
    email,
    createdAt: new Date(),
  };
}
