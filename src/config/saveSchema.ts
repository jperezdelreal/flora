// TLDR: Defines the save data schema and version for migration support

/** TLDR: Current save format version — bump when schema changes */
export const SAVE_VERSION = 1;

/** TLDR: Canonical localStorage keys for each subsystem */
export const SAVE_KEYS = {
  ENCYCLOPEDIA: 'flora_encyclopedia',
  UNLOCKS: 'flora_unlock_progress',
  HIGH_SCORES: 'flora_high_scores',
  AUDIO: 'flora:audio:preferences',
  TUTORIAL: 'flora_tutorial',
  GARDEN: 'flora_garden',
  ACHIEVEMENTS: 'flora_achievements',
  SETTINGS: 'flora_settings',
  RUN_HISTORY: 'flora_run_history',
} as const;

/** TLDR: Persisted encyclopedia data (discovered plants + timestamps) */
export interface EncyclopediaSaveData {
  plants: string[];
  timestamps: Record<string, number>;
}

/** TLDR: Persisted unlock/meta-progression data */
export interface UnlockSaveData {
  plantsHarvested: number;
  plantsMature: number;
  plantDiversity: number;
  runsCompleted: number;
  unlockedMilestones: string[];
  timestamps: Record<string, number>;
}

/** TLDR: Persisted score breakdown for a single run */
export interface HighScoreSaveData {
  score: number;
  milestone: string | null;
  date: number;
  breakdown: {
    harvests: number;
    diversity: number;
    perfection: number;
    hazards: number;
    total: number;
  };
}

/** TLDR: Persisted audio volume and mute preferences */
export interface AudioSaveData {
  master: number;
  sfx: number;
  ambient: number;
  music: number;
  muted?: {
    master: boolean;
    sfx: boolean;
    ambient: boolean;
    music: boolean;
  };
}

import type { StructureState } from '../entities/Structure';

/** TLDR: Persisted garden data (grid size + placed structures) */
export interface GardenSaveData {
  gridRows: number;
  gridCols: number;
  structures: StructureState[];
}

/** TLDR: Persisted achievement state (unlock status + cumulative counters) */
export interface AchievementSaveData {
  achievements: Record<string, { unlocked: boolean; unlockedAt: number | null }>;
  counters: {
    totalHarvests: number;
    tomatoHarvests: number;
    synergiesActivated: number;
    runsCompleted: number;
    discoveredSpecies: number;
  };
  cosmeticRewards: string[];
}

/** TLDR: Persisted display/accessibility settings */
export interface SettingsSaveData {
  colorblindMode: boolean;
  colorVisionMode?: string;
  reducedMotion?: boolean;
  highContrast?: boolean;
}

/** TLDR: Persisted run history entry for post-run review */
export interface RunHistorySaveData {
  seed: number;
  score: number;
  modifiers: string[];
  season: string;
  date: number;
  isDaily: boolean;
}

/** TLDR: Persisted leaderboard entry for a daily/seeded challenge */
export interface LeaderboardSaveData {
  score: number;
  modifiers: string[];
  date: number;
  seed: number;
}

/** TLDR: Full save file shape — used for validation and migration */
export interface SaveSchema {
  version: number;
  encyclopedia: EncyclopediaSaveData;
  unlocks: UnlockSaveData;
  highScores: HighScoreSaveData[];
  audio: AudioSaveData;
  garden: GardenSaveData;
  achievements: AchievementSaveData;
  settings: SettingsSaveData;
  runHistory: RunHistorySaveData[];
}
