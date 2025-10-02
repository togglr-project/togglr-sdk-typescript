import { CacheEntry, CacheConfig } from './types';

/**
 * Simple LRU cache implementation for feature evaluation results.
 */
export class LRUCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxSize: number;
  private readonly ttlSeconds: number;

  constructor(maxSize: number, ttlSeconds: number) {
    this.maxSize = maxSize;
    this.ttlSeconds = ttlSeconds;
  }

  /**
   * Get an entry from the cache.
   */
  get(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry;
  }

  /**
   * Set an entry in the cache.
   */
  set(key: string, value: string, enabled: boolean, found: boolean): void {
    // Remove oldest entry if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const entry: CacheEntry = {
      value,
      enabled,
      found,
      timestamp: Date.now(),
    };

    this.cache.set(key, entry);
  }

  /**
   * Clear all entries from the cache.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get current cache size.
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Check if an entry is expired.
   */
  private isExpired(entry: CacheEntry): boolean {
    const now = Date.now();
    const age = (now - entry.timestamp) / 1000; // Convert to seconds
    return age > this.ttlSeconds;
  }
}

/**
 * Create a cache instance from configuration.
 */
export function createCache(config: CacheConfig): LRUCache | null {
  if (!config.enabled) {
    return null;
  }

  return new LRUCache(config.maxSize, config.ttlSeconds);
}
