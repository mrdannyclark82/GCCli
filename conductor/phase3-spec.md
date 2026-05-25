# Phase 3: Function Calling & Agent Autonomy

**Goal:** Enable the agent to autonomously call tools during streaming conversations, using a complex chunk-accumulator for real-time tool parsing.

## Architecture

### 1. Types Update (`src/router/types.ts`)
- **`ChatMessage`**: Add `tool_calls` array for assistant messages. Add `tool_call_id` for `role: 'tool'` messages.
- **`ChatOptions`**: Add `tools?: ToolSchema[]` to pass available tools to the LLM.
- **Stream Yields**: Update the `AsyncIterable` to yield a discriminated union: 
  `{ type: 'text', content: string }` OR `{ type: 'tool_calls', calls: ToolCall[] }`.

### 2. Streaming Tool Accumulator (`src/router/providers/XaiProvider.ts`)
- Pass the `tools` payload to xAI.
- In `handleStreamingResponse`, maintain a buffer for `tool_calls`. 
- When `delta.tool_calls` arrives, accumulate the JSON argument string.
- Once the stream finishes (or switches contexts), parse the JSON and yield the complete `{ type: 'tool_calls', calls }` object.

### 3. The Autonomous Agent Loop (`src/tui/CliLoop.ts` / Core)
- Implement a recursive loop for chat:
  1. Call `router.chat()`.
  2. If yielding `text`, print to stdout.
  3. If yielding `tool_calls`, execute the tools autonomously (no user prompt) via `ToolRegistry`.
  4. Append the tool results to the conversation history as `role: 'tool'`.
  5. Automatically trigger another `router.chat()` request to let the model respond to the tool data.

## Success Criteria
- [ ] Agent can be given a tool (e.g., `get_weather` or `list_files`) and autonomously decide to use it.
- [ ] The streaming UI remains perfectly responsive; text streams normally, pauses briefly while a tool executes, then resumes streaming the final answer.
- [ ] Complex chunked tool arguments are successfully reassembled and parsed into valid JSON.

## Implementation Notes
- Tool execution errors must be caught and fed back to the LLM as the tool's response so the agent knows it failed and can try again.
