# Phase 2: MultiModelRouter & Model Connection

**Goal:** Connect GCCli to real-world LLMs (starting with xAI/Grok) using a provider-based architecture.

## Architecture

### 1. Model Provider Interface (`src/router/ModelProvider.ts`)
- Define a standard interface for all model backends:
  ```typescript
  interface ModelProvider {
    chat(messages: Message[], options: ChatOptions): Promise<ChatResponse> | AsyncIterable<ChatChunk>;
  }
  ```

### 2. xAI Provider (`src/router/providers/XaiProvider.ts`)
- Implementation for xAI API (Grok).
- Support for streaming via Server-Sent Events (SSE).
- Uses `process.env.XAI_API_KEY`.

### 3. MultiModelRouter Updates (`src/router/MultiModelRouter.ts`)
- Orchestrates between different providers.
- Implements fallback logic (if xAI fails, try fallback).
- Manages model-specific settings (temperature, max tokens).

## Success Criteria
- [ ] `MultiModelRouter` successfully calls the xAI API and returns a response.
- [ ] The CLI can handle both streaming (real-time) and non-streaming responses.
- [ ] API keys are managed via `.env` and never hardcoded.
- [ ] Basic error handling for rate limits or network issues.

## Implementation Notes
- Start with `fetch` (native in Node 18+) for API calls.
- Keep the `router` independent of the CLI loop; it should only care about inputs and outputs.
