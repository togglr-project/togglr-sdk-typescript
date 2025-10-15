// Main exports
export { TogglrClient } from './client';
export { RequestContextBuilder, createRequestContext, fromObject } from './context';
export { LRUCache, createCache } from './cache';
export { withRetries, calculateBackoffDelay, sleep, shouldRetry } from './retry';
export { TrackEventBuilder, createTrackEvent } from './track-event';

// Type exports
export type {
  ClientConfig,
  CacheConfig,
  BackoffConfig,
  RequestContext,
  EvaluationResult,
  ErrorReport,
  FeatureHealth,
  TrackEvent,
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
  EventType,
} from './types';

// Generated API exports
export * from './generated';
