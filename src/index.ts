#!/usr/bin/env node
import 'dotenv/config';
import { MultiModelRouter } from './router/MultiModelRouter.js';
import { CliLoop } from './tui/CliLoop.js';
import { MemoryManager } from './memory/MemoryManager.js';
import { FileMemoryProvider, SqliteMemoryProvider, RedisMemoryProvider } from './memory/providers/index.js';
import { TeleportationSkill } from './skills/Teleportation.js';
import { BrowserSkill } from './skills/BrowserSkill.js';
import { Proactive } from './skills/Proactive.js';
import { commandRegistry } from './core/CommandRegistry.js';
import { toolRegistry } from './tools/ToolRegistry.js';

console.log("🌿 GCCli - Custom Grok CLI");

// Pluggable Bootstrapping for Memory Provider
let memoryProvider;
const providerType = process.env.MEMORY_PROVIDER?.toLowerCase() || 'file';

try {
  switch (providerType) {
    case 'sqlite':
      memoryProvider = new SqliteMemoryProvider();
      break;
    case 'redis':
      memoryProvider = new RedisMemoryProvider(process.env.REDIS_URL);
      break;
    case 'file':
    default:
      memoryProvider = new FileMemoryProvider();
  }
} catch (err: any) {
  console.warn(`⚠️ [Warning] Failed to initialize ${providerType} memory provider: ${err.message}. Falling back to FileMemoryProvider.`);
  memoryProvider = new FileMemoryProvider();
}

const memory = new MemoryManager(memoryProvider);

// Early initialization check to ensure graceful fallback if the chosen provider fails to load (e.g. Redis connection)
try {
  await memory.initialize();
} catch (err: any) {
  if (providerType !== 'file') {
    console.warn(`⚠️ [Warning] Failed to initialize ${providerType} memory provider: ${err.message}. Falling back to FileMemoryProvider.`);
    memoryProvider = new FileMemoryProvider();
    memory.setProvider(memoryProvider);
    await memory.initialize();
  } else {
    // If file provider itself fails, we let it throw or it might be a clean slate (handled by provider)
    throw err;
  }
}

const router = new MultiModelRouter();

// Initialize Skills
const proactive = new Proactive();
const skills = [
  new TeleportationSkill(memory),
  new BrowserSkill(),
  proactive
];

// Register skill tools and commands
for (const skill of skills) {
  await skill.initialize();
  
  if (skill.getTools) {
    const tools = skill.getTools();
    for (const tool of tools) {
      toolRegistry.register(tool);
    }
  }

  if (skill.getCommands) {
    const commands = skill.getCommands();
    for (const cmd of commands) {
      commandRegistry.register(cmd.metadata, cmd.handler);
    }
  }
}

const cli = new CliLoop({ router, memory });

// Start Proactive Loop
proactive.startLoop(router, memory, (msg) => cli.printProactiveMessage(msg));

await cli.start();
