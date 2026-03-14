// TLDR: Weed spawn rates, growth timing, and compost mechanics per season

import { Season } from './seasons';
import type { WeedConfig } from '../entities/Weed';

const BASE_WEED_CONFIG: WeedConfig = {
  spawnRatePerDay: 0.08,
  growthDays: 1,
  spreadDays: 2,
  growthSlowPenalty: 0.85,
  compostYield: 1,
};

export const WEED_CONFIG_BY_SEASON: Record<Season, WeedConfig> = {
  [Season.SPRING]: { ...BASE_WEED_CONFIG, spawnRatePerDay: 0.12 },
  [Season.SUMMER]: { ...BASE_WEED_CONFIG, spawnRatePerDay: 0.10 },
  [Season.FALL]: { ...BASE_WEED_CONFIG, spawnRatePerDay: 0.06 },
  [Season.WINTER]: { ...BASE_WEED_CONFIG, spawnRatePerDay: 0.03 },
};

export const COMPOST_CONFIG = {
  POINTS_PER_APPLICATION: 3,
  SOIL_QUALITY_BOOST: 20,
  DEAD_PLANT_YIELD: 2,
  WEED_YIELD: 1,
};

export function getWeedConfig(season: Season): WeedConfig {
  return WEED_CONFIG_BY_SEASON[season];
}
