import {
  ClientConfig,
  RequestContext,
  EvaluationResult,
  FeatureHealth,
  TrackEvent,
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
import { 
  DefaultApi, 
  Configuration as ApiConfiguration,
  FeatureErrorReport,
  FeatureHealth as ApiFeatureHealth,
  TrackRequest
} from './generated';

/**
 * Togglr SDK client for feature flag evaluation.
 */
export class TogglrClient {
  private readonly apiClient: DefaultApi;
  private readonly cache: LRUCache | null;
  private readonly logger: Logger;

  constructor(config: ClientConfig) {
    this.logger = config.logger || this.createDefaultLogger();

    // Create API client
    const apiConfig = new ApiConfiguration({
      basePath: config.baseUrl || 'http://localhost:8090',
      apiKey: config.apiKey,
    });
    
    // Configure SSL verification if insecure mode is enabled
    if (config.insecure) {
      // Note: SSL verification bypass needs to be configured at the HTTP client level
      // This is a limitation of the generated client
      console.warn('Insecure mode is enabled but SSL verification bypass is not supported by the generated client');
    }
    
    this.apiClient = new DefaultApi(apiConfig);

    // Initialize cache
    this.cache = createCache(config.cache || { enabled: false, maxSize: 100, ttlSeconds: 5 });
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
      const response = await this.apiClient.sdkV1HealthGet();
      return response?.data?.status === 'ok';
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
  ): Promise<void> {
    const errorReport: FeatureErrorReport = {
      error_type: errorType,
      error_message: errorMessage,
      context,
    };

    await this.reportErrorWithRetries(featureKey, errorReport);
  }

  /**
   * Get feature health information.
   */
  async getFeatureHealth(featureKey: string): Promise<FeatureHealth> {
    const apiHealth = await this.getFeatureHealthWithRetries(featureKey);
    return this.convertFeatureHealth(apiHealth);
  }

  /**
   * Check if a feature is healthy.
   */
  async isFeatureHealthy(featureKey: string): Promise<boolean> {
    const health = await this.getFeatureHealth(featureKey);
    return health.enabled && !health.autoDisabled;
  }

  /**
   * Track an event for analytics.
   */
  async trackEvent(featureKey: string, event: TrackEvent): Promise<void> {
    await this.trackEventWithRetries(featureKey, event);
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
      const response = await this.apiClient.sdkV1FeaturesFeatureKeyEvaluatePost(featureKey, context);

      return {
        value: response.data.value || '',
        enabled: response.data.enabled || false,
        found: true,
      };
    } catch (error) {
      this.handleHttpError(error as any, featureKey);
    }
  }

  /**
   * Report error with retry logic.
   */
  private async reportErrorWithRetries(featureKey: string, errorReport: FeatureErrorReport): Promise<void> {
    await withRetries(
      async () => {
        await this.reportErrorSingle(featureKey, errorReport);
      },
      3, // Default retries
      { baseDelay: 0.1, maxDelay: 2.0, factor: 2.0 }, // Default backoff
      shouldRetry
    );
  }

  /**
   * Report error single attempt.
   */
  private async reportErrorSingle(featureKey: string, errorReport: FeatureErrorReport): Promise<void> {
    try {
      await this.apiClient.reportFeatureError(featureKey, errorReport);
      // Success - error queued for processing
    } catch (error) {
      this.handleHttpError(error as any, featureKey);
    }
  }

  /**
   * Get feature health with retry logic.
   */
  private async getFeatureHealthWithRetries(featureKey: string): Promise<ApiFeatureHealth> {
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
  private async getFeatureHealthSingle(featureKey: string): Promise<ApiFeatureHealth> {
    try {
      const response = await this.apiClient.getFeatureHealth(featureKey);
      return response.data;
    } catch (error) {
      this.handleHttpError(error as any, featureKey);
    }
  }

  /**
   * Track event with retry logic.
   */
  private async trackEventWithRetries(featureKey: string, event: TrackEvent): Promise<void> {
    await withRetries(
      async () => {
        await this.trackEventSingle(featureKey, event);
      },
      3, // Default retries
      { baseDelay: 0.1, maxDelay: 2.0, factor: 2.0 }, // Default backoff
      shouldRetry
    );
  }

  /**
   * Track event single attempt.
   */
  private async trackEventSingle(featureKey: string, event: TrackEvent): Promise<void> {
    try {
      const trackRequest: TrackRequest = {
        variant_key: event.variantKey,
        event_type: event.eventType as any,
        context: event.context,
      };

      if (event.reward !== undefined) {
        trackRequest.reward = event.reward;
      }

      if (event.createdAt !== undefined) {
        trackRequest.created_at = event.createdAt.toISOString();
      }

      if (event.dedupKey !== undefined) {
        trackRequest.dedup_key = event.dedupKey;
      }

      await this.apiClient.trackFeatureEvent(featureKey, trackRequest);
    } catch (error) {
      this.handleHttpError(error as any, featureKey);
    }
  }

  /**
   * Convert API FeatureHealth to SDK FeatureHealth.
   */
  private convertFeatureHealth(apiHealth: ApiFeatureHealth): FeatureHealth {
    const result: FeatureHealth = {
      featureKey: apiHealth.feature_key,
      environmentKey: apiHealth.environment_key,
      enabled: apiHealth.enabled || false,
      autoDisabled: apiHealth.auto_disabled || false,
      errorRate: apiHealth.error_rate || 0,
      threshold: apiHealth.threshold || 0,
    };
    
    if (apiHealth.last_error_at) {
      result.lastErrorAt = apiHealth.last_error_at;
    }
    
    return result;
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
          // eslint-disable-next-line no-case-declarations
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
