export type CommandHandler = (
  args: string[],
  flags: Record<string, string | boolean>
) => Promise<void> | void;

export interface CommandMetadata {
  name: string;
  description: string;
  usage?: string;
}

export interface RegisteredCommand {
  metadata: CommandMetadata;
  handler: CommandHandler;
}

export class CommandRegistry {
  private commands: Map<string, RegisteredCommand> = new Map();

  /**
   * Registers a new command in the registry.
   */
  register(metadata: CommandMetadata, handler: CommandHandler): void {
    this.commands.set(metadata.name, { metadata, handler });
  }

  /**
   * Retrieves a command by its name.
   */
  get(name: string): RegisteredCommand | undefined {
    return this.commands.get(name);
  }

  /**
   * Returns a list of all registered command metadata.
   */
  list(): CommandMetadata[] {
    return Array.from(this.commands.values()).map(cmd => cmd.metadata);
  }
}

// Export a singleton instance
export const commandRegistry = new CommandRegistry();
