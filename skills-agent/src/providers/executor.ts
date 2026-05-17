/**
 * Provider executor - executes LLM requests with selected provider
 */

import { Provider, LLMRequest, LLMResponse, ExecutionOptions, ExecutionResult } from '../types/provider.js';
import { OpenAICompatibleProvider } from './implementations/openai.js';
import { AnthropicProvider } from './implementations/anthropic.js';
import { providerResolver } from './resolver.js';
import { classifyError, ProviderError } from './errors.js';
import { logger } from '../utils/logger.js';

interface AttemptMetadata {
  provider: string;
  error?: string;
  latency: number;
  timestamp: number;
}

export class ProviderExecutor {
  async execute(
    request: LLMRequest,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    const { fallback = true, maxRetries = 2 } = options;
    const providersTried: string[] = [];
    const attempts: AttemptMetadata[] = [];
    let currentProvider = request.provider;
    let attemptsLeft = maxRetries;
    const startTime = Date.now();

    while (attemptsLeft >= 0) {
      const attemptStart = Date.now();
      
      try {
        const providerImpl = this.getProviderImplementation(currentProvider);
        const response = await this.executeWithTimeout(providerImpl, request, currentProvider);
        
        const latency = Date.now() - attemptStart;
        attempts.push({
          provider: currentProvider.name,
          latency,
          timestamp: attemptStart
        });
        providersTried.push(currentProvider.name);

        logger.info(`Provider ${currentProvider.name} succeeded (${latency}ms)`);

        return {
          success: true,
          response,
          attempts: attempts.length,
          providers_tried: providersTried,
          metadata: {
            attempts,
            total_latency: Date.now() - startTime
          }
        };

      } catch (error: any) {
        const latency = Date.now() - attemptStart;
        const classifiedError = classifyError(error, currentProvider.name);
        
        attempts.push({
          provider: currentProvider.name,
          error: classifiedError.message,
          latency,
          timestamp: attemptStart
        });
        providersTried.push(currentProvider.name);

        logger.warn(
          `Provider ${currentProvider.name} failed (${classifiedError.type}): ${classifiedError.message}`
        );

        // FATAL error - no fallback
        if (!classifiedError.retryable) {
          logger.error(`Fatal error, cannot retry: ${classifiedError.type}`);
          return {
            success: false,
            error: classifiedError,
            attempts: attempts.length,
            providers_tried: providersTried,
            metadata: {
              attempts,
              fatal: true,
              total_latency: Date.now() - startTime
            }
          };
        }

        // Try fallback if enabled and retries available
        if (fallback && attemptsLeft > 0) {
          const nextProvider = providerResolver.getNextProvider(currentProvider);
          
          if (!nextProvider) {
            logger.error('No fallback provider available');
            return {
              success: false,
              error: new Error('All providers exhausted'),
              attempts: attempts.length,
              providers_tried: providersTried,
              metadata: {
                attempts,
                total_latency: Date.now() - startTime
              }
            };
          }

          // Exponential backoff before retry
          const backoffMs = this.calculateBackoff(maxRetries - attemptsLeft);
          await this.sleep(backoffMs);

          logger.info(
            `Falling back to ${nextProvider.name} (attempt ${maxRetries - attemptsLeft + 1}/${maxRetries + 1}, backoff: ${backoffMs}ms)`
          );
          
          currentProvider = nextProvider;
          request.provider = nextProvider; // Update request with new provider
          attemptsLeft--;
          continue;
        }

        // No fallback or retries exhausted
        logger.error('Retries exhausted, giving up');
        return {
          success: false,
          error: classifiedError,
          attempts: attempts.length,
          providers_tried: providersTried,
          metadata: {
            attempts,
            total_latency: Date.now() - startTime
          }
        };
      }
    }

    // Should never reach here
    throw new Error('Unexpected fallback loop exit');
  }

  private calculateBackoff(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s... (max 10s)
    return Math.min(1000 * Math.pow(2, attempt), 10000);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async executeWithTimeout(
    provider: OpenAICompatibleProvider | AnthropicProvider,
    request: LLMRequest,
    currentProvider: Provider
  ): Promise<LLMResponse> {
    const timeout = currentProvider.timeout || 30000; // Default 30s
    
    return Promise.race([
      provider.execute(request),
      new Promise<never>((_, reject) => 
        setTimeout(() => {
          const error: any = new Error('Request timeout');
          error.code = 'ETIMEDOUT';
          reject(error);
        }, timeout)
      )
    ]);
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
