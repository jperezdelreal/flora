/**
 * Season definitions for Flora.
 * Based on GDD §5.3 Seasonal Mechanics
 *
 * 4 seasons with unique visuals, hazard profiles, and plant availability.
 */

export enum Season {
  SPRING = 'spring',
  SUMMER = 'summer',
  FALL = 'fall',
  WINTER = 'winter',
}

export interface SeasonConfig {
  readonly displayName: string;
  readonly emoji: string;
  /** Background (sky) color for the game renderer */
  readonly backgroundColor: number;
  /** Tint applied to the grid container (0xffffff = no tint) */
  readonly gridTint: number;
  /** Multiplier applied to pest spawn chance vs. base rate */
  readonly pestSpawnMultiplier: number;
  /** Whether drought hazard is activated this season */
  readonly droughtEnabled: boolean;
  /** Whether frost hazard is activated this season */
  readonly frostEnabled: boolean;
  /** Frost damage per day for non-frost-resistant plants (when frostEnabled) */
  readonly frostDamagePerDay: number;
  /** TLDR: Short strategic description for season card UI */
  readonly description: string;
  /** TLDR: Difficulty label for season card UI */
  readonly difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  /** TLDR: Hazard warnings shown on season card */
  readonly hazardWarnings: readonly string[];
}

export const SEASON_CONFIG: Record<Season, SeasonConfig> = {
  [Season.SPRING]: {
    displayName: 'Spring',
    emoji: '🌸',
    backgroundColor: 0xe8f5e9,  // Light mint green
    gridTint: 0xffffff,          // no tint — natural palette
    pestSpawnMultiplier: 0.5,    // mild pest activity
    droughtEnabled: false,
    frostEnabled: false,
    frostDamagePerDay: 0,
    description: 'Gentle rains and mild weather — perfect for new gardeners.',
    difficulty: 'Easy',
    hazardWarnings: ['Low pest activity'],
  },
  [Season.SUMMER]: {
    displayName: 'Summer',
    emoji: '☀️',
    backgroundColor: 0xfff8e1,  // Cream yellow
    gridTint: 0xffefaa,          // warm golden tint
    pestSpawnMultiplier: 1.0,    // normal pest activity
    droughtEnabled: true,        // drought hazard active
    frostEnabled: false,
    frostDamagePerDay: 0,
    description: 'Hot days bring drought risk, but summer crops thrive.',
    difficulty: 'Medium',
    hazardWarnings: ['Drought possible', 'Normal pest activity'],
  },
  [Season.FALL]: {
    displayName: 'Fall',
    emoji: '🍂',
    backgroundColor: 0xfbe9e7,  // Warm peach
    gridTint: 0xffcc88,          // warm orange tint
    pestSpawnMultiplier: 2.0,   // pest surge
    droughtEnabled: false,
    frostEnabled: false,
    frostDamagePerDay: 0,
    description: 'Harvest bounty awaits, but pests swarm in force.',
    difficulty: 'Hard',
    hazardWarnings: ['Pest surge (2×)', 'Limited seed variety'],
  },
  [Season.WINTER]: {
    displayName: 'Winter',
    emoji: '❄️',
    backgroundColor: 0xe3f2fd,  // Light blue
    gridTint: 0xccddff,          // cool blue tint
    pestSpawnMultiplier: 0.2,    // minimal pest activity
    droughtEnabled: false,
    frostEnabled: true,          // frost hazard active
    frostDamagePerDay: 5,        // 5 HP/day to non-frost-resistant plants
    description: 'Frost threatens most plants — only cold-hardy crops survive.',
    difficulty: 'Expert',
    hazardWarnings: ['Frost damage (5 HP/day)', 'Few available seeds'],
  },
};

/** TLDR: Canonical season order for multi-season runs */
export const SEASON_ORDER: readonly Season[] = [
  Season.SPRING,
  Season.SUMMER,
  Season.FALL,
  Season.WINTER,
];

/** TLDR: Days per mini-season in multi-season mode */
export const MULTI_SEASON_DAYS = 3;

/** TLDR: Runs required to unlock multi-season mode */
export const MULTI_SEASON_UNLOCK_THRESHOLD = 30;

/** TLDR: Score multiplier for completing a multi-season run */
export const MULTI_SEASON_SCORE_MULTIPLIER = 2;

/** TLDR: localStorage key for persisted season preference */
export const SEASON_PREFERENCE_KEY = 'flora_season_preference';

/** Pick a random season */
export function getRandomSeason(): Season {
  const seasons: Season[] = [Season.SPRING, Season.SUMMER, Season.FALL, Season.WINTER];
  return seasons[Math.floor(Math.random() * seasons.length)];
}

/** TLDR: Load persisted season preference from localStorage */
export function loadSeasonPreference(): Season | null {
  try {
    const stored = localStorage.getItem(SEASON_PREFERENCE_KEY);
    if (stored && Object.values(Season).includes(stored as Season)) {
      return stored as Season;
    }
  } catch {
    // TLDR: Gracefully handle localStorage unavailability
  }
  return null;
}

/** TLDR: Persist season preference to localStorage */
export function saveSeasonPreference(season: Season): void {
  try {
    localStorage.setItem(SEASON_PREFERENCE_KEY, season);
  } catch {
    // TLDR: Gracefully handle localStorage unavailability
  }
}
