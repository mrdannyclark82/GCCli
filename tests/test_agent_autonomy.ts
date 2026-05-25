import { CliLoop } from '../src/tui/CliLoop.js';
import { MultiModelRouter } from '../src/router/MultiModelRouter.js';
import { toolRegistry } from '../src/tools/ToolRegistry.js';
import { PassThrough } from 'stream';
import assert from 'assert';

// Mock Tool
const mockTool = {
  name: 'get_weather',
  description: 'Get the weather',
  schema: {
    type: 'object',
    properties: {
      location: { type: 'string' }
    }
  },
  execute: async (args: any) => {
    return `The weather in ${args.location} is sunny.`;
  }
};

async function testAgentAutonomy() {
  console.log('Running Test: Agent Autonomy');

  const input = new PassThrough();
  const output = new PassThrough();
  
  // Collect output
  let fullOutput = '';
  output.on('data', (chunk) => {
    fullOutput += chunk.toString();
  });

  const mockRouter = new MultiModelRouter() as any;
  
  // Register mock tool
  toolRegistry.register(mockTool);

  const loop = new CliLoop({
    input,
    output,
    router: mockRouter,
    historyPath: '/tmp/test_gccli_history'
  });

  // Mock chat method to return a tool call then a text response
  let callCount = 0;
  mockRouter.chat = async (messages: any[], options: any) => {
    callCount++;
    if (callCount === 1) {
      // First call: verify it has the tool schema
      assert(options.tools && options.tools.length > 0, 'Tools should be provided to the router');
      assert.strictEqual(options.tools[0].function.name, 'get_weather');

      // Return a tool call chunk
      return (async function* () {
        yield { 
          type: 'tool_call', 
          index: 0, 
          id: 'call_123', 
          name: 'get_weather', 
          arguments: '{"location": "San Francisco"}' 
        };
      })();
    } else {
      // Second call: verify history contains tool result
      assert.strictEqual(messages.length, 3, 'History should contain: user, assistant (tool call), tool result');
      assert.strictEqual(messages[0].role, 'user');
      assert.strictEqual(messages[1].role, 'assistant');
      assert(messages[1].tool_calls);
      assert.strictEqual(messages[2].role, 'tool');
      assert.strictEqual(messages[2].tool_call_id, 'call_123');
      assert.strictEqual(messages[2].content, 'The weather in San Francisco is sunny.');

      // Return a text chunk
      return (async function* () {
        yield { type: 'text', content: 'The weather is sunny in San Francisco.' };
      })();
    }
  };

  await loop.start();

  // Send a chat message
  input.write('What is the weather in SF?\n');

  // Wait for processing. Since it's async, we might need a bit of time or a more robust way to wait.
  // The loop processes turns sequentially.
  
  let attempts = 0;
  while (!fullOutput.includes('The weather is sunny in San Francisco.') && attempts < 20) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }

  console.log('Output received:', fullOutput);

  // Verify
  assert(fullOutput.includes('[System] Executing tool: get_weather...'));
  assert(fullOutput.includes('The weather is sunny in San Francisco.'));
  assert.strictEqual(callCount, 2, 'Should have called router twice');

  loop.close();
  console.log('Test Passed: Agent Autonomy');
  process.exit(0);
}

testAgentAutonomy().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
