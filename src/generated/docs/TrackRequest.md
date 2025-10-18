# TrackRequest

Event sent from SDK. SDK SHOULD send an impression event for each evaluation (recommended). Conversions / errors / custom events are used to update algorithm statistics. 

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**variant_key** | **string** | Variant key returned by evaluate (e.g. \&quot;A\&quot;, \&quot;v2\&quot;). | [default to undefined]
**event_type** | **string** | Type of event (e.g. \&quot;success\&quot;, \&quot;failure\&quot;, \&quot;error\&quot;). | [default to undefined]
**reward** | **number** | Numeric reward associated with event (e.g. 1.0 for conversion). Default 0. | [optional] [default to undefined]
**context** | **{ [key: string]: any; }** | Arbitrary context passed by SDK (user id, session, metadata). | [optional] [default to undefined]
**created_at** | **string** | Event timestamp. If omitted, server time will be used. | [optional] [default to undefined]
**dedup_key** | **string** | Optional idempotency key to deduplicate duplicate events from SDK retries. | [optional] [default to undefined]

## Example

```typescript
import { TrackRequest } from './api';

const instance: TrackRequest = {
    variant_key,
    event_type,
    reward,
    context,
    created_at,
    dedup_key,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
