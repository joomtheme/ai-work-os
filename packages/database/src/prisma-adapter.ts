export interface DatabaseAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export class PrismaAdapter implements DatabaseAdapter {
  async connect() {}
  async disconnect() {}
}
