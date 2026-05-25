import { MemoryProvider } from '../MemoryProvider.js';
import { createClient } from 'redis';

/**
 * A Redis-backed memory provider.
 * Uses a key 'gccli:state:default' to store serialized JSON state.
 */
export class RedisMemoryProvider extends MemoryProvider {
  private client: any;
  private key: string = 'gccli:state:default';

  constructor(redisUrl: string = 'redis://localhost:6379') {
    super();
    this.client = createClient({ url: redisUrl });
    this.client.on('error', (err: any) => console.error('[RedisMemoryProvider] Client Error', err));
  }

  private async ensureConnected(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  async save(state: any): Promise<void> {
    try {
      await this.ensureConnected();
      const data = JSON.stringify(state);
      await this.client.set(this.key, data);
    } catch (error: any) {
      console.error(`[RedisMemoryProvider] Failed to save state to Redis: ${error.message}`);
      throw error;
    }
  }

  async load(): Promise<any> {
    try {
      await this.ensureConnected();
      const data = await this.client.get(this.key);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error: any) {
      console.error(`[RedisMemoryProvider] Failed to load state from Redis: ${error.message}`);
      throw error;
    }
  }

  /**
   * Closes the Redis client connection.
   */
  async close(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }
}
