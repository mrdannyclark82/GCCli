import { ChatMessage, ChatOptions, ChatResponse, ChatChunk } from './types.js';

export abstract class ModelProvider {
  abstract chat(
    messages: ChatMessage[],
    options: ChatOptions
  ): Promise<ChatResponse | AsyncIterable<ChatChunk>>;
}
