/**
 * OpenAI-compatible provider implementation (for DeepSeek, Groq, OpenRouter, etc.)
 */

import OpenAI from 'openai';
import { Provider, LLMRequest, LLMResponse, Message } from '../../types/provider.js';
import { logger } from '../../utils/logger.js';

export class OpenAICompatibleProvider {
  private client: OpenAI;
  private provider: Provider;

  constructor(provider: Provider) {
    this.provider = provider;
    this.client = new OpenAI({
      apiKey: provider.api_key,
      baseURL: provider.endpoint,
      timeout: provider.timeout || 60000,
    });
  }

  async execute(request: LLMRequest): Promise<LLMResponse> {
    try {
      logger.debug(`Executing request with ${this.provider.name}`);

      const completion = await this.client.chat.completions.create({
        model: request.provider.model,
        messages: request.messages as any,
        max_tokens: request.max_tokens || request.provider.max_tokens,
        temperature: request.temperature || request.provider.temperature || 0.7,
        stream: false,
      });

      const usage = completion.usage!;
      const content = completion.choices[0]?.message?.content || '';

      const cost = this.calculateCost(
        usage.prompt_tokens,
        usage.completion_tokens
      );

      logger.debug(`Request completed. Tokens: ${usage.total_tokens}, Cost: $${cost.toFixed(4)}`);

      return {
        content,
        usage: {
          prompt_tokens: usage.prompt_tokens,
          completion_tokens: usage.completion_tokens,
          total_tokens: usage.total_tokens,
        },
        model: completion.model,
        provider: this.provider.name,
        cost,
      };

    } catch (error: any) {
      logger.error(`Provider ${this.provider.name} failed:`, error.message);
      throw new Error(`${this.provider.name} execution failed: ${error.message}`);
    }
  }

  private calculateCost(promptTokens: number, completionTokens: number): number {
    const inputCost = (promptTokens / 1000) * (this.provider.cost_per_1k_input || 0);
    const outputCost = (completionTokens / 1000) * (this.provider.cost_per_1k_output || 0);
    return inputCost + outputCost;
  }
}
