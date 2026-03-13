import { Entity } from './index';
import { Season } from '../config/seasons';
import { SynergyTrait } from '../config/synergies';

export enum GrowthStage {
  SEED = 'seed',
  SPROUT = 'sprout',
  GROWING = 'growing',
  MATURE = 'mature',
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

    // Check if plant needs water based on config
    const needsWater = this.state.daysSinceWater > Math.floor(1 / this.state.config.waterNeedPerDay);
    
    if (needsWater && this.state.daysSinceWater > 1) {
      // Health degrades if water need is unmet for multiple days
      const healthLoss = 15 * this.state.config.waterNeedPerDay;
      this.state.health = Math.max(0, this.state.health - healthLoss);
    }

    // Advance growth if plant is healthy (with growth speed multiplier)
    if (this.state.health > 0 && !this.state.isMature) {
      this.state.daysGrown += this.state.growthSpeedMultiplier;
      this.updateGrowthStage();
    }

    // Dead plants stop growing
    if (this.state.health <= 0) {
      this.active = false;
    }
  }

  /** Update growth stage based on days grown */
  private updateGrowthStage(): void {
    const config = this.state.config;
    const progress = this.state.daysGrown / config.growthTime;

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

  /** Harvest the plant (returns seed yield) */
  harvest(): number {
    if (!this.canHarvest()) {
      return 0;
    }

    this.active = false;
    return this.state.config.yieldSeeds;
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

  /** TLDR: Clear all synergy bonuses */
  clearSynergies(): void {
    this.state.activeSynergies.clear();
    this.state.growthSpeedMultiplier = 1.0;
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
