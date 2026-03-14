// TLDR: Run modifier definitions for daily challenges and custom runs

/** TLDR: Unique identifier for each run modifier */
export type ModifierId =
  | 'drought_season'
  | 'bountiful_harvest'
  | 'speedrun'
  | 'wild_growth';

/** TLDR: Modifier definition — describes effect, UI label, and gameplay impact */
export interface ModifierConfig {
  readonly id: ModifierId;
  readonly name: string;
  readonly emoji: string;
  readonly description: string;
  /** TLDR: Short tooltip for modifier card */
  readonly tooltip: string;
  /** TLDR: Difficulty tag shown in UI */
  readonly difficulty: 'easy' | 'normal' | 'hard';
  /** TLDR: Score multiplier applied when this modifier is active */
  readonly scoreMultiplier: number;
  /** TLDR: Gameplay effect parameters keyed by mechanic */
  readonly effects: ModifierEffects;
}

/** TLDR: Structured gameplay effects a modifier applies */
export interface ModifierEffects {
  /** TLDR: Multiplier for water drain rate (1.0 = normal) */
  waterDrainMultiplier?: number;
  /** TLDR: Extra seeds added to seed pool */
  extraSeeds?: number;
  /** TLDR: Multiplier for season length (1.0 = normal) */
  seasonLengthMultiplier?: number;
  /** TLDR: Chance per day of a random synergy boost on a plant */
  randomSynergyChance?: number;
  /** TLDR: Multiplier for synergy growth speed bonus */
  synergyBoostMultiplier?: number;
}

/** TLDR: All available run modifiers */
export const MODIFIERS: Record<ModifierId, ModifierConfig> = {
  drought_season: {
    id: 'drought_season',
    name: 'Drought Season',
    emoji: '🏜️',
    description: 'Water drains twice as fast. Every drop counts.',
    tooltip: '2× water drain rate',
    difficulty: 'hard',
    scoreMultiplier: 1.5,
    effects: {
      waterDrainMultiplier: 2.0,
    },
  },
  bountiful_harvest: {
    id: 'bountiful_harvest',
    name: 'Bountiful Harvest',
    emoji: '🌾',
    description: 'Start with extra seeds in your pool. More variety, more opportunity.',
    tooltip: '+3 extra seeds in pool',
    difficulty: 'easy',
    scoreMultiplier: 0.8,
    effects: {
      extraSeeds: 3,
    },
  },
  speedrun: {
    id: 'speedrun',
    name: 'Speedrun',
    emoji: '⏱️',
    description: 'Seasons are half as long. Can you make every day count?',
    tooltip: 'Half-length seasons',
    difficulty: 'hard',
    scoreMultiplier: 1.75,
    effects: {
      seasonLengthMultiplier: 0.5,
    },
  },
  wild_growth: {
    id: 'wild_growth',
    name: 'Wild Growth',
    emoji: '🌿',
    description: 'Random synergy boosts appear each day. Embrace the chaos.',
    tooltip: 'Random daily synergy boosts',
    difficulty: 'normal',
    scoreMultiplier: 1.0,
    effects: {
      randomSynergyChance: 0.3,
      synergyBoostMultiplier: 1.5,
    },
  },
};

/** TLDR: Get all modifier configs as an array */
export function getAllModifiers(): ModifierConfig[] {
  return Object.values(MODIFIERS);
}

/** TLDR: Get modifier config by ID (returns undefined if invalid) */
export function getModifierById(id: ModifierId): ModifierConfig | undefined {
  return MODIFIERS[id];
}

/** TLDR: Calculate combined score multiplier for a set of active modifiers */
export function getCombinedScoreMultiplier(activeIds: ModifierId[]): number {
  let multiplier = 1.0;
  for (const id of activeIds) {
    const mod = MODIFIERS[id];
    if (mod) {
      // TLDR: Stack multiplicatively so hard combos are rewarded
      multiplier *= mod.scoreMultiplier;
    }
  }
  return multiplier;
}

/** TLDR: Merge effects from multiple active modifiers into one summary */
export function mergeModifierEffects(activeIds: ModifierId[]): Required<ModifierEffects> {
  const merged: Required<ModifierEffects> = {
    waterDrainMultiplier: 1.0,
    extraSeeds: 0,
    seasonLengthMultiplier: 1.0,
    randomSynergyChance: 0.0,
    synergyBoostMultiplier: 1.0,
  };

  for (const id of activeIds) {
    const mod = MODIFIERS[id];
    if (!mod) continue;
    const fx = mod.effects;

    if (fx.waterDrainMultiplier !== undefined) {
      merged.waterDrainMultiplier *= fx.waterDrainMultiplier;
    }
    if (fx.extraSeeds !== undefined) {
      merged.extraSeeds += fx.extraSeeds;
    }
    if (fx.seasonLengthMultiplier !== undefined) {
      merged.seasonLengthMultiplier *= fx.seasonLengthMultiplier;
    }
    if (fx.randomSynergyChance !== undefined) {
      merged.randomSynergyChance = Math.max(merged.randomSynergyChance, fx.randomSynergyChance);
    }
    if (fx.synergyBoostMultiplier !== undefined) {
      merged.synergyBoostMultiplier *= fx.synergyBoostMultiplier;
    }
  }

  return merged;
}
