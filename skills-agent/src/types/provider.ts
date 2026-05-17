/**
 * Provider type definitions
 */

export type ProviderTier = 'free' | 'mid' | 'premium';

export interface Provider {
  name: string;
  enabled: boolean;
  tier: ProviderTier;
  api_key?: string;
  endpoint: string;
  model: string;
  max_tokens: number;
  cost_per_1k_input?: number;
  cost_per_1k_output?: number;
  temperature?: number;
  timeout?: number;
}

export interface ProviderConfig {
  [key: string]: Provider;
}

export interface LLMRequest {
  provider: Provider;
  messages: Message[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface LLMResponse {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  provider: string;
  cost?: number;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ExecutionOptions {
  fallback?: boolean;
  maxRetries?: number;
  timeout?: number;
}

export interface ExecutionResult {
  success: boolean;
  response?: LLMResponse;
  error?: Error;
  attempts: number;
  providers_tried: string[];
  metadata?: {
    attempts?: Array<{
      provider: string;
      error?: string;
      latency: number;
      timestamp: number;
    }>;
    total_latency?: number;
    fatal?: boolean;
  };
}
