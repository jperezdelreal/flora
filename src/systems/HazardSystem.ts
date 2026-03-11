import { System } from './index';
import { Plant } from '../entities/Plant';
import { Hazard, HazardType, PestState, PestData, DroughtData } from '../entities/Hazard';
import {
  PEST_CONFIG,
  DROUGHT_CONFIG,
  getDifficultyScaling,
  scalePestConfig,
  scaleDroughtConfig,
  PestConfig,
  DroughtConfig,
} from '../config/hazards';

export interface HazardSystemConfig {
  /** Current season number (for difficulty scaling) */
  seasonCount: number;
  /** Enable/disable pest spawning */
  enablePests: boolean;
  /** Enable/disable drought events */
  enableDrought: boolean;
}

/**
 * HazardSystem manages environmental challenges:
 * - Pest spawning on random plants (day 6-8)
 * - Drought weather events (day 5+, increases water needs)
 * - Difficulty scaling across seasons
 * 
 * Design: Hazards are NEVER instant-fail. Players always have counterplay.
 */
export class HazardSystem implements System {
  readonly name = 'HazardSystem';
  private hazards: Map<string, Hazard> = new Map();
  private currentDay = 0;
  private config: HazardSystemConfig;
  private pestConfig: PestConfig;
  private droughtConfig: DroughtConfig;
  private activeDrought: Hazard | null = null;

  // Spawn tracking
  private pestSpawnChecked = false;
  private droughtSpawnChecked = false;

  constructor(config: HazardSystemConfig) {
    this.config = config;
    
    // Apply difficulty scaling
    const scaling = getDifficultyScaling(config.seasonCount);
    this.pestConfig = scalePestConfig(PEST_CONFIG, scaling);
    this.droughtConfig = scaleDroughtConfig(DROUGHT_CONFIG, scaling);
  }

  /** Advance day counter (called by PlantSystem or game loop) */
  onDayAdvance(day: number): void {
    this.currentDay = day;

    // Check for pest spawning window
    if (
      this.config.enablePests &&
      !this.pestSpawnChecked &&
      day >= this.pestConfig.spawnWindow[0] &&
      day <= this.pestConfig.spawnWindow[1]
    ) {
      this.spawnPests();
      this.pestSpawnChecked = true;
    }

    // Check for drought event
    if (
      this.config.enableDrought &&
      !this.droughtSpawnChecked &&
      day >= this.droughtConfig.warningDay
    ) {
      this.spawnDrought();
      this.droughtSpawnChecked = true;
    }

    // Advance active hazards
    this.advanceHazards();
  }

  /** Spawn pests on random plants */
  private spawnPests(): void {
    // No implementation needed here - spawning happens externally
    // This is a hook for future plant-targeting logic
  }

  /**
   * Attempt to spawn a pest on a specific plant
   * Returns true if pest was spawned, false if resisted
   */
  trySpawnPestOnPlant(plant: Plant): boolean {
    // Healthy plants have resistance chance
    if (plant.getHealth() > this.pestConfig.resistanceHealthThreshold) {
      if (Math.random() < this.pestConfig.resistanceChance) {
        return false; // Pest resisted
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

  /** Spawn drought weather event */
  private spawnDrought(): void {
    if (this.activeDrought) {
      return; // Only one drought at a time
    }

    const duration =
      this.droughtConfig.duration[0] +
      Math.floor(
        Math.random() * (this.droughtConfig.duration[1] - this.droughtConfig.duration[0] + 1),
      );

    const droughtId = `drought_${Date.now()}`;
    const droughtData: DroughtData = {
      startDay: this.currentDay,
      duration,
      daysRemaining: duration,
      waterNeedMultiplier: this.droughtConfig.waterNeedMultiplier,
      isActive: true,
    };

    const drought = new Hazard(droughtId, HazardType.DROUGHT, droughtData);
    this.hazards.set(droughtId, drought);
    this.activeDrought = drought;
  }

  /** Advance all active hazards by one day */
  private advanceHazards(): void {
    const hazards = this.getActiveHazards();

    for (const hazard of hazards) {
      if (hazard.isDrought()) {
        hazard.advanceDrought();
        if (!hazard.active) {
          this.activeDrought = null;
        }
      }
    }

    // Clean up inactive hazards
    this.cleanupInactiveHazards();
  }

  /** Apply pest damage to target plants */
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
        // Target plant is dead/harvested, remove pest
        pest.updatePestState(PestState.REMOVED);
      }
    }
  }

  /** Get current drought water need multiplier (1.0 if no drought) */
  getDroughtMultiplier(): number {
    if (this.activeDrought && this.activeDrought.active) {
      const droughtData = this.activeDrought.getDroughtData();
      return droughtData.waterNeedMultiplier;
    }
    return 1.0;
  }

  /** Check if drought is currently active */
  isDroughtActive(): boolean {
    return this.activeDrought !== null && this.activeDrought.active;
  }

  /** Get drought data for UI display */
  getDroughtInfo():
    | { active: true; daysRemaining: number; multiplier: number }
    | { active: false } {
    if (this.isDroughtActive() && this.activeDrought) {
      const data = this.activeDrought.getDroughtData();
      return {
        active: true,
        daysRemaining: data.daysRemaining,
        multiplier: data.waterNeedMultiplier,
      };
    }
    return { active: false };
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
    droughtActive: boolean;
    currentDay: number;
  } {
    return {
      totalHazards: this.hazards.size,
      activePests: this.getActivePests().length,
      droughtActive: this.isDroughtActive(),
      currentDay: this.currentDay,
    };
  }

  /** Get pest spawn window for UI hints */
  getPestSpawnWindow(): [number, number] {
    return this.pestConfig.spawnWindow;
  }

  /** Get drought warning day for UI hints */
  getDroughtWarningDay(): number {
    return this.droughtConfig.warningDay;
  }

  /** Reset the system for a new season */
  reset(seasonCount?: number): void {
    this.hazards.clear();
    this.activeDrought = null;
    this.currentDay = 0;
    this.pestSpawnChecked = false;
    this.droughtSpawnChecked = false;

    if (seasonCount !== undefined) {
      this.config.seasonCount = seasonCount;
      // Reapply difficulty scaling
      const scaling = getDifficultyScaling(seasonCount);
      this.pestConfig = scalePestConfig(PEST_CONFIG, scaling);
      this.droughtConfig = scaleDroughtConfig(DROUGHT_CONFIG, scaling);
    }
  }

  /** Fixed-timestep update (placeholder - hazards are day-based) */
  update(delta: number): void {
    // Hazards update on day advance, not frame-by-frame
    // This method exists to satisfy the System interface
  }

  /** Destroy the system (cleanup) */
  destroy(): void {
    this.hazards.clear();
    this.activeDrought = null;
  }
}
