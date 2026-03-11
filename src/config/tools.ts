import { ToolType } from '../entities/Player';
import { Tile, TileState } from '../entities/Tile';
import { Plant } from '../entities/Plant';

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
}

export const TOOL_WATER: ToolConfig = {
  type: ToolType.WATER,
  name: 'water',
  displayName: 'Water',
  icon: '💧',
  description: 'Water a plant to help it grow',
  validate: (tile: Tile, plant: Plant | null): boolean => {
    // Can only water if tile has a plant and plant is not already watered
    if (!plant || !plant.active) return false;
    const plantState = plant.getState();
    return plantState.waterState === 'dry';
  },
  execute: (tile: Tile, plant: Plant | null): ToolActionResult => {
    if (!plant || !plant.active) {
      return { success: false, message: 'No plant to water here' };
    }

    const plantState = plant.getState();
    if (plantState.waterState === 'wet') {
      return { success: false, message: 'Plant is already watered' };
    }

    plant.water();
    tile.setMoisture(100);
    return {
      success: true,
      message: `Watered ${plantState.config.displayName}`,
      advanceDay: true,
    };
  },
};

export const TOOL_HARVEST: ToolConfig = {
  type: ToolType.HARVEST,
  name: 'harvest',
  displayName: 'Harvest',
  icon: '🌾',
  description: 'Harvest a mature plant',
  validate: (tile: Tile, plant: Plant | null): boolean => {
    // Can only harvest mature plants
    if (!plant || !plant.active) return false;
    return plant.canHarvest();
  },
  execute: (tile: Tile, plant: Plant | null): ToolActionResult => {
    if (!plant || !plant.active) {
      return { success: false, message: 'No plant to harvest here' };
    }

    if (!plant.canHarvest()) {
      return { success: false, message: 'Plant is not ready to harvest' };
    }

    const plantState = plant.getState();
    const seeds = plant.harvest();
    tile.state = TileState.EMPTY;

    return {
      success: true,
      message: `Harvested ${plantState.config.displayName}! Got ${seeds} seeds`,
      advanceDay: true,
    };
  },
};

export const TOOL_REMOVE_PEST: ToolConfig = {
  type: ToolType.REMOVE_PEST,
  name: 'remove_pest',
  displayName: 'Remove Pest',
  icon: '🐛',
  description: 'Remove pests from a tile',
  validate: (tile: Tile, plant: Plant | null): boolean => {
    // Can remove pests from pest-infested tiles
    return tile.hasPest();
  },
  execute: (tile: Tile, plant: Plant | null): ToolActionResult => {
    if (!tile.hasPest()) {
      return { success: false, message: 'No pests to remove here' };
    }

    tile.state = plant ? TileState.OCCUPIED : TileState.EMPTY;

    return {
      success: true,
      message: 'Removed pests from tile',
      advanceDay: true,
    };
  },
};

export const ALL_TOOLS: ToolConfig[] = [
  TOOL_WATER,
  TOOL_HARVEST,
  TOOL_REMOVE_PEST,
];

export const TOOL_BY_TYPE: Record<ToolType, ToolConfig> = {
  [ToolType.WATER]: TOOL_WATER,
  [ToolType.HARVEST]: TOOL_HARVEST,
  [ToolType.REMOVE_PEST]: TOOL_REMOVE_PEST,
};

export function getToolConfig(type: ToolType): ToolConfig {
  return TOOL_BY_TYPE[type];
}
