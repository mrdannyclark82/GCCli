# Phase 5: Proactive Agency & Ecosystem

**Goal:** Transform GCCli into an autonomous, proactive agent by adding local model support (Ollama), a background proactive engine, and full web-browsing capabilities via Playwright.

## Architecture

### 1. Local Model Support (`src/router/providers/OllamaProvider.ts`)
- Implement `OllamaProvider` extending `ModelProvider`.
- Point to `http://localhost:11434/api/chat`.
- Support streaming and function calling (if the specific Ollama model supports it).

### 2. Proactive Engine (`src/skills/Proactive.ts`)
- Refactor the current stub into an active background loop.
- **Mechanism:** Uses `setInterval` (e.g., every 5 minutes).
- **Logic:** Silently queries a designated model (preferring local/Ollama to save costs) with the recent context. Asks: "Based on context, should I proactively execute a tool or message the user?"
- **Output:** If action is needed, the `CliLoop` is interrupted/appended with the proactive message or tool execution.

### 3. Browser Skill (`src/skills/BrowserSkill.ts`)
- Add `playwright` dependency.
- Create a new skill that registers the following tools to the `ToolRegistry`:
  - `web_search`: Uses a search engine (e.g., DuckDuckGo) via Playwright.
  - `web_extract`: Navigates to a URL and extracts the main text content.
  - `web_click`: Clicks a specific element (requires complex DOM mapping for LLMs). *MVP will focus on search and extract.*

## Success Criteria
- [ ] User can switch to local models via `/model ollama:<model_name>`.
- [ ] Agent can be configured to "wake up" periodically and initiate conversation or action.
- [ ] Agent can autonomously browse the web to answer complex, real-time queries without external API keys (using Playwright).

## Implementation Notes
- Playwright is a heavy dependency; ensure `npm install playwright` and `npx playwright install` are part of the setup instructions.
- Ensure the proactive loop does not interfere with active user typing (requires careful `readline` manipulation).
