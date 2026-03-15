import { System } from './index';
import { eventBus } from '../core/EventBus';
import { SCORE_CONFIG, getScoreMilestone, getNextScoreMilestone } from '../config/scoring';
import type { MilestoneThreshold } from '../config/scoring';
import { PLANT_BY_ID } from '../config/plants';
import type { SaveManager } from './SaveManager';

/**
 * TLDR: Tracks score breakdown by category
 */
export interface ScoreBreakdown {
  harvests: number;
  diversity: number;
  perfection: number;
  hazards: number;
  total: number;
}

/**
 * TLDR: Run statistics for scoring
 */
export interface RunStats {
  plantsHarvested: number;
  plantsDied: number;
  uniqueTypesHarvested: Set<string>;
  pestsRemoved: number;
  droughtsSurvived: number;
  perfectPlants: number;
  synergiesActivated: number;
}

/**
 * TLDR: Persistent high score data
 */
export interface HighScoreEntry {
  score: number;
  milestone: string | null;
  date: number;
  breakdown: ScoreBreakdown;
}

const STORAGE_KEY = 'flora_high_scores';
const MAX_HIGH_SCORES = 10;

/**
 * ScoringSystem tracks per-run scoring with milestones.
 * Event-driven design: subscribes to plant, hazard, and day events.
 * Persists personal best and top 10 runs to localStorage.
 */
export class ScoringSystem implements System {
  readonly name = 'ScoringSystem';
  
  private stats: RunStats;
  private lastActionPoints = 0;
  private highScores: HighScoreEntry[] = [];
  private saveManager?: SaveManager;

  // TLDR: Store bound listeners for cleanup
  private boundPlantHarvested!: (data: { plantId: string; isNewDiscovery: boolean }) => void;
  private boundPlantDied!: () => void;
  private boundPestRemoved!: () => void;
  private boundDroughtEnded!: () => void;
  private boundSynergyActivated!: () => void;
  private boundPlayerRested!: () => void;

  constructor(saveManager?: SaveManager) {
    this.saveManager = saveManager;
    this.stats = this.resetStats();
    this.loadHighScores();
    this.subscribeToEvents();
  }

  /**
   * TLDR: Subscribe to scoring events via EventBus
   */
  private subscribeToEvents(): void {
    this.boundPlantHarvested = (data) => {
      this.onPlantHarvested(data.plantId, data.isNewDiscovery);
    };
    eventBus.on('plant:harvested', this.boundPlantHarvested);

    this.boundPlantDied = () => {
      this.onPlantDied();
    };
    eventBus.on('plant:died', this.boundPlantDied);

    this.boundPestRemoved = () => {
      this.onPestRemoved();
    };
    eventBus.on('pest:removed', this.boundPestRemoved);

    this.boundDroughtEnded = () => {
      this.onDroughtSurvived();
    };
    eventBus.on('drought:ended', this.boundDroughtEnded);

    this.boundSynergyActivated = () => {
      this.onSynergyActivated();
    };
    eventBus.on('synergy:activated', this.boundSynergyActivated);
    
    // TLDR: Score rest action for efficiency (#244)
    this.boundPlayerRested = () => {
      this.onRestAction();
    };
    eventBus.on('player:rested', this.boundPlayerRested);
  }

  /**
   * TLDR: Handle harvest event and award points
   */
  private onPlantHarvested(plantId: string, isNewDiscovery: boolean): void {
    this.stats.plantsHarvested++;
    this.stats.uniqueTypesHarvested.add(plantId);

    const plantConfig = PLANT_BY_ID[plantId];
    if (!plantConfig) return;

    const basePoints = SCORE_CONFIG.harvest.base;
    const rarityMultiplier = SCORE_CONFIG.harvest.rarityMultiplier[plantConfig.rarity] ?? 1.0;
    this.lastActionPoints = Math.round(basePoints * rarityMultiplier);
    
    // TLDR: Emit score update event for UI feedback
    eventBus.emit('score:updated', { 
      total: this.getScoreBreakdown().total, 
      lastAction: this.lastActionPoints 
    });
  }

  /**
   * TLDR: Track plant death for perfect run calculation
   */
  private onPlantDied(): void {
    this.stats.plantsDied++;
  }

  /**
   * TLDR: Award points for pest removal
   */
  private onPestRemoved(): void {
    this.stats.pestsRemoved++;
    this.lastActionPoints = SCORE_CONFIG.hazards.pestRemoved;
    
    // TLDR: Emit score update event for UI feedback
    eventBus.emit('score:updated', { 
      total: this.getScoreBreakdown().total, 
      lastAction: this.lastActionPoints 
    });
  }

  /**
   * TLDR: Award points for surviving drought
   */
  private onDroughtSurvived(): void {
    this.stats.droughtsSurvived++;
    this.lastActionPoints = SCORE_CONFIG.hazards.droughtSurvived;
  }

  /**
   * TLDR: Track synergy activation (no direct points, but counted)
   */
  private onSynergyActivated(): void {
    this.stats.synergiesActivated++;
  }
  
  /**
   * TLDR: Track rest action usage (small bonus for efficient play) (#244)
   */
  private onRestAction(): void {
    // TLDR: Small bonus for strategic resource management
    this.lastActionPoints = 5;
    
    // TLDR: Emit score update event for UI feedback
    eventBus.emit('score:updated', { 
      total: this.getScoreBreakdown().total, 
      lastAction: this.lastActionPoints 
    });
  }

  /**
   * TLDR: Calculate final score with bonuses
   */
  getScoreBreakdown(): ScoreBreakdown {
    let harvests = 0;
    
    this.stats.uniqueTypesHarvested.forEach((plantId) => {
      const plantConfig = PLANT_BY_ID[plantId];
      if (!plantConfig) return;
      
      const basePoints = SCORE_CONFIG.harvest.base;
      const rarityMultiplier = SCORE_CONFIG.harvest.rarityMultiplier[plantConfig.rarity] ?? 1.0;
      harvests += Math.round(basePoints * rarityMultiplier);
    });

    const diversity = this.stats.uniqueTypesHarvested.size * SCORE_CONFIG.diversity.pointsPerUniqueType;

    let perfection = this.stats.perfectPlants * SCORE_CONFIG.perfection.perfectPlant;
    
    if (this.isPerfectRun()) {
      perfection += SCORE_CONFIG.perfection.perfectRun;
    }

    const hazards =
      this.stats.pestsRemoved * SCORE_CONFIG.hazards.pestRemoved +
      this.stats.droughtsSurvived * SCORE_CONFIG.hazards.droughtSurvived;

    const total = harvests + diversity + perfection + hazards;

    return { harvests, diversity, perfection, hazards, total };
  }

  /**
   * TLDR: Check if current run qualifies as perfect
   */
  isPerfectRun(): boolean {
    return (
      this.stats.plantsDied === 0 &&
      this.stats.plantsHarvested > 0
    );
  }

  /**
   * TLDR: Get last action points (for HUD display)
   */
  getLastActionPoints(): number {
    return this.lastActionPoints;
  }

  /**
   * TLDR: Clear last action points
   */
  clearLastActionPoints(): void {
    this.lastActionPoints = 0;
  }

  /**
   * TLDR: Get current milestone
   */
  getCurrentMilestone(): MilestoneThreshold | null {
    const breakdown = this.getScoreBreakdown();
    return getScoreMilestone(breakdown.total);
  }

  /**
   * TLDR: Get next milestone target
   */
  getNextMilestone(): MilestoneThreshold | null {
    const breakdown = this.getScoreBreakdown();
    return getNextScoreMilestone(breakdown.total);
  }

  /**
   * TLDR: Get current run stats
   */
  getStats(): Readonly<RunStats> {
    return { ...this.stats, uniqueTypesHarvested: new Set(this.stats.uniqueTypesHarvested) };
  }

  /**
   * TLDR: Save score if it's a high score
   */
  saveScore(): boolean {
    const breakdown = this.getScoreBreakdown();
    const milestone = this.getCurrentMilestone();

    const entry: HighScoreEntry = {
      score: breakdown.total,
      milestone: milestone?.name ?? null,
      date: Date.now(),
      breakdown,
    };

    this.highScores.push(entry);
    this.highScores.sort((a, b) => b.score - a.score);
    this.highScores = this.highScores.slice(0, MAX_HIGH_SCORES);

    this.saveHighScores();
    return this.highScores[0] === entry;
  }

  /**
   * TLDR: Get personal best score
   */
  getPersonalBest(): number {
    return this.highScores.length > 0 ? this.highScores[0].score : 0;
  }

  /**
   * TLDR: Get all high scores
   */
  getHighScores(): readonly HighScoreEntry[] {
    return [...this.highScores];
  }

  /**
   * TLDR: Load high scores from SaveManager or direct localStorage
   */
  private loadHighScores(): void {
    // TLDR: Prefer SaveManager when available, fall back to direct localStorage
    if (this.saveManager) {
      const data = this.saveManager.loadHighScores();
      if (data) {
        this.highScores = data.map((entry) => ({
          ...entry,
          breakdown: entry.breakdown ?? { harvests: 0, diversity: 0, perfection: 0, hazards: 0, total: entry.score },
        }));
      }
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.highScores = data.map((entry: HighScoreEntry) => ({
          ...entry,
          breakdown: entry.breakdown ?? { harvests: 0, diversity: 0, perfection: 0, hazards: 0, total: entry.score },
        }));
      }
    } catch (error) {
      console.warn('ScoringSystem: Failed to load high scores', error);
    }
  }

  /**
   * TLDR: Save high scores via SaveManager or direct localStorage
   */
  private saveHighScores(): void {
    // TLDR: Delegate to SaveManager when available (triggers save indicator)
    if (this.saveManager) {
      this.saveManager.saveHighScores(this.highScores);
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.highScores));
    } catch (error) {
      console.warn('ScoringSystem: Failed to save high scores', error);
    }
  }

  /**
   * TLDR: Reset stats for new run
   */
  reset(): void {
    this.stats = this.resetStats();
    this.lastActionPoints = 0;
  }

  /**
   * TLDR: Create fresh stats object
   */
  private resetStats(): RunStats {
    return {
      plantsHarvested: 0,
      plantsDied: 0,
      uniqueTypesHarvested: new Set(),
      pestsRemoved: 0,
      droughtsSurvived: 0,
      perfectPlants: 0,
      synergiesActivated: 0,
    };
  }

  update(_delta: number): void {
    // No per-frame update needed
  }

  destroy(): void {
    // TLDR: Cleanup all EventBus subscriptions to prevent memory leaks
    eventBus.off('plant:harvested', this.boundPlantHarvested);
    eventBus.off('plant:died', this.boundPlantDied);
    eventBus.off('pest:removed', this.boundPestRemoved);
    eventBus.off('drought:ended', this.boundDroughtEnded);
    eventBus.off('synergy:activated', this.boundSynergyActivated);
    eventBus.off('player:rested', this.boundPlayerRested);
    this.reset();
  }
}
