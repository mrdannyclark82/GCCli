# Phase 2: CLI Loop Foundation & Command System

**Goal:** Build a modular, registry-based CLI loop that supports dynamic command registration and robust error handling.

## Architecture

### 1. Command Registry (`src/core/CommandRegistry.ts`)
- A central singleton or managed class to store command definitions.
- `register(command: string, handler: CommandHandler, metadata: CommandMetadata)`
- Commands should support descriptions for the auto-generated `/help` output.

### 2. Command Parser Updates (`src/core/CommandParser.ts`)
- Refactor to handle flexible command structures.
- Support for flags (e.g., `--verbose`) and positional arguments.

### 3. CLI Loop (`src/tui/CliLoop.ts`)
- Integrate with `CommandRegistry`.
- Improved terminal UI handling (graceful exit on `Ctrl+C`).
- Persistence for command history (~/.gccli_history).

## Success Criteria
- [ ] Users can interact with GCCli in a continuous loop.
- [ ] `/help` dynamically lists all registered commands with their descriptions.
- [ ] Slash commands are routed to their respective handlers correctly.
- [ ] Application does not crash on invalid input or unexpected errors.

## Implementation Notes
- Use `readline` as the base, but ensure it's wrapped to allow for future UI enhancements (like `ink` or `blessed`).
- Focus on clean interfaces between the TUI layer and the Core logic.
