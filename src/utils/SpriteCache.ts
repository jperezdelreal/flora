import type { Container, Graphics } from 'pixi.js';
import { eventBus } from '../core/EventBus';

/**
 * TLDR: Generic cache for reusing generated PixiJS sprites
 * Reduces GC pressure by storing generated Graphics/Container objects
 * keyed by composite keys (e.g., "plantType:growthStage:season")
 */

type CacheValue = Graphics | Container;

export interface SpriteCacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

export class SpriteCache {
  private cache = new Map<string, CacheValue>();
  private hits = 0;
  private misses = 0;

  constructor() {
    // TLDR: Invalidate cache on season change
    eventBus.on('season:ended', () => this.invalidate());
  }

  /**
   * TLDR: Get cached sprite by composite key
   * Returns undefined if not cached (caller should generate and set)
   */
  get(key: string): CacheValue | undefined {
    const cached = this.cache.get(key);
    if (cached) {
      this.hits++;
      return cached;
    }
    this.misses++;
    return undefined;
  }

  /**
   * TLDR: Store a sprite in the cache
   */
  set(key: string, value: CacheValue): void {
    this.cache.set(key, value);
  }

  /**
   * TLDR: Remove a specific key from cache
   */
  delete(key: string): void {
    const cached = this.cache.get(key);
    if (cached) {
      // Don't destroy the object - it may still be in use
      this.cache.delete(key);
    }
  }

  /**
   * TLDR: Clear entire cache without destroying sprites
   * Use when season changes or major state transition
   */
  invalidate(): void {
    // TLDR: Don't destroy cached objects - they may still be in scene
    // Just clear references and let GC handle it
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * TLDR: Get cache performance stats (for FPS monitor)
   */
  getStats(): SpriteCacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  /**
   * TLDR: Check if key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * TLDR: Get current cache size
   */
  get size(): number {
    return this.cache.size;
  }
}

// TLDR: Singleton instance for global usage
export const spriteCache = new SpriteCache();
