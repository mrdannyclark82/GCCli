# Teleportation Skill - State Schema (B.A.M. Phase 1)

This document defines the minimum state required for a successful "teleportation" (export/import) of the GCCLi agent.

## Schema Definition (JSON)

```json
{
  "metadata": {
    "version": "1.0.0",
    "timestamp": "ISO-8601 Timestamp",
    "agentId": "Unique ID of the agent instance",
    "checksum": "SHA-256 hash of the state data"
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
  }
}
```

## Field Explanations

### `metadata`
- `version`: Version of the teleportation schema to ensure backward compatibility.
- `timestamp`: When the state was exported.
- `agentId`: Helps identify which agent this state belongs to.

### `memory`
- `shortTerm`: Recent conversation history (typically last 50 messages).
- `longTerm`: Persisted facts, learned preferences, and long-term context stored as key-value pairs.

### `goals`
- A list of high-level objectives the agent is currently pursuing. Includes status and priority.

### `context`
- `currentTask`: The immediate, granular task the agent is working on.
- `activeSkills`: List of skills currently initialized or in-use.
- `environment`: Information about the runtime environment.

## Phase 1 Limitations
- No encryption: State is exported as plain-text JSON.
- No automatic conflict resolution: Importing a state overwrites the current session state.
- Single-file: All data is contained in a single JSON file.
