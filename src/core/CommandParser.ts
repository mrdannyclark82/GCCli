export interface ParsedCommand {
  type: 'chat' | 'command' | 'exit';
  name?: string;
  args: string[];
  flags: Record<string, string | boolean>;
  rawPayload: string;
}

export class CommandParser {
  /**
   * Parses raw terminal input into a structured command object.
   */
  parse(input: string): ParsedCommand {
    const trimmed = input.trim();

    if (!trimmed) {
      return { type: 'chat', args: [], flags: {}, rawPayload: '' };
    }

    // Check if it's a slash command
    if (trimmed.startsWith('/')) {
      const parts = trimmed.split(/\s+/);
      const name = parts[0].substring(1).toLowerCase();
      const rawArgs = parts.slice(1);
      
      const args: string[] = [];
      const flags: Record<string, string | boolean> = {};

      for (const part of rawArgs) {
        if (part.startsWith('--')) {
          const [keyWithPrefix, value] = part.split('=');
          const key = keyWithPrefix.substring(2);
          flags[key] = value !== undefined ? value : true;
        } else if (part.startsWith('-')) {
          const key = part.substring(1);
          flags[key] = true;
        } else {
          args.push(part);
        }
      }

      const rawPayload = parts.slice(1).join(' ').trim();
      const type = name === 'exit' ? 'exit' : 'command';

      return {
        type,
        name,
        args,
        flags,
        rawPayload
      };
    }

    // Default to plain chat response
    return { 
      type: 'chat', 
      args: [], 
      flags: {}, 
      rawPayload: trimmed 
    };
  }
}
