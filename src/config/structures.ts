// TLDR: Structure type definitions and config for garden utility buildings

/** TLDR: All placeable structure types */
export enum StructureType {
  GREENHOUSE = 'greenhouse',
  COMPOST_BIN = 'compost_bin',
  RAIN_BARREL = 'rain_barrel',
  TRELLIS = 'trellis',
}

/** TLDR: Visual parameters for procedural structure rendering */
export interface StructureVisual {
  /** Primary color palette for the structure sprite */
  colors: { primary: number; secondary: number; accent: number };
  /** Shape hint used by TileRenderer */
  shape: 'frame' | 'container' | 'cylinder' | 'lattice';
  /** Whether the structure has a shimmer/animation hint */
  animated: boolean;
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
  /** TLDR: Visual parameters for procedural rendering by TileRenderer */
  visual: StructureVisual;
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
    visual: {
      colors: { primary: 0x90caf9, secondary: 0x81c784, accent: 0xb3e5fc },
      shape: 'frame',
      animated: false,
    },
  },
  [StructureType.COMPOST_BIN]: {
    id: StructureType.COMPOST_BIN,
    displayName: 'Compost Bin',
    description: 'Converts dead plants into a soil quality boost for adjacent tiles',
    unlockMilestoneId: 'runs_10',
    icon: '🗑️',
    color: 0x8d6e63,
    visual: {
      colors: { primary: 0x8d6e63, secondary: 0x5d4037, accent: 0xa1887f },
      shape: 'container',
      animated: false,
    },
  },
  [StructureType.RAIN_BARREL]: {
    id: StructureType.RAIN_BARREL,
    displayName: 'Rain Barrel',
    description: 'Auto-waters 2 adjacent tiles each day',
    unlockMilestoneId: 'runs_5',
    icon: '🛢️',
    color: 0x64b5f6,
    visual: {
      colors: { primary: 0x64b5f6, secondary: 0x455a64, accent: 0x81d4fa },
      shape: 'cylinder',
      animated: true,
    },
  },
  [StructureType.TRELLIS]: {
    id: StructureType.TRELLIS,
    displayName: 'Trellis',
    description: 'Supports climbing plants for bonus yield',
    unlockMilestoneId: 'runs_15',
    icon: '🪜',
    color: 0xa1887f,
    visual: {
      colors: { primary: 0xa1887f, secondary: 0x8d6e63, accent: 0x6d4c41 },
      shape: 'lattice',
      animated: false,
    },
  },
};

/** TLDR: Season extension days granted by Greenhouse */
export const GREENHOUSE_BONUS_DAYS = 2;

/** TLDR: Soil quality boost applied by Compost Bin when a plant dies */
export const COMPOST_SOIL_BOOST = 15;

/** TLDR: Number of adjacent tiles auto-watered by Rain Barrel each day */
export const RAIN_BARREL_WATER_COUNT = 2;
