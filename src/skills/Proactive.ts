import { CoreSystemSkill } from './CoreSystemSkill.js';
import { MultiModelRouter } from '../router/MultiModelRouter.js';
import { MemoryManager } from '../memory/MemoryManager.js';
import { ChatMessage, ChatResponse } from '../router/types.js';

export class Proactive extends CoreSystemSkill {
  name = "Proactive";
  description = "Core System Skill that controls proactive behavior and messaging";
  private intervalId: NodeJS.Timeout | null = null;

  async initialize() {
    console.log("[Proactive] Core System Skill initialized");
  }

  /**
   * Starts the proactive evaluation loop.
   * @param router The model router to use for evaluation.
   * @param memory The memory manager to access recent context.
   * @param onMessage Callback to trigger when a proactive message is generated.
   */
  startLoop(router: MultiModelRouter, memory: MemoryManager, onMessage: (msg: string) => void) {
    const intervalMs = parseInt(process.env.PROACTIVE_INTERVAL_MS || '300000', 10); // Default 5 mins
    
    // Clear existing loop if any
    this.stopLoop();

    this.intervalId = setInterval(async () => {
      try {
        const history = memory.getShortTerm() as ChatMessage[];
        // Take last 10 messages for context
        const context = history.slice(-10).map(m => `${m.role}: ${m.content}`).join('\n');
        const currentTime = new Date().toLocaleString();

        const evaluationPrompt: ChatMessage[] = [
          {
            role: 'system',
            content: `You are a proactive assistant. Current time is ${currentTime}. 
Recent chat history:
${context || 'No history yet.'}

Based on this, is there any proactive task you should perform or important information to share? 
If you have something helpful or important to say (e.g. reminding about a task, suggesting an improvement, or sharing relevant info), provide that message. 
If no action is needed, respond ONLY with 'SKIP'.
Be extremely concise. If you decide to act, just provide the message for the user.`
          }
        ];

        // Use non-streaming chat for evaluation
        const result = await router.chat(evaluationPrompt, { streaming: false });
        
        // Type guard for ChatResponse
        if (result && !((Symbol.asyncIterator in result))) {
          const chatResponse = result as ChatResponse;
          const content = chatResponse.content?.trim();

          if (content && content.toUpperCase() !== 'SKIP') {
            onMessage(content);
          }
        }
      } catch (err) {
        // Silently handle loop errors to prevent CLI disruption
      }
    }, intervalMs);
  }

  /**
   * Stops the proactive loop.
   */
  stopLoop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async execute(context: any) {
    return {
      shouldAct: false,
      reason: "Proactive logic handled by background loop"
    };
  }
}
