import { CapacitorSQLite, SQLiteConnection, type SQLiteDBConnection } from '@capacitor-community/sqlite';
import type { AppData, Repository } from './appData';

const DATABASE_NAME = 'savings_tracker';

let connection: Promise<SQLiteDBConnection> | null = null;

const openConnection = (): Promise<SQLiteDBConnection> => {
  connection ??= (async () => {
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    const db = await sqlite.createConnection(DATABASE_NAME, false, 'no-encryption', 1, false);
    await db.open();
    // The whole app state is stored as one JSON document: a single-row write is atomic.
    await db.execute('CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY, json TEXT NOT NULL);');
    return db;
  })();
  return connection;
};

export const sqliteRepository: Repository = {
  async load() {
    const db = await openConnection();
    const result = await db.query('SELECT json FROM app_state WHERE id = 1;');
    const row = result.values?.[0];
    return row ? (JSON.parse(row.json) as AppData) : null;
  },
  async save(data) {
    const db = await openConnection();
    await db.run('INSERT OR REPLACE INTO app_state (id, json) VALUES (1, ?);', [JSON.stringify(data)]);
  },
};
