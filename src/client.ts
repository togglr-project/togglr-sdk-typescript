import axios, { AxiosInstance } from 'axios';
import {
  ClientConfig,
  RequestContext,
  EvaluationResult,
  ErrorReport,
  FeatureHealth,
  TogglrException,
  UnauthorizedException,
  BadRequestException,
  FeatureNotFoundException,
  InternalServerException,
  TooManyRequestsException,
  Logger,
} from './types';
import { LRUCache, createCache } from './cache';
import { withRetries, shouldRetry } from './retry';

/**
 * Togglr SDK client for feature flag evaluation.
 */
export class TogglrClient {
  private readonly httpClient: AxiosInstance;
  private readonly cache: LRUCache | null;
  private readonly logger: Logger;

  constructor(config: ClientConfig) {
    this.logger = config.logger || this.createDefaultLogger();

    // Create HTTP client
    this.httpClient = axios.create({
      baseURL: config.baseUrl || 'http://localhost:8090',
      timeout: config.timeout || 800,
      headers: {
        'Authorization': config.apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'togglr-sdk-typescript/1.0.0',
      },
    });


    // Initialize cache
    this.cache = createCache(config.cache || { enabled: false, maxSize: 100, ttlSeconds: 5 });

    // Setup request/response interceptors
    this.setupInterceptors();
  }

  /**
   * Close the client and clean up resources.
   */
  close(): void {
    this.cache?.clear();
  }

  /**
   * Perform a health check on the API.
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.httpClient.get('/sdk/v1/health');
      const data = response.data;
      return data?.status === 'ok';
    } catch (error) {
      this.logger.error('Health check failed', { error: (error as Error).message });
      return false;
    }
  }

  /**
   * Evaluate a feature flag.
   */
  async evaluate(featureKey: string, context: RequestContext): Promise<EvaluationResult> {
    return this.evaluateWithRetries(featureKey, context);
  }

  /**
   * Check if a feature is enabled.
   */
  async isEnabled(featureKey: string, context: RequestContext): Promise<boolean> {
    const result = await this.evaluate(featureKey, context);

    if (!result.found) {
      throw new FeatureNotFoundException(featureKey);
    }

    return result.enabled;
  }

  /**
   * Check if a feature is enabled, returning default on error.
   */
  async isEnabledOrDefault(
    featureKey: string,
    context: RequestContext,
    defaultValue = false
  ): Promise<boolean> {
    try {
      return await this.isEnabled(featureKey, context);
    } catch (error) {
      this.logger.warn('Evaluation failed, using default', {
        featureKey,
        error: (error as Error).message,
        defaultValue,
      });
      return defaultValue;
    }
  }

  /**
   * Report an error for a feature.
   */
  async reportError(
    featureKey: string,
    errorType: string,
    errorMessage: string,
    context: Record<string, unknown> = {}
  ): Promise<[FeatureHealth, boolean]> {
    const errorReport: ErrorReport = {
      errorType,
      errorMessage,
      context,
    };

    return this.reportErrorWithRetries(featureKey, errorReport);
  }

  /**
   * Get feature health information.
   */
  async getFeatureHealth(featureKey: string): Promise<FeatureHealth> {
    return this.getFeatureHealthWithRetries(featureKey);
  }

  /**
   * Check if a feature is healthy.
   */
  async isFeatureHealthy(featureKey: string): Promise<boolean> {
    const health = await this.getFeatureHealth(featureKey);
    return health.enabled && !health.autoDisabled;
  }

  /**
   * Evaluate feature with retry logic.
   */
  private async evaluateWithRetries(featureKey: string, context: RequestContext): Promise<EvaluationResult> {
    // Check cache first
    if (this.cache) {
      const cacheKey = this.getCacheKey(featureKey, context);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        this.logger.debug('Cache hit', { featureKey, cacheKey });
        return {
          value: cached.value,
          enabled: cached.enabled,
          found: cached.found,
        };
      }
    }

    // Make API call with retries
    const result = await withRetries(
      () => this.evaluateSingle(featureKey, context),
      3, // Default retries
      { baseDelay: 0.1, maxDelay: 2.0, factor: 2.0 }, // Default backoff
      shouldRetry
    );

    // Cache result if successful
    if (this.cache && result.found) {
      const cacheKey = this.getCacheKey(featureKey, context);
      this.cache.set(cacheKey, result.value, result.enabled, result.found);
    }

    return result;
  }

  /**
   * Evaluate feature single attempt.
   */
  private async evaluateSingle(featureKey: string, context: RequestContext): Promise<EvaluationResult> {
    try {
      const response = await this.httpClient.post(`/sdk/v1/features/${featureKey}/evaluate`, context);
      const data = response.data;

      return {
        value: data.value || '',
        enabled: data.enabled || false,
        found: true,
      };
    } catch (error) {
      this.handleHttpError(error as any, featureKey);
    }
  }

  /**
   * Report error with retry logic.
   */
  private async reportErrorWithRetries(featureKey: string, errorReport: ErrorReport): Promise<[FeatureHealth, boolean]> {
    return withRetries(
      () => this.reportErrorSingle(featureKey, errorReport),
      3, // Default retries
      { baseDelay: 0.1, maxDelay: 2.0, factor: 2.0 }, // Default backoff
      shouldRetry
    );
  }

  /**
   * Report error single attempt.
   */
  private async reportErrorSingle(featureKey: string, errorReport: ErrorReport): Promise<[FeatureHealth, boolean]> {
    try {
      const response = await this.httpClient.post(`/sdk/v1/features/${featureKey}/report-error`, errorReport);
      const data = response.data;

      const health: FeatureHealth = {
        featureKey: data.feature_key,
        environmentKey: data.environment_key,
        enabled: data.enabled || false,
        autoDisabled: data.auto_disabled || false,
        errorRate: data.error_rate || 0,
        threshold: data.threshold || 0,
        lastErrorAt: data.last_error_at,
      };

      const isPending = response.status === 202;
      return [health, isPending];
    } catch (error) {
      this.handleHttpError(error as any, featureKey);
    }
  }

  /**
   * Get feature health with retry logic.
   */
  private async getFeatureHealthWithRetries(featureKey: string): Promise<FeatureHealth> {
    return withRetries(
      () => this.getFeatureHealthSingle(featureKey),
      3, // Default retries
      { baseDelay: 0.1, maxDelay: 2.0, factor: 2.0 }, // Default backoff
      shouldRetry
    );
  }

  /**
   * Get feature health single attempt.
   */
  private async getFeatureHealthSingle(featureKey: string): Promise<FeatureHealth> {
    try {
      const response = await this.httpClient.get(`/sdk/v1/features/${featureKey}/health`);
      const data = response.data;

      return {
        featureKey: data.feature_key,
        environmentKey: data.environment_key,
        enabled: data.enabled || false,
        autoDisabled: data.auto_disabled || false,
        errorRate: data.error_rate || 0,
        threshold: data.threshold || 0,
        lastErrorAt: data.last_error_at,
      };
    } catch (error) {
      this.handleHttpError(error as any, featureKey);
    }
  }

  /**
   * Generate cache key for feature and context.
   */
  private getCacheKey(featureKey: string, context: RequestContext): string {
    const contextString = JSON.stringify(context, Object.keys(context).sort());
    const contextHash = this.simpleHash(contextString);
    return `${featureKey}:${contextHash}`;
  }

  /**
   * Simple hash function for cache keys.
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Handle HTTP errors and convert to appropriate exceptions.
   */
  private handleHttpError(error: any, featureKey: string): never {
    if (error.response) {
      const status = error.response.status;

      switch (status) {
        case 401:
          throw new UnauthorizedException();
        case 400:
          throw new BadRequestException();
        case 404:
          throw new FeatureNotFoundException(featureKey);
        case 429:
          const retryAfter = error.response.headers['retry-after'];
          throw new TooManyRequestsException('Too many requests', retryAfter ? parseInt(retryAfter) : undefined);
        case 500:
          throw new InternalServerException();
        default:
          throw new TogglrException(`HTTP ${status}`);
      }
    } else if (error.request) {
      throw new TogglrException('Request failed: No response received');
    } else {
      throw new TogglrException(`Request failed: ${error.message}`);
    }
  }

  /**
   * Setup request/response interceptors.
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.httpClient.interceptors.request.use(
      (config) => {
        this.logger.debug('Making request', {
          method: config.method?.toUpperCase(),
          url: config.url,
        });
        return config;
      },
      (error) => {
        this.logger.error('Request error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.httpClient.interceptors.response.use(
      (response) => {
        this.logger.debug('Request completed', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error) => {
        this.logger.error('Response error', {
          status: error.response?.status,
          url: error.config?.url,
          error: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Create default logger.
   */
  private createDefaultLogger(): Logger {
    return {
      debug: (message: string, context?: Record<string, unknown>) => {
        if (process.env['NODE_ENV'] === 'development') {
          console.debug(`[TogglrSDK] ${message}`, context || '');
        }
      },
      info: (message: string, context?: Record<string, unknown>) => {
        console.log(`[TogglrSDK] ${message}`, context || '');
      },
      warn: (message: string, context?: Record<string, unknown>) => {
        console.warn(`[TogglrSDK] ${message}`, context || '');
      },
      error: (message: string, context?: Record<string, unknown>) => {
        console.error(`[TogglrSDK] ${message}`, context || '');
      },
    };
  }
}
