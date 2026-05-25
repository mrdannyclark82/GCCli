import readline from 'readline';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { Readable, Writable } from 'stream';

import { CommandParser } from '../core/CommandParser.js';
import { commandRegistry } from '../core/CommandRegistry.js';

export interface CliLoopOptions {
  input?: Readable;
  output?: Writable;
  historyPath?: string;
}

export class CliLoop {
  private rl!: readline.Interface;
  private input: Readable;
  private output: Writable;
  private historyPath: string;
  private historyList: string[] = [];
  private parser = new CommandParser();

  constructor(options: CliLoopOptions = {}) {
    this.input = options.input || process.stdin;
    this.output = options.output || process.stdout;
    this.historyPath = options.historyPath || path.join(os.homedir(), '.gccli_history');
    this.setupCommands();
  }

  /**
   * Registers core system commands.
   */
  private setupCommands() {
    commandRegistry.register(
      { name: 'exit', description: 'Exit the interactive shell' },
      () => {
        this.output.write("Exiting GCCli. Goodbye!\n");
        this.rl.close();
      }
    );

    commandRegistry.register(
      { name: 'help', description: 'Show this help overview' },
      () => {
        this.output.write("\n🌿 GCCli - Available Commands:\n");
        const commands = commandRegistry.list();
        commands.forEach(cmd => {
          this.output.write(`  /${cmd.name.padEnd(25)} ${cmd.description}\n`);
        });
        this.output.write("\n");
      }
    );

    commandRegistry.register(
      { name: 'model', description: 'Switch active AI model runtime', usage: '/model <name>' },
      (args) => {
        const modelName = args[0] || 'unknown';
        this.output.write(`[Router] Switching active model to: ${modelName}\n`);
      }
    );
  }

  /**
   * Initializes history and starts the readline loop.
   */
  start() {
    this.loadHistory();

    // Create the readline interface
    this.rl = readline.createInterface({
      input: this.input,
      output: this.output,
      prompt: '🌿 GCCli > ',
      historySize: 100,
      // Workaround to pre-populate history inside readline for arrow key navigation
      history: this.historyList.slice().reverse()
    } as readline.ReadLineOptions);

    this.rl.prompt();

    this.rl.on('line', async (line) => {
      const parsed = this.parser.parse(line);

      if (parsed.type === 'chat' && !parsed.rawPayload) {
        this.rl.prompt();
        return;
      }

      // Append to local history list and persist
      this.appendHistory(line.trim());

      if (parsed.type === 'exit' || (parsed.type === 'command' && parsed.name === 'exit')) {
        const cmd = commandRegistry.get('exit');
        if (cmd) {
          cmd.handler(parsed.args, parsed.flags);
          return;
        }
      }

      if (parsed.type === 'command' && parsed.name) {
        const cmd = commandRegistry.get(parsed.name);
        if (cmd) {
          try {
            const result = cmd.handler(parsed.args, parsed.flags);
            if (result instanceof Promise) {
              await result;
            }
          } catch (err: any) {
            this.output.write(`[Error] Command execution failed: ${err.message}\n`);
          }
        } else {
          this.output.write(`[Command] Unknown command: /${parsed.name}\n`);
        }
      } else if (parsed.type === 'chat') {
        // Chat type
        this.output.write(`[Processed]: ${parsed.rawPayload}\n`);
      }

      this.rl.prompt();
    });

    this.rl.on('close', () => {
      // Cleanup / close logic
    });
  }

  /**
   * Loads command history from disk.
   */
  private loadHistory() {
    try {
      if (fs.existsSync(this.historyPath)) {
        const fileContent = fs.readFileSync(this.historyPath, 'utf8');
        this.historyList = fileContent
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
      }
    } catch (err: any) {
      this.output.write(`[Warning] Failed to load history: ${err.message}\n`);
    }
  }

  /**
   * Appends a command to history and saves to disk.
   */
  private appendHistory(line: string) {
    // Avoid duplicate adjacent entries
    if (this.historyList.length > 0 && this.historyList[this.historyList.length - 1] === line) {
      return;
    }

    this.historyList.push(line);
    
    // Cap at 100 entries
    if (this.historyList.length > 100) {
      this.historyList.shift();
    }

    try {
      const dir = path.dirname(this.historyPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.appendFileSync(this.historyPath, `${line}\n`, 'utf8');
    } catch (err: any) {
      this.output.write(`[Error] Failed to append history: ${err.message}\n`);
    }
  }

  close() {
    if (this.rl) {
      this.rl.close();
    }
  }
}
