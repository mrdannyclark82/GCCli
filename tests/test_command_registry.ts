import { commandRegistry } from '../src/core/CommandRegistry.js';

async function runCommandRegistryTest() {
  console.log("\n" + "=".repeat(50));
  console.log("🧪 TDD: RUNNING COMMAND REGISTRY TEST 🧪");
  console.log("=".repeat(50));

  console.log("[STEP 1] Testing basic command registration...");
  let handlerCalled = false;
  const testHandler = (args: string[], flags: Record<string, string | boolean>) => {
    handlerCalled = true;
  };

  commandRegistry.register(
    { name: 'test', description: 'A test command' },
    testHandler
  );

  const command = commandRegistry.get('test');
  if (!command) {
    throw new Error("Failed to retrieve registered command 'test'.");
  }
  if (command.metadata.name !== 'test' || command.metadata.description !== 'A test command') {
    throw new Error("Command metadata mismatch.");
  }
  
  // Verify the handler works
  command.handler([], {});
  if (!handlerCalled) {
    throw new Error("Command handler was not correctly registered.");
  }
  console.log("  [SUCCESS]");

  console.log("[STEP 2] Testing listing commands...");
  commandRegistry.register(
    { name: 'help', description: 'Show help information' },
    () => {}
  );

  const commands = commandRegistry.list();
  if (commands.length < 2) {
    throw new Error(`Expected at least 2 commands, found ${commands.length}.`);
  }
  
  const hasTest = commands.some(c => c.name === 'test');
  const hasHelp = commands.some(c => c.name === 'help');
  
  if (!hasTest || !hasHelp) {
    throw new Error("Command list is missing registered commands.");
  }
  console.log("  [SUCCESS]");

  console.log("[STEP 3] Testing non-existent command...");
  const nonExistent = commandRegistry.get('nonexistent');
  if (nonExistent !== undefined) {
    throw new Error("Retrieving non-existent command should return undefined.");
  }
  console.log("  [SUCCESS]");

  console.log("\n" + "=".repeat(50));
  console.log("🧪 TDD COMMAND REGISTRY: NOMINAL 🧪");
  console.log("=".repeat(50) + "\n");
}

runCommandRegistryTest().catch(err => {
  console.error("\n❌ TEST FAILED:", err.message);
  process.exit(1);
});
