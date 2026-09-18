export interface DatabaseAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export class RuntimeDatabaseAdapter implements DatabaseAdapter {
  async connect() {}
  async disconnect() {}
}
