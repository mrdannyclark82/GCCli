import { ModelProvider } from '../ModelProvider.js';
import { ChatMessage, ChatOptions, ChatResponse, ChatChunk } from '../types.js';

export class XaiProvider extends ModelProvider {
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.x.ai/v1/chat/completions';

  constructor() {
    super();
    this.apiKey = process.env.XAI_API_KEY || '';
    if (!this.apiKey) {
      // In a real scenario, we might want to throw an error or handle this more gracefully
      console.warn('XAI_API_KEY is not set in environment variables');
    }
  }

  async chat(
    messages: ChatMessage[],
    options: ChatOptions
  ): Promise<ChatResponse | AsyncIterable<ChatChunk>> {
    const payload: any = {
      messages,
      model: options.model || 'grok-beta',
      stream: options.streaming || false,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
    };

    if (options.tools && options.tools.length > 0) {
      payload.tools = options.tools;
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`xAI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    if (options.streaming) {
      return this.handleStreamingResponse(response);
    } else {
      const data = await response.json();
      return {
        content: data.choices[0].message.content,
        model: data.model,
        tool_calls: data.choices[0].message.tool_calls,
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
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
          if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;

          if (trimmedLine.startsWith('data: ')) {
            try {
              const json = JSON.parse(trimmedLine.slice(6));
              const delta = json.choices[0]?.delta;
              
              if (delta?.content) {
                yield { type: 'text', content: delta.content };
              }

              if (delta?.tool_calls) {
                for (const toolCall of delta.tool_calls) {
                  yield {
                    type: 'tool_call',
                    index: toolCall.index,
                    id: toolCall.id,
                    name: toolCall.function?.name,
                    arguments: toolCall.function?.arguments,
                  };
                }
              }
            } catch (e) {
              console.error('Error parsing SSE chunk:', e, trimmedLine);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
