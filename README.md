# GCCli

**Custom Grok CLI** — A powerful, local-first, multi-model CLI with deep skills integration and proactive behavior.

## Current Focus
- Multi-Model Router
- Core System Skills (Proactive, Honest Limitation Reporting, Teleportation)
- Clean modular architecture
- Strong memory foundation

## Project Structure

src/
├── core/           # Agent loop & orchestration
├── router/         # Multi-model routing
├── memory/         # Memory system
├── skills/         # Skill system + Core System Skills
├── tui/            # Terminal interface
├── tools/          # Tool definitions
└── utils/
textEOF

# ==================== src/index.ts ====================
cat > src/index.ts << 'EOF'
#!/usr/bin/env node
import 'dotenv/config';
import { MultiModelRouter } from './router/MultiModelRouter.js';

console.log("🌿 GCCli - Custom Grok CLI");
console.log("Status: Initial structure loaded.");

const router = new MultiModelRouter();
