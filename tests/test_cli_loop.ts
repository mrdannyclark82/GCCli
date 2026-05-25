import { CliLoop } from '../src/tui/CliLoop.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { Readable, Writable } from 'stream';

async function runCliLoopTest() {
  console.log("\n" + "="*50);
  console.log("🧪 TDD: RUNNING CLI LOOP FOUNDATION TEST 🧪");
  console.log("="*50);

  const historyFile = path.join(os.homedir(), '.gccli_history_test');
  
  // Clean up any old test history files
  try {
    await fs.unlink(historyFile);
  } catch {}

  // Mock input and output streams
  const mockStdin = new Readable({
    read() {}
  });
  
  let mockStdoutContent = '';
  const mockStdout = new Writable({
    write(chunk, encoding, callback) {
      mockStdoutContent += chunk.toString();
      callback();
    }
  });

  console.log("[STEP 1] Initializing CliLoop with mocked streams...");
  const cliLoop = new CliLoop({
    input: mockStdin,
    output: mockStdout,
    historyPath: historyFile
  });

  // Verify CliLoop starts and sets up the prompt
  cliLoop.start();
  
  console.log("[STEP 2] Simulating user inputs...");
  // Push inputs into mock stdin
  mockStdin.push("Hello Grok!\n");
  mockStdin.push("/help\n");
  mockStdin.push("exit\n");
  mockStdin.push(null); // End of stream

  // Wait a small moment for async readline processing
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log("[STEP 3] Verifying output contains expected lines...");
  console.log("Raw Output Collected:\n", mockStdoutContent);

  if (mockStdoutContent.includes("Hello Grok!") || mockStdoutContent.includes("exit")) {
    console.log("  [SUCCESS] CliLoop successfully processed inputs.");
  } else {
    throw new Error("CliLoop failed to process inputs correctly.");
  }

  console.log("[STEP 4] Verifying history persistence...");
  const historyExists = await fs.access(historyFile).then(() => true).catch(() => false);
  if (historyExists) {
    const historyData = await fs.readFile(historyFile, 'utf-8');
    console.log("History File Contents:\n", historyData);
    if (historyData.includes("Hello Grok!")) {
      console.log("  [SUCCESS] History successfully persisted to file.");
    } else {
      throw new Error("Input not found in history file.");
    }
  } else {
    throw new Error("History file was not created.");
  }

  // Cleanup
  try {
    await fs.unlink(historyFile);
  } catch {}

  console.log("\n" + "="*50);
  console.log("🧪 TDD CLI LOOP: NOMINAL 🧪");
  console.log("="*50 + "\n");
}

runCliLoopTest().catch(err => {
  console.error("\n❌ TEST FAILED:", err.message);
  process.exit(1);
});
