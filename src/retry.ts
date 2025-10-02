import { BackoffConfig, TogglrException } from './types';

/**
 * Calculate delay for retry attempt using exponential backoff.
 */
export function calculateBackoffDelay(config: BackoffConfig, attempt: number): number {
  if (attempt <= 0) {
    return 0;
  }

  let delay = config.baseDelay;
  for (let i = 1; i < attempt; i++) {
    delay *= config.factor;
    if (delay > config.maxDelay) {
      delay = config.maxDelay;
      break;
    }
  }

  return delay;
}

/**
 * Sleep for the specified number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if an exception should trigger a retry.
 */
export function shouldRetry(error: TogglrException): boolean {
  return !(
    error instanceof TogglrException &&
    (error.code === 'unauthorized' || error.code === 'bad_request' || error.code === 'not_found')
  );
}

/**
 * Execute a function with retry logic.
 */
export async function withRetries<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  backoffConfig: BackoffConfig,
  shouldRetryFn: (error: TogglrException) => boolean = shouldRetry
): Promise<T> {
  let lastError: TogglrException;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as TogglrException;

      if (attempt === maxAttempts - 1 || !shouldRetryFn(lastError)) {
        throw lastError;
      }

      const delay = calculateBackoffDelay(backoffConfig, attempt + 1);
      await sleep(delay * 1000); // Convert to milliseconds
    }
  }

  throw lastError!;
}
