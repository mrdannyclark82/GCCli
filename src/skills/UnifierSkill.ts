import { CoreSystemSkill } from './CoreSystemSkill.js';
import { BrowserSkill } from './BrowserSkill.js';
import { MultiModelRouter } from '../router/MultiModelRouter.js';
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
  private tempState: TeleportState | null = null;

  constructor(browser: BrowserSkill, router: MultiModelRouter) {
    super();
    this.browser = browser;
    this.router = router;
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
            if (state.memory && state.memory.shortTerm.length > 0) {
              const instructions = state.memory.shortTerm[0].content;
              console.log(`[Unifier] Extracted Instructions: ${instructions.substring(0, 150)}...`);
            }
          } catch (err: any) {
            console.error(`[Unifier] Unification failed: ${err.message}`);
          }
        }
      }
    ];
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
