import readline from 'readline';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { Readable, Writable } from 'stream';

import { CommandParser } from '../core/CommandParser.js';
import { commandRegistry } from '../core/CommandRegistry.js';
import { MultiModelRouter } from '../router/MultiModelRouter.js';
import { MemoryManager } from '../memory/MemoryManager.js';
import { ChatChunk, ChatMessage, ToolCall } from '../router/types.js';
import { toolRegistry } from '../tools/ToolRegistry.js';

export interface CliLoopOptions {
  input?: Readable;
  output?: Writable;
  historyPath?: string;
  router?: MultiModelRouter;
  memory?: MemoryManager;
}

export class CliLoop {
  private rl!: readline.Interface;
  private input: Readable;
  private output: Writable;
  private historyPath: string;
  private historyList: string[] = [];
  private chatHistory: ChatMessage[] = [];
  private parser = new CommandParser();
  private router: MultiModelRouter;
  private memory: MemoryManager;

  constructor(options: CliLoopOptions = {}) {
    this.input = options.input || process.stdin;
    this.output = options.output || process.stdout;
    this.historyPath = options.historyPath || path.join(os.homedir(), '.gccli_history');
    this.router = options.router || new MultiModelRouter();
    this.memory = options.memory || new MemoryManager();
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
        const modelName = args[0];
        if (!modelName) {
          this.output.write("[Router] Usage: /model <name>\n");
          return;
        }
        try {
          this.router.setActiveProvider(modelName);
          this.output.write(`[Router] Switching active model to: ${modelName}\n`);
        } catch (err: any) {
          this.output.write(`[Error] Failed to switch model: ${err.message}\n`);
        }
      }
    );
  }

  /**
   * Initializes history and starts the readline loop.
   */
  async start() {
    this.loadHistory();
    await this.memory.initialize();
    this.chatHistory = this.memory.getShortTerm() as ChatMessage[];

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
        try {
          const userMessage: ChatMessage = { role: 'user', content: parsed.rawPayload };
          this.memory.addToShortTerm(userMessage);

          let continueAgentLoop = true;
          let turnCount = 0;
          const MAX_TURNS = 10;

          while (continueAgentLoop && turnCount < MAX_TURNS) {
            turnCount++;
            continueAgentLoop = false;

            const result = await this.router.chat(
              this.chatHistory,
              { streaming: true, tools: toolRegistry.getSchemas() }
            );

            if (Symbol.asyncIterator in result) {
              let assistantContent = '';
              const toolCallsBuffer: Map<number, ToolCall> = new Map();

              for await (const chunk of result as AsyncIterable<ChatChunk>) {
                if (chunk.type === 'text') {
                  assistantContent += chunk.content;
                  this.output.write(chunk.content);
                } else if (chunk.type === 'tool_call') {
                  if (!toolCallsBuffer.has(chunk.index)) {
                    toolCallsBuffer.set(chunk.index, {
                      id: chunk.id || '',
                      type: 'function',
                      function: { name: chunk.name || '', arguments: chunk.arguments || '' }
                    });
                  } else {
                    const existing = toolCallsBuffer.get(chunk.index)!;
                    if (chunk.id) existing.id = chunk.id;
                    if (chunk.name) existing.function.name += chunk.name;
                    if (chunk.arguments) existing.function.arguments += chunk.arguments;
                  }
                }
              }

              const toolCalls = Array.from(toolCallsBuffer.values());
              
              // Push assistant message to history
              const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: assistantContent || null
              };
              if (toolCalls.length > 0) {
                assistantMessage.tool_calls = toolCalls;
              }
              this.memory.addToShortTerm(assistantMessage);

              if (toolCalls.length > 0) {
                this.output.write('\n');
                for (const tc of toolCalls) {
                  this.output.write(`[System] Executing tool: ${tc.function.name}...\n`);
                  try {
                    const args = JSON.parse(tc.function.arguments || '{}');
                    const toolResult = await toolRegistry.execute(tc.function.name, args);
                    
                    this.memory.addToShortTerm({
                      role: 'tool',
                      tool_call_id: tc.id,
                      content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult)
                    });
                    continueAgentLoop = true;
                  } catch (err: any) {
                    this.memory.addToShortTerm({
                      role: 'tool',
                      tool_call_id: tc.id,
                      content: `Error: ${err.message}`
                    });
                    continueAgentLoop = true;
                  }
                }
              } else {
                this.output.write('\n');
              }
            } else {
              // Handle non-streaming response if it ever happens
              const response = result as any;
              this.output.write(`${response.content || ''}\n`);
              
              const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: response.content || null
              };
              if (response.tool_calls) {
                assistantMessage.tool_calls = response.tool_calls;
              }
              this.memory.addToShortTerm(assistantMessage);

              if (response.tool_calls && response.tool_calls.length > 0) {
                for (const tc of response.tool_calls) {
                  this.output.write(`[System] Executing tool: ${tc.function.name}...\n`);
                  try {
                    const args = typeof tc.function.arguments === 'string' 
                      ? JSON.parse(tc.function.arguments) 
                      : tc.function.arguments;
                    const toolResult = await toolRegistry.execute(tc.function.name, args);
                    this.memory.addToShortTerm({
                      role: 'tool',
                      tool_call_id: tc.id,
                      content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult)
                    });
                    continueAgentLoop = true;
                  } catch (err: any) {
                    this.memory.addToShortTerm({
                      role: 'tool',
                      tool_call_id: tc.id,
                      content: `Error: ${err.message}`
                    });
                    continueAgentLoop = true;
                  }
                }
              }
            }
          }
        } catch (err: any) {
          this.output.write(`[Error] Chat failed: ${err.message}\n`);
        }
      }

      await this.memory.persist();
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
