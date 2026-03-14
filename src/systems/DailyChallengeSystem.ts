// TLDR: Daily challenge system — deterministic seeds from date, modifier application, leaderboard, run history

import { SeededRandom } from '../utils/SeededRandom';
import type { ModifierId, ModifierEffects } from '../config/modifiers';
import { mergeModifierEffects, getCombinedScoreMultiplier } from '../config/modifiers';
import type { SaveManager } from './SaveManager';
import type { System } from './index';

/** TLDR: Daily challenge state for a given date */
export interface DailyChallenge {
  dateString: string;
  seed: number;
  modifiers: ModifierId[];
}

/** TLDR: Leaderboard entry for a daily challenge seed */
export interface LeaderboardEntry {
  score: number;
  modifiers: ModifierId[];
  date: number;
  seed: number;
}

/** TLDR: Run history entry persisted across sessions */
export interface RunHistoryEntry {
  seed: number;
  score: number;
  modifiers: ModifierId[];
  season: string;
  date: number;
  isDaily: boolean;
}

const MAX_LEADERBOARD_ENTRIES = 10;
const MAX_RUN_HISTORY = 20;

/**
 * DailyChallengeSystem generates deterministic daily seeds from YYYY-MM-DD,
 * manages modifier composition, persists per-seed leaderboards, and tracks run history.
 */
export class DailyChallengeSystem implements System {
  readonly name = 'DailyChallengeSystem';
  private saveManager: SaveManager;
  private activeModifiers: ModifierId[] = [];
  private currentSeed: number = 0;
  private isDaily = false;

  constructor(saveManager: SaveManager) {
    this.saveManager = saveManager;
  }

  // ──── Daily seed generation ────

  /**
   * TLDR: Generate a deterministic seed from a YYYY-MM-DD date string.
   * Same date always produces the same seed across all sessions.
   */
  static dateSeed(dateString: string): number {
    // TLDR: Simple hash — sum of char codes multiplied by prime offsets
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
      const ch = dateString.charCodeAt(i);
      hash = ((hash << 5) - hash + ch) | 0;
    }
    // TLDR: Ensure positive 32-bit integer for SeededRandom compatibility
    return Math.abs(hash) >>> 0;
  }

  /**
   * TLDR: Get today's date string in YYYY-MM-DD format (local time)
   */
  static todayDateString(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * TLDR: Build the daily challenge for today (or a given date)
   */
  getDailyChallenge(dateString?: string): DailyChallenge {
    const date = dateString ?? DailyChallengeSystem.todayDateString();
    const seed = DailyChallengeSystem.dateSeed(date);

    // TLDR: Use the seed to deterministically pick 1-2 modifiers for the daily
    const rng = new SeededRandom(seed);
    const allIds: ModifierId[] = [
      'drought_season',
      'bountiful_harvest',
      'speedrun',
      'wild_growth',
    ];
    const shuffled = rng.shuffle([...allIds]);
    const count = rng.nextInt(1, 2);
    const modifiers = shuffled.slice(0, count);

    return { dateString: date, seed, modifiers };
  }

  // ──── Modifier management ────

  /**
   * TLDR: Set the active modifiers for the current run
   */
  setActiveModifiers(modifiers: ModifierId[]): void {
    this.activeModifiers = [...modifiers];
  }

  /** TLDR: Get current active modifier IDs */
  getActiveModifiers(): readonly ModifierId[] {
    return this.activeModifiers;
  }

  /** TLDR: Get merged effects of all active modifiers */
  getActiveEffects(): Required<ModifierEffects> {
    return mergeModifierEffects(this.activeModifiers);
  }

  /** TLDR: Get combined score multiplier for active modifiers */
  getScoreMultiplier(): number {
    return getCombinedScoreMultiplier(this.activeModifiers);
  }

  /** TLDR: Set the run seed (daily or custom) */
  setSeed(seed: number, isDaily: boolean): void {
    this.currentSeed = seed;
    this.isDaily = isDaily;
  }

  /** TLDR: Get the current run seed */
  getSeed(): number {
    return this.currentSeed;
  }

  /** TLDR: Check if this is a daily challenge run */
  isDailyRun(): boolean {
    return this.isDaily;
  }

  // ──── Leaderboard (per-seed, top 10) ────

  /**
   * TLDR: Submit a score to the leaderboard for a given seed.
   * Returns true if the score made it into the top 10.
   */
  submitLeaderboardScore(seed: number, score: number, modifiers: ModifierId[]): boolean {
    const board = this.loadLeaderboard(seed);
    const entry: LeaderboardEntry = {
      score,
      modifiers: [...modifiers],
      date: Date.now(),
      seed,
    };
    board.push(entry);
    board.sort((a, b) => b.score - a.score);
    const trimmed = board.slice(0, MAX_LEADERBOARD_ENTRIES);
    this.saveLeaderboard(seed, trimmed);
    return trimmed.some((e) => e === entry);
  }

  /** TLDR: Get leaderboard entries for a given seed */
  getLeaderboard(seed: number): LeaderboardEntry[] {
    return this.loadLeaderboard(seed);
  }

  private leaderboardKey(seed: number): string {
    return `flora_leaderboard_${seed}`;
  }

  private loadLeaderboard(seed: number): LeaderboardEntry[] {
    const data = this.saveManager.load<LeaderboardEntry[]>(this.leaderboardKey(seed));
    return data ?? [];
  }

  private saveLeaderboard(seed: number, entries: LeaderboardEntry[]): void {
    this.saveManager.save(this.leaderboardKey(seed), entries);
  }

  // ──── Run History (last 20 runs) ────

  /**
   * TLDR: Record a completed run in history
   */
  recordRun(score: number, season: string): void {
    const history = this.loadRunHistory();
    const entry: RunHistoryEntry = {
      seed: this.currentSeed,
      score,
      modifiers: [...this.activeModifiers],
      season,
      date: Date.now(),
      isDaily: this.isDaily,
    };
    history.unshift(entry);
    const trimmed = history.slice(0, MAX_RUN_HISTORY);
    this.saveRunHistory(trimmed);
  }

  /** TLDR: Get last N run history entries */
  getRunHistory(): RunHistoryEntry[] {
    return this.loadRunHistory();
  }

  private loadRunHistory(): RunHistoryEntry[] {
    const data = this.saveManager.load<RunHistoryEntry[]>('flora_run_history');
    return data ?? [];
  }

  private saveRunHistory(entries: RunHistoryEntry[]): void {
    this.saveManager.save('flora_run_history', entries);
  }

  // ──── System interface ────

  /** TLDR: Reset state for a new run */
  reset(): void {
    this.activeModifiers = [];
    this.currentSeed = 0;
    this.isDaily = false;
  }

  update(_delta: number): void {
    // TLDR: No per-frame work needed
  }

  destroy(): void {
    this.reset();
  }
}
