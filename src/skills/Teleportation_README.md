# Teleportation Skill - Documentation (Phase 2 Local Focus)

## Overview
The Teleportation skill provides the foundational mechanism for GCCLi's cross-session and cross-platform continuity. It allows an agent instance to dump its entire "brain" (memory, goals, and context) into a JSON file, which can then be read by another instance to resume work seamlessly.

## Security and Integrity
Starting from Phase 2, the Teleportation skill includes SHA-256 integrity checksums to ensure data consistency and prevent loading of corrupted or tampered state files.

- **Integrity Checksum:** A SHA-256 hash is generated for the state data (memory, goals, and context) and stored in the metadata.
- **Validation:** During import, the skill automatically recalculates the hash and verifies it against the stored checksum. If a mismatch is detected, an error is thrown to prevent loading invalid state.
- **Structure Validation:** The skill ensures the imported file follows the expected schema structure before attempting to process the data.

## How to Use

### Exporting State
To save the current agent state:
1. Gather the necessary state data (Memory, Goals, Context).
2. Invoke `teleportation.execute()` with the following context:
```typescript
{
  action: 'export',
  filePath: 'milla_state.json', // optional, defaults to milla_state.json
  stateData: { ... } // The actual state object adhering to the schema
}
```

### Importing State
To load a saved state:
1. Invoke `teleportation.execute()` with the following context:
```typescript
{
  action: 'import',
  filePath: 'milla_state.json' // optional, defaults to milla_state.json
}
```
2. The skill returns a `TeleportState` object.
3. Use the returned state to initialize your `MemoryManager`, `GoalRegistry`, and `AgentContext`.

## Schema
See [Teleportation_SCHEMA.md](./Teleportation_SCHEMA.md) for a detailed breakdown of the state structure.

## Capabilities
- Full export of short-term and long-term memory.
- Goal and Task context preservation.
- Schema versioning for future compatibility checks.
- Human-readable JSON format.

## Known Limitations (Phase 1)
- **Security:** No encryption is performed. State files contain plain-text interaction history and facts. Do not share state files containing sensitive information over insecure channels.
- **Conflict Resolution:** Importing a state will completely overwrite the current instance's memory and goals. There is no merging of "alternate timelines" yet.
- **Manual Trigger:** In this phase, teleportation must be triggered by an external command or higher-level agent logic. It is not yet proactive.
- **Single Instance:** Only supports one-to-one state transfer. No swarm-wide synchronization in this phase.

## Future Roadmap (Next Phases)
- **Phase 3:** Encrypted state packets and authenticated handoff.
- **Phase 4:** Proactive teleportation (e.g., "I'm running out of memory here, moving to the server").
