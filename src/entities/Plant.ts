import { Entity } from './index';
import { Season } from '../config/seasons';
import { SynergyTrait } from '../config/synergies';

export enum GrowthStage {
  SEED = 'seed',
  SPROUT = 'sprout',
  GROWING = 'growing',
  MATURE = 'mature',
  WILTING = 'wilting',
}

export enum WaterState {
  DRY = 'dry',
  WET = 'wet',
}

export interface PlantConfig {
  readonly id: string;
  readonly name: string;
  readonly displayName: string;
  readonly growthTime: number; // in-game days to reach maturity
  readonly waterNeedPerDay: number; // 0-1 water need per day (0 = drought-tolerant, 1 = daily watering)
  readonly yieldSeeds: number; // seeds dropped on harvest
  readonly rarity: 'common' | 'uncommon' | 'rare' | 'heirloom';
  readonly description: string;
  /** Seasons when this plant can be grown */
  readonly availableSeasons: Season[];
  /** Synergy traits for adjacency bonuses */
  readonly synergyTraits?: SynergyTrait[];
}

/** TLDR: Heirloom variant definition for seed mutations */
export interface HeirloomVariant {
  readonly id: string;
  readonly name: string;
  readonly displayName: string;
  readonly tint: number; // color tint hex (e.g. gold shimmer, crystal blue)
  readonly growthSpeedBonus: number; // e.g. 0.10 = 10% faster
  readonly yieldSeedsBonus: number; // extra seeds on harvest
}

export interface PlantState {
  readonly plantId: string;
  readonly config: PlantConfig;
  growthStage: GrowthStage;
  daysGrown: number; // days since planting
  health: number; // 0-100%
  waterState: WaterState;
  daysSinceWater: number; // tracks consecutive dry days
  isMature: boolean;
  isHarvestable: boolean;
  activeSynergies: Set<string>; // TLDR: Active synergy bonus IDs
  growthSpeedMultiplier: number; // TLDR: Combined growth speed multiplier from synergies
  waterNeedMultiplier: number; // TLDR: Multiplier for water needs from negative synergies
  negativeSynergies: Set<string>; // TLDR: Active negative synergy IDs
  // TLDR: Heirloom mutation state
  isHeirloom: boolean;
  heirloomVariant: HeirloomVariant | null;
  /** Whether this plant was grown under perfect conditions (never dried, high health) */
  perfectGrowth: boolean;
}

export class Plant implements Entity {
  readonly id: string;
  x: number;
  y: number;
  active: boolean;
  private state: PlantState;

  constructor(
    id: string,
    config: PlantConfig,
    x: number,
    y: number,
  ) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.active = true;

    this.state = {
      plantId: config.id,
      config,
      growthStage: GrowthStage.SEED,
      daysGrown: 0,
      health: 100,
      waterState: WaterState.DRY,
      daysSinceWater: 0,
      isMature: false,
      isHarvestable: false,
      activeSynergies: new Set(),
      growthSpeedMultiplier: 1.0,
      waterNeedMultiplier: 1.0,
      negativeSynergies: new Set(),
      isHeirloom: false,
      heirloomVariant: null,
      perfectGrowth: true,
    };
  }

  /** Get read-only state snapshot */
  getState(): Readonly<PlantState> {
    return { ...this.state };
  }

  /** Get current growth stage */
  getGrowthStage(): GrowthStage {
    return this.state.growthStage;
  }

  /** Check if plant is mature and ready to harvest */
  canHarvest(): boolean {
    return this.state.isHarvestable && this.state.isMature;
  }

  /** Water the plant (changes state to WET, resets dry counter) */
  water(): void {
    this.state.waterState = WaterState.WET;
    this.state.daysSinceWater = 0;
  }

  /** Advance growth by one in-game day */
  advanceDay(): void {
    // Transition water state (wet plants become dry after 1 day)
    if (this.state.waterState === WaterState.WET) {
      this.state.waterState = WaterState.DRY;
    } else {
      this.state.daysSinceWater++;
    }

    // TLDR: Water need check accounts for water competition multiplier
    const effectiveWaterNeed = this.state.config.waterNeedPerDay * this.state.waterNeedMultiplier;
    const needsWater = this.state.daysSinceWater > Math.floor(1 / effectiveWaterNeed);
    
    if (needsWater && this.state.daysSinceWater > 1) {
      // Health degrades if water need is unmet for multiple days
      const healthLoss = 15 * this.state.config.waterNeedPerDay;
      this.state.health = Math.max(0, this.state.health - healthLoss);
      // TLDR: Perfect growth lost if plant takes drought damage
      this.state.perfectGrowth = false;
    }

    // Advance growth if plant is healthy (with growth speed multiplier)
    if (this.state.health > 0 && !this.state.isMature) {
      this.state.daysGrown += this.state.growthSpeedMultiplier;
    }

    // Always re-evaluate stage (handles wilting on any stage including mature)
    if (this.state.health > 0) {
      this.updateGrowthStage();
    }

    // Dead plants stop growing
    if (this.state.health <= 0) {
      this.active = false;
    }
  }

  /** Update growth stage based on days grown and health */
  private updateGrowthStage(): void {
    const config = this.state.config;
    const progress = this.state.daysGrown / config.growthTime;

    // Wilting overrides normal stage when health is critically low
    if (this.state.health < 40 && this.state.health > 0 && progress >= 0.33) {
      this.state.growthStage = GrowthStage.WILTING;
      return;
    }

    if (progress >= 1.0) {
      this.state.growthStage = GrowthStage.MATURE;
      this.state.isMature = true;
      this.state.isHarvestable = true;
    } else if (progress >= 0.66) {
      this.state.growthStage = GrowthStage.GROWING;
    } else if (progress >= 0.33) {
      this.state.growthStage = GrowthStage.SPROUT;
    } else {
      this.state.growthStage = GrowthStage.SEED;
    }
  }

  /** Harvest the plant (returns seed yield, boosted by heirloom bonus) */
  harvest(): number {
    if (!this.canHarvest()) {
      return 0;
    }

    this.active = false;
    const baseYield = this.state.config.yieldSeeds;
    const bonus = this.state.heirloomVariant?.yieldSeedsBonus ?? 0;
    return baseYield + bonus;
  }

  /** TLDR: Check if plant had perfect growing conditions */
  hasPerfectGrowth(): boolean {
    return this.state.perfectGrowth && this.state.health >= 90;
  }

  /** TLDR: Check if this plant has an active synergy bonus */
  hasSynergyActive(): boolean {
    return this.state.activeSynergies.size > 0;
  }

  /** TLDR: Mark this plant as an heirloom variant */
  setHeirloomVariant(variant: HeirloomVariant): void {
    this.state.isHeirloom = true;
    this.state.heirloomVariant = variant;
    // Heirlooms grow slightly faster
    this.state.growthSpeedMultiplier *= (1 + variant.growthSpeedBonus);
  }

  /** TLDR: Get heirloom variant if any */
  getHeirloomVariant(): HeirloomVariant | null {
    return this.state.heirloomVariant;
  }

  /** TLDR: Check if this plant is an heirloom */
  isHeirloom(): boolean {
    return this.state.isHeirloom;
  }

  /** Apply damage to plant health (from pests, hazards, etc.) */
  takeDamage(amount: number): void {
    this.state.health = Math.max(0, this.state.health - amount);
    if (this.state.health <= 0) {
      this.active = false;
    }
  }

  /** Get current health percentage */
  getHealth(): number {
    return this.state.health;
  }

  /** Get plant config */
  getConfig(): PlantConfig {
    return this.state.config;
  }

  /** TLDR: Apply synergy bonuses to plant */
  applySynergyBonuses(bonuses: { growthSpeedMultiplier?: number; healthBonus?: number }, synergyId: string): void {
    if (bonuses.growthSpeedMultiplier) {
      this.state.growthSpeedMultiplier *= bonuses.growthSpeedMultiplier;
    }
    if (bonuses.healthBonus) {
      this.state.health = Math.min(100, this.state.health + bonuses.healthBonus);
    }
    this.state.activeSynergies.add(synergyId);
  }

  /** TLDR: Apply negative synergy penalty to plant */
  applyNegativeSynergy(penalty: { waterNeedMultiplier?: number; growthSpeedMultiplier?: number }, synergyId: string): void {
    if (penalty.waterNeedMultiplier) {
      this.state.waterNeedMultiplier *= penalty.waterNeedMultiplier;
    }
    if (penalty.growthSpeedMultiplier) {
      this.state.growthSpeedMultiplier *= penalty.growthSpeedMultiplier;
    }
    this.state.negativeSynergies.add(synergyId);
  }

  /** TLDR: Get active negative synergies */
  getNegativeSynergies(): Set<string> {
    return new Set(this.state.negativeSynergies);
  }

  /** TLDR: Get water need multiplier */
  getWaterNeedMultiplier(): number {
    return this.state.waterNeedMultiplier;
  }

  /** TLDR: Clear all synergy bonuses */
  clearSynergies(): void {
    this.state.activeSynergies.clear();
    this.state.negativeSynergies.clear();
    this.state.growthSpeedMultiplier = 1.0;
    this.state.waterNeedMultiplier = 1.0;
  }

  /** TLDR: Get active synergies */
  getActiveSynergies(): Set<string> {
    return new Set(this.state.activeSynergies);
  }

  /** TLDR: Get growth speed multiplier */
  getGrowthSpeedMultiplier(): number {
    return this.state.growthSpeedMultiplier;
  }
}
