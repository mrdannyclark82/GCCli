export interface ParsedCommand {
  type: 'chat' | 'help' | 'exit' | 'model' | 'teleport';
  action?: 'export' | 'import';
  payload: string;
}

export class CommandParser {
  /**
   * Parses raw terminal input into a structured command object.
   */
  parse(input: string): ParsedCommand {
    const trimmed = input.trim();

    if (!trimmed) {
      return { type: 'chat', payload: '' };
    }

    // Check if it's a slash command
    if (trimmed.startsWith('/')) {
      const parts = trimmed.split(/\s+/);
      const command = parts[0].toLowerCase();
      const payload = parts.slice(1).join(' ').trim();

      if (command === '/help') {
        return { type: 'help', payload };
      }

      if (command === '/exit') {
        return { type: 'exit', payload };
      }

      if (command === '/model') {
        return { type: 'model', payload };
      }

      if (command === '/teleport') {
        const action = parts[1] ? parts[1].toLowerCase() : '';
        const filePayload = parts.slice(2).join(' ').trim();
        
        if (action === 'export' || action === 'import') {
          return {
            type: 'teleport',
            action: action as 'export' | 'import',
            payload: filePayload
          };
        }
        
        return {
          type: 'teleport',
          payload: parts.slice(1).join(' ').trim()
        };
      }
    }

    // Default to plain chat response
    return { type: 'chat', payload: trimmed };
  }
}
