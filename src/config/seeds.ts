import type { Seed } from '../ui';

/**
 * Seed configuration data
 * Defines available seeds, unlock requirements, and seasonal availability
 */
export const SEED_CONFIG: readonly Seed[] = [
  { name: 'Tomato', icon: '🍅', available: true },
  { name: 'Lettuce', icon: '🥬', available: true },
  { name: 'Carrot', icon: '🥕', available: true },
  { name: 'Sunflower', icon: '🌻', available: true },
  { name: 'Mint', icon: '🌿', available: false },
  { name: 'Frost Willow', icon: '❄️', available: false },
] as const;
