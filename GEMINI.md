# GCCli - Custom Grok CLI

A powerful, local-first, multi-model CLI with deep skills integration and proactive behavior.

## Project Overview

GCCli is an AI agent designed to bring multi-model capabilities directly to the terminal. It is built with a modular architecture to support extensibility and core system skills such as proactive behavior and honest limitation reporting.

### Main Technologies
- **Language:** TypeScript
- **Runtime:** Node.js (v22+ recommended)
- **Development:** [tsx](https://github.com/privatenumber/tsx) for fast development cycles.
- **Build Tool:** TypeScript Compiler (tsc)
- **Environment Management:** dotenv

### Architecture
The project follows a modular structure located in the `GCCli/src/` directory:
- **Core (`core/`):** Orchestrates the agent loop and main logic.
- **Router (`router/`):** Manages multi-model routing (currently implemented as a stub).
- **Memory (`memory/`):** Handles short-term and long-term memory management. Now supports state serialization for teleportation.
- **Skills (`skills/`):** Implementation of the skill system, including:
    - `Proactive`: Controls proactive behavior.
    - `Teleportation`: Facilitates cross-session and cross-platform continuity via state export/import (JSON with SHA-256 integrity checks).
- **Tools (`tools/`):** Registry and execution logic for tools available to the agent.
- **TUI (`tui/`):** Components for the terminal user interface.
- **Utils (`utils/`):** Shared utility functions.

## Building and Running

Commands are managed via `npm` and are located in the `GCCli` subdirectory.

| Task | Command | Description |
| :--- | :--- | :--- |
| **Development** | `npm run dev` | Runs the CLI directly from source using `tsx`. |
| **Build** | `npm run build` | Compiles TypeScript source to JavaScript in the `dist` folder. |
| **Start** | `npm start` | Runs the compiled project from the `dist` folder. |
| **Clean** | `npm run clean` | Removes the `dist` directory. |

## Development Conventions

- **Module System:** Uses ES Modules (`"type": "module"` in `package.json`).
- **Coding Style:** Strict TypeScript is enforced via `tsconfig.json`.
- **Modularity:** Keep logic separated into the respective directories under `src/`. 
- **Skill Implementation:** All core skills should extend the `CoreSystemSkill` abstract class.
- **Asynchronous Patterns:** Prefer `async/await` for all I/O and model-related operations.

## Key Files
- `GCCli/src/index.ts`: Entry point of the application.
- `GCCli/src/router/MultiModelRouter.ts`: Central routing logic for AI models.
- `GCCli/src/memory/MemoryManager.ts`: Manages agent memory state with support for state serialization.
- `GCCli/src/skills/CoreSystemSkill.ts`: Base class for all system skills.
- `GCCli/src/skills/Teleportation.ts`: Implementation of cross-session state transfer.
- `GCCli/src/tools/ToolRegistry.ts`: Central registry for agent tools.
