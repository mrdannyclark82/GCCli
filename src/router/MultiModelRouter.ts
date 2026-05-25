import { XaiProvider } from './providers/XaiProvider.js';
import { OllamaProvider } from './providers/OllamaProvider.js';
import { ModelProvider } from './ModelProvider.js';
import { ChatMessage, ChatOptions, ChatResponse, ChatChunk } from './types.js';

export class MultiModelRouter {
  private providers: Map<string, ModelProvider> = new Map();
  private activeProviderKey: string = 'grok';

  constructor() {
    this.providers.set('grok', new XaiProvider());
    this.providers.set('ollama', new OllamaProvider());
  }

  async chat(
    messages: ChatMessage[],
    options: ChatOptions = {}
  ): Promise<ChatResponse | AsyncIterable<ChatChunk>> {
    let providerKey = this.activeProviderKey;
    let chatOptions = { ...options };

    if (options.model?.startsWith('ollama:')) {
      providerKey = 'ollama';
      chatOptions.model = options.model.substring(7); // Remove 'ollama:' prefix
    }

    const provider = this.providers.get(providerKey);
    
    if (!provider) {
      throw new Error(`No provider found for key: ${providerKey}`);
    }

    return provider.chat(messages, chatOptions);
  }

  setActiveProvider(key: string) {
    if (!this.providers.has(key)) {
      throw new Error(`Provider ${key} not registered.`);
    }
    this.activeProviderKey = key;
  }
}
