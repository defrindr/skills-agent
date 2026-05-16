/**
 * Provider executor - executes LLM requests with selected provider
 */

import { Provider, LLMRequest, LLMResponse, ExecutionOptions, ExecutionResult } from '../types/provider.js';
import { OpenAICompatibleProvider } from './implementations/openai.js';
import { AnthropicProvider } from './implementations/anthropic.js';
import { logger } from '../utils/logger.js';

export class ProviderExecutor {
  async execute(
    request: LLMRequest,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    const { fallback = true, maxRetries = 2 } = options;
    const providersTried: string[] = [];
    let lastError: Error | undefined;

    try {
      const provider = this.getProviderImplementation(request.provider);
      const response = await provider.execute(request);
      
      providersTried.push(request.provider.name);

      return {
        success: true,
        response,
        attempts: 1,
        providers_tried: providersTried,
      };

    } catch (error: any) {
      lastError = error;
      providersTried.push(request.provider.name);
      logger.warn(`Provider ${request.provider.name} failed: ${error.message}`);

      if (fallback && maxRetries > 0) {
        logger.info('Fallback not implemented in this basic version');
        // TODO: Implement fallback to next provider
      }

      return {
        success: false,
        error: lastError,
        attempts: providersTried.length,
        providers_tried: providersTried,
      };
    }
  }

  private getProviderImplementation(provider: Provider): OpenAICompatibleProvider | AnthropicProvider {
    // Determine provider type based on endpoint
    if (provider.endpoint.includes('anthropic')) {
      return new AnthropicProvider(provider);
    }
    
    // Default to OpenAI-compatible
    return new OpenAICompatibleProvider(provider);
  }
}

export const providerExecutor = new ProviderExecutor();
