import { CliLoop } from '../src/tui/CliLoop.js';
import { commandRegistry } from '../src/core/CommandRegistry.js';
import { PassThrough } from 'stream';

async function runCliLoopTest() {
  console.log("\n" + "=".repeat(50));
  console.log("🧪 TDD: RUNNING CLI LOOP INTEGRATION TEST 🧪");
  console.log("=".repeat(50));

  const input = new PassThrough();
  const output = new PassThrough();
  let outputData = '';

  output.on('data', (chunk) => {
    outputData += chunk.toString();
  });

  const cliLoop = new CliLoop({
    input,
    output,
    historyPath: './test_history'
  });

  console.log("[STEP 1] Testing registered command execution...");
  let handlerCalled = false;
  let handlerArgs: string[] = [];
  let handlerFlags: any = {};

  commandRegistry.register({ name: 'testcmd', description: 'Test command' }, (args, flags) => {
    handlerCalled = true;
    handlerArgs = args;
    handlerFlags = flags;
  });

  cliLoop.start();
  input.write('/testcmd arg1 --flag1=val1\n');

  await new Promise(resolve => setTimeout(resolve, 100));

  if (!handlerCalled) {
    throw new Error("Handler was not called for /testcmd");
  }
  if (handlerArgs[0] !== 'arg1' || handlerFlags['flag1'] !== 'val1') {
    throw new Error(`Handler arguments or flags mismatch. Args: ${handlerArgs}, Flags: ${JSON.stringify(handlerFlags)}`);
  }
  console.log("  [SUCCESS]");

  console.log("[STEP 2] Testing dynamic help...");
  // We expect the implementation to use registry for help
  input.write('/help\n');
  await new Promise(resolve => setTimeout(resolve, 100));

  if (!outputData.includes('/testcmd')) {
    throw new Error("Help output did not include registered command /testcmd");
  }
  console.log("  [SUCCESS]");

  console.log("[STEP 3] Testing unknown command...");
  input.write('/unknowncmd\n');
  await new Promise(resolve => setTimeout(resolve, 100));

  if (!outputData.includes('Unknown command: /unknowncmd')) {
    throw new Error("Did not report unknown command correctly");
  }
  console.log("  [SUCCESS]");

  console.log("\n" + "=".repeat(50));
  console.log("🧪 TDD CLI LOOP INTEGRATION: NOMINAL 🧪");
  console.log("=".repeat(50) + "\n");
  
  cliLoop.close();
}

runCliLoopTest().catch(err => {
  console.error("\n❌ TEST FAILED:", err.message);
  process.exit(1);
});
