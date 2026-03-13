import { System } from './index';
import { MilestoneConfig, MilestoneType, UNLOCK_MILESTONES, getNextMilestone } from '../config/unlocks';

/**
 * TLDR: Player progression data persisted across sessions
 */
export interface UnlockProgress {
  plantsHarvested: number;
  plantsMature: number;
  plantDiversity: number;
  unlockedMilestones: string[];
  timestamps: Record<string, number>;
}

/**
 * TLDR: Event triggered when a milestone is achieved
 */
export interface UnlockEvent {
  milestone: MilestoneConfig;
  progress: UnlockProgress;
  timestamp: number;
}

const STORAGE_KEY = 'flora_unlock_progress';

/**
 * UnlockSystem manages meta-progression: milestones, unlocks, and persistence.
 * Tracks player achievements across runs and triggers unlock notifications.
 * Based on GDD §7 'Meta-Progression' and EncyclopediaSystem localStorage patterns.
 */
export class UnlockSystem implements System {
  readonly name = 'UnlockSystem';
  private progress: UnlockProgress;
  private unlockCallbacks: Array<(event: UnlockEvent) => void> = [];

  constructor() {
    this.progress = this.loadFromStorage();
  }

  /**
   * TLDR: Register callback for unlock notifications
   */
  onUnlock(callback: (event: UnlockEvent) => void): void {
    this.unlockCallbacks.push(callback);
  }

  /**
   * TLDR: Increment harvested plant count and check for unlocks
   */
  recordHarvest(plantId: string): void {
    this.progress.plantsHarvested++;
    this.checkMilestones('plants_harvested', this.progress.plantsHarvested);
    this.saveToStorage();
  }

  /**
   * TLDR: Increment matured plant count and check for unlocks
   */
  recordMaturity(plantId: string): void {
    this.progress.plantsMature++;
    this.checkMilestones('plants_matured', this.progress.plantsMature);
    this.saveToStorage();
  }

  /**
   * TLDR: Update plant diversity count and check for unlocks
   */
  recordDiscovery(discoveredCount: number): void {
    if (discoveredCount > this.progress.plantDiversity) {
      this.progress.plantDiversity = discoveredCount;
      this.checkMilestones('plant_diversity', this.progress.plantDiversity);
      this.saveToStorage();
    }
  }

  /**
   * TLDR: Check if any milestones were achieved and trigger unlock events
   */
  private checkMilestones(type: MilestoneType, currentValue: number): void {
    const milestones = UNLOCK_MILESTONES[type];
    
    for (const milestone of milestones) {
      // Skip if already unlocked
      if (this.progress.unlockedMilestones.includes(milestone.id)) {
        continue;
      }

      // Check if threshold reached
      if (currentValue >= milestone.threshold) {
        const timestamp = Date.now();
        this.progress.unlockedMilestones.push(milestone.id);
        this.progress.timestamps[milestone.id] = timestamp;

        // Trigger unlock event
        const event: UnlockEvent = {
          milestone,
          progress: { ...this.progress },
          timestamp,
        };

        for (const callback of this.unlockCallbacks) {
          callback(event);
        }
      }
    }
  }

  /**
   * TLDR: Check if a specific milestone is unlocked
   */
  isUnlocked(milestoneId: string): boolean {
    return this.progress.unlockedMilestones.includes(milestoneId);
  }

  /**
   * TLDR: Get current progress data
   */
  getProgress(): Readonly<UnlockProgress> {
    return { ...this.progress };
  }

  /**
   * TLDR: Get next milestone for a specific type with progress
   */
  getNextMilestone(type: MilestoneType): { milestone: MilestoneConfig | null; current: number; target: number } | null {
    let currentValue = 0;
    
    switch (type) {
      case 'plants_harvested':
        currentValue = this.progress.plantsHarvested;
        break;
      case 'plants_matured':
        currentValue = this.progress.plantsMature;
        break;
      case 'plant_diversity':
        currentValue = this.progress.plantDiversity;
        break;
    }

    const milestone = getNextMilestone(type, currentValue);
    
    if (!milestone) {
      return null;
    }

    return {
      milestone,
      current: currentValue,
      target: milestone.threshold,
    };
  }

  /**
   * TLDR: Get all next milestones across all types
   */
  getAllNextMilestones(): Array<{ type: MilestoneType; milestone: MilestoneConfig; current: number; target: number }> {
    const types: MilestoneType[] = ['plants_harvested', 'plants_matured', 'plant_diversity'];
    const nextMilestones: Array<{ type: MilestoneType; milestone: MilestoneConfig; current: number; target: number }> = [];

    for (const type of types) {
      const next = this.getNextMilestone(type);
      if (next && next.milestone) {
        nextMilestones.push({
          type,
          milestone: next.milestone,
          current: next.current,
          target: next.target,
        });
      }
    }

    // Sort by closest to completion
    return nextMilestones.sort((a, b) => {
      const aProgress = a.current / a.target;
      const bProgress = b.current / b.target;
      return bProgress - aProgress;
    });
  }

  /**
   * TLDR: Load progress from localStorage
   */
  private loadFromStorage(): UnlockProgress {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return {
          plantsHarvested: data.plantsHarvested ?? 0,
          plantsMature: data.plantsMature ?? 0,
          plantDiversity: data.plantDiversity ?? 0,
          unlockedMilestones: data.unlockedMilestones ?? [],
          timestamps: data.timestamps ?? {},
        };
      }
    } catch (error) {
      console.warn('UnlockSystem: Failed to load from storage', error);
    }

    // Default progress
    return {
      plantsHarvested: 0,
      plantsMature: 0,
      plantDiversity: 0,
      unlockedMilestones: [],
      timestamps: {},
    };
  }

  /**
   * TLDR: Save progress to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
    } catch (error) {
      console.warn('UnlockSystem: Failed to save to storage', error);
    }
  }

  /**
   * TLDR: Reset progress (for testing or new game+)
   */
  reset(): void {
    this.progress = {
      plantsHarvested: 0,
      plantsMature: 0,
      plantDiversity: 0,
      unlockedMilestones: [],
      timestamps: {},
    };
    this.saveToStorage();
  }

  update(_delta: number): void {
    // No per-frame update needed
  }

  destroy(): void {
    this.unlockCallbacks = [];
  }
}
