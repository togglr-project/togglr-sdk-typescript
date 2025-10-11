# FeatureHealth


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**feature_key** | **string** |  | [default to undefined]
**environment_key** | **string** |  | [default to undefined]
**enabled** | **boolean** |  | [default to undefined]
**auto_disabled** | **boolean** |  | [default to undefined]
**error_rate** | **number** |  | [optional] [default to undefined]
**threshold** | **number** |  | [optional] [default to undefined]
**last_error_at** | **string** |  | [optional] [default to undefined]

## Example

```typescript
import { FeatureHealth } from './api';

const instance: FeatureHealth = {
    feature_key,
    environment_key,
    enabled,
    auto_disabled,
    error_rate,
    threshold,
    last_error_at,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
