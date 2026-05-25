import { XaiProvider } from '../src/router/providers/XaiProvider.js';
import { ChatMessage, ChatChunk, ToolSchema } from '../src/router/types.js';

async function runXaiFunctionCallingTest() {
  console.log("\n" + "=".repeat(50));
  console.log("🧪 RUNNING XAI FUNCTION CALLING TEST 🧪");
  console.log("=".repeat(50));

  process.env.XAI_API_KEY = 'test-key';
  const provider = new XaiProvider();

  const messages: ChatMessage[] = [
    { role: 'user', content: 'What is the weather in London?' }
  ];

  const tools: ToolSchema[] = [
    {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get the current weather',
        parameters: {
          type: 'object',
          properties: {
            location: { type: 'string' }
          },
          required: ['location']
        }
      }
    }
  ];

  console.log("[STEP 1] Testing non-streaming function call...");
  
  const mockResponse = {
    ok: true,
    json: async () => ({
      choices: [{ 
        message: { 
          content: null,
          tool_calls: [
            {
              id: 'call_123',
              type: 'function',
              function: {
                name: 'get_weather',
                arguments: '{"location": "London"}'
              }
            }
          ]
        } 
      }],
      model: 'grok-beta',
      usage: { prompt_tokens: 50, completion_tokens: 20 }
    })
  };

  const originalFetch = global.fetch;
  let capturedPayload: any;
  global.fetch = (async (url: string, init: any) => {
    capturedPayload = JSON.parse(init.body);
    return mockResponse as any;
  }) as any;

  const response = await provider.chat(messages, { streaming: false, tools }) as any;
  console.log("Non-streaming response:", JSON.stringify(response, null, 2));

  if (!capturedPayload.tools) {
    throw new Error("Tools were not passed to the API");
  }

  if (!response.tool_calls || response.tool_calls.length === 0) {
    throw new Error("Expected tool_calls in response");
  }
  if (response.tool_calls[0].function.name !== 'get_weather') {
    throw new Error(`Expected function name 'get_weather', got '${response.tool_calls[0].function.name}'`);
  }

  console.log("  [SUCCESS]");

  console.log("[STEP 2] Testing streaming function call...");

  const sseData = [
    'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_abc","function":{"name":"get_weather"}}]}}]}\n\n',
    'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\\"loc"}} ]}}]}\n\n',
    'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"ation\\": \\"Lon"}} ]}}]}\n\n',
    'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"don\\"}"}} ]}}]}\n\n',
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

  global.fetch = (async () => mockStreamingResponse as any) as any;

  const stream = await provider.chat(messages, { streaming: true, tools }) as AsyncIterable<ChatChunk>;
  const toolCalls: any[] = [];
  
  for await (const chunk of stream) {
    if (chunk.type === 'tool_call') {
      const existing = toolCalls.find(tc => tc.index === chunk.index);
      if (existing) {
        if (chunk.id) existing.id = chunk.id;
        if (chunk.name) existing.name = chunk.name;
        if (chunk.arguments) existing.arguments = (existing.arguments || '') + chunk.arguments;
      } else {
        toolCalls.push({ ...chunk });
      }
    }
  }

  console.log("Accumulated tool calls:", JSON.stringify(toolCalls, null, 2));
  
  if (toolCalls.length !== 1) {
    throw new Error(`Expected 1 tool call, got ${toolCalls.length}`);
  }
  if (toolCalls[0].name !== 'get_weather') {
    throw new Error(`Expected name 'get_weather', got '${toolCalls[0].name}'`);
  }
  if (toolCalls[0].arguments !== '{"location": "London"}') {
    throw new Error(`Expected arguments '{"location": "London"}', got '${toolCalls[0].arguments}'`);
  }

  console.log("  [SUCCESS]");

  global.fetch = originalFetch;

  console.log("\n" + "=".repeat(50));
  console.log("🧪 XAI FUNCTION CALLING TEST: PASSED 🧪");
  console.log("=".repeat(50) + "\n");
}

runXaiFunctionCallingTest().catch(err => {
  console.error("\n❌ TEST FAILED:", err.message);
  process.exit(1);
});
