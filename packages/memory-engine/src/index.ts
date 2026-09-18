export type MemoryEntry = {
  id: string;
  content: string;
  createdAt: Date;
};

const memories: MemoryEntry[] = [];

export function remember(entry: MemoryEntry) {
  memories.push(entry);
}

export function recall(): MemoryEntry[] {
  return memories;
}
