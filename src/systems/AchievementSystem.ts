// TLDR: Event-driven achievement tracker — subscribes to EventBus, persists via SaveManager

import { System } from './index';
import { eventBus } from '../core/EventBus';
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_BY_ID,
  type AchievementConfig,
  type CosmeticReward,
} from '../config/achievements';
import type { SaveManager } from './SaveManager';
import { Season } from '../config/seasons';

/** TLDR: Persistent state for a single achievement */
export interface AchievementState {
  unlocked: boolean;
  unlockedAt: number | null;
}

/** TLDR: Full persistent achievement data */
export interface AchievementSaveState {
  achievements: Record<string, AchievementState>;
  /** TLDR: Cumulative counters persisted across runs */
  counters: AchievementCounters;
  /** TLDR: Unlocked cosmetic reward IDs */
  cosmeticRewards: string[];
}

/** TLDR: Cumulative counters for threshold-based achievements */
interface AchievementCounters {
  totalHarvests: number;
  tomatoHarvests: number;
  synergiesActivated: number;
  runsCompleted: number;
  discoveredSpecies: number;
  weedsRemoved: number;
  compostApplied: number;
}

/** TLDR: Per-run volatile trackers (reset each season) */
interface RunTrackers {
  plantsDiedThisRun: number;
  harvestsToday: number;
  currentDay: number;
  activePlantTypes: Set<string>;
  harvestedInFrost: boolean;
  droughtActive: boolean;
  plantsDiedDuringDrought: number;
}

/** TLDR: Callback fired when an achievement is unlocked */
export type AchievementUnlockCallback = (config: AchievementConfig) => void;

/**
 * AchievementSystem tracks milestones across runs.
 * Subscribes to EventBus events and checks thresholds
 * after each relevant action. Persists via SaveManager.
 */
export class AchievementSystem implements System {
  readonly name = 'AchievementSystem';

  private state: AchievementSaveState;
  private run: RunTrackers;
  private unlockCallbacks: AchievementUnlockCallback[] = [];
  private saveManager?: SaveManager;
  private currentSeason: Season = Season.SPRING;

  // TLDR: Store bound listeners for cleanup
  private boundPlantHarvested!: (data: { plantId: string }) => void;
  private boundPlantDied!: () => void;
  private boundPlantCreated!: (data: { plantId: string }) => void;
  private boundSynergyActivated!: () => void;
  private boundDiscoveryNew!: () => void;
  private boundDayAdvanced!: (data: { day: number }) => void;
  private boundDroughtStarted!: () => void;
  private boundDroughtEnded!: () => void;

  constructor(saveManager?: SaveManager) {
    this.saveManager = saveManager;
    this.state = this.loadState();
    this.run = this.freshRunTrackers();
    this.subscribeToEvents();
  }

  // ------ Public API ------

  /** TLDR: Register callback for unlock notifications */
  onUnlock(callback: AchievementUnlockCallback): void {
    this.unlockCallbacks.push(callback);
  }

  /** TLDR: Set the current season (needed for frost_harvester check) */
  setSeason(season: Season): void {
    this.currentSeason = season;
  }

  /** TLDR: Check if achievement is unlocked */
  isUnlocked(achievementId: string): boolean {
    return this.state.achievements[achievementId]?.unlocked === true;
  }

  /** TLDR: Get all achievement states for gallery display */
  getAllStates(): Array<{ config: AchievementConfig; state: AchievementState }> {
    return ACHIEVEMENTS.map((config) => ({
      config,
      state: this.state.achievements[config.id] ?? { unlocked: false, unlockedAt: null },
    }));
  }

  /** TLDR: Get unlocked cosmetic reward IDs */
  getUnlockedRewards(): readonly string[] {
    return [...this.state.cosmeticRewards];
  }

  /** TLDR: Get full cosmetic reward objects that have been unlocked */
  getUnlockedCosmeticRewards(): CosmeticReward[] {
    return ACHIEVEMENTS
      .filter((a) => this.isUnlocked(a.id))
      .map((a) => a.reward);
  }

  /** TLDR: Get total / unlocked counts for progress display */
  getProgress(): { unlocked: number; total: number } {
    const unlocked = Object.values(this.state.achievements).filter((s) => s.unlocked).length;
    return { unlocked, total: ACHIEVEMENTS.length };
  }

  /** TLDR: Called when a new run/season starts — resets per-run trackers */
  resetRun(): void {
    this.run = this.freshRunTrackers();
  }

  /** TLDR: Called when run ends — checks end-of-season achievements */
  onRunEnd(): void {
    // TLDR: Perfect Season — no deaths during the run
    if (this.run.plantsDiedThisRun === 0) {
      this.tryUnlock('perfect_season');
    }

    // TLDR: Increment runs completed counter
    this.state.counters.runsCompleted++;
    this.checkThreshold('seasoned_veteran', this.state.counters.runsCompleted);

    this.saveState();
  }

  // ------ EventBus Subscriptions ------

  private subscribeToEvents(): void {
    this.boundPlantHarvested = (data) => {
      this.onPlantHarvested(data.plantId);
    };
    eventBus.on('plant:harvested', this.boundPlantHarvested);

    this.boundPlantDied = () => {
      this.run.plantsDiedThisRun++;
      if (this.run.droughtActive) {
        this.run.plantsDiedDuringDrought++;
      }
    };
    eventBus.on('plant:died', this.boundPlantDied);

    this.boundPlantCreated = (data) => {
      this.run.activePlantTypes.add(data.plantId.split('-')[0]);
    };
    eventBus.on('plant:created', this.boundPlantCreated);

    this.boundSynergyActivated = () => {
      this.state.counters.synergiesActivated++;
      this.checkThreshold('synergy_adept', this.state.counters.synergiesActivated);
      this.saveState();
    };
    eventBus.on('synergy:activated', this.boundSynergyActivated);

    this.boundDiscoveryNew = () => {
      this.state.counters.discoveredSpecies++;
      this.checkThreshold('plant_explorer', this.state.counters.discoveredSpecies);
      this.checkThreshold('flora_completionist', this.state.counters.discoveredSpecies);
      this.saveState();
    };
    eventBus.on('discovery:new', this.boundDiscoveryNew);

    this.boundDayAdvanced = (data) => {
      // TLDR: Reset daily harvest counter on new day
      this.run.harvestsToday = 0;
      this.run.currentDay = data.day;
    };
    eventBus.on('day:advanced', this.boundDayAdvanced);

    this.boundDroughtStarted = () => {
      this.run.droughtActive = true;
      this.run.plantsDiedDuringDrought = 0;
    };
    eventBus.on('drought:started', this.boundDroughtStarted);

    this.boundDroughtEnded = () => {
      // TLDR: Drought Survivor — ended drought with zero deaths during it
      if (this.run.plantsDiedDuringDrought === 0) {
        this.tryUnlock('drought_survivor');
      }
      this.run.droughtActive = false;
    };
    eventBus.on('drought:ended', this.boundDroughtEnded);
  }

  // ------ Internal Logic ------

  private onPlantHarvested(plantId: string): void {
    // TLDR: Cumulative harvest counter
    this.state.counters.totalHarvests++;
    this.checkThreshold('first_harvest', this.state.counters.totalHarvests);
    this.checkThreshold('bountiful_harvest', this.state.counters.totalHarvests);

    // TLDR: Track tomato-specific harvests (strip instance suffix)
    const plantType = plantId.split('-')[0];
    if (plantType === 'tomato') {
      this.state.counters.tomatoHarvests++;
      this.checkThreshold('tomato_lover', this.state.counters.tomatoHarvests);
    }

    // TLDR: Daily harvest counter for speed_grower
    this.run.harvestsToday++;
    this.checkThreshold('speed_grower', this.run.harvestsToday);

    // TLDR: Frost Harvester — harvest during winter
    if (this.currentSeason === Season.WINTER) {
      this.tryUnlock('frost_harvester');
    }

    // TLDR: Polyculture — track unique active plant types
    this.run.activePlantTypes.add(plantType);
    this.checkThreshold('polyculture_master', this.run.activePlantTypes.size);

    this.saveState();
  }

  /** TLDR: Attempt threshold-based unlock */
  private checkThreshold(achievementId: string, currentValue: number): void {
    if (this.isUnlocked(achievementId)) return;

    const config = ACHIEVEMENT_BY_ID[achievementId];
    if (!config || config.threshold === undefined) return;

    if (currentValue >= config.threshold) {
      this.tryUnlock(achievementId);
    }
  }

  /** TLDR: Unlock an achievement and fire callbacks */
  private tryUnlock(achievementId: string): void {
    if (this.isUnlocked(achievementId)) return;

    const config = ACHIEVEMENT_BY_ID[achievementId];
    if (!config) return;

    this.state.achievements[achievementId] = {
      unlocked: true,
      unlockedAt: Date.now(),
    };

    // TLDR: Add cosmetic reward to unlocked list
    if (!this.state.cosmeticRewards.includes(config.reward.id)) {
      this.state.cosmeticRewards.push(config.reward.id);
    }

    // TLDR: Emit event for other systems (audio, etc.)
    eventBus.emit('achievement:unlocked', {
      achievementId: config.id,
      achievementName: config.displayName,
    });

    // TLDR: Fire direct callbacks (for notification popup)
    for (const cb of this.unlockCallbacks) {
      cb(config);
    }

    this.saveState();
  }

  // ------ Persistence ------

  private loadState(): AchievementSaveState {
    if (this.saveManager) {
      const data = this.saveManager.loadAchievements();
      if (data) {
        return {
          achievements: data.achievements ?? {},
          counters: {
            totalHarvests: data.counters?.totalHarvests ?? 0,
            tomatoHarvests: data.counters?.tomatoHarvests ?? 0,
            synergiesActivated: data.counters?.synergiesActivated ?? 0,
            runsCompleted: data.counters?.runsCompleted ?? 0,
            discoveredSpecies: data.counters?.discoveredSpecies ?? 0,
            weedsRemoved: data.counters?.weedsRemoved ?? 0,
            compostApplied: data.counters?.compostApplied ?? 0,
          },
          cosmeticRewards: data.cosmeticRewards ?? [],
        };
      }
    }

    return this.defaultState();
  }

  private saveState(): void {
    if (this.saveManager) {
      this.saveManager.saveAchievements(this.state);
    }
  }

  private defaultState(): AchievementSaveState {
    return {
      achievements: {},
      counters: {
        totalHarvests: 0,
        tomatoHarvests: 0,
        synergiesActivated: 0,
        runsCompleted: 0,
        discoveredSpecies: 0,
        weedsRemoved: 0,
        compostApplied: 0,
      },
      cosmeticRewards: [],
    };
  }

  private freshRunTrackers(): RunTrackers {
    return {
      plantsDiedThisRun: 0,
      harvestsToday: 0,
      currentDay: 0,
      activePlantTypes: new Set(),
      harvestedInFrost: false,
      droughtActive: false,
      plantsDiedDuringDrought: 0,
    };
  }

  // ------ System interface ------

  update(_delta: number): void {
    // TLDR: No per-frame update needed — event-driven
  }

  destroy(): void {
    // TLDR: Cleanup all EventBus subscriptions to prevent memory leaks
    eventBus.off('plant:harvested', this.boundPlantHarvested);
    eventBus.off('plant:died', this.boundPlantDied);
    eventBus.off('plant:created', this.boundPlantCreated);
    eventBus.off('synergy:activated', this.boundSynergyActivated);
    eventBus.off('discovery:new', this.boundDiscoveryNew);
    eventBus.off('day:advanced', this.boundDayAdvanced);
    eventBus.off('drought:started', this.boundDroughtStarted);
    eventBus.off('drought:ended', this.boundDroughtEnded);
    this.unlockCallbacks = [];
  }
}
