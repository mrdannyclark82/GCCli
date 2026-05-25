# Phase 3: Function Calling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable the agent to autonomously call tools during streaming conversations with a complex chunk-accumulator.

**Architecture:** Recursive agent loop. Streaming response union (`text` | `tool_calls`). JSON accumulator for SSE chunks.

**Tech Stack:** TypeScript, xAI API, Node.js Streams.

---

### Task 1: Update Router Types & Interfaces

**Files:**
- Modify: `src/router/types.ts`
- Modify: `src/router/ModelProvider.ts`

- [ ] **Step 1: Enhance ChatMessage and ChatOptions**
Update `ChatMessage` to support `tool_calls` and `tool_call_id`. Add `tools` to `ChatOptions`.

- [ ] **Step 2: Update Chat Response Yields**
Refactor the `AsyncIterable` in `ModelProvider` to yield objects: `{ type: 'text', content: string } | { type: 'tool_call_chunk', ... }`.

- [ ] **Step 3: Commit**
```bash
git add src/router/types.ts src/router/ModelProvider.ts
git commit -m "feat(phase3): update router types for function calling"
```

---

### Task 2: Implement Streaming Tool Accumulator

**Files:**
- Modify: `src/router/providers/XaiProvider.ts`
- Test: `tests/test_xai_function_calling.ts`

- [ ] **Step 1: Pass Tools to xAI API**
Update the `chat` method to include the `tools` array in the fetch payload.

- [ ] **Step 2: Implement Chunk Accumulation**
In `handleStreamingResponse`, detect `tool_calls` in the SSE chunks and buffer the JSON arguments.

- [ ] **Step 3: Yield Parsed Tool Calls**
Once the stream indicates the tool call is complete, parse the buffered JSON and yield the tool call object.

- [ ] **Step 4: Commit**
```bash
git add src/router/providers/XaiProvider.ts tests/test_xai_function_calling.ts
git commit -m "feat(phase3): implement streaming tool call accumulation in XaiProvider"
```

---

### Task 3: The Autonomous Agent Loop

**Files:**
- Modify: `src/tui/CliLoop.ts`

- [ ] **Step 1: Implement the recursive chat handler**
Update the chat handler to check for tool calls. If found, execute them via `ToolRegistry` and loop back for another model turn.

- [ ] **Step 2: Integrate Tool Results into History**
Ensure tool results are correctly formatted as messages and passed back to the model.

- [ ] **Step 3: Verify with End-to-End Test**
Create a test case where the agent must call a tool (e.g., `get_time`) to answer a user question.

- [ ] **Step 4: Commit**
```bash
git add src/tui/CliLoop.ts
git commit -m "feat(phase3): implement autonomous agent loop with function calling"
```
