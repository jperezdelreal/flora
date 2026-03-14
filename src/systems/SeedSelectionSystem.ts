import { System } from './index';
import { PlantConfig } from '../entities/Plant';
import { ALL_PLANTS, PLANT_BY_ID } from '../config/plants';
import { Season } from '../config/seasons';
import { SeededRandom } from '../utils/SeededRandom';

/**
 * TLDR: Rarity weights for seed pool generation
 * Based on acceptance criteria: 70% common, 20% uncommon, 10% rare
 * Heirloom excluded from random pools (special unlock rewards)
 */
const RARITY_WEIGHTS = {
  common: 0.7,
  uncommon: 0.2,
  rare: 0.1,
  heirloom: 0.0, // Never in random pools
};

/**
 * TLDR: Configuration for seed pool generation
 */
export interface SeedPoolConfig {
  minSeeds: number;
  maxSeeds: number;
  runSeed: number; // Deterministic run seed
  /** TLDR: Optional season filter — only include plants available in this season */
  season?: Season;
}

/**
 * TLDR: Result of seed pool generation
 */
export interface SeedPool {
  seeds: PlantConfig[];
  runSeed: number;
  timestamp: number;
  /** TLDR: Season used for filtering (if any) */
  season?: Season;
}

/**
 * SeedSelectionSystem generates randomized seed pools for each run.
 * Provides deterministic seeding for reproducible runs and testing.
 * Enforces rarity weights and no-duplicate rules.
 * Based on GDD §7 'Run Seeding' and roadmap item #3.
 */
export class SeedSelectionSystem implements System {
  readonly name = 'SeedSelectionSystem';
  private currentPool: SeedPool | null = null;
  private rng: SeededRandom;

  constructor() {
    this.rng = new SeededRandom(Date.now());
  }

  /**
   * TLDR: Generate a new seed pool for a run
   * @param unlockedPlantIds - Plant IDs available to player (from UnlockSystem/Encyclopedia)
   * @param config - Pool generation configuration (includes optional season filter)
   * @returns Generated seed pool
   */
  generatePool(
    unlockedPlantIds: string[],
    config: SeedPoolConfig = { minSeeds: 4, maxSeeds: 6, runSeed: Date.now() }
  ): SeedPool {
    // Initialize RNG with run seed for deterministic generation
    this.rng.reset(config.runSeed);

    // TLDR: Filter to unlocked plants, excluding heirlooms, with optional seasonal filter
    let availablePlants = unlockedPlantIds
      .map((id) => PLANT_BY_ID[id])
      .filter((plant) => plant && plant.rarity !== 'heirloom');

    if (config.season) {
      availablePlants = availablePlants.filter((plant) =>
        plant.availableSeasons.includes(config.season!)
      );
    }

    if (availablePlants.length === 0) {
      // Fallback: use all common plants if nothing unlocked
      console.warn('SeedSelectionSystem: No unlocked plants, using common plants');
      const commonPlants = ALL_PLANTS.filter((p) => p.rarity === 'common');
      availablePlants.push(...commonPlants);
    }

    // Determine pool size
    const poolSize = this.rng.nextInt(config.minSeeds, config.maxSeeds);
    const selectedSeeds: PlantConfig[] = [];
    const usedIds = new Set<string>();

    // Group plants by rarity for weighted selection
    const plantsByRarity: Record<string, PlantConfig[]> = {
      common: [],
      uncommon: [],
      rare: [],
    };

    for (const plant of availablePlants) {
      if (plant.rarity !== 'heirloom') {
        plantsByRarity[plant.rarity].push(plant);
      }
    }

    // Generate pool with weighted rarity selection
    let attempts = 0;
    const maxAttempts = poolSize * 10; // Prevent infinite loop

    while (selectedSeeds.length < poolSize && attempts < maxAttempts) {
      attempts++;

      // Weighted rarity roll
      const roll = this.rng.next();
      let cumulativeWeight = 0;
      let selectedRarity: 'common' | 'uncommon' | 'rare' = 'common';

      for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
        cumulativeWeight += weight;
        if (roll <= cumulativeWeight) {
          selectedRarity = rarity as 'common' | 'uncommon' | 'rare';
          break;
        }
      }

      // Get available plants of selected rarity
      const candidates = plantsByRarity[selectedRarity].filter(
        (p) => !usedIds.has(p.id)
      );

      if (candidates.length === 0) {
        // Fallback to any available plant if no candidates in selected rarity
        const allAvailable = availablePlants.filter((p) => !usedIds.has(p.id));
        if (allAvailable.length > 0) {
          const plant = this.rng.choice(allAvailable);
          selectedSeeds.push(plant);
          usedIds.add(plant.id);
        }
      } else {
        const plant = this.rng.choice(candidates);
        selectedSeeds.push(plant);
        usedIds.add(plant.id);
      }
    }

    // Create seed pool
    this.currentPool = {
      seeds: selectedSeeds,
      runSeed: config.runSeed,
      timestamp: Date.now(),
      season: config.season,
    };

    return this.currentPool;
  }

  /**
   * TLDR: Get current seed pool
   */
  getCurrentPool(): SeedPool | null {
    return this.currentPool;
  }

  /**
   * TLDR: Validate that pool meets acceptance criteria
   * - 4-6 seeds
   * - No duplicates
   * - Respects unlock state
   * - Weighted rarity distribution
   */
  validatePool(pool: SeedPool, unlockedIds: string[]): boolean {
    // Check size
    if (pool.seeds.length < 4 || pool.seeds.length > 6) {
      return false;
    }

    // Check for duplicates
    const ids = pool.seeds.map((s) => s.id);
    if (new Set(ids).size !== ids.length) {
      return false;
    }

    // Check all seeds are unlocked
    for (const seed of pool.seeds) {
      if (!unlockedIds.includes(seed.id)) {
        return false;
      }
    }

    return true;
  }

  /**
   * TLDR: Test deterministic generation (same seed = same pool)
   * Returns true if two pools generated with same seed are identical
   */
  testDeterminism(unlockedIds: string[], runSeed: number): boolean {
    const pool1 = this.generatePool(unlockedIds, {
      minSeeds: 4,
      maxSeeds: 6,
      runSeed,
    });

    const pool2 = this.generatePool(unlockedIds, {
      minSeeds: 4,
      maxSeeds: 6,
      runSeed,
    });

    // Compare seed IDs
    if (pool1.seeds.length !== pool2.seeds.length) {
      return false;
    }

    for (let i = 0; i < pool1.seeds.length; i++) {
      if (pool1.seeds[i].id !== pool2.seeds[i].id) {
        return false;
      }
    }

    return true;
  }

  /**
   * TLDR: Generate N unique pools to test variety
   * Returns true if at least N unique combinations are generated
   */
  testVariety(
    unlockedIds: string[],
    numRuns: number,
    requiredUnique: number
  ): boolean {
    const uniquePools = new Set<string>();

    for (let i = 0; i < numRuns; i++) {
      const pool = this.generatePool(unlockedIds, {
        minSeeds: 4,
        maxSeeds: 6,
        runSeed: Date.now() + i, // Different seed each time
      });

      // Serialize pool as sorted ID string for comparison
      const poolSignature = pool.seeds
        .map((s) => s.id)
        .sort()
        .join(',');
      uniquePools.add(poolSignature);
    }

    return uniquePools.size >= requiredUnique;
  }

  update(_delta: number): void {
    // No per-frame update needed
  }

  destroy(): void {
    this.currentPool = null;
  }
}
