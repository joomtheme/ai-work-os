export type MemoryRecord = {
  id: string;
  agentId: string;
  content: string;
  createdAt: Date;
};

export class MemoryEngine {
  private records: MemoryRecord[] = [];

  remember(record: MemoryRecord) {
    this.records.push(record);
    return record;
  }

  search(agentId: string) {
    return this.records.filter((item) => item.agentId === agentId);
  }
}
