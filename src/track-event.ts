import { TrackEvent, EventType } from './types';

/**
 * Builder class for creating TrackEvent instances.
 */
export class TrackEventBuilder {
  private event: TrackEvent;

  constructor(variantKey: string, eventType: EventType) {
    this.event = {
      variantKey,
      eventType,
      context: {},
    };
  }

  /**
   * Add a reward value to the event.
   */
  withReward(reward: number): TrackEventBuilder {
    this.event.reward = reward;
    return this;
  }

  /**
   * Add a single context key-value pair.
   */
  withContext(key: string, value: unknown): TrackEventBuilder {
    this.event.context[key] = value;
    return this;
  }

  /**
   * Add multiple context key-value pairs.
   */
  withContexts(contexts: Record<string, unknown>): TrackEventBuilder {
    Object.assign(this.event.context, contexts);
    return this;
  }

  /**
   * Set the creation timestamp.
   */
  withCreatedAt(createdAt: Date): TrackEventBuilder {
    this.event.createdAt = createdAt;
    return this;
  }

  /**
   * Set the deduplication key.
   */
  withDedupKey(dedupKey: string): TrackEventBuilder {
    this.event.dedupKey = dedupKey;
    return this;
  }

  /**
   * Build the TrackEvent instance.
   */
  build(): TrackEvent {
    return { ...this.event };
  }
}

/**
 * Create a new TrackEvent builder.
 */
export function createTrackEvent(variantKey: string, eventType: EventType): TrackEventBuilder {
  return new TrackEventBuilder(variantKey, eventType);
}
