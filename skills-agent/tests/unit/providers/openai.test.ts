/**
 * Unit tests for OpenAI-compatible provider implementation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenAICompatibleProvider } from '../../../src/providers/implementations/openai.js';
import { Provider, LLMRequest, ProviderTier } from '../../../src/types/provider.js';

// Mock openai SDK
vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      chat = {
        completions: {
          create: vi.fn()
        }
      };
    }
  };
});

describe('OpenAICompatibleProvider', () => {
  let provider: OpenAICompatibleProvider;
  let mockProvider: Provider;
  let mockRequest: LLMRequest;

  beforeEach(() => {
    mockProvider = {
      name: 'deepseek',
      endpoint: 'https://api.deepseek.com/v1',
      api_key: 'test-api-key',
      model: 'deepseek-chat',
      tier: 'free' as ProviderTier,
      enabled: true,
      max_tokens: 4096,
      timeout: 30000
    };
    provider = new OpenAICompatibleProvider(mockProvider);
    mockRequest = {
      messages: [
        { role: 'user', content: 'What is 2+2?' }
      ],
      provider: mockProvider,
      temperature: 0.7
    };
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should successfully make API request', async () => {
      const mockResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1677652288,
        model: 'deepseek-chat',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: '2+2 equals 4.'
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 12,
          completion_tokens: 8,
          total_tokens: 20
        }
      };

      (provider as any).client.chat.completions.create = vi.fn().mockResolvedValue(mockResponse);

      const result = await provider.execute(mockRequest);

      expect(result.content).toBe('2+2 equals 4.');
      expect(result.usage.prompt_tokens).toBe(12);
      expect(result.usage.completion_tokens).toBe(8);
      expect(result.usage.total_tokens).toBe(20);
      expect(result.model).toBe('deepseek-chat');
      expect(result.provider).toBe('deepseek');
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Invalid API key provided');
      (mockError as any).status = 401;

      (provider as any).client.chat.completions.create = vi.fn().mockRejectedValue(mockError);

      await expect(provider.execute(mockRequest)).rejects.toThrow('Invalid API key provided');
    });

    it('should respect max_tokens and temperature', async () => {
      const requestWithParams = { 
        ...mockRequest, 
        max_tokens: 1000,
        temperature: 0.5
      };
      
      (provider as any).client.chat.completions.create = vi.fn().mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
        usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 }
      });

      await provider.execute(requestWithParams);

      expect((provider as any).client.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 1000,
          temperature: 0.5
        })
      );
    });
  });
});
