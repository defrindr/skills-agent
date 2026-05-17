/**
 * Unit tests for ProviderExecutor
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProviderExecutor } from '../../../src/providers/executor.js';
import { Provider, LLMRequest, ProviderTier } from '../../../src/types/provider.js';
import { providerResolver } from '../../../src/providers/resolver.js';
import { ProviderError, ErrorType } from '../../../src/providers/errors.js';

describe('ProviderExecutor', () => {
  let executor: ProviderExecutor;

  beforeEach(() => {
    executor = new ProviderExecutor();
    vi.clearAllMocks();
  });

  const mockProvider: Provider = {
    name: 'test-provider',
    endpoint: 'https://api.test.com/v1',
    apiKey: 'test-key',
    model: 'test-model',
    tier: 'free' as ProviderTier,
    enabled: true,
    timeout: 30000
  };

  const mockRequest: LLMRequest = {
    messages: [
      { role: 'user', content: 'Test prompt' }
    ],
    provider: mockProvider,
    temperature: 0.7
  };

  describe('execute', () => {
    it('should execute successfully on first attempt', async () => {
      // Mock the getProviderImplementation to return a mock provider
      const mockExecute = vi.fn().mockResolvedValue({
        content: 'Test response',
        tokens_used: 100,
        model: 'test-model'
      });

      vi.spyOn(executor as any, 'getProviderImplementation').mockReturnValue({
        execute: mockExecute
      });

      const result = await executor.execute(mockRequest);

      expect(result.success).toBe(true);
      expect(result.response?.content).toBe('Test response');
      expect(result.attempts).toBe(1);
      expect(result.providers_tried).toEqual(['test-provider']);
      expect(result.metadata?.attempts).toHaveLength(1);
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      let callCount = 0;
      const mockExecute = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          // First call fails with rate limit
          const error: any = new Error('Rate limit exceeded');
          error.status = 429;
          throw error;
        }
        // Second call succeeds
        return {
          content: 'Success after retry',
          tokens_used: 100,
          model: 'test-model'
        };
      });

      vi.spyOn(executor as any, 'getProviderImplementation').mockReturnValue({
        execute: mockExecute
      });

      // Mock getNextProvider to return a different provider
      const fallbackProvider: Provider = {
        ...mockProvider,
        name: 'fallback-provider'
      };
      vi.spyOn(providerResolver, 'getNextProvider').mockReturnValue(fallbackProvider);

      const result = await executor.execute(mockRequest, { fallback: true, maxRetries: 2 });

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
      expect(result.providers_tried).toEqual(['test-provider', 'fallback-provider']);
      expect(mockExecute).toHaveBeenCalledTimes(2);
    });

    it('should not retry on fatal errors', async () => {
      const mockExecute = vi.fn().mockImplementation(async () => {
        const error: any = new Error('Invalid API key');
        error.status = 401;
        throw error;
      });

      vi.spyOn(executor as any, 'getProviderImplementation').mockReturnValue({
        execute: mockExecute
      });

      const result = await executor.execute(mockRequest, { fallback: true, maxRetries: 2 });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(result.metadata?.fatal).toBe(true);
      expect(mockExecute).toHaveBeenCalledTimes(1); // No retry on auth error
    });

    it('should apply exponential backoff between retries', async () => {
      const sleepSpy = vi.spyOn(executor as any, 'sleep');
      
      let callCount = 0;
      const mockExecute = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount <= 2) {
          // First two calls fail
          const error: any = new Error('Timeout');
          error.code = 'ETIMEDOUT';
          throw error;
        }
        // Third call succeeds
        return {
          content: 'Success after retries',
          tokens_used: 100,
          model: 'test-model'
        };
      });

      vi.spyOn(executor as any, 'getProviderImplementation').mockReturnValue({
        execute: mockExecute
      });

      const fallbackProvider: Provider = {
        ...mockProvider,
        name: 'fallback-provider'
      };
      vi.spyOn(providerResolver, 'getNextProvider').mockReturnValue(fallbackProvider);

      await executor.execute(mockRequest, { fallback: true, maxRetries: 3 });

      // Should have called sleep for backoff
      expect(sleepSpy).toHaveBeenCalled();
      
      // Check backoff times: 1s (1000ms), 2s (2000ms)
      const backoffCalls = sleepSpy.mock.calls.map(call => call[0]);
      expect(backoffCalls[0]).toBe(1000); // 2^0 * 1000
      expect(backoffCalls[1]).toBe(2000); // 2^1 * 1000
    });

    it('should handle timeout and classify as retryable', async () => {
      const mockExecute = vi.fn().mockImplementation(async () => {
        // Simulate slow response
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
          content: 'This should timeout',
          tokens_used: 100,
          model: 'test-model'
        };
      });

      vi.spyOn(executor as any, 'getProviderImplementation').mockReturnValue({
        execute: mockExecute
      });

      // Set very short timeout
      const shortTimeoutProvider = { ...mockProvider, timeout: 10 };
      const shortTimeoutRequest = { ...mockRequest, provider: shortTimeoutProvider };

      const fallbackProvider: Provider = {
        ...mockProvider,
        name: 'fallback-provider',
        timeout: 30000
      };
      vi.spyOn(providerResolver, 'getNextProvider').mockReturnValue(fallbackProvider);

      const result = await executor.execute(shortTimeoutRequest, { fallback: true, maxRetries: 1 });

      // First attempt should timeout, then fallback
      expect(result.metadata?.attempts).toBeDefined();
      if (result.metadata?.attempts) {
        expect(result.metadata.attempts.length).toBeGreaterThan(0);
      }
    });

    it('should stop retrying after maxRetries exhausted', async () => {
      const mockExecute = vi.fn().mockImplementation(async () => {
        const error: any = new Error('Server error');
        error.status = 500;
        throw error;
      });

      vi.spyOn(executor as any, 'getProviderImplementation').mockReturnValue({
        execute: mockExecute
      });

      const fallbackProvider: Provider = {
        ...mockProvider,
        name: 'fallback-provider'
      };
      vi.spyOn(providerResolver, 'getNextProvider').mockReturnValue(fallbackProvider);

      const result = await executor.execute(mockRequest, { fallback: true, maxRetries: 2 });

      expect(result.success).toBe(false);
      expect(result.attempts).toBeLessThanOrEqual(3); // Initial + 2 retries
      expect(mockExecute).toHaveBeenCalledTimes(result.attempts);
    });

    it('should return error if no fallback provider available', async () => {
      const mockExecute = vi.fn().mockImplementation(async () => {
        const error: any = new Error('Rate limit');
        error.status = 429;
        throw error;
      });

      vi.spyOn(executor as any, 'getProviderImplementation').mockReturnValue({
        execute: mockExecute
      });

      // Mock no fallback available
      vi.spyOn(providerResolver, 'getNextProvider').mockReturnValue(null);

      const result = await executor.execute(mockRequest, { fallback: true, maxRetries: 2 });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(result.error).toBeDefined();
    });

    it('should track all attempts in metadata', async () => {
      let callCount = 0;
      const mockExecute = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          const error: any = new Error('Rate limit');
          error.status = 429;
          throw error;
        }
        if (callCount === 2) {
          const error: any = new Error('Timeout');
          error.code = 'ETIMEDOUT';
          throw error;
        }
        return {
          content: 'Success on third try',
          tokens_used: 100,
          model: 'test-model'
        };
      });

      vi.spyOn(executor as any, 'getProviderImplementation').mockReturnValue({
        execute: mockExecute
      });

      const fallbackProvider: Provider = {
        ...mockProvider,
        name: 'fallback-provider'
      };
      vi.spyOn(providerResolver, 'getNextProvider').mockReturnValue(fallbackProvider);

      const result = await executor.execute(mockRequest, { fallback: true, maxRetries: 3 });

      expect(result.success).toBe(true);
      expect(result.metadata?.attempts).toHaveLength(3);
      
      if (result.metadata?.attempts) {
        // First attempt failed with rate limit
        expect(result.metadata.attempts[0].error).toContain('Rate limit');
        // Second attempt failed with timeout
        expect(result.metadata.attempts[1].error).toContain('Timeout');
        // Third attempt succeeded (no error field)
        expect(result.metadata.attempts[2].error).toBeUndefined();
      }

      expect(result.metadata?.total_latency).toBeGreaterThan(0);
    });
  });

  describe('calculateBackoff', () => {
    it('should return exponential backoff times', () => {
      const backoff0 = (executor as any).calculateBackoff(0);
      const backoff1 = (executor as any).calculateBackoff(1);
      const backoff2 = (executor as any).calculateBackoff(2);
      const backoff3 = (executor as any).calculateBackoff(3);

      expect(backoff0).toBe(1000);  // 2^0 * 1000 = 1s
      expect(backoff1).toBe(2000);  // 2^1 * 1000 = 2s
      expect(backoff2).toBe(4000);  // 2^2 * 1000 = 4s
      expect(backoff3).toBe(8000);  // 2^3 * 1000 = 8s
    });

    it('should cap backoff at 10 seconds', () => {
      const backoff4 = (executor as any).calculateBackoff(4); // 2^4 * 1000 = 16s
      const backoff5 = (executor as any).calculateBackoff(5); // 2^5 * 1000 = 32s

      expect(backoff4).toBe(10000); // Capped at 10s
      expect(backoff5).toBe(10000); // Capped at 10s
    });
  });
});
