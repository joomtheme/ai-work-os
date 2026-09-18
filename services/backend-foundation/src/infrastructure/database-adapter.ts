export interface DatabaseAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export class InMemoryDatabaseAdapter implements DatabaseAdapter {
  async connect(): Promise<void> {}

  async disconnect(): Promise<void> {}
}
