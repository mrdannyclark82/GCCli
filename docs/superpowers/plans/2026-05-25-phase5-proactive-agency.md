# Phase 5: Proactive Agency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform GCCli into a proactive, web-capable agent with local model support.

**Architecture:** Ollama Provider (REST), Proactive Interval Engine, Browser Skill (Playwright wrapper).

**Tech Stack:** TypeScript, Playwright, Ollama.

---

### Task 1: Ollama Provider Implementation

**Files:**
- Create: `src/router/providers/OllamaProvider.ts`
- Modify: `src/router/MultiModelRouter.ts`

- [ ] **Step 1: Implement OllamaProvider class**
Build the logic to call local Ollama chat API. Support streaming.

- [ ] **Step 2: Register Ollama in MultiModelRouter**
Update the router to allow registering ollama models (e.g., `ollama:llama3`).

- [ ] **Step 3: Commit**
```bash
git add src/router/providers/OllamaProvider.ts src/router/MultiModelRouter.ts
git commit -m "feat(phase5): add Ollama model provider support"
```

---

### Task 2: Browser Skill & Tools (Playwright)

**Files:**
- Create: `src/skills/BrowserSkill.ts`

- [ ] **Step 1: Install Playwright**
Run: `npm install playwright` and `npx playwright install`.

- [ ] **Step 2: Implement BrowserSkill**
Create tools: `web_search` (using DuckDuckGo) and `web_extract` (text extraction).

- [ ] **Step 3: Commit**
```bash
git add src/skills/BrowserSkill.ts
git commit -m "feat(phase5): implement browser skill with search and extraction"
```

---

### Task 3: Proactive Engine & Loop

**Files:**
- Modify: `src/skills/Proactive.ts`
- Modify: `src/tui/CliLoop.ts`

- [ ] **Step 1: Implement the Proactive Loop**
Refactor `Proactive.ts` to start a `setInterval` that periodically queries the agent's "proactive intent".

- [ ] **Step 2: Integrate Loop with CliLoop**
Ensure proactive messages can interrupt the prompt gracefully.

- [ ] **Step 3: Commit**
```bash
git add src/skills/Proactive.ts src/tui/CliLoop.ts
git commit -m "feat(phase5): implement background proactive loop"
```
