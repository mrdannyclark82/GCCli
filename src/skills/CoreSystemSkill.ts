import { Tool } from '../tools/ToolRegistry.js';
import { CommandMetadata, CommandHandler } from '../core/CommandRegistry.js';

export abstract class CoreSystemSkill {
  abstract name: string;
  abstract description: string;

  abstract initialize(): Promise<void>;
  abstract execute(context: any): Promise<any>;

  getTools?(): Tool[];
  getCommands?(): { metadata: CommandMetadata, handler: CommandHandler }[];
}
