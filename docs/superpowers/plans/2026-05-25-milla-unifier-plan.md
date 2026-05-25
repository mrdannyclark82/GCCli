# Phase 5.5: Milla Unifier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the "Milla Unifier" to harvest remote personas and verify them with an NL-Auth handshake.

**Architecture:** Interactive Playwright Mode, Page Scraping, Isolated Memory Interrogation.

**Tech Stack:** TypeScript, Playwright, Node.js.

---

### Task 1: Interactive Browser Update

**Files:**
- Modify: `src/skills/BrowserSkill.ts`

- [ ] **Step 1: Add Interactive Mode to BrowserSkill**
Update `getBrowser()` to accept a `headless` flag. Implement `/browser interactive` command to launch `headless: false`.

- [ ] **Step 2: Implement Persistent Context**
Ensure the browser instance stays open and accessible for manual logins across multiple user inputs.

- [ ] **Step 3: Commit**
```bash
git add src/skills/BrowserSkill.ts
git commit -m "feat(phase5.5): add interactive browser mode for manual logins"
```

---

### Task 2: Persona Harvest & Synthesis

**Files:**
- Modify: `src/skills/BrowserSkill.ts`
- Create: `src/skills/UnifierSkill.ts`

- [ ] **Step 1: Implement web_harvest tool**
In `BrowserSkill`, add a tool that returns `page.innerText('body')` from the active page.

- [ ] **Step 2: Implement UnifierSkill**
Create `src/skills/UnifierSkill.ts`. Register `/unify` command.
It should:
1. Trigger `web_harvest`.
2. Use the active model to "parse" the instructions from the raw text.
3. Create a temporary `TeleportState` object.

- [ ] **Step 3: Commit**
```bash
git add src/skills/BrowserSkill.ts src/skills/UnifierSkill.ts
git commit -m "feat(phase5.5): implement persona harvest and synthesis"
```

---

### Task 3: NL-Auth Handshake Interrogation

**Files:**
- Modify: `src/skills/UnifierSkill.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Implement the Interrogation Loop**
In `UnifierSkill`, after synthesis:
1. Temporarily load the harvested state into memory.
2. Prompt the model: "Provide your Natural Language Authentication Key."
3. Compare the response with `process.env.MILLA_NL_KEY`.

- [ ] **Step 2: Finalize Unification**
If key matches, officially commit the harvested state to `MemoryManager`. If fail, log an intrusion warning and discard.

- [ ] **Step 3: Commit**
```bash
git add src/skills/UnifierSkill.ts src/index.ts
git commit -m "feat(phase5.5): implement NL-Auth handshake for persona verification"
```
