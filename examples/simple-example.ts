#!/usr/bin/env ts-node

import { TogglrClient, createRequestContext, ErrorType } from '../src';

/**
 * Simple example of using Togglr TypeScript SDK.
 */
async function main(): Promise<void> {
  console.log('=== Togglr SDK Simple Example ===');

  // Create client with default configuration
  const client = new TogglrClient({
    apiKey: '42b6f8f1-630c-400c-97bd-a3454a07f700',
    baseUrl: 'http://localhost:8090',
    timeout: 1000,
    cache: {
      enabled: true,
      maxSize: 1000,
      ttlSeconds: 10,
    },
    retries: 3,
  });

  try {
    // Create request context with comprehensive user information
    const context = createRequestContext()
      .withUserId('user123')
      .withUserEmail('user@example.com')
      .withAnonymous(false)
      .withCountry('US')
      .withRegion('us-west')
      .withCity('San Francisco')
      .withDeviceType('mobile')
      .withManufacturer('Apple')
      .withOs('iOS')
      .withOsVersion('15.0')
      .withBrowser('Safari')
      .withBrowserVersion('15.0')
      .withLanguage('en-US')
      .withConnectionType('wifi')
      .withAge(25)
      .withGender('female')
      .withIp('192.168.1.1')
      .withAppVersion('1.2.3')
      .withPlatform('ios')
      .set('plan', 'premium')
      .build();

    console.log('Context:', JSON.stringify(context, null, 2));

    // Health check
    const isHealthy = await client.healthCheck();
    console.log(`API is healthy: ${isHealthy}`);

    // Evaluate feature flag
    try {
      const result = await client.evaluate('new_ui', context);
      if (result.found) {
        console.log(`Feature enabled: ${result.enabled}, value: ${result.value}`);
      } else {
        console.log('Feature not found');
      }
    } catch (error) {
      console.log(`Error evaluating feature: ${(error as Error).message}`);
    }

    // Simple enabled check
    try {
      const isEnabled = await client.isEnabled('new_ui', context);
      console.log(`Feature is enabled: ${isEnabled}`);
    } catch (error) {
      console.log(`Error checking feature: ${(error as Error).message}`);
    }

    // With default value
    const isEnabledWithDefault = await client.isEnabledOrDefault('new_ui', context, false);
    console.log(`Feature enabled (with default): ${isEnabledWithDefault}`);

    // Report an error for a feature
    try {
      await client.reportError(
        'new_ui',
        ErrorType.TIMEOUT,
        'Service did not respond in 5s',
        { service: 'payment-gateway', timeout_ms: 5000 }
      );
      console.log('Error reported successfully - queued for processing');
    } catch (error) {
      console.log(`Failed to report error: ${(error as Error).message}`);
    }

    // Get feature health
    try {
      const health = await client.getFeatureHealth('new_ui');
      console.log(`Feature health: enabled=${health.enabled}, auto_disabled=${health.autoDisabled}`);
      console.log(`Error rate: ${health.errorRate}, threshold: ${health.threshold}`);
    } catch (error) {
      console.log(`Failed to get feature health: ${(error as Error).message}`);
    }

    // Simple health check
    try {
      const isFeatureHealthy = await client.isFeatureHealthy('new_ui');
      console.log(`Feature new_ui is healthy: ${isFeatureHealthy}`);
    } catch (error) {
      console.log(`Failed to check feature health: ${(error as Error).message}`);
    }
  } finally {
    client.close();
    console.log('Client closed');
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}
