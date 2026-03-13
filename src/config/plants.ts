import { PlantConfig } from '../entities/Plant';
import { Season } from './seasons';

/**
 * Plant type definitions for Flora MVP.
 * 12 plant types: 4 common, 4 uncommon, 2 rare, 2 heirloom
 * Based on GDD §5 Garden Mechanics and §10 MVP Scope
 */

// Common plants (starter variety, forgiving)
export const TOMATO: PlantConfig = {
  id: 'tomato',
  name: 'tomato',
  displayName: 'Tomato',
  growthTime: 5,
  waterNeedPerDay: 1.0, // needs daily watering
  yieldSeeds: 2,
  rarity: 'common',
  description: 'Classic garden staple. Requires daily watering but rewards with reliable yield.',
  availableSeasons: [Season.SPRING, Season.SUMMER],
};

export const LETTUCE: PlantConfig = {
  id: 'lettuce',
  name: 'lettuce',
  displayName: 'Lettuce',
  growthTime: 3,
  waterNeedPerDay: 0.5, // every other day
  yieldSeeds: 2,
  rarity: 'common',
  description: 'Fast-growing leafy green. Fragile but quick to harvest.',
  availableSeasons: [Season.SPRING, Season.WINTER],
};

export const CARROT: PlantConfig = {
  id: 'carrot',
  name: 'carrot',
  displayName: 'Carrot',
  growthTime: 6,
  waterNeedPerDay: 0.14, // ~once per week
  yieldSeeds: 1,
  rarity: 'common',
  description: 'Hardy root crop. Slow growth but drought-tolerant.',
  availableSeasons: [Season.SPRING, Season.SUMMER, Season.FALL, Season.WINTER],
};

export const RADISH: PlantConfig = {
  id: 'radish',
  name: 'radish',
  displayName: 'Radish',
  growthTime: 4,
  waterNeedPerDay: 0.5,
  yieldSeeds: 2,
  rarity: 'common',
  description: 'Quick-growing root vegetable. Perfect for early harvests.',
  availableSeasons: [Season.SPRING, Season.FALL, Season.WINTER],
};

// Uncommon plants (strategic choices)
export const SUNFLOWER: PlantConfig = {
  id: 'sunflower',
  name: 'sunflower',
  displayName: 'Sunflower',
  growthTime: 7,
  waterNeedPerDay: 0.33, // moderate watering
  yieldSeeds: 3,
  rarity: 'uncommon',
  description: 'Tall flowering plant. Takes time but yields plentiful seeds.',
  availableSeasons: [Season.SPRING, Season.SUMMER, Season.FALL],
};

export const MINT: PlantConfig = {
  id: 'mint',
  name: 'mint',
  displayName: 'Mint',
  growthTime: 4,
  waterNeedPerDay: 1.0,
  yieldSeeds: 2,
  rarity: 'uncommon',
  description: 'Fragrant herb. Needs consistent moisture but grows vigorously.',
  availableSeasons: [Season.SPRING, Season.FALL],
};

export const PEPPER: PlantConfig = {
  id: 'pepper',
  name: 'pepper',
  displayName: 'Bell Pepper',
  growthTime: 6,
  waterNeedPerDay: 0.5,
  yieldSeeds: 2,
  rarity: 'uncommon',
  description: 'Warm-season favorite. Moderate care yields colorful harvests.',
  availableSeasons: [Season.SPRING, Season.SUMMER, Season.FALL],
};

export const BASIL: PlantConfig = {
  id: 'basil',
  name: 'basil',
  displayName: 'Basil',
  growthTime: 5,
  waterNeedPerDay: 0.5,
  yieldSeeds: 2,
  rarity: 'uncommon',
  description: 'Aromatic herb. Thrives with regular attention.',
  availableSeasons: [Season.SPRING, Season.SUMMER, Season.FALL],
};

// Rare plants (special properties, unlockable)
export const FROST_WILLOW: PlantConfig = {
  id: 'frost_willow',
  name: 'frost_willow',
  displayName: 'Frost Willow',
  growthTime: 5,
  waterNeedPerDay: 0.14, // weekly watering
  yieldSeeds: 1,
  rarity: 'rare',
  description: 'Cold-resistant ornamental. Survives harsh conditions others cannot.',
  availableSeasons: [Season.WINTER],
};

export const LAVENDER: PlantConfig = {
  id: 'lavender',
  name: 'lavender',
  displayName: 'Lavender',
  growthTime: 8,
  waterNeedPerDay: 0.2,
  yieldSeeds: 2,
  rarity: 'rare',
  description: 'Fragrant perennial. Slow to mature but extremely drought-tolerant.',
  availableSeasons: [Season.SPRING, Season.SUMMER, Season.FALL],
};

// Heirloom plants (premium unlocks, unique traits)
export const HEIRLOOM_SQUASH: PlantConfig = {
  id: 'heirloom_squash',
  name: 'heirloom_squash',
  displayName: 'Heirloom Squash',
  growthTime: 8,
  waterNeedPerDay: 0.33,
  yieldSeeds: 3,
  rarity: 'heirloom',
  description: 'Rare heritage variety. Long growth time rewarded with abundant seeds.',
  availableSeasons: [Season.SPRING, Season.SUMMER, Season.FALL],
};

export const GOLDEN_MARIGOLD: PlantConfig = {
  id: 'golden_marigold',
  name: 'golden_marigold',
  displayName: 'Golden Marigold',
  growthTime: 6,
  waterNeedPerDay: 0.5,
  yieldSeeds: 3,
  rarity: 'heirloom',
  description: 'Legendary flower. Vibrant blooms and generous seed yield.',
  availableSeasons: [Season.SPRING, Season.SUMMER, Season.FALL],
};

/** All plant types available in the game */
export const ALL_PLANTS: PlantConfig[] = [
  // Common (4)
  TOMATO,
  LETTUCE,
  CARROT,
  RADISH,
  // Uncommon (4)
  SUNFLOWER,
  MINT,
  PEPPER,
  BASIL,
  // Rare (2)
  FROST_WILLOW,
  LAVENDER,
  // Heirloom (2)
  HEIRLOOM_SQUASH,
  GOLDEN_MARIGOLD,
];

/** Plant lookup by ID */
export const PLANT_BY_ID: Record<string, PlantConfig> = ALL_PLANTS.reduce(
  (acc, plant) => {
    acc[plant.id] = plant;
    return acc;
  },
  {} as Record<string, PlantConfig>,
);

/** Get plants by rarity tier */
export function getPlantsByRarity(rarity: PlantConfig['rarity']): PlantConfig[] {
  return ALL_PLANTS.filter((plant) => plant.rarity === rarity);
}

/** Get plants available in the given season */
export function getPlantsBySeason(season: Season): PlantConfig[] {
  return ALL_PLANTS.filter((plant) => plant.availableSeasons.includes(season));
}

/** Get a random plant from the collection */
export function getRandomPlant(): PlantConfig {
  return ALL_PLANTS[Math.floor(Math.random() * ALL_PLANTS.length)];
}

/** Get random plants weighted by rarity */
export function getRandomPlants(count: number): PlantConfig[] {
  const weights = { common: 0.5, uncommon: 0.3, rare: 0.15, heirloom: 0.05 };
  const selected: PlantConfig[] = [];
  const available = [...ALL_PLANTS];

  for (let i = 0; i < count && available.length > 0; i++) {
    const roll = Math.random();
    let cumulativeWeight = 0;
    let targetRarity: PlantConfig['rarity'] = 'common';

    for (const [rarity, weight] of Object.entries(weights)) {
      cumulativeWeight += weight;
      if (roll <= cumulativeWeight) {
        targetRarity = rarity as PlantConfig['rarity'];
        break;
      }
    }

    const candidates = available.filter((p) => p.rarity === targetRarity);
    if (candidates.length > 0) {
      const plant = candidates[Math.floor(Math.random() * candidates.length)];
      selected.push(plant);
      available.splice(available.indexOf(plant), 1);
    }
  }

  return selected;
}
