/**
 * Unit tests for LRU Cache
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LRUCache, getFileHash } from '../../../src/utils/cache.js';
import path from 'path';
import { SKILLS_FIXTURES_DIR } from '../../setup.js';

describe('LRUCache', () => {
  let cache: LRUCache<string>;

  beforeEach(() => {
    cache = new LRUCache<string>(3); // Small cache for testing
  });

  describe('set and get', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should track cache misses', () => {
      cache.get('nonexistent');
      
      const metrics = cache.getMetrics();
      expect(metrics.misses).toBe(1);
      expect(metrics.hits).toBe(0);
    });

    it('should track cache hits', () => {
      cache.set('key1', 'value1');
      cache.get('key1');
      
      const metrics = cache.getMetrics();
      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(0);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', async () => {
      cache.set('key1', 'value1', 100); // 100ms TTL
      
      expect(cache.get('key1')).toBe('value1');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should not expire entries before TTL', async () => {
      cache.set('key1', 'value1', 1000); // 1s TTL
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(cache.get('key1')).toBe('value1');
    });
  });

  describe('LRU eviction', () => {
    it('should evict oldest entry when at capacity', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // Cache is now at capacity (3 items)
      expect(cache.size()).toBe(3);
      
      // Adding 4th item should evict key1 (oldest)
      cache.set('key4', 'value4');
      
      expect(cache.size()).toBe(3);
      expect(cache.get('key1')).toBeUndefined(); // Evicted
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });

    it('should track evictions in metrics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4'); // Triggers eviction
      
      const metrics = cache.getMetrics();
      expect(metrics.evictions).toBe(1);
    });

    it('should update LRU order on access', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // Access key1 (moves to end)
      cache.get('key1');
      
      // Now key2 is oldest, should be evicted next
      cache.set('key4', 'value4');
      
      expect(cache.get('key2')).toBeUndefined(); // Evicted
      expect(cache.get('key1')).toBe('value1'); // Still there
    });
  });

  describe('has', () => {
    it('should return true for existing keys', () => {
      cache.set('key1', 'value1');
      
      expect(cache.has('key1')).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should return false for expired keys', async () => {
      cache.set('key1', 'value1', 100);
      
      expect(cache.has('key1')).toBe(true);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(cache.has('key1')).toBe(false);
    });
  });

  describe('invalidate', () => {
    it('should remove key from cache', () => {
      cache.set('key1', 'value1');
      
      expect(cache.has('key1')).toBe(true);
      
      cache.invalidate('key1');
      
      expect(cache.has('key1')).toBe(false);
    });

    it('should return true if key was removed', () => {
      cache.set('key1', 'value1');
      
      expect(cache.invalidate('key1')).toBe(true);
    });

    it('should return false if key did not exist', () => {
      expect(cache.invalidate('nonexistent')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      expect(cache.size()).toBe(2);
      
      cache.clear();
      
      expect(cache.size()).toBe(0);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
    });

    it('should reset metrics', () => {
      cache.set('key1', 'value1');
      cache.get('key1');
      cache.get('nonexistent');
      
      cache.clear();
      
      const metrics = cache.getMetrics();
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);
      expect(metrics.evictions).toBe(0);
    });
  });

  describe('metrics', () => {
    it('should calculate hit rate correctly', () => {
      cache.set('key1', 'value1');
      
      // 2 hits, 1 miss = 66.67% hit rate
      cache.get('key1'); // hit
      cache.get('key1'); // hit
      cache.get('nonexistent'); // miss
      
      const metrics = cache.getMetrics();
      expect(metrics.hits).toBe(2);
      expect(metrics.misses).toBe(1);
      expect(metrics.hitRate).toBeCloseTo(0.6667, 2);
    });

    it('should handle zero hits/misses', () => {
      const metrics = cache.getMetrics();
      expect(metrics.hitRate).toBe(0);
    });
  });

  describe('hash-based invalidation', () => {
    it('should store hash with entry', () => {
      cache.set('key1', 'value1');
      
      const entry = cache.getEntry('key1');
      expect(entry).toBeDefined();
      expect(entry?.hash).toBeTruthy();
    });

    it('should accept custom hash', () => {
      cache.set('key1', 'value1', 3600000, 'custom-hash');
      
      const entry = cache.getEntry('key1');
      expect(entry?.hash).toBe('custom-hash');
    });
  });
});

describe('getFileHash', () => {
  it('should return hash for existing file', () => {
    const filePath = path.join(SKILLS_FIXTURES_DIR, 'test-skill', 'SKILL.md');
    
    const hash = getFileHash(filePath);
    
    expect(hash).toBeTruthy();
    expect(hash).toMatch(/^[a-f0-9]{32}$/); // MD5 format
  });

  it('should return empty string for non-existent file', () => {
    const hash = getFileHash('/nonexistent/file.txt');
    
    expect(hash).toBe('');
  });

  it('should return same hash for same content', () => {
    const filePath = path.join(SKILLS_FIXTURES_DIR, 'test-skill', 'SKILL.md');
    
    const hash1 = getFileHash(filePath);
    const hash2 = getFileHash(filePath);
    
    expect(hash1).toBe(hash2);
  });
});
