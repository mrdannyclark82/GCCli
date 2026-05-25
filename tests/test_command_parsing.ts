import { CommandParser } from '../src/core/CommandParser.js';

async function runCommandParserTest() {
  console.log("\n" + "="*50);
  console.log("🧪 TDD: RUNNING COMMAND PARSER TEST 🧪");
  console.log("="*50);

  const parser = new CommandParser();

  console.log("[STEP 1] Testing standard chat input...");
  const chatResult = parser.parse("Hello, how are you today?");
  console.log("Chat Result:", chatResult);
  if (chatResult.type !== 'chat' || chatResult.payload !== "Hello, how are you today?") {
    throw new Error("Failed to parse standard chat input.");
  }
  console.log("  [SUCCESS]");

  console.log("[STEP 2] Testing slash commands...");
  
  const helpResult = parser.parse("/help");
  console.log("Help Result:", helpResult);
  if (helpResult.type !== 'help') {
    throw new Error("Failed to parse /help command.");
  }

  const exitResult = parser.parse("/exit");
  console.log("Exit Result:", exitResult);
  if (exitResult.type !== 'exit') {
    throw new Error("Failed to parse /exit command.");
  }

  const modelResult = parser.parse("/model grok-beta");
  console.log("Model Result:", modelResult);
  if (modelResult.type !== 'model' || modelResult.payload !== 'grok-beta') {
    throw new Error("Failed to parse /model command with payload.");
  }

  const teleportResult = parser.parse("/teleport export my_state.json");
  console.log("Teleport Result:", teleportResult);
  if (teleportResult.type !== 'teleport' || teleportResult.action !== 'export' || teleportResult.payload !== 'my_state.json') {
    throw new Error("Failed to parse /teleport command with action and payload.");
  }

  console.log("  [SUCCESS] All slash commands parsed correctly.");

  console.log("[STEP 3] Testing edge cases & error resilience...");
  const emptyResult = parser.parse("   ");
  if (emptyResult.type !== 'chat' || emptyResult.payload !== '') {
    throw new Error("Failed to handle empty input gracefully.");
  }

  const leadingWhitespace = parser.parse("   /help   ");
  if (leadingWhitespace.type !== 'help') {
    throw new Error("Failed to parse command with leading/trailing whitespace.");
  }

  console.log("  [SUCCESS] Resilience tests passed.");

  console.log("\n" + "="*50);
  console.log("🧪 TDD COMMAND PARSER: NOMINAL 🧪");
  console.log("="*50 + "\n");
}

runCommandParserTest().catch(err => {
  console.error("\n❌ TEST FAILED:", err.message);
  process.exit(1);
});
