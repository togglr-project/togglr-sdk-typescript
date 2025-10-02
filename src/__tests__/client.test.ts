import { TogglrClient, createRequestContext, ErrorType } from '../index';

// Mock axios
jest.mock('axios');
const mockedAxios = require('axios');

describe('TogglrClient', () => {
  let client: TogglrClient;
  let mockHttpClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock HTTP client
    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };

    // Mock axios.create to return our mock client
    mockedAxios.create.mockReturnValue(mockHttpClient);

    client = new TogglrClient({
      apiKey: 'test-api-key',
      baseUrl: 'http://localhost:8090',
    });
  });

  afterEach(() => {
    client.close();
  });

  describe('healthCheck', () => {
    it('should return true when API is healthy', async () => {
      mockHttpClient.get.mockResolvedValue({
        data: { status: 'ok' },
      });

      const result = await client.healthCheck();
      expect(result).toBe(true);
    });

    it('should return false when API is not healthy', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Connection failed'));

      const result = await client.healthCheck();
      expect(result).toBe(false);
    });
  });

  describe('evaluate', () => {
    it('should evaluate feature successfully', async () => {
      mockHttpClient.post.mockResolvedValue({
        data: {
          value: 'test-value',
          enabled: true,
        },
      });

      const context = createRequestContext().withUserId('user123').build();
      const result = await client.evaluate('test-feature', context);

      expect(result).toEqual({
        value: 'test-value',
        enabled: true,
        found: true,
      });
    });
  });

  describe('reportError', () => {
    it('should report error successfully', async () => {
      mockHttpClient.post.mockResolvedValue({
        status: 200,
        data: {
          feature_key: 'test-feature',
          enabled: true,
          auto_disabled: false,
          error_rate: 0.1,
          threshold: 0.5,
        },
      });

      const [health, isPending] = await client.reportError(
        'test-feature',
        ErrorType.TIMEOUT,
        'Test error',
        { service: 'test' }
      );

      expect(health).toEqual({
        featureKey: 'test-feature',
        environmentKey: undefined,
        enabled: true,
        autoDisabled: false,
        errorRate: 0.1,
        threshold: 0.5,
        lastErrorAt: undefined,
      });
      expect(isPending).toBe(false);
    });

    it('should handle 202 response with pending status', async () => {
      mockHttpClient.post.mockResolvedValue({
        status: 202,
        data: {
          feature_key: 'test-feature',
          enabled: true,
          auto_disabled: false,
          error_rate: 0.1,
          threshold: 0.5,
        },
      });

      const [, isPending] = await client.reportError(
        'test-feature',
        ErrorType.TIMEOUT,
        'Test error'
      );

      expect(isPending).toBe(true);
    });
  });

  describe('getFeatureHealth', () => {
    it('should get feature health successfully', async () => {
      mockHttpClient.get.mockResolvedValue({
        data: {
          feature_key: 'test-feature',
          enabled: true,
          auto_disabled: false,
          error_rate: 0.1,
          threshold: 0.5,
        },
      });

      const health = await client.getFeatureHealth('test-feature');

      expect(health).toEqual({
        featureKey: 'test-feature',
        environmentKey: undefined,
        enabled: true,
        autoDisabled: false,
        errorRate: 0.1,
        threshold: 0.5,
        lastErrorAt: undefined,
      });
    });
  });

  describe('isFeatureHealthy', () => {
    it('should return true for healthy feature', async () => {
      mockHttpClient.get.mockResolvedValue({
        data: {
          enabled: true,
          auto_disabled: false,
        },
      });

      const isHealthy = await client.isFeatureHealthy('test-feature');
      expect(isHealthy).toBe(true);
    });

    it('should return false for unhealthy feature', async () => {
      mockHttpClient.get.mockResolvedValue({
        data: {
          enabled: true,
          auto_disabled: true,
        },
      });

      const isHealthy = await client.isFeatureHealthy('test-feature');
      expect(isHealthy).toBe(false);
    });
  });
});
