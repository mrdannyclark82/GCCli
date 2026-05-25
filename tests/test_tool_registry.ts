import { ToolRegistry, Tool } from '../src/tools/ToolRegistry.js';

async function runToolRegistryTest() {
  console.log("\n🧪 TDD: RUNNING TOOL REGISTRY TEST 🧪");

  const registry = new ToolRegistry();

  console.log("[STEP 1] Testing tool registration...");
  const dummyTool: Tool = {
    name: 'test_tool',
    description: 'A test tool',
    schema: { type: 'object', properties: { input: { type: 'string' } } },
    execute: async (args: any) => `Result: ${args.input}`
  };

  registry.register(dummyTool);
  
  const tools = registry.list();
  if (!tools.includes('test_tool')) {
    throw new Error("Tool 'test_tool' not found in registry list.");
  }
  console.log("  [SUCCESS] Tool registered and listed.");
}

runToolRegistryTest().catch(err => {
  console.error("\n❌ TEST FAILED:", err.message);
  process.exit(1);
});
