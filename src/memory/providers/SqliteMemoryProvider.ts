import { MemoryProvider } from '../MemoryProvider.js';
import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';

/**
 * A SQLite-based memory provider that saves state as a JSON blob.
 * Default path: ~/.gccli_state.db
 */
export class SqliteMemoryProvider extends MemoryProvider {
  private db: Database.Database;

  constructor(dbPath?: string) {
    super();
    const resolvedPath = dbPath || path.join(os.homedir(), '.gccli_state.db');
    this.db = new Database(resolvedPath);
    this.init();
  }

  /**
   * Initializes the database schema.
   */
  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agent_state (
        id TEXT PRIMARY KEY,
        state_json TEXT
      )
    `);
  }

  /**
   * Saves the agent's state to the SQLite database.
   * @param state The state object to persist.
   */
  async save(state: any): Promise<void> {
    try {
      const stateJson = JSON.stringify(state);
      const stmt = this.db.prepare(`
        INSERT INTO agent_state (id, state_json)
        VALUES ('default', ?)
        ON CONFLICT(id) DO UPDATE SET state_json = excluded.state_json
      `);
      stmt.run(stateJson);
    } catch (error: any) {
      console.error(`[SqliteMemoryProvider] Failed to save state: ${error.message}`);
      throw error;
    }
  }

  /**
   * Loads the agent's state from the SQLite database.
   * @returns The loaded state object, or null if no state exists.
   */
  async load(): Promise<any> {
    try {
      const row = this.db.prepare('SELECT state_json FROM agent_state WHERE id = ?').get('default') as { state_json: string } | undefined;
      if (!row) {
        return null;
      }
      return JSON.parse(row.state_json);
    } catch (error: any) {
      console.error(`[SqliteMemoryProvider] Failed to load state: ${error.message}`);
      throw error;
    }
  }

  /**
   * Closes the database connection.
   */
  close(): void {
    this.db.close();
  }
}
