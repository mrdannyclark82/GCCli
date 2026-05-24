import { CoreSystemSkill } from './CoreSystemSkill.js';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

/**
 * Teleportation State Interface (B.A.M. Phase 1)
 */
export interface TeleportState {
  metadata: {
    version: string;
    timestamp: string;
    agentId: string;
    checksum?: string;
  };
  memory: {
    shortTerm: any[];
    longTerm: Record<string, any>;
  };
  goals: any[];
  context: {
    currentTask: string | null;
    activeSkills: string[];
    environment: string;
  };
}

/**
 * TeleportationSkill (B.A.M. Phase 1)
 * Allows the agent to export and import its internal state to/from a JSON file.
 */
export class TeleportationSkill extends CoreSystemSkill {
  name = "Teleportation";
  description = "Allows the agent to export/import its current state to facilitate cross-session continuity.";

  private readonly SCHEMA_VERSION = "1.0.0";

  async initialize(): Promise<void> {
    console.log("[Teleportation] Skill initialized.");
  }

  /**
   * Main entry point for the skill.
   * @param context Expected to contain 'action' (export/import) and 'path'.
   */
  async execute(context: any): Promise<any> {
    const { action, filePath, stateData } = context;

    if (action === 'export') {
      return await this.export_state(filePath || 'milla_state.json', stateData);
    } else if (action === 'import') {
      return await this.import_state(filePath || 'milla_state.json');
    } else {
      throw new Error(`[Teleportation] Unknown action: ${action}`);
    }
  }

  /**
   * Exports the current agent state to a JSON file.
   */
  async export_state(filePath: string, stateData: Partial<TeleportState>): Promise<{ success: boolean; path: string }> {
    console.log(`[Teleportation] Exporting state to ${filePath}...`);

    const fullState: TeleportState = {
      metadata: {
        version: this.SCHEMA_VERSION,
        timestamp: new Date().toISOString(),
        agentId: stateData.metadata?.agentId || "gcc-agent-alpha"
      },
      memory: stateData.memory || { shortTerm: [], longTerm: {} },
      goals: stateData.goals || [],
      context: stateData.context || {
        currentTask: null,
        activeSkills: [this.name],
        environment: "cli"
      }
    };

    // Calculate integrity checksum
    const dataToHash = JSON.stringify({
      memory: fullState.memory,
      goals: fullState.goals,
      context: fullState.context
    });
    fullState.metadata.checksum = crypto.createHash('sha256').update(dataToHash).digest('hex');

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
  async import_state(filePath: string): Promise<TeleportState> {
    console.log(`[Teleportation] Importing state from ${filePath}...`);

    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const state = JSON.parse(data) as TeleportState;

      // Basic structure validation
      const requiredKeys: (keyof TeleportState)[] = ['metadata', 'memory', 'goals', 'context'];
      for (const key of requiredKeys) {
        if (!state[key]) {
          throw new Error(`[Teleportation] Invalid state structure: missing '${key}'`);
        }
      }

      if (state.metadata.version !== this.SCHEMA_VERSION) {
        console.warn(`[Teleportation] Schema version mismatch! Found ${state.metadata.version}, expected ${this.SCHEMA_VERSION}.`);
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
