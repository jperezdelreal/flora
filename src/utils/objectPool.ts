// TLDR: Generic object pool to reduce GC pressure from frequent alloc/dealloc cycles

/** TLDR: Factory + reset callbacks for pooled objects */
export interface PoolConfig<T> {
  create: () => T;
  reset: (obj: T) => void;
  destroy?: (obj: T) => void;
  initialSize?: number;
  maxSize?: number;
}

/**
 * TLDR: Pre-allocates and recycles objects instead of creating/destroying each frame.
 * Designed for Graphics, particles, and other hot-path allocations.
 */
export class ObjectPool<T> {
  private available: T[] = [];
  private active: Set<T> = new Set();
  private readonly config: Required<Pick<PoolConfig<T>, 'create' | 'reset'>> &
    Pick<PoolConfig<T>, 'destroy'> & { maxSize: number };

  constructor(config: PoolConfig<T>) {
    this.config = {
      create: config.create,
      reset: config.reset,
      destroy: config.destroy,
      maxSize: config.maxSize ?? 256,
    };

    // TLDR: Pre-warm the pool
    const initialSize = config.initialSize ?? 0;
    for (let i = 0; i < initialSize; i++) {
      this.available.push(this.config.create());
    }
  }

  /** TLDR: Acquire an object from the pool (or create one if empty) */
  acquire(): T {
    const obj = this.available.length > 0
      ? this.available.pop()!
      : this.config.create();
    this.active.add(obj);
    return obj;
  }

  /** TLDR: Return an object to the pool after use */
  release(obj: T): void {
    if (!this.active.has(obj)) return;
    this.active.delete(obj);
    this.config.reset(obj);

    if (this.available.length < this.config.maxSize) {
      this.available.push(obj);
    } else if (this.config.destroy) {
      this.config.destroy(obj);
    }
  }

  /** TLDR: Release all active objects back into the pool */
  releaseAll(): void {
    for (const obj of this.active) {
      this.config.reset(obj);
      if (this.available.length < this.config.maxSize) {
        this.available.push(obj);
      } else if (this.config.destroy) {
        this.config.destroy(obj);
      }
    }
    this.active.clear();
  }

  /** TLDR: Destroy all objects and empty the pool */
  drain(): void {
    if (this.config.destroy) {
      for (const obj of this.active) this.config.destroy(obj);
      for (const obj of this.available) this.config.destroy(obj);
    }
    this.active.clear();
    this.available.length = 0;
  }

  get activeCount(): number {
    return this.active.size;
  }

  get availableCount(): number {
    return this.available.length;
  }

  get totalCount(): number {
    return this.active.size + this.available.length;
  }
}
