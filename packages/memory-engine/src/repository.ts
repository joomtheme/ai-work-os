export interface MemoryRecord {
  id: string;
  scope: string;
  content: string;
  createdAt: Date;
}

export interface MemoryRepository {
  save(memory: MemoryRecord): Promise<MemoryRecord>;
  search(scope: string, query: string): Promise<MemoryRecord[]>;
}

export class InMemoryRepository implements MemoryRepository {
  private records: MemoryRecord[] = [];

  async save(memory: MemoryRecord) {
    this.records.push(memory);
    return memory;
  }

  async search(scope: string, query: string) {
    return this.records.filter(
      (item) => item.scope === scope && item.content.includes(query)
    );
  }
}
