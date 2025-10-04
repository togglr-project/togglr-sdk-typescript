# Togglr TypeScript SDK

TypeScript SDK for working with Togglr - feature flag management system.

## Installation

```bash
npm install togglr-sdk-typescript
```

### Development Installation

For development or if you want to build from source:

```bash
git clone https://github.com/rom8726/togglr-sdk-typescript.git
cd togglr-sdk-typescript
npm install
npm run build
```

## Quick Start

```typescript
import { TogglrClient, createRequestContext, ErrorType } from 'togglr-sdk-typescript';

// Create client with default configuration
const client = new TogglrClient({
  apiKey: 'your-api-key-here',
  baseUrl: 'http://localhost:8090',
  timeout: 1000,
  cache: {
    enabled: true,
    maxSize: 1000,
    ttlSeconds: 10,
  },
});

// Create request context
const context = createRequestContext()
  .withUserId('user123')
  .withCountry('US')
  .withDeviceType('mobile')
  .withOs('iOS')
  .withOsVersion('15.0')
  .withBrowser('Safari')
  .withLanguage('en-US')
  .build();

// Evaluate feature flag
try {
  const result = await client.evaluate('new_ui', context);
  if (result.found) {
    console.log(`Feature enabled: ${result.enabled}, value: ${result.value}`);
  } else {
    console.log('Feature not found');
  }
} catch (error) {
  console.log(`Error evaluating feature: ${error.message}`);
}

// Check if feature is enabled
try {
  const isEnabled = await client.isEnabled('new_ui', context);
  console.log(`Feature is enabled: ${isEnabled}`);
} catch (error) {
  console.log(`Error checking feature: ${error.message}`);
}

// With default value
const isEnabledWithDefault = await client.isEnabledOrDefault('new_ui', context, false);
console.log(`Feature enabled (with default): ${isEnabledWithDefault}`);

// Health check
const isHealthy = await client.healthCheck();
console.log(`API is healthy: ${isHealthy}`);

// Clean up
client.close();
```

## Configuration

### Creating a client

```typescript
// With default settings
const client = new TogglrClient({
  apiKey: 'your-api-key',
});

// With custom configuration
const client = new TogglrClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.togglr.com',
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
  insecure: true, // Skip SSL verification for self-signed certificates
});
```

### Configuration options

```typescript
interface ClientConfig {
  apiKey: string;                    // Required: Your Togglr API key
  baseUrl?: string;                  // API base URL (default: "http://localhost:8090")
  timeout?: number;                  // Request timeout in milliseconds (default: 800)
  retries?: number;                  // Number of retries (default: 2)
  cache?: CacheConfig;               // Cache configuration
  backoff?: BackoffConfig;          // Backoff configuration for retries
  logger?: Logger;                   // Logger instance
}
```

## Usage

### Creating request context

```typescript
import { createRequestContext } from 'togglr-sdk-typescript';

const context = createRequestContext()
  .withUserId('user123')
  .withUserEmail('user@example.com')
  .withCountry('US')
  .withDeviceType('mobile')
  .withOs('iOS')
  .withOsVersion('15.0')
  .withBrowser('Safari')
  .withLanguage('en-US')
  .withAge(25)
  .withGender('female')
  .set('custom_attribute', 'custom_value')
  .setMany({
    'user.role': 'admin',
    'user.team': 'engineering',
  })
  .build();
```

### Evaluating feature flags

```typescript
// Full evaluation
const result = await client.evaluate('feature_key', context);
// Returns: { value: string, enabled: boolean, found: boolean }

// Simple enabled check
const isEnabled = await client.isEnabled('feature_key', context);

// With default value
const isEnabled = await client.isEnabledOrDefault('feature_key', context, false);
```

## Error Reporting and Auto-Disable

The SDK supports reporting errors for features, which can trigger automatic disabling based on error rates:

```typescript
import { ErrorType } from 'togglr-sdk-typescript';

// Report an error for a feature
await client.reportError(
  'feature_key',
  ErrorType.TIMEOUT,
  'Service did not respond in 5s',
  { service: 'payment-gateway', timeout_ms: 5000 }
);

console.log('Error reported successfully - queued for processing');
```

### Error Types

Supported error types:
- `ErrorType.TIMEOUT` - Service timeout
- `ErrorType.VALIDATION` - Data validation error
- `ErrorType.SERVICE_UNAVAILABLE` - External service unavailable
- `ErrorType.RATE_LIMIT` - Rate limit exceeded
- `ErrorType.NETWORK` - Network connectivity issue
- `ErrorType.INTERNAL` - Internal application error

### Context Data

You can provide additional context with error reports:

```typescript
const context = {
  service: 'payment-gateway',
  timeout_ms: 5000,
  user_id: 'user123',
  region: 'us-east-1',
};

await client.reportError(
  'feature_key',
  ErrorType.TIMEOUT,
  'Service timeout',
  context
);
```

## Feature Health Monitoring

Monitor the health status of features:

```typescript
// Get detailed health information
const health = await client.getFeatureHealth('feature_key');

console.log(`Feature: ${health.featureKey}`);
console.log(`Enabled: ${health.enabled}`);
console.log(`Auto Disabled: ${health.autoDisabled}`);
console.log(`Error Rate: ${health.errorRate}`);
console.log(`Threshold: ${health.threshold}`);
console.log(`Last Error At: ${health.lastErrorAt}`);

// Simple health check
const isHealthy = await client.isFeatureHealthy('feature_key');
console.log(`Feature is healthy: ${isHealthy}`);
```

### FeatureHealth Model

The `FeatureHealth` interface provides:

- `featureKey` - The feature identifier
- `environmentKey` - The environment identifier
- `enabled` - Whether the feature is enabled
- `autoDisabled` - Whether the feature was auto-disabled due to errors
- `errorRate` - Current error rate (0.0 to 1.0)
- `threshold` - Error rate threshold for auto-disable
- `lastErrorAt` - Timestamp of the last error

### ErrorReport Model

The `ErrorReport` interface provides:

- `errorType` - Type of error
- `errorMessage` - Human-readable error message
- `context` - Additional context data

```typescript
// Create an error report
const errorReport: ErrorReport = {
  errorType: ErrorType.TIMEOUT,
  errorMessage: 'Service timeout',
  context: { service: 'api', timeout_ms: 5000 },
};
```

## Caching

The SDK supports optional caching of evaluation results using LRU cache:

```typescript
const client = new TogglrClient({
  apiKey: 'your-api-key',
  cache: {
    enabled: true,
    maxSize: 1000,  // number of items
    ttlSeconds: 10, // TTL in seconds
  },
});
```

## Retries

The SDK automatically retries requests on temporary errors:

```typescript
const client = new TogglrClient({
  apiKey: 'your-api-key',
  retries: 3,
  backoff: {
    baseDelay: 0.1,  // 100ms
    maxDelay: 2.0,   // 2s
    factor: 2.0,     // 2x multiplier
  },
});
```

## Logging

```typescript
import { Logger } from 'togglr-sdk-typescript';

// Custom logger
const logger: Logger = {
  debug: (message: string, context?: Record<string, unknown>) => {
    console.debug(`[DEBUG] ${message}`, context);
  },
  info: (message: string, context?: Record<string, unknown>) => {
    console.log(`[INFO] ${message}`, context);
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(`[WARN] ${message}`, context);
  },
  error: (message: string, context?: Record<string, unknown>) => {
    console.error(`[ERROR] ${message}`, context);
  },
};

const client = new TogglrClient({
  apiKey: 'your-api-key',
  logger,
});
```

## Error Handling

```typescript
import {
  TogglrException,
  UnauthorizedException,
  BadRequestException,
  FeatureNotFoundException,
  InternalServerException,
  TooManyRequestsException,
} from 'togglr-sdk-typescript';

try {
  const result = await client.evaluate('feature_key', context);
  // Handle success
} catch (error) {
  if (error instanceof UnauthorizedException) {
    // Handle authentication error
  } else if (error instanceof BadRequestException) {
    // Handle bad request
  } else if (error instanceof FeatureNotFoundException) {
    // Handle feature not found
  } else if (error instanceof TooManyRequestsException) {
    // Handle rate limiting
  } else if (error instanceof InternalServerException) {
    // Handle server error
  } else if (error instanceof TogglrException) {
    // Handle other Togglr errors
  } else {
    // Handle unexpected errors
  }
}
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
npm run lint:fix
```

### Formatting

```bash
npm run format
```

### Generating API Client

```bash
npm run generate-client
```

## Examples

See the `examples/` directory for complete usage examples:

- `simple-example.ts` - Basic usage
- `advanced-example.ts` - Advanced features including error reporting and health monitoring

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/rom8726/togglr-sdk-typescript.

## License

This project is licensed under the MIT License.
