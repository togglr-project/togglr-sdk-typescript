# DefaultApi

All URIs are relative to *http://localhost:8090*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**getFeatureHealth**](#getfeaturehealth) | **GET** /sdk/v1/features/{feature_key}/health | Get health status of feature (including auto-disable state)|
|[**reportFeatureError**](#reportfeatureerror) | **POST** /sdk/v1/features/{feature_key}/report-error | Report feature execution error (for auto-disable)|
|[**sdkV1FeaturesFeatureKeyEvaluatePost**](#sdkv1featuresfeaturekeyevaluatepost) | **POST** /sdk/v1/features/{feature_key}/evaluate | Evaluate feature for given context|
|[**sdkV1HealthGet**](#sdkv1healthget) | **GET** /sdk/v1/health | Health check for SDK server|
|[**trackFeatureEvent**](#trackfeatureevent) | **POST** /sdk/v1/features/{feature_key}/track | Track event for a feature (impression / conversion / error / custom)|

# **getFeatureHealth**
> FeatureHealth getFeatureHealth()


### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let featureKey: string; // (default to undefined)

const { status, data } = await apiInstance.getFeatureHealth(
    featureKey
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **featureKey** | [**string**] |  | defaults to undefined|


### Return type

**FeatureHealth**

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Health status of feature |  -  |
|**400** | Bad request |  -  |
|**401** | Unauthorized |  -  |
|**404** | Feature not found |  -  |
|**500** | Internal server error |  -  |
|**0** | Unexpected error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **reportFeatureError**
> reportFeatureError(featureErrorReport)


### Example

```typescript
import {
    DefaultApi,
    Configuration,
    FeatureErrorReport
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let featureKey: string; // (default to undefined)
let featureErrorReport: FeatureErrorReport; //

const { status, data } = await apiInstance.reportFeatureError(
    featureKey,
    featureErrorReport
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **featureErrorReport** | **FeatureErrorReport**|  | |
| **featureKey** | [**string**] |  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**202** | Error reported |  -  |
|**400** | Bad request |  -  |
|**401** | Unauthorized |  -  |
|**404** | Feature not found |  -  |
|**500** | Internal server error |  -  |
|**0** | Unexpected error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **sdkV1FeaturesFeatureKeyEvaluatePost**
> EvaluateResponse sdkV1FeaturesFeatureKeyEvaluatePost(requestBody)

Returns feature evaluation result for given project and context. The project is derived from the API key. 

### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let featureKey: string; // (default to undefined)
let requestBody: { [key: string]: any; }; //

const { status, data } = await apiInstance.sdkV1FeaturesFeatureKeyEvaluatePost(
    featureKey,
    requestBody
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **requestBody** | **{ [key: string]: any; }**|  | |
| **featureKey** | [**string**] |  | defaults to undefined|


### Return type

**EvaluateResponse**

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Evaluation result |  -  |
|**400** | Bad request |  -  |
|**401** | Unauthorized |  -  |
|**404** | Feature not found |  -  |
|**500** | Internal server error |  -  |
|**0** | Unexpected error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **sdkV1HealthGet**
> HealthResponse sdkV1HealthGet()


### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

const { status, data } = await apiInstance.sdkV1HealthGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**HealthResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Health information |  -  |
|**0** | Unexpected error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **trackFeatureEvent**
> trackFeatureEvent(trackRequest)

Send a feedback event related to a feature evaluation. Events are written to TimescaleDB (hypertable) and used for analytics, auto-disable and training MAB algorithms. The project is derived from the API key. 

### Example

```typescript
import {
    DefaultApi,
    Configuration,
    TrackRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let featureKey: string; // (default to undefined)
let trackRequest: TrackRequest; //

const { status, data } = await apiInstance.trackFeatureEvent(
    featureKey,
    trackRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **trackRequest** | **TrackRequest**|  | |
| **featureKey** | [**string**] |  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**202** | Event accepted for processing |  -  |
|**400** | Bad request |  -  |
|**401** | Unauthorized |  -  |
|**404** | Feature not found |  -  |
|**429** | Too many requests |  -  |
|**500** | Internal server error |  -  |
|**0** | Unexpected error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

