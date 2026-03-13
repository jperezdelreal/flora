// TLDR: Defines the save data schema and version for migration support

/** TLDR: Current save format version — bump when schema changes */
export const SAVE_VERSION = 1;

/** TLDR: Canonical localStorage keys for each subsystem */
export const SAVE_KEYS = {
  ENCYCLOPEDIA: 'flora_encyclopedia',
  UNLOCKS: 'flora_unlock_progress',
  HIGH_SCORES: 'flora_high_scores',
  AUDIO: 'flora:audio:preferences',
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

/** TLDR: Full save file shape — used for validation and migration */
export interface SaveSchema {
  version: number;
  encyclopedia: EncyclopediaSaveData;
  unlocks: UnlockSaveData;
  highScores: HighScoreSaveData[];
  audio: AudioSaveData;
}
