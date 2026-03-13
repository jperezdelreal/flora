/**
 * TLDR: Deterministic pseudorandom number generator using Mulberry32 algorithm
 * Allows reproducible runs when seeded with the same value
 * Based on https://stackoverflow.com/a/47593316
 */
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  /**
   * TLDR: Generate next random number [0, 1)
   * Mulberry32 PRNG algorithm — fast and adequate for game randomness
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * TLDR: Get random integer in range [min, max]
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * TLDR: Get random element from array
   */
  choice<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }

  /**
   * TLDR: Shuffle array in-place (Fisher-Yates)
   */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * TLDR: Reset to original seed
   */
  reset(seed: number): void {
    this.state = seed;
  }

  /**
   * TLDR: Get current state (for serialization)
   */
  getState(): number {
    return this.state;
  }

  /**
   * TLDR: Set state directly (for deserialization)
   */
  setState(state: number): void {
    this.state = state;
  }
}
