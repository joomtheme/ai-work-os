export interface Repository<T> {
  find(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
}

export class InMemoryRepository<T extends { id: string }> implements Repository<T> {
  private items = new Map<string, T>();

  async find(id: string): Promise<T | null> {
    return this.items.get(id) ?? null;
  }

  async save(entity: T): Promise<T> {
    this.items.set(entity.id, entity);
    return entity;
  }
}
