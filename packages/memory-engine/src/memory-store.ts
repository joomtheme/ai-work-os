export type MemoryEntry = {
  agentId: string;
  context: string;
  result: string;
};

const memory: MemoryEntry[] = [];

export function remember(entry: MemoryEntry) {
  memory.push(entry);
}

export function recall(agentId: string) {
  return memory.filter((item) => item.agentId === agentId);
}
