/**
 * Simple Cache Implementation
 * 
 * A lightweight cache implementation for backend use that doesn't depend on frontend code.
 * Provides basic caching functionality with TTL and size limits.
 */

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

/**
 * Simple cache implementation with TTL and size limits
 */
export class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly _maxSize: number;
  private readonly defaultTtl: number;

  constructor(maxSize: number = 100, defaultTtl: number = 5000) {
    this._maxSize = maxSize;
    this.defaultTtl = defaultTtl;
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get max cache size
   */
  get maxSize(): number {
    return this._maxSize;
  }

  /**
   * Get default TTL in milliseconds
   */
  get ttlMs(): number {
    return this.defaultTtl;
  }

  /**
   * Set a value in the cache
   */
  set(key: string, value: T, ttl?: number): void {
    // Clean expired entries if cache is full
    if (this.cache.size >= this._maxSize) {
      this.cleanExpired();
      
      // If still full after cleaning, remove oldest entry
      if (this.cache.size >= this._maxSize) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) {
          this.cache.delete(firstKey);
        }
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTtl
    });
  }

  /**
   * Get a value from the cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Delete a key from the cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean expired entries
   */
  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}