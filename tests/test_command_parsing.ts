import { CommandParser } from '../src/core/CommandParser.js';

async function runCommandParserTest() {
  console.log("\n" + "=".repeat(50));
  console.log("🧪 TDD: RUNNING COMMAND PARSER TEST 🧪");
  console.log("=".repeat(50));

  const parser = new CommandParser();

  console.log("[STEP 1] Testing standard chat input...");
  const chatResult = parser.parse("Hello, how are you today?");
  console.log("Chat Result:", chatResult);
  if (chatResult.type !== 'chat' || chatResult.rawPayload !== "Hello, how are you today?") {
    throw new Error("Failed to parse standard chat input.");
  }
  console.log("  [SUCCESS]");

  console.log("[STEP 2] Testing slash commands (generic)...");
  
  const helpResult = parser.parse("/help");
  console.log("Help Result:", helpResult);
  if (helpResult.type !== 'command' || helpResult.name !== 'help') {
    throw new Error("Failed to parse /help command generically.");
  }

  const exitResult = parser.parse("/exit");
  console.log("Exit Result:", exitResult);
  if (exitResult.type !== 'exit' || exitResult.name !== 'exit') {
    throw new Error("Failed to parse /exit command.");
  }

  const modelResult = parser.parse("/model grok-beta");
  console.log("Model Result:", modelResult);
  if (modelResult.type !== 'command' || modelResult.name !== 'model' || modelResult.rawPayload !== 'grok-beta') {
    throw new Error("Failed to parse /model command generically.");
  }

  console.log("  [SUCCESS] Basic slash commands parsed correctly.");

  console.log("[STEP 3] Testing resilience...");
  const emptyResult = parser.parse("   ");
  if (emptyResult.type !== 'chat' || emptyResult.rawPayload !== '') {
    throw new Error("Failed to handle empty input gracefully.");
  }

  const leadingWhitespace = parser.parse("   /help   ");
  if (leadingWhitespace.type !== 'command' || leadingWhitespace.name !== 'help') {
    throw new Error("Failed to parse command with leading/trailing whitespace.");
  }
  console.log("  [SUCCESS] Resilience tests passed.");

  console.log("[STEP 4] Testing generic slash commands...");
  const customResult = parser.parse("/custom something");
  if (customResult.type !== 'command' || customResult.name !== 'custom' || customResult.rawPayload !== 'something') {
    throw new Error("Failed to parse generic slash command name and payload.");
  }
  console.log("  [SUCCESS] Generic command test passed.");

  console.log("[STEP 5] Testing arguments and flags (EXPECTED TO FAIL ARGS/FLAGS CHECK)...");
  const complexResult = parser.parse("/test arg1 arg2 --flag1=val1 -f");
  console.log("Complex Result:", complexResult);
  
  // These will fail currently as args/flags are not implemented
  if (complexResult.args.length !== 2) {
    throw new Error(`Expected 2 args, got ${complexResult.args.length}`);
  }
  if (complexResult.args[0] !== 'arg1' || complexResult.args[1] !== 'arg2') {
    throw new Error("Args values mismatch.");
  }
  if (complexResult.flags['flag1'] !== 'val1') {
    throw new Error(`Expected flag1=val1, got ${complexResult.flags['flag1']}`);
  }
  if (complexResult.flags['f'] !== true) {
    throw new Error(`Expected flag f=true, got ${complexResult.flags['f']}`);
  }
  console.log("  [SUCCESS] Arguments and flags tests passed.");

  console.log("\n" + "=".repeat(50));
  console.log("🧪 TDD COMMAND PARSER: NOMINAL 🧪");
  console.log("=".repeat(50) + "\n");
}

runCommandParserTest().catch(err => {
  console.error("\n❌ TEST FAILED:", err.message);
  process.exit(1);
});
