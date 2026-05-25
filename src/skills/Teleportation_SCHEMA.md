# Teleportation Skill - State Schema (B.A.M. Phase 3)

This document defines the minimum state required for a successful "teleportation" (export/import) of the GCCLi agent.

## Schema Definition (JSON)

```json
{
  "metadata": {
    "version": "1.1.0",
    "timestamp": "ISO-8601 Timestamp",
    "agentId": "Unique ID of the agent instance",
    "checksum": "SHA-256 hash of the state data (plaintext)",
    "isEncrypted": "boolean",
    "origin": "signature or public key of origin agent (optional)",
    "target": "signature or public key of intended target agent (optional)"
  },
  "memory": {
    "shortTerm": [
      { "role": "user/assistant", "content": "..." },
      ...
    ],
    "longTerm": {
      "key": "value",
      ...
    }
  },
  "goals": [
    {
      "id": "goal_id",
      "description": "...",
      "status": "active/completed/pending",
      "priority": 1-5
    }
  ],
  "context": {
    "currentTask": "Description of the current active task",
    "activeSkills": ["SkillName", ...],
    "environment": "cli/local/remote"
  },
  "encryptedData": "AES-256 encrypted base64 string (optional, replaces memory/goals/context when isEncrypted is true)"
}
```

## Field Explanations

### `metadata`
- `version`: Version of the teleportation schema to ensure backward compatibility.
- `timestamp`: When the state was exported.
- `agentId`: Helps identify which agent this state belongs to.
- `checksum`: SHA-256 integrity hash.
- `isEncrypted`: Indicates if the payload is encrypted.
- `origin`: Authenticated handoff: origin identifier.
- `target`: Authenticated handoff: target identifier.

### `memory`
- `shortTerm`: Recent conversation history.
- `longTerm`: Persisted facts and context.

### `goals`
- High-level objectives and status.

### `context`
- Runtime context and active skills.

### `encryptedData`
- If `isEncrypted` is true, the `memory`, `goals`, and `context` fields are removed from the root and their serialized JSON string is stored here after encryption.

## Phase 3 Upgrades
- **AES-256 Encryption:** Optional encryption for state packets.
- **Authenticated Handoff:** Added origin and target fields to metadata.
