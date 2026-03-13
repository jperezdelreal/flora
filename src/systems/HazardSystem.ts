import { System } from './index';
import { Plant } from '../entities/Plant';
import { Hazard, HazardType, PestState, PestData } from '../entities/Hazard';
import {
  PEST_CONFIG,
  getDifficultyScaling,
  scalePestConfig,
  PestConfig,
} from '../config/hazards';
import { Season, SEASON_CONFIG } from '../config/seasons';
import type { SynergySystem } from './SynergySystem';

export interface HazardSystemConfig {
  /** Current season number (for difficulty scaling) */
  seasonCount: number;
  /** Active season (drives hazard profile) */
  season: Season;
  /** Enable/disable pest spawning (overridden by season if not set explicitly) */
  enablePests?: boolean;
  /** Optional synergy system for pest deterrent checks */
  synergySystem?: SynergySystem;
}

/**
 * TLDR: HazardSystem manages pest spawning and damage
 * Weather events delegated to WeatherSystem (drought, frost, heavy rain)
 * Design: Hazards are NEVER instant-fail. Players always have counterplay.
 */
export class HazardSystem implements System {
  readonly name = 'HazardSystem';
  private hazards: Map<string, Hazard> = new Map();
  private currentDay = 0;
  private config: HazardSystemConfig;
  private pestConfig: PestConfig;

  private enablePests: boolean;
  private pestSpawnMultiplier: number;

  private pestSpawnChecked = false;

  constructor(config: HazardSystemConfig) {
    this.config = config;
    
    const scaling = getDifficultyScaling(config.seasonCount);
    this.pestConfig = scalePestConfig(PEST_CONFIG, scaling);

    const seasonCfg = SEASON_CONFIG[config.season];
    this.enablePests = config.enablePests ?? true;
    this.pestSpawnMultiplier = seasonCfg.pestSpawnMultiplier;
  }

  /** Advance day counter (called by PlantSystem or game loop) */
  onDayAdvance(day: number): void {
    this.currentDay = day;

    // TLDR: Check for pest spawning window
    if (
      this.enablePests &&
      !this.pestSpawnChecked &&
      day >= this.pestConfig.spawnWindow[0] &&
      day <= this.pestConfig.spawnWindow[1]
    ) {
      this.spawnPests();
      this.pestSpawnChecked = true;
    }
  }

  /** Spawn pests on random plants */
  private spawnPests(): void {
    // TLDR: No implementation needed here - spawning happens externally via trySpawnPestOnPlant
  }

  /**
   * TLDR: Attempt to spawn a pest on a specific plant
   * Season's pestSpawnMultiplier scales the effective resistance chance.
   * Returns true if pest was spawned, false if resisted.
   */
  trySpawnPestOnPlant(plant: Plant, allPlants?: Plant[]): boolean {
    // TLDR: Check pest deterrent synergy first
    if (this.config.synergySystem && allPlants) {
      if (this.config.synergySystem.isPestDeterrentActive(plant.x, plant.y, allPlants)) {
        return false;
      }
    }

    if (Math.random() > this.pestSpawnMultiplier) {
      return false;
    }

    if (plant.getHealth() > this.pestConfig.resistanceHealthThreshold) {
      if (Math.random() < this.pestConfig.resistanceChance) {
        return false;
      }
    }

    const pestId = `pest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const pestData: PestData = {
      targetPlantId: plant.id,
      spawnDay: this.currentDay,
      state: PestState.ACTIVE,
      damagePerDay: this.pestConfig.damagePerDay,
    };

    const pest = new Hazard(pestId, HazardType.PEST, pestData, plant.x, plant.y);
    this.hazards.set(pestId, pest);
    return true;
  }

  /** Apply pest damage to plants */
  applyPestDamage(plants: Plant[]): void {
    const pests = this.getActivePests();

    for (const pest of pests) {
      const pestData = pest.getPestData();
      if (pestData.state !== PestState.ACTIVE) {
        continue;
      }

      const targetPlant = plants.find((p) => p.id === pestData.targetPlantId);
      if (targetPlant && targetPlant.active) {
        targetPlant.takeDamage(pestData.damagePerDay);
      } else {
        pest.updatePestState(PestState.REMOVED);
      }
    }
  }

  /** Remove a pest (player action: click to pick off) */
  removePest(pestId: string): boolean {
    const hazard = this.hazards.get(pestId);
    if (hazard && hazard.isPest()) {
      hazard.updatePestState(PestState.REMOVED);
      return true;
    }
    return false;
  }

  /** Get pest at specific grid position */
  getPestAt(x: number, y: number): Hazard | undefined {
    const pests = this.getActivePests();
    return pests.find((p) => p.x === x && p.y === y);
  }

  /** Get all active pests */
  getActivePests(): Hazard[] {
    return Array.from(this.hazards.values()).filter(
      (h) => h.isPest() && h.active && h.getPestData().state === PestState.ACTIVE,
    );
  }

  /** Get all active hazards */
  getActiveHazards(): Hazard[] {
    return Array.from(this.hazards.values()).filter((h) => h.active);
  }

  /** Get hazard by ID */
  getHazard(hazardId: string): Hazard | undefined {
    return this.hazards.get(hazardId);
  }

  /** Clean up inactive hazards */
  private cleanupInactiveHazards(): void {
    const inactive = Array.from(this.hazards.values()).filter((h) => !h.active);
    for (const hazard of inactive) {
      this.hazards.delete(hazard.id);
    }
  }

  /** Get hazard statistics for UI/debugging */
  getStats(): {
    totalHazards: number;
    activePests: number;
    currentDay: number;
  } {
    return {
      totalHazards: this.hazards.size,
      activePests: this.getActivePests().length,
      currentDay: this.currentDay,
    };
  }

  /** Get pest spawn window for UI hints */
  getPestSpawnWindow(): [number, number] {
    return this.pestConfig.spawnWindow;
  }

  /** Reset the system for a new season */
  reset(seasonCount?: number, season?: Season): void {
    this.hazards.clear();
    this.currentDay = 0;
    this.pestSpawnChecked = false;

    if (seasonCount !== undefined) {
      this.config.seasonCount = seasonCount;
      const scaling = getDifficultyScaling(seasonCount);
      this.pestConfig = scalePestConfig(PEST_CONFIG, scaling);
    }

    if (season !== undefined) {
      this.config.season = season;
      const seasonCfg = SEASON_CONFIG[season];
      this.pestSpawnMultiplier = seasonCfg.pestSpawnMultiplier;
    }
  }

  /** Fixed-timestep update (placeholder - hazards are day-based) */
  update(delta: number): void {
    // TLDR: Hazards update on day advance, not frame-by-frame
  }

  /** Destroy the system (cleanup) */
  destroy(): void {
    this.hazards.clear();
  }
}
