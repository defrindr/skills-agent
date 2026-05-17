/**
 * Unit tests for Provider error classification and fallback
 */

import { describe, it, expect } from 'vitest';
import { classifyError, ErrorType, ProviderError } from '../../../src/providers/errors.js';

describe('Error Classification', () => {
  describe('classifyError', () => {
    it('should classify rate limit errors as retryable', () => {
      const error = { status: 429, message: 'Rate limit exceeded' };
      const classified = classifyError(error, 'test-provider');

      expect(classified).toBeInstanceOf(ProviderError);
      expect(classified.type).toBe(ErrorType.RATE_LIMIT);
      expect(classified.retryable).toBe(true);
      expect(classified.statusCode).toBe(429);
    });

    it('should classify auth errors as non-retryable (fatal)', () => {
      const error = { status: 401, message: 'Invalid API key' };
      const classified = classifyError(error, 'test-provider');

      expect(classified.type).toBe(ErrorType.AUTH_ERROR);
      expect(classified.retryable).toBe(false);
      expect(classified.message).toContain('Authentication failed');
    });

    it('should classify timeout errors as retryable', () => {
      const error = { code: 'ETIMEDOUT', message: 'Connection timeout' };
      const classified = classifyError(error);

      expect(classified.type).toBe(ErrorType.TIMEOUT);
      expect(classified.retryable).toBe(true);
    });

    it('should classify 5xx errors as retryable', () => {
      const error = { status: 503, message: 'Service unavailable' };
      const classified = classifyError(error);

      expect(classified.type).toBe(ErrorType.SERVER_ERROR);
      expect(classified.retryable).toBe(true);
      expect(classified.statusCode).toBe(503);
    });

    it('should classify quota exceeded as retryable', () => {
      const error = { code: 'insufficient_quota', message: 'Quota exceeded' };
      const classified = classifyError(error);

      expect(classified.type).toBe(ErrorType.QUOTA_EXCEEDED);
      expect(classified.retryable).toBe(true);
    });

    it('should classify context length errors as non-retryable', () => {
      const error = { message: 'Context length exceeded' };
      const classified = classifyError(error);

      expect(classified.type).toBe(ErrorType.CONTEXT_LENGTH);
      expect(classified.retryable).toBe(false);
    });

    it('should classify 400 errors as non-retryable', () => {
      const error = { status: 400, message: 'Bad request' };
      const classified = classifyError(error);

      expect(classified.type).toBe(ErrorType.INVALID_REQUEST);
      expect(classified.retryable).toBe(false);
    });

    it('should default unknown errors to non-retryable', () => {
      const error = { message: 'Something weird happened' };
      const classified = classifyError(error);

      expect(classified.type).toBe(ErrorType.UNKNOWN);
      expect(classified.retryable).toBe(false);
    });

    it('should handle errors with nested response objects', () => {
      const error = {
        response: { status: 429 },
        message: 'Rate limited'
      };
      const classified = classifyError(error);

      expect(classified.type).toBe(ErrorType.RATE_LIMIT);
      expect(classified.retryable).toBe(true);
    });

    it('should handle errors with error.error nested structure', () => {
      const error = {
        error: {
          code: 'invalid_api_key',
          message: 'Invalid authentication'
        }
      };
      const classified = classifyError(error);

      expect(classified.type).toBe(ErrorType.AUTH_ERROR);
      expect(classified.retryable).toBe(false);
    });
  });

  describe('ProviderError', () => {
    it('should create error with all properties', () => {
      const error = new ProviderError(
        ErrorType.RATE_LIMIT,
        'Rate limit exceeded',
        429,
        true,
        'test-provider'
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ProviderError');
      expect(error.type).toBe(ErrorType.RATE_LIMIT);
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.statusCode).toBe(429);
      expect(error.retryable).toBe(true);
      expect(error.provider).toBe('test-provider');
    });
  });
});
