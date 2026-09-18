import { Pool } from "pg";
import { PGlite } from "@electric-sql/pglite";
import { mkdir } from "node:fs/promises";

export interface Queryable {
  query<T>(sql: string, values?: unknown[]): Promise<{ rows: T[] }>;
}
export interface Database extends Queryable {
  transaction<T>(fn: (tx: Queryable) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}
const schema = `
CREATE TABLE IF NOT EXISTS missions (
 workspace text NOT NULL, id uuid NOT NULL, document jsonb NOT NULL,
 PRIMARY KEY (workspace,id)
);
CREATE TABLE IF NOT EXISTS jobs (
 workspace text NOT NULL, mission_id uuid NOT NULL, token uuid,
 lease_until timestamptz, step integer NOT NULL DEFAULT 0,
 PRIMARY KEY (workspace,mission_id),
 FOREIGN KEY (workspace,mission_id) REFERENCES missions(workspace,id)
);
`;
export async function connect(options: {
  url?: string;
  directory?: string;
}): Promise<Database> {
  if (options.url) {
    const pool = new Pool({ connectionString: options.url, max: 5 });
    await pool.query(schema);
    return {
      query: async <T>(sql: string, values?: unknown[]) => ({
        rows: (await pool.query(sql, values)).rows as T[],
      }),
      transaction: async <T>(fn: (tx: Queryable) => Promise<T>) => {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          const value = await fn({
            query: async <R>(sql: string, values?: unknown[]) => ({
              rows: (await client.query(sql, values)).rows as R[],
            }),
          });
          await client.query("COMMIT");
          return value;
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        } finally {
          client.release();
        }
      },
      close: () => pool.end(),
    };
  }
  if (options.directory) await mkdir(options.directory, { recursive: true });
  const db = new PGlite(options.directory);
  await db.exec(schema);
  return {
    query: <T>(sql: string, values?: unknown[]) => db.query<T>(sql, values),
    transaction: <T>(fn: (tx: Queryable) => Promise<T>) =>
      db.transaction((tx) =>
        fn({
          query: <R>(sql: string, values?: unknown[]) =>
            tx.query<R>(sql, values),
        }),
      ),
    close: () => db.close(),
  };
}
const globalDB = globalThis as typeof globalThis & {
  missionDB?: Promise<Database>;
};
export function database() {
  if (!process.env.DATABASE_URL && !process.env.PGLITE_DATA_DIR)
    throw new Error("Configure DATABASE_URL or PGLITE_DATA_DIR.");
  return (globalDB.missionDB ??= connect({
    url: process.env.DATABASE_URL,
    directory: process.env.PGLITE_DATA_DIR,
  }));
}
