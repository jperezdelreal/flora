// TLDR: Centralized save/load coordinator for all persistent game data

import { SAVE_KEYS, SAVE_VERSION } from '../config/saveSchema';
import type {
  EncyclopediaSaveData,
  UnlockSaveData,
  HighScoreSaveData,
  AudioSaveData,
  GardenSaveData,
  AchievementSaveData,
  SettingsSaveData,
  RunHistorySaveData,
  LeaderboardSaveData,
} from '../config/saveSchema';
import { loadJSON, saveJSON, isStorageAvailable } from '../utils/storage';

/** TLDR: Callback signature for save-state notifications */
export type SaveStateCallback = (saving: boolean) => void;

/**
 * SaveManager coordinates all persistent storage operations.
 * Systems delegate save/load through this manager so the UI
 * can display a unified save indicator and future features
 * (cloud sync, export/import) have a single integration point.
 */
export class SaveManager {
  private saveStateCallbacks: SaveStateCallback[] = [];
  private storageAvailable: boolean;

  constructor() {
    this.storageAvailable = isStorageAvailable();
    if (!this.storageAvailable) {
      console.warn('SaveManager: localStorage is not available — saves will be lost');
    }
  }

  // ------ Generic save/load ------

  /** TLDR: Save JSON data under a key and notify listeners */
  save(key: string, data: unknown): boolean {
    this.notifySaving(true);
    const ok = saveJSON(key, data);
    // Brief delay so the indicator is visible
    setTimeout(() => this.notifySaving(false), 300);
    return ok;
  }

  /** TLDR: Load and parse JSON from a key */
  load<T>(key: string): T | null {
    return loadJSON<T>(key);
  }

  // ------ Typed per-subsystem helpers ------

  /** TLDR: Save encyclopedia discovery data */
  saveEncyclopedia(data: EncyclopediaSaveData): boolean {
    return this.save(SAVE_KEYS.ENCYCLOPEDIA, data);
  }

  /** TLDR: Load encyclopedia discovery data */
  loadEncyclopedia(): EncyclopediaSaveData | null {
    return this.load<EncyclopediaSaveData>(SAVE_KEYS.ENCYCLOPEDIA);
  }

  /** TLDR: Save unlock/meta-progression data */
  saveUnlocks(data: UnlockSaveData): boolean {
    return this.save(SAVE_KEYS.UNLOCKS, data);
  }

  /** TLDR: Load unlock/meta-progression data */
  loadUnlocks(): UnlockSaveData | null {
    return this.load<UnlockSaveData>(SAVE_KEYS.UNLOCKS);
  }

  /** TLDR: Save high-score list */
  saveHighScores(data: HighScoreSaveData[]): boolean {
    return this.save(SAVE_KEYS.HIGH_SCORES, data);
  }

  /** TLDR: Load high-score list */
  loadHighScores(): HighScoreSaveData[] | null {
    return this.load<HighScoreSaveData[]>(SAVE_KEYS.HIGH_SCORES);
  }

  /** TLDR: Save audio preferences */
  saveAudio(data: AudioSaveData): boolean {
    return this.save(SAVE_KEYS.AUDIO, data);
  }

  /** TLDR: Load audio preferences */
  loadAudio(): AudioSaveData | null {
    return this.load<AudioSaveData>(SAVE_KEYS.AUDIO);
  }

  /** TLDR: Save garden expansion data (grid size + structures) */
  saveGarden(data: GardenSaveData): boolean {
    return this.save(SAVE_KEYS.GARDEN, data);
  }

  /** TLDR: Load garden expansion data */
  loadGarden(): GardenSaveData | null {
    return this.load<GardenSaveData>(SAVE_KEYS.GARDEN);
  }

  /** TLDR: Save achievement state */
  saveAchievements(data: AchievementSaveData): boolean {
    return this.save(SAVE_KEYS.ACHIEVEMENTS, data);
  }

  /** TLDR: Load achievement state */
  loadAchievements(): AchievementSaveData | null {
    return this.load<AchievementSaveData>(SAVE_KEYS.ACHIEVEMENTS);
  }

  /** TLDR: Save display/accessibility settings */
  saveSettings(data: SettingsSaveData): boolean {
    return this.save(SAVE_KEYS.SETTINGS, data);
  }

  /** TLDR: Load display/accessibility settings */
  loadSettings(): SettingsSaveData | null {
    return this.load<SettingsSaveData>(SAVE_KEYS.SETTINGS);
  }

  /** TLDR: Save run history entries */
  saveRunHistory(data: RunHistorySaveData[]): boolean {
    return this.save(SAVE_KEYS.RUN_HISTORY, data);
  }

  /** TLDR: Load run history entries */
  loadRunHistory(): RunHistorySaveData[] | null {
    return this.load<RunHistorySaveData[]>(SAVE_KEYS.RUN_HISTORY);
  }

  /** TLDR: Save leaderboard for a specific seed */
  saveLeaderboard(seed: number, data: LeaderboardSaveData[]): boolean {
    return this.save(`flora_leaderboard_${seed}`, data);
  }

  /** TLDR: Load leaderboard for a specific seed */
  loadLeaderboard(seed: number): LeaderboardSaveData[] | null {
    return this.load<LeaderboardSaveData[]>(`flora_leaderboard_${seed}`);
  }

  // ------ Save-state notifications ------

  /** TLDR: Register a callback fired when save state changes */
  onSaveStateChange(callback: SaveStateCallback): void {
    this.saveStateCallbacks.push(callback);
  }

  /** TLDR: Remove a previously registered callback */
  offSaveStateChange(callback: SaveStateCallback): void {
    this.saveStateCallbacks = this.saveStateCallbacks.filter((cb) => cb !== callback);
  }

  /** TLDR: Notify all listeners of save-state change */
  private notifySaving(saving: boolean): void {
    for (const cb of this.saveStateCallbacks) {
      cb(saving);
    }
  }

  // ------ Utilities ------

  /** TLDR: Check whether persistent storage is available */
  isAvailable(): boolean {
    return this.storageAvailable;
  }

  /** TLDR: Get the save format version */
  getVersion(): number {
    return SAVE_VERSION;
  }

  /** TLDR: Remove all Flora save data (for testing or full reset) */
  clearAll(): void {
    for (const key of Object.values(SAVE_KEYS)) {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore if storage unavailable
      }
    }
  }
}
