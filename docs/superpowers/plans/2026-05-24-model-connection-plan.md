# MultiModelRouter + Model Connection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect GCCli to the xAI (Grok) API and implement a streaming-ready provider architecture.

**Architecture:** Provider Pattern. `MultiModelRouter` delegates to `ModelProvider` implementations. Supports `AsyncIterable` for streaming.

**Tech Stack:** TypeScript, Node.js `fetch`, `dotenv`.

---

### Task 1: Model Provider Interface & Types

**Files:**
- Create: `src/router/types.ts`
- Create: `src/router/ModelProvider.ts`

- [ ] **Step 1: Define Message and Option types**
Define `ChatMessage`, `ChatOptions`, and `ChatResponse` in `src/router/types.ts`.

- [ ] **Step 2: Create ModelProvider Interface**
Define the `ModelProvider` abstract class or interface with a `chat` method that returns `Promise<ChatResponse> | AsyncIterable<string>`.

- [ ] **Step 3: Commit**
```bash
git add src/router/types.ts src/router/ModelProvider.ts
git commit -m "feat: add ModelProvider interface and types"
```

---

### Task 2: Implement xAI Provider

**Files:**
- Create: `src/router/providers/XaiProvider.ts`
- Test: `tests/test_xai_provider.ts`

- [ ] **Step 1: Implement XaiProvider class**
Build the logic to call `https://api.x.ai/v1/chat/completions`. Use `process.env.XAI_API_KEY`.

- [ ] **Step 2: Add Streaming support**
Implement the logic to parse SSE (Server-Sent Events) from the xAI response and yield chunks.

- [ ] **Step 3: Create a Mock Test**
Write a test that mocks the `fetch` call to verify the provider correctly handles both standard and streaming responses.

- [ ] **Step 4: Commit**
```bash
git add src/router/providers/XaiProvider.ts tests/test_xai_provider.ts
git commit -m "feat: implement XaiProvider with streaming support"
```

---

### Task 3: Update MultiModelRouter & CliLoop Integration

**Files:**
- Modify: `src/router/MultiModelRouter.ts`
- Modify: `src/tui/CliLoop.ts`

- [ ] **Step 1: Update Router to use Providers**
Refactor `MultiModelRouter` to maintain a map of providers and delegate the `chat` call to the active one.

- [ ] **Step 2: Connect CliLoop to Router**
Update the `chat` handler in `CliLoop.ts` to call `router.chat()` and print the response. 

- [ ] **Step 3: Implement Basic Streaming Display**
In `CliLoop.ts`, if the router returns an `AsyncIterable`, use a loop to print chunks to `process.stdout` in real-time.

- [ ] **Step 4: Commit**
```bash
git add src/router/MultiModelRouter.ts src/tui/CliLoop.ts
git commit -m "feat: integrate XaiProvider into MultiModelRouter and CliLoop"
```
