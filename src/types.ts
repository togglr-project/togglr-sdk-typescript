/**
 * Configuration options for the Togglr client.
 */
export interface ClientConfig {
  /** API key for authentication */
  apiKey: string;
  /** Base URL for the API */
  baseUrl?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Number of retries for failed requests */
  retries?: number;
  /** Cache configuration */
  cache?: CacheConfig;
  /** Backoff configuration for retries */
  backoff?: BackoffConfig;
  /** Logger instance */
  logger?: Logger;
  /** Skip SSL verification for HTTPS connections */
  insecure?: boolean;
}

/**
 * Cache configuration options.
 */
export interface CacheConfig {
  /** Whether caching is enabled */
  enabled: boolean;
  /** Maximum number of cache entries */
  maxSize: number;
  /** Cache TTL in seconds */
  ttlSeconds: number;
}

/**
 * Backoff configuration for retry logic.
 */
export interface BackoffConfig {
  /** Base delay in seconds */
  baseDelay: number;
  /** Maximum delay in seconds */
  maxDelay: number;
  /** Backoff multiplier */
  factor: number;
}

/**
 * Request context for feature evaluation.
 */
export interface RequestContext {
  /** User ID */
  userId?: string;
  /** User email */
  userEmail?: string;
  /** Country code */
  country?: string;
  /** Device type */
  deviceType?: string;
  /** Operating system */
  os?: string;
  /** OS version */
  osVersion?: string;
  /** Browser */
  browser?: string;
  /** Language code */
  language?: string;
  /** User age */
  age?: number;
  /** User gender */
  gender?: string;
  /** Custom attributes */
  [key: string]: unknown;
}

/**
 * Feature evaluation result.
 */
export interface EvaluationResult {
  /** Feature value */
  value: string;
  /** Whether feature is enabled */
  enabled: boolean;
  /** Whether feature was found */
  found: boolean;
}

/**
 * Error report for feature execution errors.
 */
export interface ErrorReport {
  /** Type of error */
  errorType: string;
  /** Human-readable error message */
  errorMessage: string;
  /** Additional context data */
  context: Record<string, unknown>;
}

/**
 * Feature health information.
 */
export interface FeatureHealth {
  /** Feature key */
  featureKey?: string;
  /** Environment key */
  environmentKey?: string;
  /** Whether feature is enabled */
  enabled: boolean;
  /** Whether feature was auto-disabled */
  autoDisabled: boolean;
  /** Current error rate (0.0 to 1.0) */
  errorRate: number;
  /** Error rate threshold for auto-disable */
  threshold: number;
  /** Timestamp of last error */
  lastErrorAt?: string;
}

/**
 * Logger interface.
 */
export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

/**
 * Cache entry for storing evaluation results.
 */
export interface CacheEntry {
  /** Cached value */
  value: string;
  /** Whether feature is enabled */
  enabled: boolean;
  /** Whether feature was found */
  found: boolean;
  /** Timestamp when cached */
  timestamp: number;
}

/**
 * Error types for reporting.
 */
export enum ErrorType {
  TIMEOUT = 'timeout',
  VALIDATION = 'validation',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  RATE_LIMIT = 'rate_limit',
  NETWORK = 'network',
  INTERNAL = 'internal',
}

/**
 * Togglr SDK exceptions.
 */
export class TogglrException extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'TogglrException';
  }
}

export class UnauthorizedException extends TogglrException {
  constructor(message = 'Authentication required') {
    super(message, 'unauthorized');
    this.name = 'UnauthorizedException';
  }
}

export class BadRequestException extends TogglrException {
  constructor(message = 'Bad request') {
    super(message, 'bad_request');
    this.name = 'BadRequestException';
  }
}

export class FeatureNotFoundException extends TogglrException {
  constructor(public readonly featureKey: string, message?: string) {
    super(message || `Feature '${featureKey}' not found`, 'not_found');
    this.name = 'FeatureNotFoundException';
  }
}

export class InternalServerException extends TogglrException {
  constructor(message = 'Internal server error') {
    super(message, 'internal');
    this.name = 'InternalServerException';
  }
}

export class TooManyRequestsException extends TogglrException {
  constructor(message = 'Too many requests', public readonly retryAfter?: number) {
    super(message, 'too_many_requests');
    this.name = 'TooManyRequestsException';
  }
}
