import { ToolType } from '../entities/Player';
import { Tile, TileState } from '../entities/Tile';
import { Plant } from '../entities/Plant';
import { COMPOST_TOOL_BOOST } from './structures';

export interface ToolConfig {
  type: ToolType;
  name: string;
  displayName: string;
  icon: string;
  description: string;
  validate: (tile: Tile, plant: Plant | null) => boolean;
  execute: (tile: Tile, plant: Plant | null) => ToolActionResult;
}

export interface ToolActionResult {
  success: boolean;
  message: string;
  advanceDay?: boolean;
  affectedOffsets?: Array<{ dRow: number; dCol: number }>;
  tooltipData?: SoilTestResult;
}

export interface SoilTestResult {
  soilQuality: number;
  moisture: number;
  optimalPlants: string[];
}

export enum ToolTier {
  BASIC = 1,
  IMPROVED = 2,
  ADVANCED = 3,
}

export const TIER_NAMES: Record<ToolTier, string> = {
  [ToolTier.BASIC]: 'Basic',
  [ToolTier.IMPROVED]: 'Improved',
  [ToolTier.ADVANCED]: 'Advanced',
};

export const TIER_STARS: Record<ToolTier, string> = {
  [ToolTier.BASIC]: '★',
  [ToolTier.IMPROVED]: '★★',
  [ToolTier.ADVANCED]: '★★★',
};

export interface TierUnlockCondition {
  type: 'harvests' | 'runs';
  threshold: number;
}

export interface ToolTierConfig {
  tier: ToolTier;
  displayName: string;
  description: string;
  unlockCondition: TierUnlockCondition | null;
  affectedTiles: Array<{ dRow: number; dCol: number }>;
  effectParams: Record<string, number>;
}

export interface ProgressiveToolConfig {
  type: ToolType;
  name: string;
  icon: string;
  unlockCondition: TierUnlockCondition | null;
  unlockHint: string;
  tiers: ToolTierConfig[];
  startsUnlocked: boolean;
}

const CROSS_OFFSETS = [
  { dRow: 0, dCol: 0 },
  { dRow: -1, dCol: 0 },
  { dRow: 1, dCol: 0 },
  { dRow: 0, dCol: -1 },
  { dRow: 0, dCol: 1 },
];

const AREA_3X3_OFFSETS = [
  { dRow: -1, dCol: -1 }, { dRow: -1, dCol: 0 }, { dRow: -1, dCol: 1 },
  { dRow: 0, dCol: -1 },  { dRow: 0, dCol: 0 },  { dRow: 0, dCol: 1 },
  { dRow: 1, dCol: -1 },  { dRow: 1, dCol: 0 },  { dRow: 1, dCol: 1 },
];

const ADJACENT_OFFSETS = [
  { dRow: -1, dCol: 0 },
  { dRow: 1, dCol: 0 },
  { dRow: 0, dCol: -1 },
  { dRow: 0, dCol: 1 },
];

export const WATERING_CAN_PROGRESSION: ProgressiveToolConfig = {
  type: ToolType.WATER,
  name: 'Watering Can',
  icon: '\uD83D\uDCA7',
  unlockCondition: null,
  unlockHint: '',
  startsUnlocked: true,
  tiers: [
    {
      tier: ToolTier.BASIC, displayName: 'Watering Can',
      description: 'Water 1 tile', unlockCondition: null,
      affectedTiles: [{ dRow: 0, dCol: 0 }], effectParams: { moistureAmount: 100 },
    },
    {
      tier: ToolTier.IMPROVED, displayName: 'Improved Watering Can',
      description: 'Water cross pattern (5 tiles)',
      unlockCondition: { type: 'harvests', threshold: 15 },
      affectedTiles: CROSS_OFFSETS, effectParams: { moistureAmount: 100 },
    },
    {
      tier: ToolTier.ADVANCED, displayName: 'Advanced Watering Can',
      description: 'Water 3x3 area (9 tiles)',
      unlockCondition: { type: 'harvests', threshold: 40 },
      affectedTiles: AREA_3X3_OFFSETS, effectParams: { moistureAmount: 100 },
    },
  ],
};

export const PEST_SPRAY_PROGRESSION: ProgressiveToolConfig = {
  type: ToolType.PEST_SPRAY, name: 'Pest Spray', icon: '🧪',
  unlockCondition: { type: 'runs', threshold: 10 },
  unlockHint: 'Complete 10 runs to unlock', startsUnlocked: false,
  tiers: [{
    tier: ToolTier.BASIC, displayName: 'Pest Spray',
    description: 'Remove pests from target + adjacent tiles', unlockCondition: null,
    affectedTiles: [{ dRow: 0, dCol: 0 }, ...ADJACENT_OFFSETS], effectParams: {},
  }],
};

export const SOIL_TESTER_PROGRESSION: ProgressiveToolConfig = {
  type: ToolType.SOIL_TESTER, name: 'Soil Tester', icon: '\uD83D\uDD2C',
  unlockCondition: { type: 'harvests', threshold: 25 },
  unlockHint: 'Harvest 25 plants to unlock', startsUnlocked: false,
  tiers: [{
    tier: ToolTier.BASIC, displayName: 'Soil Tester',
    description: 'Reveals soil quality, moisture & optimal plants', unlockCondition: null,
    affectedTiles: [{ dRow: 0, dCol: 0 }], effectParams: {},
  }],
};

export const TRELLIS_PROGRESSION: ProgressiveToolConfig = {
  type: ToolType.TRELLIS, name: 'Trellis', icon: '\uD83E\uDE9C',
  unlockCondition: { type: 'runs', threshold: 15 },
  unlockHint: 'Complete 15 runs to unlock', startsUnlocked: false,
  tiers: [{
    tier: ToolTier.BASIC, displayName: 'Trellis',
    description: 'Place a trellis that boosts climbing plants +25%', unlockCondition: null,
    affectedTiles: [{ dRow: 0, dCol: 0 }], effectParams: { growthBoost: 0.25 },
  }],
};

// TLDR: Seed tool progression — always unlocked, single-tile planting
export const SEED_PROGRESSION: ProgressiveToolConfig = {
  type: ToolType.SEED, name: 'Seed', icon: '\uD83C\uDF31',
  unlockCondition: null,
  unlockHint: '', startsUnlocked: true,
  tiers: [{
    tier: ToolTier.BASIC, displayName: 'Seed',
    description: 'Plant a seed on an empty tile', unlockCondition: null,
    affectedTiles: [{ dRow: 0, dCol: 0 }], effectParams: {},
  }],
};

export const PROGRESSIVE_TOOLS: ProgressiveToolConfig[] = [
  WATERING_CAN_PROGRESSION, PEST_SPRAY_PROGRESSION,
  SOIL_TESTER_PROGRESSION, TRELLIS_PROGRESSION, SEED_PROGRESSION,
];

export const PROGRESSIVE_TOOL_BY_TYPE: Partial<Record<ToolType, ProgressiveToolConfig>> = {};
for (const tool of PROGRESSIVE_TOOLS) {
  PROGRESSIVE_TOOL_BY_TYPE[tool.type] = tool;
}

export const TOOL_WATER: ToolConfig = {
  type: ToolType.WATER, name: 'water', displayName: 'Water',
  icon: '\uD83D\uDCA7', description: 'Water a plant to help it grow',
  validate: (tile: Tile, plant: Plant | null): boolean => {
    if (!plant || !plant.active) return false;
    return plant.getState().waterState === 'dry';
  },
  execute: (tile: Tile, plant: Plant | null): ToolActionResult => {
    if (!plant || !plant.active) return { success: false, message: 'No plant to water here' };
    if (plant.getState().waterState === 'wet') return { success: false, message: 'Plant is already watered' };
    plant.water(); tile.setMoisture(100);
    return { success: true, message: `Watered ${plant.getState().config.displayName}`, advanceDay: true };
  },
};

export const TOOL_HARVEST: ToolConfig = {
  type: ToolType.HARVEST, name: 'harvest', displayName: 'Harvest',
  icon: '\uD83C\uDF3E', description: 'Harvest a mature plant',
  validate: (tile: Tile, plant: Plant | null): boolean => {
    if (!plant || !plant.active) return false;
    return plant.canHarvest();
  },
  execute: (tile: Tile, plant: Plant | null): ToolActionResult => {
    if (!plant || !plant.active) return { success: false, message: 'No plant to harvest here' };
    if (!plant.canHarvest()) return { success: false, message: 'Plant is not ready to harvest' };
    const plantState = plant.getState();
    const seeds = plant.harvest();
    tile.state = TileState.EMPTY;
    return { success: true, message: `Harvested ${plantState.config.displayName}! Got ${seeds} seeds`, advanceDay: true };
  },
};

export const TOOL_REMOVE_PEST: ToolConfig = {
  type: ToolType.REMOVE_PEST, name: 'remove_pest', displayName: 'Remove Pest',
  icon: '\uD83D\uDC1B', description: 'Remove pests from a tile',
  validate: (tile: Tile, _plant: Plant | null): boolean => { return tile.hasPest(); },
  execute: (tile: Tile, plant: Plant | null): ToolActionResult => {
    if (!tile.hasPest()) return { success: false, message: 'No pests to remove here' };
    tile.state = plant ? TileState.OCCUPIED : TileState.EMPTY;
    return { success: true, message: 'Removed pests from tile', advanceDay: true };
  },
};

export const TOOL_REMOVE_WEED: ToolConfig = {
  type: ToolType.REMOVE_WEED, name: 'remove_weed', displayName: 'Pull Weed',
  icon: '\uD83C\uDF3F', description: 'Pull a weed from a tile and earn compost',
  validate: (tile: Tile, _plant: Plant | null): boolean => { return tile.hasWeed(); },
  execute: (tile: Tile, _plant: Plant | null): ToolActionResult => {
    if (!tile.hasWeed()) return { success: false, message: 'No weed to pull here' };
    return { success: true, message: 'Pulled a weed! Compost earned.', advanceDay: true };
  },
};

export const TOOL_COMPOST: ToolConfig = {
  type: ToolType.COMPOST, name: 'compost', displayName: 'Compost',
  icon: '🪱', description: `Apply compost to boost soil quality (+${COMPOST_TOOL_BOOST}%)`,
  validate: (tile: Tile, _plant: Plant | null): boolean => { return tile.soilQuality < 100; },
  execute: (tile: Tile, _plant: Plant | null): ToolActionResult => {
    if (tile.soilQuality >= 100) return { success: false, message: 'Soil quality is already at maximum' };
    const before = tile.soilQuality;
    tile.setSoilQuality(tile.soilQuality + COMPOST_TOOL_BOOST);
    return { success: true, message: `Applied compost! Soil: ${before}% → ${tile.soilQuality}%`, advanceDay: true };
  },
};

export const TOOL_PEST_SPRAY: ToolConfig = {
  type: ToolType.PEST_SPRAY, name: 'pest_spray', displayName: 'Pest Spray',
  icon: '🧪', description: 'Remove pests from target + adjacent tiles',
  validate: (tile: Tile, _plant: Plant | null): boolean => { return tile.hasPest(); },
  execute: (tile: Tile, plant: Plant | null): ToolActionResult => {
    if (!tile.hasPest()) return { success: false, message: 'No pests to spray here' };
    tile.state = plant ? TileState.OCCUPIED : TileState.EMPTY;
    return { success: true, message: 'Sprayed pests! Target + adjacent tiles cleared', advanceDay: true, affectedOffsets: ADJACENT_OFFSETS };
  },
};

export const TOOL_SOIL_TESTER: ToolConfig = {
  type: ToolType.SOIL_TESTER, name: 'soil_tester', displayName: 'Soil Tester',
  icon: '\uD83D\uDD2C', description: 'Reveals soil quality, moisture & optimal plants',
  validate: (_tile: Tile, _plant: Plant | null): boolean => { return true; },
  execute: (tile: Tile, _plant: Plant | null): ToolActionResult => {
    const optimalPlants = getSoilOptimalPlants(tile.soilQuality, tile.moisture);
    return {
      success: true,
      message: `Soil: ${tile.soilQuality}% quality, ${tile.moisture}% moisture`,
      advanceDay: false,
      tooltipData: { soilQuality: tile.soilQuality, moisture: tile.moisture, optimalPlants },
    };
  },
};

export const TOOL_TRELLIS: ToolConfig = {
  type: ToolType.TRELLIS, name: 'trellis', displayName: 'Trellis',
  icon: '\uD83E\uDE9C', description: 'Place a support that boosts climbing plants +25%',
  validate: (tile: Tile, _plant: Plant | null): boolean => { return tile.isEmpty() || tile.isOccupied(); },
  execute: (tile: Tile, _plant: Plant | null): ToolActionResult => {
    return { success: true, message: 'Placed a trellis! Climbing plants grow 25% faster here', advanceDay: true };
  },
};

// TLDR: Seed tool — plants a seed on an empty tile (actual planting logic in GardenScene)
export const TOOL_SEED: ToolConfig = {
  type: ToolType.SEED, name: 'seed', displayName: 'Seed',
  icon: '\uD83C\uDF31', description: 'Plant a seed on an empty tile',
  validate: (tile: Tile, _plant: Plant | null): boolean => { return tile.isEmpty(); },
  execute: (tile: Tile, _plant: Plant | null): ToolActionResult => {
    return { success: true, message: 'Planted a seed!', advanceDay: true };
  },
};

function getSoilOptimalPlants(soilQuality: number, moisture: number): string[] {
  const suggestions: string[] = [];
  if (soilQuality >= 80 && moisture >= 60) suggestions.push('Tomato', 'Cucumber');
  if (soilQuality >= 60 && moisture <= 40) suggestions.push('Carrot', 'Lavender');
  if (moisture >= 70) suggestions.push('Lettuce', 'Mint');
  if (soilQuality >= 50 && moisture >= 30) suggestions.push('Pea', 'Radish');
  return [...new Set(suggestions)].slice(0, 3);
}

// TLDR: Ordered to match keyboard shortcuts 1-9 (#294)
export const ALL_TOOLS: ToolConfig[] = [
  TOOL_SEED, TOOL_WATER, TOOL_HARVEST, TOOL_REMOVE_PEST, TOOL_REMOVE_WEED,
  TOOL_COMPOST, TOOL_PEST_SPRAY, TOOL_SOIL_TESTER, TOOL_TRELLIS,
];

export const TOOL_BY_TYPE: Record<ToolType, ToolConfig> = {
  [ToolType.WATER]: TOOL_WATER,
  [ToolType.HARVEST]: TOOL_HARVEST,
  [ToolType.REMOVE_PEST]: TOOL_REMOVE_PEST,
  [ToolType.REMOVE_WEED]: TOOL_REMOVE_WEED,
  [ToolType.COMPOST]: TOOL_COMPOST,
  [ToolType.PEST_SPRAY]: TOOL_PEST_SPRAY,
  [ToolType.SOIL_TESTER]: TOOL_SOIL_TESTER,
  [ToolType.TRELLIS]: TOOL_TRELLIS,
  [ToolType.SEED]: TOOL_SEED,
};

export function getToolConfig(type: ToolType): ToolConfig {
  return TOOL_BY_TYPE[type];
}
