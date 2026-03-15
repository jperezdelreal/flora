import { System } from './index';
import { Plant, HeirloomVariant } from '../entities/Plant';
import { eventBus } from '../core/EventBus';
import {
  HEIRLOOM_VARIANTS,
  BASE_MUTATION_CHANCE,
  PERFECT_CONDITION_MUTATION_CHANCE,
  HIGH_SOIL_QUALITY_THRESHOLD,
} from '../config/mutations';
import type { EncyclopediaSystem } from './EncyclopediaSystem';

export interface MutationCheckContext {
  /** Soil quality at the harvest tile (0-100) */
  soilQuality: number;
  /** Whether the plant was fully watered throughout its life */
  fullyWatered: boolean;
  /** Whether any synergy bonus was active on the plant */
  synergyActive: boolean;
}

export interface MutationResult {
  mutated: boolean;
  variant: HeirloomVariant | null;
  isNewDiscovery: boolean;
}

/**
 * TLDR: MutationSystem determines heirloom mutations on harvest.
 * - Base 5% chance on any mature harvest
 * - 15% chance under perfect conditions (high soil, fully watered, synergy active)
 * - Tracks discovered heirloom variants in the encyclopedia
 */
export class MutationSystem implements System {
  readonly name = 'MutationSystem';
  private discoveredVariants: Set<string> = new Set();
  private encyclopediaSystem?: EncyclopediaSystem;

  constructor(encyclopediaSystem?: EncyclopediaSystem) {
    this.encyclopediaSystem = encyclopediaSystem;
  }

  /** TLDR: Check if a harvested plant should mutate into an heirloom variant */
  checkMutation(plant: Plant, context: MutationCheckContext): MutationResult {
    const plantConfigId = plant.getConfig().id;
    const variants = HEIRLOOM_VARIANTS[plantConfigId];

    // No heirloom variants defined for this plant type
    if (!variants || variants.length === 0) {
      return { mutated: false, variant: null, isNewDiscovery: false };
    }

    // Determine mutation chance based on growing conditions
    const isPerfect = this.isPerfectConditions(plant, context);
    const mutationChance = isPerfect ? PERFECT_CONDITION_MUTATION_CHANCE : BASE_MUTATION_CHANCE;

    const roll = Math.random();
    if (roll > mutationChance) {
      return { mutated: false, variant: null, isNewDiscovery: false };
    }

    // Pick a random variant from available ones
    const variant = variants[Math.floor(Math.random() * variants.length)];

    // Track discovery
    const isNewDiscovery = !this.discoveredVariants.has(variant.id);
    this.discoveredVariants.add(variant.id);

    // Register with encyclopedia if available
    if (isNewDiscovery && this.encyclopediaSystem) {
      this.encyclopediaSystem.discoverPlant(variant.id);
    }

    // Emit mutation event for discovery popup
    eventBus.emit('mutation:discovered', {
      plantId: plantConfigId,
      variantId: variant.id,
      variantName: variant.displayName,
      tint: variant.tint,
    });

    return { mutated: true, variant, isNewDiscovery };
  }

  /** TLDR: Perfect conditions = high soil quality + fully watered + synergy active */
  private isPerfectConditions(plant: Plant, context: MutationCheckContext): boolean {
    const hasPerfectGrowth = plant.hasPerfectGrowth();
    const highSoilQuality = context.soilQuality >= HIGH_SOIL_QUALITY_THRESHOLD;
    const hasSynergy = context.synergyActive;

    return hasPerfectGrowth && highSoilQuality && hasSynergy;
  }

  /** TLDR: Check if a variant has been discovered */
  isVariantDiscovered(variantId: string): boolean {
    return this.discoveredVariants.has(variantId);
  }

  /** TLDR: Get all discovered variant IDs */
  getDiscoveredVariants(): string[] {
    return Array.from(this.discoveredVariants);
  }

  /** TLDR: Get discovery count stats */
  getStats(): { discovered: number; total: number } {
    const total = Object.values(HEIRLOOM_VARIANTS).reduce((sum, v) => sum + v.length, 0);
    return { discovered: this.discoveredVariants.size, total };
  }

  /** TLDR: Load previously discovered variants (for save/load) */
  loadDiscoveredVariants(variantIds: string[]): void {
    this.discoveredVariants = new Set(variantIds);
  }

  update(_delta: number): void {
    // No per-frame update needed
  }

  destroy(): void {
    this.discoveredVariants.clear();
  }
}
