import { XaiProvider } from './providers/XaiProvider.js';
import { ModelProvider } from './ModelProvider.js';
import { ChatMessage, ChatOptions, ChatResponse, ChatChunk } from './types.js';

export class MultiModelRouter {
  private providers: Map<string, ModelProvider> = new Map();
  private activeProviderKey: string = 'grok';

  constructor() {
    this.providers.set('grok', new XaiProvider());
  }

  async chat(
    messages: ChatMessage[],
    options: ChatOptions = {}
  ): Promise<ChatResponse | AsyncIterable<ChatChunk>> {
    const provider = this.providers.get(this.activeProviderKey);
    
    if (!provider) {
      throw new Error(`No provider found for key: ${this.activeProviderKey}`);
    }

    return provider.chat(messages, options);
  }

  setActiveProvider(key: string) {
    if (!this.providers.has(key)) {
      throw new Error(`Provider ${key} not registered.`);
    }
    this.activeProviderKey = key;
  }
}
