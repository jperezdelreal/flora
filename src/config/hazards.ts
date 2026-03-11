/**
 * Hazard configuration for Flora MVP.
 * Based on GDD §5 Garden Mechanics — Hazards (Non-Combat)
 * 
 * Design principles:
 * - Hazards are puzzles, not instant-fail events
 * - Players always have counterplay options
 * - Difficulty scales over seasons using 0..1 ramp
 */

export interface PestConfig {
  /** Day range when pests can spawn [min, max] */
  spawnWindow: [number, number];
  /** Maximum pests per spawn event */
  maxPestsPerEvent: number;
  /** Damage dealt to plant per day if pest not removed */
  damagePerDay: number;
  /** Minimum plant health for pest resistance check */
  resistanceHealthThreshold: number;
  /** Chance for healthy plant to resist infestation (0-1) */
  resistanceChance: number;
}

export interface DroughtConfig {
  /** Day when drought warning appears */
  warningDay: number;
  /** Duration of drought in days [min, max] */
  duration: [number, number];
  /** Multiplier for plant water needs during drought */
  waterNeedMultiplier: number;
  /** Visual warning intensity (for UI) */
  warningIntensity: number;
}

export interface HazardDifficultyScaling {
  /** Difficulty ramp (0 = easiest, 1 = hardest) */
  difficulty: number;
  /** Pest spawn chance multiplier */
  pestSpawnChance: number;
  /** Drought intensity multiplier */
  droughtIntensity: number;
  /** Max simultaneous hazards */
  maxSimultaneousHazards: number;
}

/** Base pest configuration */
export const PEST_CONFIG: PestConfig = {
  spawnWindow: [6, 8],
  maxPestsPerEvent: 2,
  damagePerDay: 12,
  resistanceHealthThreshold: 70,
  resistanceChance: 0.3,
};

/** Base drought configuration */
export const DROUGHT_CONFIG: DroughtConfig = {
  warningDay: 5,
  duration: [2, 3],
  waterNeedMultiplier: 1.5,
  warningIntensity: 0.75,
};

/**
 * Difficulty scaling curve (0..1 ramp over seasons)
 * Inspired by ComeRosquillas ghost AI difficulty progression
 */
export function getDifficultyScaling(seasonCount: number): HazardDifficultyScaling {
  // Difficulty ramps from 0 (season 1) to 1 (season 9+)
  const difficulty = Math.min(1.0, seasonCount / 9);

  return {
    difficulty,
    // Pest spawn chance: 0.5x → 1.2x (easy to hard)
    pestSpawnChance: 0.5 + difficulty * 0.7,
    // Drought intensity: 1.0x → 1.3x (water need multiplier)
    droughtIntensity: 1.0 + difficulty * 0.3,
    // Max hazards: 1 → 3 (early to late game)
    maxSimultaneousHazards: Math.ceil(1 + difficulty * 2),
  };
}

/**
 * Apply difficulty scaling to pest config
 */
export function scalePestConfig(
  baseConfig: PestConfig,
  scaling: HazardDifficultyScaling,
): PestConfig {
  return {
    ...baseConfig,
    maxPestsPerEvent: Math.ceil(baseConfig.maxPestsPerEvent * scaling.pestSpawnChance),
    damagePerDay: Math.floor(baseConfig.damagePerDay * (1 + scaling.difficulty * 0.5)),
    resistanceChance: baseConfig.resistanceChance * (1 - scaling.difficulty * 0.2),
  };
}

/**
 * Apply difficulty scaling to drought config
 */
export function scaleDroughtConfig(
  baseConfig: DroughtConfig,
  scaling: HazardDifficultyScaling,
): DroughtConfig {
  return {
    ...baseConfig,
    waterNeedMultiplier: baseConfig.waterNeedMultiplier * scaling.droughtIntensity,
    duration: [
      baseConfig.duration[0],
      Math.ceil(baseConfig.duration[1] * (1 + scaling.difficulty * 0.5)),
    ],
  };
}
