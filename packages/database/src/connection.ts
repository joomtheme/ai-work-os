export interface DatabaseConfig {
  url: string;
}

export function createDatabaseConfig(url: string): DatabaseConfig {
  return { url };
}
