// Main exports
export { TogglrClient } from './client';
export { RequestContextBuilder, createRequestContext, fromObject } from './context';
export { LRUCache, createCache } from './cache';
export { withRetries, calculateBackoffDelay, sleep, shouldRetry } from './retry';

// Type exports
export type {
  ClientConfig,
  CacheConfig,
  BackoffConfig,
  RequestContext,
  EvaluationResult,
  ErrorReport,
  FeatureHealth,
  Logger,
  CacheEntry,
} from './types';

// Exception exports
export {
  TogglrException,
  UnauthorizedException,
  BadRequestException,
  FeatureNotFoundException,
  InternalServerException,
  TooManyRequestsException,
  ErrorType,
} from './types';

// Generated API exports
export * from './generated';
