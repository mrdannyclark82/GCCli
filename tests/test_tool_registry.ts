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

  console.log("[STEP 2] Testing tool execution...");
  const result = await registry.execute('test_tool', { input: 'hello' });
  if (result !== 'Result: hello') {
    throw new Error(`Expected 'Result: hello', got '${result}'`);
  }
  console.log("  [SUCCESS] Tool executed correctly.");

  console.log("[STEP 3] Testing non-existent tool execution...");
  try {
    await registry.execute('non_existent', {});
    throw new Error("Should have thrown error for non-existent tool.");
  } catch (error: any) {
    if (!error.message.includes('Tool not found')) {
      throw error;
    }
  }
  console.log("  [SUCCESS] Handled non-existent tool correctly.");

  console.log("[STEP 4] Testing tool execution failure...");
  const failingTool: Tool = {
    name: 'failing_tool',
    description: 'A failing tool',
    schema: {},
    execute: async () => { throw new Error("Inside tool error"); }
  };
  registry.register(failingTool);
  try {
    await registry.execute('failing_tool', {});
    throw new Error("Should have thrown error for failing tool.");
  } catch (error: any) {
    if (!error.message.includes('Inside tool error')) {
      throw error;
    }
  }
  console.log("  [SUCCESS] Handled tool execution failure correctly.");
}

runToolRegistryTest().catch(err => {
  console.error("\n❌ TEST FAILED:", err.message);
  process.exit(1);
});
