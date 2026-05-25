# Memory + Tool/Skill Registry (MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement persistent memory and a functional registry for tools and skills.

**Architecture:** Provider Pattern for memory. Registry Pattern for tools and skills.

**Tech Stack:** TypeScript, Node.js `fs/promises`.

---

### Task 1: Pluggable Memory Providers

**Files:**
- Create: `src/memory/MemoryProvider.ts`
- Create: `src/memory/providers/FileMemoryProvider.ts`
- Modify: `src/memory/MemoryManager.ts`

- [ ] **Step 1: Define MemoryProvider Interface**
Define the `MemoryProvider` abstract class with `save(state: any): Promise<void>` and `load(): Promise<any>`.

- [ ] **Step 2: Implement FileMemoryProvider**
Create a JSON-based provider that saves/loads state from `~/.gccli_state.json`.

- [ ] **Step 3: Refactor MemoryManager**
Update `MemoryManager` to accept a provider and use it for persistence. Ensure `TeleportationSkill` still works with the new structure.

- [ ] **Step 4: Commit**
```bash
git add src/memory/MemoryProvider.ts src/memory/providers/FileMemoryProvider.ts src/memory/MemoryManager.ts
git commit -m "feat: implement pluggable memory providers"
```

---

### Task 2: Functional Tool Registry

**Files:**
- Modify: `src/tools/ToolRegistry.ts`
- Test: `tests/test_tool_registry.ts`

- [ ] **Step 1: Update Tool Interface**
Add `schema` (JSON Schema) to the `Tool` interface so LLMs can understand how to call them.

- [ ] **Step 2: Implement tool execution logic**
Ensure `ToolRegistry.execute(name, args)` works correctly and handles errors.

- [ ] **Step 3: Write tests**
Verify tools can be registered, listed, and executed with parameters.

- [ ] **Step 4: Commit**
```bash
git add src/tools/ToolRegistry.ts tests/test_tool_registry.ts
git commit -m "feat: enhance ToolRegistry with schemas and execution logic"
```

---

### Task 3: Skill Integration & Wiring

**Files:**
- Modify: `src/skills/CoreSystemSkill.ts`
- Modify: `src/index.ts`
- Modify: `src/tui/CliLoop.ts`

- [ ] **Step 1: Update CoreSystemSkill**
Add `getTools(): Tool[]` and `getCommands(): Command[]` (or similar) to the base skill class.

- [ ] **Step 2: Auto-register Skills**
In `src/index.ts`, implement a basic loop to initialize skills and register their tools/commands into the respective registries.

- [ ] **Step 3: Wire Memory into CliLoop**
Ensure `MemoryManager.load()` is called on startup and `MemoryManager.save()` is called after each interaction (or on exit).

- [ ] **Step 4: Commit**
```bash
git add src/skills/CoreSystemSkill.ts src/index.ts src/tui/CliLoop.ts
git commit -m "feat: wire memory and skills into the main application flow"
```
