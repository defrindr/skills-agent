/**
 * LRU Cache implementation with TTL support
 */

import crypto from 'crypto';
import fs from 'fs';

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number; // milliseconds
  hash: string; // Content hash for invalidation
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  hitRate: number;
}

export class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private maxSize: number;
  private metrics: CacheMetrics;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.metrics = { hits: 0, misses: 0, evictions: 0, hitRate: 0 };
  }

  /**
   * Set a value in cache
   */
  set(key: string, value: T, ttl: number = 3600000, hash?: string): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
        this.metrics.evictions++;
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
      hash: hash || this.hashValue(value)
    });
  }

  /**
   * Get a value from cache (returns undefined if expired or not found)
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.metrics.misses++;
      this.updateHitRate();
      return undefined;
    }

    // Check TTL
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      this.metrics.misses++;
      this.updateHitRate();
      return undefined;
    }

    // Move to end (LRU - most recently used goes to end)
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    this.metrics.hits++;
    this.updateHitRate();
    return entry.value;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Get cache entry (including metadata)
   */
  getEntry(key: string): CacheEntry<T> | undefined {
    return this.cache.get(key);
  }

  /**
   * Invalidate (remove) a key
   */
  invalidate(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.metrics = { hits: 0, misses: 0, evictions: 0, hitRate: 0 };
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Hash value for invalidation checks
   */
  private hashValue(value: any): string {
    try {
      const str = typeof value === 'string' ? value : JSON.stringify(value);
      return crypto.createHash('md5').update(str).digest('hex');
    } catch {
      return '';
    }
  }

  /**
   * Update hit rate metric
   */
  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;
  }
}

/**
 * Get file content hash for cache invalidation
 */
export function getFileHash(filePath: string): string {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return crypto.createHash('md5').update(content).digest('hex');
  } catch {
    return '';
  }
}

/**
 * Global cache instances
 */
export const skillCache = new LRUCache<any>(50); // 50 skills max
export const frameworkCache = new LRUCache<any>(20); // 20 projects max
export const personaCache = new LRUCache<any>(30); // 30 persona contexts max

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  skillCache.clear();
  frameworkCache.clear();
  personaCache.clear();
}

/**
 * Get aggregated cache statistics
 */
export function getCacheStats() {
  return {
    skill: {
      size: skillCache.size(),
      ...skillCache.getMetrics()
    },
    framework: {
      size: frameworkCache.size(),
      ...frameworkCache.getMetrics()
    },
    persona: {
      size: personaCache.size(),
      ...personaCache.getMetrics()
    }
  };
}
