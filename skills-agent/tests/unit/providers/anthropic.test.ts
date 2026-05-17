/**
 * Unit tests for Anthropic provider implementation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnthropicProvider } from '../../../src/providers/implementations/anthropic.js';
import { Provider, LLMRequest, ProviderTier } from '../../../src/types/provider.js';

// Mock @anthropic-ai/sdk
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: vi.fn()
      };
    }
  };
});

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;
  let mockProvider: Provider;
  let mockRequest: LLMRequest;

  beforeEach(() => {
    mockProvider = {
      name: 'claude-sonnet',
      endpoint: 'https://api.anthropic.com/v1',
      api_key: 'test-api-key',
      model: 'claude-3-5-sonnet-20240620',
      tier: 'premium' as ProviderTier,
      enabled: true,
      max_tokens: 4096,
      timeout: 30000
    };
    provider = new AnthropicProvider(mockProvider);
    mockRequest = {
      messages: [
        { role: 'user', content: 'Hello, Claude!' }
      ],
      provider: mockProvider,
      temperature: 0.7
    };
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should successfully make API request', async () => {
      const mockResponse = {
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Hello! How can I help you?' }],
        model: 'claude-3-5-sonnet-20240620',
        stop_reason: 'end_turn',
        usage: {
          input_tokens: 10,
          output_tokens: 20
        }
      };

      // Mock the client.messages.create method
      (provider as any).client.messages.create = vi.fn().mockResolvedValue(mockResponse);

      const result = await provider.execute(mockRequest);

      expect(result.content).toBe('Hello! How can I help you?');
      expect(result.usage.prompt_tokens).toBe(10);
      expect(result.usage.completion_tokens).toBe(20);
      expect(result.usage.total_tokens).toBe(30);
      expect(result.model).toBe('claude-3-5-sonnet-20240620');
      expect(result.provider).toBe('claude-sonnet');
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Invalid API key');
      (mockError as any).status = 401;

      (provider as any).client.messages.create = vi.fn().mockRejectedValue(mockError);

      await expect(provider.execute(mockRequest)).rejects.toThrow('Invalid API key');
    });

    it('should respect max_tokens from request', async () => {
      const requestWithMaxTokens = { ...mockRequest, max_tokens: 2000 };
      
      (provider as any).client.messages.create = vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Response' }],
        usage: { input_tokens: 5, output_tokens: 10 }
      });

      await provider.execute(requestWithMaxTokens);

      expect((provider as any).client.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 2000
        })
      );
    });
  });
});
