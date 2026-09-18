export type MemoryEntry = {
  id: string;
  type: "decision" | "fact" | "context";
  content: string;
  createdAt: Date;
};

export class MemoryStore {
  private entries: MemoryEntry[] = [];

  save(entry: MemoryEntry) {
    this.entries.push(entry);
  }

  search(query: string) {
    return this.entries.filter((item) =>
      item.content.toLowerCase().includes(query.toLowerCase())
    );
  }
}
