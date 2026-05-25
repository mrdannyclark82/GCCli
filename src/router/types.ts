export type ChatRole = 'user' | 'assistant' | 'system' | 'tool';

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolSchema {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters: any;
  };
}

export interface ChatMessage {
  role: ChatRole;
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ChatOptions {
  model?: string;
  streaming?: boolean;
  temperature?: number;
  maxTokens?: number;
  tools?: ToolSchema[];
}

export interface ChatResponse {
  content: string | null;
  model: string;
  tool_calls?: ToolCall[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export type ChatChunk = 
  | { type: 'text', content: string }
  | { type: 'tool_call', index: number, id?: string, name?: string, arguments?: string };
