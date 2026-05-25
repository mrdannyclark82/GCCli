import { CoreSystemSkill } from './CoreSystemSkill.js';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { MemoryManager } from '../memory/MemoryManager.js';
import { Tool } from '../tools/ToolRegistry.js';
import { CommandMetadata, CommandHandler } from '../core/CommandRegistry.js';

/**
 * Teleportation State Interface (B.A.M. Phase 3)
 */
export interface TeleportState {
  metadata: {
    version: string;
    timestamp: string;
    agentId: string;
    checksum?: string;
    isEncrypted?: boolean;
    origin?: string;
    target?: string;
  };
  memory?: {
    shortTerm: any[];
    longTerm: Record<string, any>;
  };
  goals?: any[];
  context?: {
    currentTask: string | null;
    activeSkills: string[];
    environment: string;
  };
  encryptedData?: string;
}

/**
 * TeleportationSkill (B.A.M. Phase 3)
 * Allows the agent to export and import its internal state with AES-256 encryption.
 */
export class TeleportationSkill extends CoreSystemSkill {
  name = "Teleportation";
  description = "Allows the agent to export/import its current state with AES-256 encryption and authenticated handoff.";

  private readonly SCHEMA_VERSION = "1.1.0";
  private readonly ENCRYPTION_ALGORITHM = 'aes-256-cbc';
  private memory: MemoryManager;

  constructor(memory: MemoryManager) {
    super();
    this.memory = memory;
  }

  async initialize(): Promise<void> {
    console.log("[Teleportation] Skill initialized.");
  }

  getCommands(): { metadata: CommandMetadata; handler: CommandHandler }[] {
    return [
      {
        metadata: {
          name: 'export',
          description: 'Export agent state to a JSON file',
          usage: '/export <filePath> [encryptionKey]'
        },
        handler: async (args: string[]) => {
          const filePath = args[0] || 'milla_state.json';
          const encryptionKey = args[1];
          const state = this.memory.getState();
          
          try {
            const result = await this.execute({
              action: 'export',
              filePath,
              stateData: { memory: state },
              encryptionKey
            });
            console.log(`[Teleportation] State exported successfully to ${result.path}`);
          } catch (err: any) {
            console.error(`[Teleportation] Export failed: ${err.message}`);
          }
        }
      },
      {
        metadata: {
          name: 'import',
          description: 'Import agent state from a JSON file',
          usage: '/import <filePath> [encryptionKey]'
        },
        handler: async (args: string[]) => {
          const filePath = args[0];
          const encryptionKey = args[1];

          if (!filePath) {
            console.error("[Teleportation] Usage: /import <filePath> [encryptionKey]");
            return;
          }

          try {
            const state = await this.execute({
              action: 'import',
              filePath,
              encryptionKey
            });
            if (state.memory) {
              this.memory.loadState(state.memory);
              console.log("[Teleportation] State imported and loaded into memory.");
            }
          } catch (err: any) {
            console.error(`[Teleportation] Import failed: ${err.message}`);
          }
        }
      }
    ];
  }

  /**
   * Main entry point for the skill.
   * @param context Expected to contain 'action', 'filePath', 'stateData', 'encryptionKey', 'origin', 'target'.
   */
  async execute(context: any): Promise<any> {
    const { action, filePath, stateData, encryptionKey, origin, target } = context;

    if (action === 'export') {
      return await this.export_state(filePath || 'milla_state.json', stateData, encryptionKey, origin, target);
    } else if (action === 'import') {
      return await this.import_state(filePath || 'milla_state.json', encryptionKey);
    } else {
      throw new Error(`[Teleportation] Unknown action: ${action}`);
    }
  }

  /**
   * Exports the current agent state to a JSON file.
   */
  async export_state(
    filePath: string,
    stateData: Partial<TeleportState>,
    encryptionKey?: string,
    origin?: string,
    target?: string
  ): Promise<{ success: boolean; path: string }> {
    console.log(`[Teleportation] Exporting state to ${filePath}...`);

    const fullState: TeleportState = {
      metadata: {
        version: this.SCHEMA_VERSION,
        timestamp: new Date().toISOString(),
        agentId: stateData.metadata?.agentId || "gcc-agent-alpha",
        isEncrypted: !!encryptionKey,
        origin,
        target
      },
      memory: stateData.memory || { shortTerm: [], longTerm: {} },
      goals: stateData.goals || [],
      context: stateData.context || {
        currentTask: null,
        activeSkills: [this.name],
        environment: "cli"
      }
    };

    // Calculate integrity checksum (on plaintext data)
    const dataToHash = JSON.stringify({
      memory: fullState.memory,
      goals: fullState.goals,
      context: fullState.context
    });
    fullState.metadata.checksum = crypto.createHash('sha256').update(dataToHash).digest('hex');

    // Apply encryption if key is provided
    if (encryptionKey) {
      console.log("[Teleportation] Encrypting state data...");
      const iv = crypto.randomBytes(16);
      const key = crypto.scryptSync(encryptionKey, 'salt', 32);
      const cipher = crypto.createCipheriv(this.ENCRYPTION_ALGORITHM, key, iv);
      
      let encrypted = cipher.update(dataToHash, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      fullState.encryptedData = iv.toString('base64') + ":" + encrypted;
      
      // Remove plaintext fields
      delete fullState.memory;
      delete fullState.goals;
      delete fullState.context;
    }

    try {
      await fs.writeFile(filePath, JSON.stringify(fullState, null, 2), 'utf-8');
      return { success: true, path: path.resolve(filePath) };
    } catch (error: any) {
      console.error(`[Teleportation] Export failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Imports an agent state from a JSON file.
   */
  async import_state(filePath: string, encryptionKey?: string): Promise<TeleportState> {
    console.log(`[Teleportation] Importing state from ${filePath}...`);

    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const state = JSON.parse(data) as TeleportState;

      // Basic structure validation
      if (!state.metadata) {
        throw new Error("[Teleportation] Invalid state structure: missing 'metadata'");
      }

      // Check if encrypted
      if (state.metadata.isEncrypted) {
        if (!encryptionKey) {
          throw new Error("[Teleportation] State is encrypted. Please provide an 'encryptionKey'.");
        }
        if (!state.encryptedData) {
          throw new Error("[Teleportation] Invalid state structure: 'isEncrypted' is true but 'encryptedData' is missing.");
        }

        console.log("[Teleportation] Decrypting state data...");
        const [ivBase64, encrypted] = state.encryptedData.split(':');
        const iv = Buffer.from(ivBase64, 'base64');
        const key = crypto.scryptSync(encryptionKey, 'salt', 32);
        const decipher = crypto.createDecipheriv(this.ENCRYPTION_ALGORITHM, key, iv);
        
        let decrypted = decipher.update(encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        
        const decryptedData = JSON.parse(decrypted);
        state.memory = decryptedData.memory;
        state.goals = decryptedData.goals;
        state.context = decryptedData.context;
      }

      const requiredKeys: (keyof TeleportState)[] = ['memory', 'goals', 'context'];
      for (const key of requiredKeys) {
        if (!state[key]) {
          throw new Error(`[Teleportation] Invalid state structure: missing '${key}' after decryption/loading`);
        }
      }

      // Integrity checksum verification
      if (!state.metadata.checksum) {
        throw new Error("[Teleportation] Integrity check failed: Checksum missing from metadata.");
      }

      const dataToHash = JSON.stringify({
        memory: state.memory,
        goals: state.goals,
        context: state.context
      });
      const calculatedChecksum = crypto.createHash('sha256').update(dataToHash).digest('hex');

      if (calculatedChecksum !== state.metadata.checksum) {
        throw new Error("[Teleportation] Integrity check failed: State data has been tampered with or is corrupted.");
      }

      console.log("[Teleportation] Integrity verified. State imported successfully.");
      return state;
    } catch (error: any) {
      console.error(`[Teleportation] Import failed: ${error.message}`);
      throw error;
    }
  }
}
