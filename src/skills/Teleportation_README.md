# Teleportation Skill - Documentation (Phase 3 Security Upgrade)

## Overview
The Teleportation skill provides the foundational mechanism for GCCLi's cross-session and cross-platform continuity. It allows an agent instance to dump its entire "brain" (memory, goals, and context) into a JSON file, which can then be read by another instance to resume work seamlessly.

## Phase 3: Security and Authenticated Handoff
In Phase 3, the Teleportation skill introduces robust encryption and metadata for authenticated handoffs.

### AES-256 Encryption
State files can now be encrypted using AES-256-CBC.
- **Optional Encryption:** Encryption is triggered by providing an `encryptionKey` during export.
- **Robustness:** The skill automatically detects if an imported state is encrypted and requires the correct key for decryption.
- **Integrity First:** The SHA-256 checksum is calculated on the *plaintext* data *before* encryption, ensuring that the integrity of the original data is preserved and verifiable after decryption.

### Authenticated Handoff
New metadata fields `origin` and `target` have been added to prepare for networked handoffs between different agent instances or platforms.
- `origin`: Identifier of the agent that exported the state.
- `target`: Identifier of the intended recipient agent.

## How to Use

### Exporting State (Encrypted)
To save the current agent state with encryption:
```typescript
{
  action: 'export',
  filePath: 'milla_state.json',
  stateData: { ... },
  encryptionKey: 'your-secure-key',
  origin: 'agent-alpha', // optional
  target: 'agent-beta'   // optional
}
```

### Importing State (Encrypted)
To load an encrypted state:
```typescript
{
  action: 'import',
  filePath: 'milla_state.json',
  encryptionKey: 'your-secure-key'
}
```

## Schema
See [Teleportation_SCHEMA.md](./Teleportation_SCHEMA.md) for a detailed breakdown of the state structure and Phase 3 fields.

## Capabilities
- Full export of short-term and long-term memory.
- Goal and Task context preservation.
- Schema versioning (v1.1.0).
- **AES-256 Encryption.**
- **Origin/Target metadata for handoffs.**

## Known Limitations
- **Manual Trigger:** In this phase, teleportation must be triggered by an external command or higher-level agent logic.
- **Key Management:** Users are responsible for securely managing and sharing encryption keys.
