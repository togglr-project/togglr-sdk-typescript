#!/usr/bin/env ts-node

import { TogglrClient, createRequestContext, ErrorType, ErrorReport, FeatureHealth } from '../src';

/**
 * Advanced example of using Togglr TypeScript SDK.
 */
async function main(): Promise<void> {
  console.log('=== Togglr SDK Advanced Example ===');

  // Create client with advanced configuration
  const client = new TogglrClient({
    apiKey: 'your-api-key-here',
    baseUrl: 'http://localhost:8090',
    timeout: 2000,
    retries: 5,
    cache: {
      enabled: true,
      maxSize: 2000,
      ttlSeconds: 30,
    },
    backoff: {
      baseDelay: 0.2,
      maxDelay: 5.0,
      factor: 1.5,
    },
  });

  try {
    // Create request context
    const context = createRequestContext()
      .withUserId('user456')
      .withCountry('CA')
      .withUserEmail('user@example.ca')
      .withDeviceType('desktop')
      .withOs('macOS')
      .withOsVersion('12.0')
      .set('subscription', 'premium')
      .set('region', 'north')
      .build();

    console.log('Context:', JSON.stringify(context, null, 2));

    const featureKey = 'advanced_analytics';

    // Evaluate feature
    console.log('\n=== Feature Evaluation ===');
    try {
      const result = await client.evaluate(featureKey, context);
      console.log('Feature evaluation result:');
      console.log(`  Found: ${result.found}`);
      console.log(`  Enabled: ${result.enabled}`);
      console.log(`  Value: ${result.value}`);
    } catch (error) {
      console.log(`Feature evaluation failed: ${(error as Error).message}`);
    }

    // Test different error types
    console.log('\n=== Error Reporting Examples ===');
    
    const errorExamples = [
      [ErrorType.TIMEOUT, 'Service timeout after 10s', { timeout_ms: 10000, service: 'analytics' }],
      [ErrorType.VALIDATION, 'Invalid user data provided', { field: 'email', value: 'invalid-email' }],
      [ErrorType.SERVICE_UNAVAILABLE, 'External service is down', { service: 'database', region: 'us-east-1' }],
      [ErrorType.RATE_LIMIT, 'Too many requests', { limit: 100, current: 150, window: '1m' }],
    ] as const;

    for (const [errorType, message, contextData] of errorExamples) {
      try {
        await client.reportError(featureKey, errorType, message, contextData);
        console.log(`Reported ${errorType} error successfully - queued for processing`);
      } catch (error) {
        console.log(`Failed to report ${errorType} error: ${(error as Error).message}`);
      }
      console.log('');
    }

    // Feature health monitoring
    console.log('=== Feature Health Monitoring ===');
    
    try {
      const health = await client.getFeatureHealth(featureKey);
      console.log(`Feature: ${health.featureKey}`);
      console.log(`Environment: ${health.environmentKey}`);
      console.log(`Enabled: ${health.enabled}`);
      console.log(`Auto Disabled: ${health.autoDisabled}`);
      console.log(`Error Rate: ${health.errorRate}`);
      console.log(`Threshold: ${health.threshold}`);
      console.log(`Last Error At: ${health.lastErrorAt}`);
      console.log(`Is Healthy: ${health.enabled && !health.autoDisabled}`);
    } catch (error) {
      console.log(`Failed to get feature health: ${(error as Error).message}`);
    }

    // Simple health check
    console.log('\n=== Simple Health Check ===');
    try {
      const isHealthy = await client.isFeatureHealthy(featureKey);
      console.log(`Feature ${featureKey} is healthy: ${isHealthy}`);
    } catch (error) {
      console.log(`Health check failed: ${(error as Error).message}`);
    }

    // Multiple features health check
    console.log('\n=== Multiple Features Health Check ===');
    const features = ['advanced_analytics', 'new_ui', 'beta_features', 'experimental_api'];
    
    for (const feature of features) {
      try {
        const isHealthy = await client.isFeatureHealthy(feature);
        const status = isHealthy ? 'healthy' : 'unhealthy';
        console.log(`Feature ${feature}: ${status}`);
      } catch (error) {
        console.log(`Feature ${feature}: error - ${(error as Error).message}`);
      }
    }

    // Health check
    console.log('\n=== System Health Check ===');
    const systemHealthy = await client.healthCheck();
    console.log(`System health: ${systemHealthy ? 'healthy' : 'unhealthy'}`);

    // Demonstrate ErrorReport model
    console.log('\n=== ErrorReport Model Example ===');
    const errorReport: ErrorReport = {
      errorType: ErrorType.TIMEOUT,
      errorMessage: 'Service timeout',
      context: { service: 'api', timeout_ms: 5000 },
    };
    console.log('Error Report:', JSON.stringify(errorReport, null, 2));

    // Demonstrate FeatureHealth model
    console.log('\n=== FeatureHealth Model Example ===');
    const healthData: FeatureHealth = {
      featureKey: 'test_feature',
      enabled: true,
      autoDisabled: false,
      errorRate: 0.05,
      threshold: 0.1,
    };
    console.log('Feature Health:', JSON.stringify(healthData, null, 2));
    console.log(`Is Healthy: ${healthData.enabled && !healthData.autoDisabled}`);

  } finally {
    client.close();
    console.log('\nClient closed');
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}
