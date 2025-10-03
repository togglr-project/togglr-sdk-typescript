import { TogglrClient, createRequestContext, ErrorType } from '../index';

// Mock axios
jest.mock('axios');
const mockedAxios = require('axios');

// Mock the generated API client
jest.mock('../generated', () => ({
  DefaultApi: jest.fn().mockImplementation(() => ({
    reportFeatureError: jest.fn(),
    getFeatureHealth: jest.fn(),
  })),
  Configuration: jest.fn().mockImplementation(() => ({})),
}));

describe('TogglrClient', () => {
  let client: TogglrClient;
  let mockHttpClient: any;
  let mockApiClient: any;

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

    // Create mock API client
    mockApiClient = {
      reportFeatureError: jest.fn(),
      getFeatureHealth: jest.fn(),
    };

    // Mock axios.create to return our mock client
    mockedAxios.create.mockReturnValue(mockHttpClient);

    // Mock the DefaultApi constructor
    const { DefaultApi } = require('../generated');
    DefaultApi.mockImplementation(() => mockApiClient);

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
      mockApiClient.reportFeatureError.mockResolvedValue({});

      await expect(client.reportError(
        'test-feature',
        ErrorType.TIMEOUT,
        'Test error',
        { service: 'test' }
      )).resolves.toBeUndefined();

      expect(mockApiClient.reportFeatureError).toHaveBeenCalledWith(
        'test-feature',
        {
          error_type: ErrorType.TIMEOUT,
          error_message: 'Test error',
          context: { service: 'test' },
        }
      );
    });
  });

  describe('getFeatureHealth', () => {
    it('should get feature health successfully', async () => {
      mockApiClient.getFeatureHealth.mockResolvedValue({
        data: {
          feature_key: 'test-feature',
          environment_key: 'test-env',
          enabled: true,
          auto_disabled: false,
          error_rate: 0.1,
          threshold: 0.5,
          last_error_at: '2023-01-01T00:00:00Z',
        },
      });

      const health = await client.getFeatureHealth('test-feature');

      expect(health).toEqual({
        featureKey: 'test-feature',
        environmentKey: 'test-env',
        enabled: true,
        autoDisabled: false,
        errorRate: 0.1,
        threshold: 0.5,
        lastErrorAt: '2023-01-01T00:00:00Z',
      });

      expect(mockApiClient.getFeatureHealth).toHaveBeenCalledWith('test-feature');
    });
  });

  describe('isFeatureHealthy', () => {
    it('should return true for healthy feature', async () => {
      mockApiClient.getFeatureHealth.mockResolvedValue({
        data: {
          feature_key: 'test-feature',
          enabled: true,
          auto_disabled: false,
        },
      });

      const isHealthy = await client.isFeatureHealthy('test-feature');
      expect(isHealthy).toBe(true);
    });

    it('should return false for unhealthy feature', async () => {
      mockApiClient.getFeatureHealth.mockResolvedValue({
        data: {
          feature_key: 'test-feature',
          enabled: true,
          auto_disabled: true,
        },
      });

      const isHealthy = await client.isFeatureHealthy('test-feature');
      expect(isHealthy).toBe(false);
    });
  });
});
