/**
 * Anthropic Claude provider implementation
 */

import Anthropic from '@anthropic-ai/sdk';
import { Provider, LLMRequest, LLMResponse, Message } from '../../types/provider.js';
import { logger } from '../../utils/logger.js';

export class AnthropicProvider {
  private client: Anthropic;
  private provider: Provider;

  constructor(provider: Provider) {
    this.provider = provider;
    this.client = new Anthropic({
      apiKey: provider.api_key,
      timeout: provider.timeout || 60000,
    });
  }

  async execute(request: LLMRequest): Promise<LLMResponse> {
    try {
      logger.debug(`Executing request with ${this.provider.name}`);

      // Separate system messages from user/assistant messages
      const systemMessages = request.messages
        .filter(m => m.role === 'system')
        .map(m => m.content)
        .join('\n\n');

      const messages = request.messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      const completion = await this.client.messages.create({
        model: request.provider.model,
        max_tokens: request.max_tokens || request.provider.max_tokens,
        temperature: request.temperature || request.provider.temperature || 0.7,
        system: systemMessages || undefined,
        messages,
      });

      const content = completion.content[0]?.type === 'text' 
        ? completion.content[0].text 
        : '';

      const usage = completion.usage;
      const cost = this.calculateCost(
        usage.input_tokens,
        usage.output_tokens
      );

      logger.debug(`Request completed. Tokens: ${usage.input_tokens + usage.output_tokens}, Cost: $${cost.toFixed(4)}`);

      return {
        content,
        usage: {
          prompt_tokens: usage.input_tokens,
          completion_tokens: usage.output_tokens,
          total_tokens: usage.input_tokens + usage.output_tokens,
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

  private calculateCost(inputTokens: number, outputTokens: number): number {
    const inputCost = (inputTokens / 1000) * (this.provider.cost_per_1k_input || 0);
    const outputCost = (outputTokens / 1000) * (this.provider.cost_per_1k_output || 0);
    return inputCost + outputCost;
  }
}
