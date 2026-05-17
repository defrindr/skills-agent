/**
 * Provider error classification and handling
 */

export enum ErrorType {
  RATE_LIMIT = 'rate_limit',         // 429 - fallback allowed
  TIMEOUT = 'timeout',                // Network timeout - fallback allowed
  SERVER_ERROR = 'server_error',      // 5xx - fallback allowed
  AUTH_ERROR = 'auth_error',          // 401/403 - FATAL, no fallback
  INVALID_REQUEST = 'invalid_request', // 400 - FATAL
  QUOTA_EXCEEDED = 'quota_exceeded',  // Monthly limit - fallback allowed
  CONTEXT_LENGTH = 'context_length',  // Token limit exceeded - FATAL
  UNKNOWN = 'unknown'
}

export class ProviderError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public statusCode?: number,
    public retryable: boolean = false,
    public provider?: string
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

/**
 * Classify error from provider response
 */
export function classifyError(error: any, providerName?: string): ProviderError {
  const status = error.status || error.statusCode || error.response?.status;
  const code = error.code || error.error?.code;
  const message = error.message || error.error?.message || 'Unknown error';

  // Rate limit errors
  if (status === 429 || code === 'rate_limit_exceeded' || code === 'too_many_requests') {
    return new ProviderError(
      ErrorType.RATE_LIMIT,
      'Rate limit exceeded',
      429,
      true,
      providerName
    );
  }

  // Authentication errors (FATAL - no retry)
  if (
    status === 401 ||
    status === 403 ||
    code === 'invalid_api_key' ||
    code === 'authentication_error' ||
    message.toLowerCase().includes('api_key') ||
    message.toLowerCase().includes('api key')
  ) {
    return new ProviderError(
      ErrorType.AUTH_ERROR,
      'Authentication failed - check API key',
      status,
      false,
      providerName
    );
  }

  // Timeout errors
  if (
    code === 'ETIMEDOUT' ||
    code === 'ECONNABORTED' ||
    code === 'ESOCKETTIMEDOUT' ||
    message.toLowerCase().includes('timeout')
  ) {
    return new ProviderError(
      ErrorType.TIMEOUT,
      'Request timeout',
      undefined,
      true,
      providerName
    );
  }

  // Server errors (5xx)
  if (status >= 500 && status < 600) {
    return new ProviderError(
      ErrorType.SERVER_ERROR,
      `Server error: ${status}`,
      status,
      true,
      providerName
    );
  }

  // Quota/billing errors
  if (
    code === 'insufficient_quota' ||
    code === 'quota_exceeded' ||
    message.toLowerCase().includes('quota') ||
    message.toLowerCase().includes('billing')
  ) {
    return new ProviderError(
      ErrorType.QUOTA_EXCEEDED,
      'Quota exceeded',
      status,
      true,
      providerName
    );
  }

  // Context length errors (FATAL - need to reduce tokens)
  if (
    code === 'context_length_exceeded' ||
    code === 'max_tokens_exceeded' ||
    message.toLowerCase().includes('context length') ||
    message.toLowerCase().includes('maximum context')
  ) {
    return new ProviderError(
      ErrorType.CONTEXT_LENGTH,
      'Context length exceeded - reduce input size',
      400,
      false,
      providerName
    );
  }

  // Invalid request (FATAL)
  if (status === 400 || status === 422) {
    return new ProviderError(
      ErrorType.INVALID_REQUEST,
      `Invalid request: ${message}`,
      status,
      false,
      providerName
    );
  }

  // Unknown error - default to not retryable for safety
  return new ProviderError(
    ErrorType.UNKNOWN,
    message,
    status,
    false,
    providerName
  );
}
