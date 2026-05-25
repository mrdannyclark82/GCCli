# Phase 4: Production Database Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement SQLite and Redis memory providers and update bootstrapping logic for pluggable persistence.

**Architecture:** Provider Pattern. `MemoryManager` uses an injected `MemoryProvider`. SQLite uses `better-sqlite3` (sync/embedded). Redis uses `redis` (async/remote).

**Tech Stack:** TypeScript, `better-sqlite3`, `redis`.

---

### Task 1: Dependencies and Environment Setup

**Files:**
- Modify: `package.json`
- Modify: `.env`

- [ ] **Step 1: Install new dependencies**
Run: `npm install better-sqlite3 redis` and `npm install --save-dev @types/better-sqlite3`.

- [ ] **Step 2: Update .env template**
Add `MEMORY_PROVIDER=file`, `REDIS_URL=redis://localhost:6379`, and `SQLITE_PATH=.gccli_state.db` to the environment.

- [ ] **Step 3: Commit**
```bash
git add package.json
git commit -m "chore(phase4): add sqlite and redis dependencies"
```

---

### Task 2: Implement SqliteMemoryProvider

**Files:**
- Create: `src/memory/providers/SqliteMemoryProvider.ts`
- Test: `tests/test_sqlite_provider.ts`

- [ ] **Step 1: Create SqliteMemoryProvider class**
Implement `save` and `load` using `better-sqlite3`. Use a table `agent_state` with a single row.

- [ ] **Step 2: Write tests for SQLite provider**
Verify state can be saved and retrieved from a local `.db` file.

- [ ] **Step 3: Commit**
```bash
git add src/memory/providers/SqliteMemoryProvider.ts tests/test_sqlite_provider.ts
git commit -m "feat(phase4): implement SqliteMemoryProvider"
```

---

### Task 3: Implement RedisMemoryProvider

**Files:**
- Create: `src/memory/providers/RedisMemoryProvider.ts`
- Test: `tests/test_redis_provider.ts`

- [ ] **Step 1: Create RedisMemoryProvider class**
Implement `save` and `load` using the `redis` client. Use a key `gccli:state:default`.

- [ ] **Step 2: Write tests for Redis provider**
Mock the redis client to verify save/load logic.

- [ ] **Step 3: Commit**
```bash
git add src/memory/providers/RedisMemoryProvider.ts tests/test_redis_provider.ts
git commit -m "feat(phase4): implement RedisMemoryProvider"
```

---

### Task 4: Pluggable Bootstrapping and Fallback

**Files:**
- Modify: `src/index.ts`
- Modify: `src/tui/CliLoop.ts`

- [ ] **Step 1: Implement provider factory logic**
In `src/index.ts`, read `process.env.MEMORY_PROVIDER` and instantiate the correct provider.

- [ ] **Step 2: Add graceful fallback**
If SQLite or Redis fails to initialize, log a warning and fallback to `FileMemoryProvider`.

- [ ] **Step 3: Commit**
```bash
git add src/index.ts src/tui/CliLoop.ts
git commit -m "feat(phase4): implement pluggable provider bootstrapping with fallback"
```
