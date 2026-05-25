import { ChatMessage, ChatOptions, ChatResponse } from './types.js';

export abstract class ModelProvider {
  abstract chat(
    messages: ChatMessage[],
    options: ChatOptions
  ): Promise<ChatResponse | AsyncIterable<string>>;
}
