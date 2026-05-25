# Phase 4: Production Database Migration

**Goal:** Upgrade the memory system by implementing `SqliteMemoryProvider` and `RedisMemoryProvider` to replace the MVP JSON file provider, using a Document Store approach.

## Architecture

### 1. Provider Implementations (`src/memory/providers/`)
We will create two new classes that implement the existing `MemoryProvider` interface:
- **`SqliteMemoryProvider`**: Uses the `sqlite3` (or `better-sqlite3`) npm package.
- **`RedisMemoryProvider`**: Uses the `redis` npm package.

### 2. Schema: Document Store
Since we are optimizing for rapid MVP deployment while maintaining flexibility, we will use a "JSON Blob" Document Store approach.
- **SQLite Schema**:
  - Table: `agent_state`
  - Columns: `id` (Primary Key, e.g., 'default'), `state_json` (TEXT)
- **Redis Schema**:
  - Key: `gccli:state:default`
  - Value: JSON string of the agent's state.

### 3. Configuration & Bootstrapping (`src/index.ts`)
- Use a `.env` variable (e.g., `MEMORY_PROVIDER=sqlite | redis | file`) to determine which provider to instantiate at startup.
- Add necessary configuration variables for Redis (e.g., `REDIS_URL`).

## Success Criteria
- [ ] Users can configure GCCli to use SQLite, Redis, or File storage via `.env`.
- [ ] SQLite provider creates a local `.gccli_state.db` file and successfully saves/loads state.
- [ ] Redis provider connects to a given Redis URL and successfully saves/loads state.
- [ ] The `MemoryManager` logic remains untouched; only the provider injection changes.

## Implementation Notes
- Add `better-sqlite3` and `redis` to `package.json` dependencies.
- Ensure graceful degradation (fallback to `FileMemoryProvider`) if a database connection fails during initialization.
