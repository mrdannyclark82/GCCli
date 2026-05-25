# CLI Loop Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the CLI to use a dynamic `CommandRegistry` and a more robust loop.

**Architecture:** Implement a registry pattern where commands are objects with handlers, decoupled from the core loop and parser.

**Tech Stack:** TypeScript, Node.js `readline`.

---

### Task 1: Command Registry Core

**Files:**
- Create: `src/core/CommandRegistry.ts`
- Test: `tests/test_command_registry.ts`

- [ ] **Step 1: Define Command Interfaces**
Create the `CommandHandler` and `CommandMetadata` types in `src/core/CommandRegistry.ts`.

- [ ] **Step 2: Implement CommandRegistry Class**
Implement the registry with `register`, `get`, and `list` methods. It should be a singleton or exported instance.

- [ ] **Step 3: Write tests for the Registry**
Ensure commands can be registered and retrieved correctly.

- [ ] **Step 4: Commit**
```bash
git add src/core/CommandRegistry.ts tests/test_command_registry.ts
git commit -m "feat: add dynamic CommandRegistry"
```

---

### Task 2: Refactor CommandParser

**Files:**
- Modify: `src/core/CommandParser.ts`
- Test: `tests/test_command_parsing.ts`

- [ ] **Step 1: Update ParsedCommand type**
Add support for `args` (array of strings) and `flags` (Map or Record).

- [ ] **Step 2: Implement dynamic slash-command parsing**
Instead of hardcoding `/help`, etc., the parser should identify `/command` and extract the payload.

- [ ] **Step 3: Update tests**
Ensure the new parser correctly extracts commands and arguments.

- [ ] **Step 4: Commit**
```bash
git add src/core/CommandParser.ts tests/test_command_parsing.ts
git commit -m "refactor: update CommandParser for dynamic commands"
```

---

### Task 3: Integrate with CliLoop

**Files:**
- Modify: `src/tui/CliLoop.ts`

- [ ] **Step 1: Register Core Commands**
Register `/help`, `/exit`, and `/model` using the new `CommandRegistry`.

- [ ] **Step 2: Update the Line Handler**
Refactor the `rl.on('line')` logic to look up commands in the registry instead of using a `switch` statement.

- [ ] **Step 3: Implement Dynamic Help**
The `/help` command handler should now iterate through `CommandRegistry.list()` to display help text.

- [ ] **Step 4: Verify Loop Stability**
Run `npm run dev` and test various commands, including empty input and invalid slash commands.

- [ ] **Step 5: Commit**
```bash
git add src/tui/CliLoop.ts
git commit -m "feat: integrate CommandRegistry into CliLoop"
```
