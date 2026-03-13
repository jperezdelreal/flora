// TLDR: Structure type definitions and config for garden utility buildings

/** TLDR: All placeable structure types */
export enum StructureType {
  GREENHOUSE = 'greenhouse',
  COMPOST_BIN = 'compost_bin',
  RAIN_BARREL = 'rain_barrel',
}

/** TLDR: Config shape for a placeable structure */
export interface StructureConfig {
  id: StructureType;
  displayName: string;
  description: string;
  /** TLDR: Milestone ID that must be unlocked to place this structure */
  unlockMilestoneId: string;
  icon: string;
  /** TLDR: Hex color used for rendering the structure on the grid */
  color: number;
}

/** TLDR: All structure configs keyed by type */
export const STRUCTURE_CONFIGS: Record<StructureType, StructureConfig> = {
  [StructureType.GREENHOUSE]: {
    id: StructureType.GREENHOUSE,
    displayName: 'Greenhouse',
    description: 'Extends the season by 2 extra days',
    unlockMilestoneId: 'runs_10',
    icon: '🏠',
    color: 0x81c784,
  },
  [StructureType.COMPOST_BIN]: {
    id: StructureType.COMPOST_BIN,
    displayName: 'Compost Bin',
    description: 'Converts dead plants into a soil quality boost for adjacent tiles',
    unlockMilestoneId: 'runs_10',
    icon: '🗑️',
    color: 0x8d6e63,
  },
  [StructureType.RAIN_BARREL]: {
    id: StructureType.RAIN_BARREL,
    displayName: 'Rain Barrel',
    description: 'Auto-waters 2 adjacent tiles each day',
    unlockMilestoneId: 'runs_5',
    icon: '🛢️',
    color: 0x64b5f6,
  },
};

/** TLDR: Season extension days granted by Greenhouse */
export const GREENHOUSE_BONUS_DAYS = 2;

/** TLDR: Soil quality boost applied by Compost Bin when a plant dies */
export const COMPOST_SOIL_BOOST = 15;

/** TLDR: Number of adjacent tiles auto-watered by Rain Barrel each day */
export const RAIN_BARREL_WATER_COUNT = 2;
