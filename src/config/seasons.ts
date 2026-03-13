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
}

export const SEASON_CONFIG: Record<Season, SeasonConfig> = {
  [Season.SPRING]: {
    displayName: 'Spring',
    emoji: '🌸',
    backgroundColor: 0x3a6b35,  // vibrant green
    gridTint: 0xffffff,          // no tint — natural palette
    pestSpawnMultiplier: 0.5,    // mild pest activity
    droughtEnabled: false,
    frostEnabled: false,
    frostDamagePerDay: 0,
  },
  [Season.SUMMER]: {
    displayName: 'Summer',
    emoji: '☀️',
    backgroundColor: 0x5c6e1f,  // warm olive green
    gridTint: 0xffefaa,          // warm golden tint
    pestSpawnMultiplier: 1.0,    // normal pest activity
    droughtEnabled: true,        // drought hazard active
    frostEnabled: false,
    frostDamagePerDay: 0,
  },
  [Season.FALL]: {
    displayName: 'Fall',
    emoji: '🍂',
    backgroundColor: 0x7a4e1e,  // warm autumn brown
    gridTint: 0xffcc88,          // warm orange tint
    pestSpawnMultiplier: 2.0,   // pest surge
    droughtEnabled: false,
    frostEnabled: false,
    frostDamagePerDay: 0,
  },
  [Season.WINTER]: {
    displayName: 'Winter',
    emoji: '❄️',
    backgroundColor: 0x253657,  // cold dark blue
    gridTint: 0xccddff,          // cool blue tint
    pestSpawnMultiplier: 0.2,    // minimal pest activity
    droughtEnabled: false,
    frostEnabled: true,          // frost hazard active
    frostDamagePerDay: 5,        // 5 HP/day to non-frost-resistant plants
  },
};

/** Pick a random season */
export function getRandomSeason(): Season {
  const seasons: Season[] = [Season.SPRING, Season.SUMMER, Season.FALL, Season.WINTER];
  return seasons[Math.floor(Math.random() * seasons.length)];
}
