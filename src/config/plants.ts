import { PlantConfig } from '../entities/Plant';
import { Season } from './seasons';
import { SynergyTrait } from './synergies';

/**
 * Plant type definitions for Flora.
 * 22 plant types: 5 common, 7 uncommon, 4 rare, 4 heirloom (2 original + 2 expansion per tier)
 * Based on GDD §5 Garden Mechanics and Issue #120 Content Expansion
 */

// Common plants (starter variety, forgiving)
export const TOMATO: PlantConfig = {
  id: 'tomato',
  name: 'tomato',
  displayName: 'Tomato',
  growthTime: 5,
  waterNeedPerDay: 1.0,
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
  waterNeedPerDay: 0.5,
  yieldSeeds: 2,
  rarity: 'common',
  description: 'Fast-growing leafy green. Fragile but quick to harvest.',
  availableSeasons: [Season.SPRING, Season.WINTER],
  synergyTraits: [SynergyTrait.SHADE_LOVER],
};

export const CARROT: PlantConfig = {
  id: 'carrot',
  name: 'carrot',
  displayName: 'Carrot',
  growthTime: 6,
  waterNeedPerDay: 0.14,
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

// TLDR: New common plant — Pea (Spring exclusive, nitrogen fixer companion)
export const PEA: PlantConfig = {
  id: 'pea',
  name: 'pea',
  displayName: 'Pea',
  growthTime: 3,
  waterNeedPerDay: 0.33,
  yieldSeeds: 2,
  rarity: 'common',
  description: 'Spring staple legume. Fixes nitrogen in soil, boosting nearby plants.',
  availableSeasons: [Season.SPRING],
  synergyTraits: [SynergyTrait.NITROGEN_FIXER, SynergyTrait.CLIMBING],
};

// Uncommon plants (strategic choices)
export const SUNFLOWER: PlantConfig = {
  id: 'sunflower',
  name: 'sunflower',
  displayName: 'Sunflower',
  growthTime: 7,
  waterNeedPerDay: 0.33,
  yieldSeeds: 3,
  rarity: 'uncommon',
  description: 'Tall flowering plant. Takes time but yields plentiful seeds.',
  availableSeasons: [Season.SPRING, Season.SUMMER, Season.FALL],
  synergyTraits: [SynergyTrait.SHADE_PROVIDER],
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
  synergyTraits: [SynergyTrait.PEST_DETERRENT],
};

// TLDR: Pepper updated — Summer exclusive (seasonal exclusive per Issue #120)
export const PEPPER: PlantConfig = {
  id: 'pepper',
  name: 'pepper',
  displayName: 'Bell Pepper',
  growthTime: 6,
  waterNeedPerDay: 0.5,
  yieldSeeds: 2,
  rarity: 'uncommon',
  description: 'Heat-loving summer crop. Thrives in warmth, wilts in cold.',
  availableSeasons: [Season.SUMMER],
  synergyTraits: [SynergyTrait.NITROGEN_FIXER],
};

export const BASIL: PlantConfig = {
  id: 'basil',
  name: 'basil',
  displayName: 'Basil',
  growthTime: 5,
  waterNeedPerDay: 0.5,
  yieldSeeds: 2,
  rarity: 'uncommon',
  description: 'Aromatic herb with potent oils. Deters pests but inhibits some neighbors.',
  availableSeasons: [Season.SPRING, Season.SUMMER, Season.FALL],
  synergyTraits: [SynergyTrait.PEST_DETERRENT, SynergyTrait.ALLELOPATHIC],
};

// TLDR: New uncommon plant — Cucumber (water-hungry competitor)
export const CUCUMBER: PlantConfig = {
  id: 'cucumber',
  name: 'cucumber',
  displayName: 'Cucumber',
  growthTime: 5,
  waterNeedPerDay: 1.0,
  yieldSeeds: 2,
  rarity: 'uncommon',
  description: 'Vigorous vine that drinks heavily. Competes for water with neighbors.',
  availableSeasons: [Season.SPRING, Season.SUMMER],
  synergyTraits: [SynergyTrait.WATER_COMPETITOR, SynergyTrait.CLIMBING],
};

// TLDR: New uncommon plant — Blueberry (Fall exclusive, allelopathic acidifier)
export const BLUEBERRY: PlantConfig = {
  id: 'blueberry',
  name: 'blueberry',
  displayName: 'Blueberry',
  growthTime: 7,
  waterNeedPerDay: 0.5,
  yieldSeeds: 3,
  rarity: 'uncommon',
  description: 'Tart fall berry. Acidifies soil, slowing nearby plant growth.',
  availableSeasons: [Season.FALL],
  synergyTraits: [SynergyTrait.ALLELOPATHIC],
};

// Rare plants (special properties, unlockable)
export const FROST_WILLOW: PlantConfig = {
  id: 'frost_willow',
  name: 'frost_willow',
  displayName: 'Frost Willow',
  growthTime: 5,
  waterNeedPerDay: 0.14,
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

// TLDR: New rare plant — Orchid (delicate beauty that attracts pests but loves shade)
export const ORCHID: PlantConfig = {
  id: 'orchid',
  name: 'orchid',
  displayName: 'Orchid',
  growthTime: 10,
  waterNeedPerDay: 0.5,
  yieldSeeds: 1,
  rarity: 'rare',
  description: 'Exotic bloom of stunning beauty. Attracts pests but thrives in shade.',
  availableSeasons: [Season.SPRING, Season.SUMMER],
  synergyTraits: [SynergyTrait.SHADE_LOVER, SynergyTrait.PEST_ATTRACTOR],
};

// TLDR: New rare plant — Venus Flytrap (pest deterrent with allelopathic tradeoff)
export const VENUS_FLYTRAP: PlantConfig = {
  id: 'venus_flytrap',
  name: 'venus_flytrap',
  displayName: 'Venus Flytrap',
  growthTime: 8,
  waterNeedPerDay: 0.5,
  yieldSeeds: 1,
  rarity: 'rare',
  description: 'Carnivorous plant that eats pests. Its digestive secretions inhibit neighbors.',
  availableSeasons: [Season.SUMMER, Season.FALL],
  synergyTraits: [SynergyTrait.PEST_DETERRENT, SynergyTrait.ALLELOPATHIC],
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
  synergyTraits: [SynergyTrait.PEST_DETERRENT],
};

// TLDR: New heirloom — Ghost Pepper (fiery deterrent with strong allelopathy)
export const GHOST_PEPPER: PlantConfig = {
  id: 'ghost_pepper',
  name: 'ghost_pepper',
  displayName: 'Ghost Pepper',
  growthTime: 9,
  waterNeedPerDay: 0.33,
  yieldSeeds: 2,
  rarity: 'heirloom',
  description: 'Legendary hot pepper. Its intense capsaicin deters pests but scorches neighboring roots.',
  availableSeasons: [Season.SUMMER],
  synergyTraits: [SynergyTrait.PEST_DETERRENT, SynergyTrait.ALLELOPATHIC],
};

// TLDR: New heirloom — Moonflower (Winter exclusive, shade-lover that attracts nocturnal pests)
export const MOONFLOWER: PlantConfig = {
  id: 'moonflower',
  name: 'moonflower',
  displayName: 'Moonflower',
  growthTime: 8,
  waterNeedPerDay: 0.14,
  yieldSeeds: 2,
  rarity: 'heirloom',
  description: 'Mystical bloom that opens under moonlight. Thrives in shade but lures nocturnal pests.',
  availableSeasons: [Season.WINTER],
  synergyTraits: [SynergyTrait.SHADE_LOVER, SynergyTrait.PEST_ATTRACTOR],
};

/** All plant types available in the game */
export const ALL_PLANTS: PlantConfig[] = [
  // Common (5)
  TOMATO,
  LETTUCE,
  CARROT,
  RADISH,
  PEA,
  // Uncommon (7)
  SUNFLOWER,
  MINT,
  PEPPER,
  BASIL,
  CUCUMBER,
  BLUEBERRY,
  // Rare (4)
  FROST_WILLOW,
  LAVENDER,
  ORCHID,
  VENUS_FLYTRAP,
  // Heirloom (4)
  HEIRLOOM_SQUASH,
  GOLDEN_MARIGOLD,
  GHOST_PEPPER,
  MOONFLOWER,
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
