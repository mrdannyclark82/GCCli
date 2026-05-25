import readline from 'readline';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { Readable, Writable } from 'stream';

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

  constructor(options: CliLoopOptions = {}) {
    this.input = options.input || process.stdin;
    this.output = options.output || process.stdout;
    this.historyPath = options.historyPath || path.join(os.homedir(), '.gccli_history');
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

    this.rl.on('line', (line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        this.rl.prompt();
        return;
      }

      // Handle simple exit commands directly
      if (trimmed === 'exit' || trimmed === '/exit') {
        this.output.write("Exiting GCCli. Goodbye!\n");
        this.rl.close();
        return;
      }

      // Append to local history list and persist
      this.appendHistory(trimmed);

      // Simple mock processing output
      this.output.write(`[Processed]: ${trimmed}\n`);

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
      // Silent catch or simple log
    }
  }

  close() {
    if (this.rl) {
      this.rl.close();
    }
  }
}
