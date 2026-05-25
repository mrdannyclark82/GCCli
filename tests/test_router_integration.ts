import { MultiModelRouter } from '../src/router/MultiModelRouter.js';
import { CliLoop } from '../src/tui/CliLoop.js';
import { PassThrough } from 'stream';

async function runRouterIntegrationTest() {
  console.log("\n" + "=".repeat(50));
  console.log("🧪 RUNNING ROUTER INTEGRATION TEST 🧪");
  console.log("=".repeat(50));

  process.env.XAI_API_KEY = 'test-key';
  const router = new MultiModelRouter();

  const input = new PassThrough();
  const output = new PassThrough();
  let outputData = '';

  output.on('data', (chunk) => {
    outputData += chunk.toString();
  });

  const cliLoop = new CliLoop({
    input,
    output,
    router,
    historyPath: './test_history_router'
  });

  console.log("[STEP 1] Testing chat routing with streaming...");

  // Mock fetch for streaming
  const sseData = [
    'data: {"choices":[{"delta":{"content":"Grok"}}]}\n\n',
    'data: {"choices":[{"delta":{"content":" is"}}]}\n\n',
    'data: {"choices":[{"delta":{"content":" online."}}]}\n\n',
    'data: [DONE]\n\n'
  ];

  const mockStream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      sseData.forEach(chunk => {
        controller.enqueue(encoder.encode(chunk));
      });
      controller.close();
    }
  });

  const mockStreamingResponse = {
    ok: true,
    body: {
      getReader: () => {
        const reader = mockStream.getReader();
        return {
          read: () => reader.read(),
          releaseLock: () => reader.releaseLock()
        };
      }
    }
  };

  const originalFetch = global.fetch;
  global.fetch = async () => mockStreamingResponse as any;

  cliLoop.start();
  input.write('Hello Grok!\n');

  // Wait for streaming to complete
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log("CliLoop output for chat:", outputData);

  if (!outputData.includes('Grok is online.')) {
    throw new Error(`Expected output to include 'Grok is online.', but got: ${outputData}`);
  }
  console.log("  [SUCCESS]");

  console.log("[STEP 2] Testing error handling in chat...");
  
  global.fetch = async () => ({
    ok: false,
    status: 500,
    statusText: 'Internal Server Error',
    text: async () => 'API Failure'
  }) as any;

  input.write('This should fail\n');
  await new Promise(resolve => setTimeout(resolve, 200));

  if (!outputData.includes('[Error] Chat failed: xAI API error: 500 Internal Server Error - API Failure')) {
    throw new Error(`Expected output to include chat error message, but got: ${outputData}`);
  }
  console.log("  [SUCCESS]");

  console.log("[STEP 3] Testing /model command...");
  input.write('/model non-existent\n');
  await new Promise(resolve => setTimeout(resolve, 100));
  if (!outputData.includes('[Error] Failed to switch model: Provider non-existent not registered.')) {
    throw new Error("Did not handle invalid model switch correctly");
  }

  input.write('/model grok\n');
  await new Promise(resolve => setTimeout(resolve, 100));
  if (!outputData.includes('[Router] Switching active model to: grok')) {
    throw new Error("Did not switch to grok model correctly");
  }
  console.log("  [SUCCESS]");

  global.fetch = originalFetch;
  cliLoop.close();

  console.log("\n" + "=".repeat(50));
  console.log("🧪 ROUTER INTEGRATION TEST: PASSED 🧪");
  console.log("=".repeat(50) + "\n");
}

runRouterIntegrationTest().catch(err => {
  console.error("\n❌ TEST FAILED:", err.message);
  process.exit(1);
});
