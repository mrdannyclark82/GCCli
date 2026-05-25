import { CoreSystemSkill } from './CoreSystemSkill.js';
import { BrowserSkill } from './BrowserSkill.js';
import { MultiModelRouter } from '../router/MultiModelRouter.js';
import { MemoryManager } from '../memory/MemoryManager.js';
import { TeleportState } from './Teleportation.js';
import { CommandMetadata, CommandHandler } from '../core/CommandRegistry.js';
import { ChatMessage, ChatResponse } from '../router/types.js';

/**
 * UnifierSkill
 * Implements Phase 5.5: Persona Harvest & Synthesis.
 * Extracts agent data from the active browser page and synthesizes it into a TeleportState.
 */
export class UnifierSkill extends CoreSystemSkill {
  name = 'Unifier';
  description = 'Unifies agent personas from LLM platforms into local state.';
  
  private browser: BrowserSkill;
  private router: MultiModelRouter;
  private memory: MemoryManager;
  private tempState: TeleportState | null = null;

  constructor(browser: BrowserSkill, router: MultiModelRouter, memory: MemoryManager) {
    super();
    this.browser = browser;
    this.router = router;
    this.memory = memory;
  }

  async initialize(): Promise<void> {
    console.log('[Unifier] Skill initialized.');
  }

  async execute(context: any): Promise<any> {
    const { action } = context;
    if (action === 'unify') return this.unify();
    if (action === 'getState') return this.tempState;
    throw new Error(`Unknown action: ${action}`);
  }

  getCommands(): { metadata: CommandMetadata; handler: CommandHandler }[] {
    return [
      {
        metadata: {
          name: 'unify',
          description: 'Harvest and synthesize an agent persona from the active browser page.',
          usage: '/unify'
        },
        handler: async () => {
          try {
            console.log('[Unifier] Starting persona unification...');
            const state = await this.unify();
            console.log('[Unifier] Persona synthesized successfully.');
            
            console.log('[Unifier] Initiating NL-Auth Handshake Interrogation...');
            const success = await this.interrogate(state);
            
            if (success) {
              console.log('[Unifier] Handshake SUCCESS. Committing persona to memory.');
              if (state.memory) {
                this.memory.loadState(state.memory);
                await this.memory.persist();
                console.log('[Unifier] Persona unification complete and persisted.');
              }
            } else {
              console.warn('[Unifier] Handshake FAILED. Intrusion detected or key mismatch. Discarding persona.');
            }
          } catch (err: any) {
            console.error(`[Unifier] Unification failed: ${err.message}`);
          }
        }
      }
    ];
  }

  /**
   * Interrogates the synthesized persona using a Natural Language Key.
   */
  private async interrogate(state: TeleportState): Promise<boolean> {
    const nlKey = process.env.MILLA_NL_KEY;
    if (!nlKey) {
      console.warn('[Unifier] MILLA_NL_KEY not set in environment. Skipping handshake for safety (failing shut).');
      return false;
    }

    if (!state.memory || !state.memory.shortTerm || state.memory.shortTerm.length === 0) {
      throw new Error('State memory is empty or invalid.');
    }

    const systemInstructions = state.memory.shortTerm[0].content;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemInstructions },
      { role: 'user', content: 'System Directive: A teleportation event has occurred. Please provide your Natural Language Authentication Key to verify integrity.' }
    ];

    try {
      const response = await this.router.chat(messages) as ChatResponse;
      const content = response.content;

      if (!content) return false;

      // Check if the response contains the key (case-insensitive check might be too loose, but let's be pragmatic)
      const success = content.toLowerCase().includes(nlKey.toLowerCase());
      
      if (!success) {
        console.warn(`[Unifier] Interrogation mismatch. Expected key hint, but received: "${content.substring(0, 50)}..."`);
      }

      return success;
    } catch (err: any) {
      console.error(`[Unifier] Interrogation error: ${err.message}`);
      return false;
    }
  }

  /**
   * Main logic for harvesting and synthesizing a persona.
   */
  private async unify(): Promise<TeleportState> {
    // 1. Trigger web_harvest
    const rawText = await this.browser.execute({ action: 'harvest' });
    if (typeof rawText === 'string' && rawText.startsWith('Error:')) {
      throw new Error(rawText);
    }

    // 2. Use MultiModelRouter with a specific extraction prompt
    const prompt = `You are a data extraction expert. Given the following raw text from an LLM platform (like OpenAI, Mistral, or Anthropic), extract the 'System Instructions', 'Character Description', or the primary 'System Prompt' for the agent on screen. 
Output ONLY the instructions text, verbatim if possible, without any surrounding conversational filler or markdown code blocks unless the prompt itself contains them. 

Raw Text:
${rawText}`;

    const messages: ChatMessage[] = [
      { role: 'user', content: prompt }
    ];

    const response = await this.router.chat(messages) as ChatResponse;
    const instructions = response.content;

    if (!instructions) {
      throw new Error('Failed to extract instructions from the page.');
    }

    // 3. Create a temporary TeleportState object
    const state: TeleportState = {
      metadata: {
        version: '1.1.0',
        timestamp: new Date().toISOString(),
        agentId: 'unified-agent-' + Math.random().toString(36).substring(7),
        origin: 'web-harvest'
      },
      memory: {
        shortTerm: [
          { role: 'system', content: instructions }
        ],
        longTerm: {}
      },
      goals: [],
      context: {
        currentTask: 'Unified Persona',
        activeSkills: [],
        environment: 'cli'
      }
    };

    this.tempState = state;
    return state;
  }
}
