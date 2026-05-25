# Phase 2: Memory & Tool Registry (MVP)

**Goal:** Implement a persistent memory system with a pluggable storage engine and a functional registry for tools and skills.

## Architecture

### 1. Memory Provider System (`src/memory/providers/`)
- **Interface:** `MemoryProvider` with `save`, `load`, and `clear` methods.
- **MVP Implementation:** `FileMemoryProvider` (saves state as JSON to a local file).
- **Ready for Future:** Designed to be extended with `SQLiteMemoryProvider` or `RedisMemoryProvider`.

### 2. Tool Registry (`src/tools/ToolRegistry.ts`)
- Functional registry where tools can be added with names, descriptions, and JSON schemas for arguments.
- Tools are "pluggable" units of work the agent can execute.

### 3. Skill Integration (`src/skills/`)
- Skills can now register both **Commands** (for the CLI) and **Tools** (for the Model).
- Integration between `MemoryManager` and `TeleportationSkill` to ensure state is correctly persisted.

## Success Criteria
- [ ] Memory persists across CLI restarts (via the JSON provider).
- [ ] Tools can be registered and their execution triggered.
- [ ] Skills can successfully access memory and tools.
- [ ] Teleportation skill uses the new `MemoryManager` state.

## Implementation Notes
- Focus on the "Provider Pattern" for memory to satisfy the requirement of future SQLite/Redis integration.
- Ensure the `ToolRegistry` provides enough metadata for future LLM function-calling support.
