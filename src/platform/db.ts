import postgres from 'postgres';
import { SCHEMA } from './schema';

/**
 * Postgres connection (Neon on Vercel — DATABASE_URL / POSTGRES_URL are set automatically
 * when a database is connected in the Vercel "Storage" tab).
 */
const URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
export const dbConfigured = () => !!URL;

type G = { __ast_sql?: postgres.Sql; __ast_ready?: Promise<void> | null };
const g = globalThis as unknown as G;

function client(): postgres.Sql {
  if (!URL) throw new Error('DATABASE_NOT_CONNECTED');
  if (!g.__ast_sql) {
    const local = /localhost|127\.0\.0\.1/.test(URL);
    g.__ast_sql = postgres(URL, { max: local ? 5 : 3, prepare: false, idle_timeout: 20, ssl: local ? false : 'require', onnotice: () => {} });
  }
  return g.__ast_sql;
}

/** The ready-to-use query function. Creates the tables on first use. */
export async function db(): Promise<postgres.Sql> {
  const sql = client();
  if (!g.__ast_ready) g.__ast_ready = sql.unsafe(SCHEMA).then(() => undefined).catch((e) => { g.__ast_ready = null; throw e; });
  await g.__ast_ready;
  return sql;
}

export async function getSetting(key: string): Promise<string | null> {
  const sql = await db();
  const [r] = await sql<{ value: string }[]>`select value from settings where key = ${key}`;
  return r?.value ?? null;
}
export async function setSetting(key: string, value: string) {
  const sql = await db();
  await sql`insert into settings (key, value) values (${key}, ${value}) on conflict (key) do update set value = excluded.value`;
}
export async function setSettingIfMissing(key: string, value: string) {
  const sql = await db();
  await sql`insert into settings (key, value) values (${key}, ${value}) on conflict (key) do nothing`;
}
