import { XaiProvider } from '../src/router/providers/XaiProvider.js';
import { ChatMessage, ChatChunk } from '../src/router/types.js';

async function runXaiProviderTest() {
  console.log("\n" + "=".repeat(50));
  console.log("🧪 RUNNING XAI PROVIDER TEST 🧪");
  console.log("=".repeat(50));

  process.env.XAI_API_KEY = 'test-key';
  const provider = new XaiProvider();

  const messages: ChatMessage[] = [
    { role: 'user', content: 'Hello' }
  ];

  console.log("[STEP 1] Testing non-streaming chat...");
  
  const mockResponse = {
    ok: true,
    json: async () => ({
      choices: [{ message: { content: 'Hello there!' } }],
      model: 'grok-beta',
      usage: { prompt_tokens: 10, completion_tokens: 5 }
    })
  };

  const originalFetch = global.fetch;
  global.fetch = async () => mockResponse as any;

  const response = await provider.chat(messages, { streaming: false }) as any;
  console.log("Non-streaming response:", response);

  if (response.content !== 'Hello there!') {
    throw new Error(`Expected content 'Hello there!', got '${response.content}'`);
  }
  if (response.usage?.promptTokens !== 10) {
    throw new Error(`Expected promptTokens 10, got ${response.usage?.promptTokens}`);
  }

  console.log("  [SUCCESS]");

  console.log("[STEP 2] Testing streaming chat...");

  const sseData = [
    'data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n',
    'data: {"choices":[{"delta":{"content":" there"}}]}\n\n',
    'data: {"choices":[{"delta":{"content":"!"}}]}\n\n',
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

  global.fetch = async () => mockStreamingResponse as any;

  const stream = await provider.chat(messages, { streaming: true }) as AsyncIterable<ChatChunk>;
  let fullContent = '';
  for await (const chunk of stream) {
    if (chunk.type === 'text') {
      fullContent += chunk.content;
    }
  }

  console.log("Streaming full content:", fullContent);
  if (fullContent !== 'Hi there!') {
    throw new Error(`Expected streaming content 'Hi there!', got '${fullContent}'`);
  }

  console.log("  [SUCCESS]");

  global.fetch = originalFetch;

  console.log("\n" + "=".repeat(50));
  console.log("🧪 XAI PROVIDER TEST: PASSED 🧪");
  console.log("=".repeat(50) + "\n");
}

runXaiProviderTest().catch(err => {
  console.error("\n❌ TEST FAILED:", err.message);
  process.exit(1);
});
