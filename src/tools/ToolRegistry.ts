export interface Tool {
  name: string;
  description: string;
  schema: any;
  execute: (args: any) => Promise<any>;
}

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(tool: Tool) {
    this.tools.set(tool.name, tool);
    console.log(`[Tools] Registered tool: ${tool.name}`);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  list(): string[] {
    return Array.from(this.tools.keys());
  }

  async execute(name: string, args: any): Promise<any> {
    const tool = this.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    try {
      return await tool.execute(args);
    } catch (error: any) {
      console.error(`[Tools] Error executing tool ${name}:`, error.message);
      throw new Error(`Execution failed for tool ${name}: ${error.message}`);
    }
  }
}
