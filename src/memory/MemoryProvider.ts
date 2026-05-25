/**
 * Abstract class representing a pluggable memory provider.
 * Allows switching between different persistence layers (JSON, SQLite, Redis, etc.)
 */
export abstract class MemoryProvider {
  /**
   * Saves the agent's state to the persistence layer.
   * @param state The state object to persist.
   */
  abstract save(state: any): Promise<void>;

  /**
   * Loads the agent's state from the persistence layer.
   * @returns The loaded state object, or null if no state exists.
   */
  abstract load(): Promise<any>;
}
