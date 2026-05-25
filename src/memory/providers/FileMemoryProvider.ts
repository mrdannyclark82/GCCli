import { MemoryProvider } from '../MemoryProvider.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * A JSON-based memory provider that saves state to a local file.
 * Default path: ~/.gccli_state.json
 */
export class FileMemoryProvider extends MemoryProvider {
  private filePath: string;

  constructor(filePath?: string) {
    super();
    this.filePath = filePath || path.join(os.homedir(), '.gccli_state.json');
  }

  async save(state: any): Promise<void> {
    try {
      const data = JSON.stringify(state, null, 2);
      await fs.writeFile(this.filePath, data, 'utf-8');
    } catch (error: any) {
      console.error(`[FileMemoryProvider] Failed to save state to ${this.filePath}: ${error.message}`);
      throw error;
    }
  }

  async load(): Promise<any> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error: any) {
      if ((error as any).code === 'ENOENT') {
        // File not found is a valid case for first run
        return null;
      }
      console.error(`[FileMemoryProvider] Failed to load state from ${this.filePath}: ${error.message}`);
      throw error;
    }
  }
}
