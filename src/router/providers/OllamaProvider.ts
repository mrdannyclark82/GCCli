import { ModelProvider } from '../ModelProvider.js';
import { ChatMessage, ChatOptions, ChatResponse, ChatChunk } from '../types.js';

export class OllamaProvider extends ModelProvider {
  private readonly apiUrl = 'http://localhost:11434/api/chat';

  async chat(
    messages: ChatMessage[],
    options: ChatOptions
  ): Promise<ChatResponse | AsyncIterable<ChatChunk>> {
    const payload = {
      model: options.model || 'llama3',
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      stream: options.streaming ?? false,
      options: {
        temperature: options.temperature,
        num_predict: options.maxTokens,
      },
    };

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    if (options.streaming) {
      return this.handleStreamingResponse(response);
    } else {
      const data = await response.json();
      return {
        content: data.message?.content || '',
        model: data.model,
        usage: data.done ? {
          promptTokens: data.prompt_eval_count,
          completionTokens: data.eval_count,
        } : undefined,
      };
    }
  }

  private async *handleStreamingResponse(response: Response): AsyncIterable<ChatChunk> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          try {
            const json = JSON.parse(trimmedLine);
            if (json.message?.content) {
              yield { type: 'text', content: json.message.content };
            }
          } catch (e) {
            console.error('Error parsing Ollama NDJSON chunk:', e, trimmedLine);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
