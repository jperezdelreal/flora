/**
 * TLDR: Per-plant visual definitions — 22 unique identities from seed to mature
 * Each plant gets distinct shape, colors, and growth keyframes.
 */

import { GrowthStage } from '../entities/Plant';
import { getActivePalette } from '../utils/accessibility';

export interface PlantKeyframe {
  scale: number;
  alpha: number;
  saturation: number;
  yOffset: number;
}

export type SeedShape = 'round' | 'oval' | 'flat' | 'pointed';
export type LeafShape = 'round' | 'pointed' | 'serrated' | 'narrow';
export type StemStyle = 'thin' | 'medium' | 'thick';
export type PlantFamily = 'flower' | 'herb' | 'vegetable' | 'root_veg' | 'leafy' | 'vine' | 'tree' | 'berry' | 'melon' | 'exotic';

export interface PlantVisualDef {
  plantId: string;
  plantFamily: PlantFamily;
  keyframes: Record<GrowthStage, PlantKeyframe>;
  matureShape: 'circle' | 'oval' | 'tall' | 'wide' | 'star' | 'bush' | 'flower' | 'root';
  baseColor: number;
  accentColor: number;
  detailColor?: number;
  swayIntensity: number;
  glowOnMature: boolean;
  /** Per-species procedural parameters */
  seedShape: SeedShape;
  leafShape: LeafShape;
  stemStyle: StemStyle;
  leafCount: number;
  fruitSize: number;
}

const KEYFRAMES: Record<GrowthStage, PlantKeyframe> = {
  [GrowthStage.SEED]: { scale: 0.3, alpha: 0.8, saturation: 0.4, yOffset: 0 },
  [GrowthStage.SPROUT]: { scale: 0.5, alpha: 0.9, saturation: 0.6, yOffset: -2 },
  [GrowthStage.GROWING]: { scale: 0.8, alpha: 1.0, saturation: 0.85, yOffset: -5 },
  [GrowthStage.MATURE]: { scale: 1.0, alpha: 1.0, saturation: 1.0, yOffset: -8 },
  [GrowthStage.WILTING]: { scale: 0.9, alpha: 0.7, saturation: 0.3, yOffset: -4 },
};

export const PLANT_VISUALS: Record<string, PlantVisualDef> = {
  tomato: {
    plantId: 'tomato',
    plantFamily: 'vegetable',
    keyframes: KEYFRAMES,
    matureShape: 'circle',
    baseColor: 0xe74c3c,
    accentColor: 0x27ae60,
    detailColor: 0xffc107,
    swayIntensity: 1.0,
    glowOnMature: false,
    seedShape: 'flat',
    leafShape: 'serrated',
    stemStyle: 'medium',
    leafCount: 5,
    fruitSize: 0.9,
  },
  lettuce: {
    plantId: 'lettuce',
    plantFamily: 'leafy',
    keyframes: KEYFRAMES,
    matureShape: 'wide',
    baseColor: 0x81c784,
    accentColor: 0xa5d6a7,
    swayIntensity: 0.8,
    glowOnMature: false,
    seedShape: 'round',
    leafShape: 'round',
    stemStyle: 'thin',
    leafCount: 8,
    fruitSize: 0.0,
  },
  carrot: {
    plantId: 'carrot',
    plantFamily: 'root_veg',
    keyframes: KEYFRAMES,
    matureShape: 'root',
    baseColor: 0xff9800,
    accentColor: 0x66bb6a,
    detailColor: 0xff6f00,
    swayIntensity: 0.4,
    glowOnMature: false,
    seedShape: 'pointed',
    leafShape: 'serrated',
    stemStyle: 'thin',
    leafCount: 4,
    fruitSize: 0.7,
  },
  radish: {
    plantId: 'radish',
    plantFamily: 'root_veg',
    keyframes: KEYFRAMES,
    matureShape: 'root',
    baseColor: 0xe91e63,
    accentColor: 0x8bc34a,
    swayIntensity: 0.5,
    glowOnMature: false,
    seedShape: 'round',
    leafShape: 'round',
    stemStyle: 'thin',
    leafCount: 3,
    fruitSize: 0.6,
  },
  pea: {
    plantId: 'pea',
    plantFamily: 'vine',
    keyframes: KEYFRAMES,
    matureShape: 'tall',
    baseColor: 0x8bc34a,
    accentColor: 0xc5e1a5,
    detailColor: 0x7cb342,
    swayIntensity: 1.3,
    glowOnMature: false,
    seedShape: 'round',
    leafShape: 'pointed',
    stemStyle: 'thin',
    leafCount: 6,
    fruitSize: 0.5,
  },
  sunflower: {
    plantId: 'sunflower',
    plantFamily: 'flower',
    keyframes: KEYFRAMES,
    matureShape: 'flower',
    baseColor: 0xffd54f,
    accentColor: 0x795548,
    detailColor: 0xffeb3b,
    swayIntensity: 1.5,
    glowOnMature: true,
    seedShape: 'oval',
    leafShape: 'pointed',
    stemStyle: 'thick',
    leafCount: 12,
    fruitSize: 1.0,
  },
  mint: {
    plantId: 'mint',
    plantFamily: 'herb',
    keyframes: KEYFRAMES,
    matureShape: 'bush',
    baseColor: 0x4db6ac,
    accentColor: 0x80cbc4,
    swayIntensity: 1.0,
    glowOnMature: false,
    seedShape: 'round',
    leafShape: 'serrated',
    stemStyle: 'thin',
    leafCount: 7,
    fruitSize: 0.0,
  },
  pepper: {
    plantId: 'pepper',
    plantFamily: 'vegetable',
    keyframes: KEYFRAMES,
    matureShape: 'oval',
    baseColor: 0xff5722,
    accentColor: 0x4caf50,
    detailColor: 0xff9800,
    swayIntensity: 0.7,
    glowOnMature: false,
    seedShape: 'flat',
    leafShape: 'pointed',
    stemStyle: 'medium',
    leafCount: 4,
    fruitSize: 0.8,
  },
  basil: {
    plantId: 'basil',
    plantFamily: 'herb',
    keyframes: KEYFRAMES,
    matureShape: 'bush',
    baseColor: 0x388e3c,
    accentColor: 0x689f38,
    swayIntensity: 0.9,
    glowOnMature: false,
    seedShape: 'round',
    leafShape: 'round',
    stemStyle: 'medium',
    leafCount: 6,
    fruitSize: 0.0,
  },
  cucumber: {
    plantId: 'cucumber',
    plantFamily: 'vine',
    keyframes: KEYFRAMES,
    matureShape: 'oval',
    baseColor: 0x4caf50,
    accentColor: 0x81c784,
    detailColor: 0x2e7d32,
    swayIntensity: 1.2,
    glowOnMature: false,
    seedShape: 'oval',
    leafShape: 'serrated',
    stemStyle: 'medium',
    leafCount: 5,
    fruitSize: 0.85,
  },
  blueberry: {
    plantId: 'blueberry',
    plantFamily: 'berry',
    keyframes: KEYFRAMES,
    matureShape: 'bush',
    baseColor: 0x5c6bc0,
    accentColor: 0x7986cb,
    detailColor: 0x3f51b5,
    swayIntensity: 0.6,
    glowOnMature: false,
    seedShape: 'round',
    leafShape: 'narrow',
    stemStyle: 'medium',
    leafCount: 5,
    fruitSize: 0.4,
  },
  frost_willow: {
    plantId: 'frost_willow',
    plantFamily: 'tree',
    keyframes: KEYFRAMES,
    matureShape: 'tall',
    baseColor: 0xb3e5fc,
    accentColor: 0x81d4fa,
    detailColor: 0x4fc3f7,
    swayIntensity: 1.8,
    glowOnMature: true,
    seedShape: 'pointed',
    leafShape: 'narrow',
    stemStyle: 'thick',
    leafCount: 8,
    fruitSize: 0.3,
  },
  lavender: {
    plantId: 'lavender',
    plantFamily: 'herb',
    keyframes: KEYFRAMES,
    matureShape: 'flower',
    baseColor: 0x9c27b0,
    accentColor: 0xba68c8,
    detailColor: 0x7b1fa2,
    swayIntensity: 1.1,
    glowOnMature: true,
    seedShape: 'oval',
    leafShape: 'narrow',
    stemStyle: 'thin',
    leafCount: 10,
    fruitSize: 0.3,
  },
  orchid: {
    plantId: 'orchid',
    plantFamily: 'flower',
    keyframes: KEYFRAMES,
    matureShape: 'flower',
    baseColor: 0xf06292,
    accentColor: 0xf48fb1,
    detailColor: 0xe91e63,
    swayIntensity: 0.8,
    glowOnMature: true,
    seedShape: 'flat',
    leafShape: 'narrow',
    stemStyle: 'thin',
    leafCount: 5,
    fruitSize: 0.7,
  },
  venus_flytrap: {
    plantId: 'venus_flytrap',
    plantFamily: 'exotic',
    keyframes: KEYFRAMES,
    matureShape: 'star',
    baseColor: 0x8bc34a,
    accentColor: 0xe91e63,
    detailColor: 0x689f38,
    swayIntensity: 0.5,
    glowOnMature: true,
    seedShape: 'pointed',
    leafShape: 'serrated',
    stemStyle: 'thick',
    leafCount: 5,
    fruitSize: 0.6,
  },
  heirloom_squash: {
    plantId: 'heirloom_squash',
    plantFamily: 'melon',
    keyframes: KEYFRAMES,
    matureShape: 'wide',
    baseColor: 0xff9800,
    accentColor: 0x4caf50,
    detailColor: 0xffc107,
    swayIntensity: 0.4,
    glowOnMature: true,
    seedShape: 'flat',
    leafShape: 'round',
    stemStyle: 'thick',
    leafCount: 4,
    fruitSize: 1.0,
  },
  golden_marigold: {
    plantId: 'golden_marigold',
    plantFamily: 'flower',
    keyframes: KEYFRAMES,
    matureShape: 'flower',
    baseColor: 0xffc107,
    accentColor: 0xffd54f,
    detailColor: 0xff9800,
    swayIntensity: 1.0,
    glowOnMature: true,
    seedShape: 'oval',
    leafShape: 'serrated',
    stemStyle: 'medium',
    leafCount: 14,
    fruitSize: 0.5,
  },
  ghost_pepper: {
    plantId: 'ghost_pepper',
    plantFamily: 'exotic',
    keyframes: KEYFRAMES,
    matureShape: 'oval',
    baseColor: 0xff1744,
    accentColor: 0x4caf50,
    detailColor: 0xff5252,
    swayIntensity: 0.8,
    glowOnMature: true,
    seedShape: 'pointed',
    leafShape: 'pointed',
    stemStyle: 'medium',
    leafCount: 4,
    fruitSize: 0.7,
  },
  moonflower: {
    plantId: 'moonflower',
    plantFamily: 'flower',
    keyframes: KEYFRAMES,
    matureShape: 'flower',
    baseColor: 0xe1f5fe,
    accentColor: 0xb3e5fc,
    detailColor: 0x81d4fa,
    swayIntensity: 1.2,
    glowOnMature: true,
    seedShape: 'round',
    leafShape: 'round',
    stemStyle: 'thin',
    leafCount: 7,
    fruitSize: 0.8,
  },
  strawberry: {
    plantId: 'strawberry',
    plantFamily: 'berry',
    keyframes: KEYFRAMES,
    matureShape: 'bush',
    baseColor: 0xef5350,
    accentColor: 0x66bb6a,
    detailColor: 0xffcdd2,
    swayIntensity: 0.7,
    glowOnMature: false,
    seedShape: 'pointed',
    leafShape: 'serrated',
    stemStyle: 'thin',
    leafCount: 5,
    fruitSize: 0.7,
  },
  sage: {
    plantId: 'sage',
    plantFamily: 'herb',
    keyframes: KEYFRAMES,
    matureShape: 'bush',
    baseColor: 0x78909c,
    accentColor: 0x90a4ae,
    detailColor: 0xb0bec5,
    swayIntensity: 0.6,
    glowOnMature: false,
    seedShape: 'round',
    leafShape: 'narrow',
    stemStyle: 'medium',
    leafCount: 6,
    fruitSize: 0.0,
  },
  watermelon: {
    plantId: 'watermelon',
    plantFamily: 'melon',
    keyframes: KEYFRAMES,
    matureShape: 'wide',
    baseColor: 0x43a047,
    accentColor: 0xef5350,
    detailColor: 0x2e7d32,
    swayIntensity: 0.3,
    glowOnMature: true,
    seedShape: 'flat',
    leafShape: 'round',
    stemStyle: 'thick',
    leafCount: 4,
    fruitSize: 1.0,
  },
};

export function getPlantVisual(plantId: string): PlantVisualDef | undefined {
  return PLANT_VISUALS[plantId];
}

export function getStageKeyframe(plantId: string, stage: GrowthStage): PlantKeyframe {
  const visual = getPlantVisual(plantId);
  if (!visual) {
    return KEYFRAMES[stage];
  }
  return visual.keyframes[stage];
}

export function adjustColorForHealth(baseColor: number, health: number): number {
  const r = (baseColor >> 16) & 0xff;
  const g = (baseColor >> 8) & 0xff;
  const b = baseColor & 0xff;
  
  const factor = Math.max(0.3, health / 100);
  
  return (
    (Math.floor(r * factor) << 16) |
    (Math.floor(g * factor) << 8) |
    Math.floor(b * factor)
  );
}

export function adjustColorForAccessibility(baseColor: number): number {
  const palette = getActivePalette();
  
  if ((baseColor & 0x00ff00) > 0x009000) {
    return palette.lightGreen;
  }
  
  if ((baseColor & 0xff0000) > 0xcc0000) {
    return palette.danger;
  }
  
  if ((baseColor & 0x0000ff) > 0x000090) {
    return palette.info;
  }
  
  return baseColor;
}

export interface PlantShapeData {
  mainRadius: number;
  secondaryRadius?: number;
  aspectRatio: number;
  petals?: number;
  rotation: number;
}

export function getShapeData(
  visualDef: PlantVisualDef,
  stage: GrowthStage,
  baseSize: number,
): PlantShapeData {
  const keyframe = visualDef.keyframes[stage];
  const size = baseSize * keyframe.scale;
  
  const shapeMap: Record<typeof visualDef.matureShape, PlantShapeData> = {
    circle: {
      mainRadius: size,
      aspectRatio: 1.0,
      rotation: 0,
    },
    oval: {
      mainRadius: size,
      aspectRatio: 1.4,
      rotation: 0,
    },
    tall: {
      mainRadius: size,
      aspectRatio: 0.6,
      rotation: 0,
    },
    wide: {
      mainRadius: size,
      aspectRatio: 1.8,
      rotation: 0,
    },
    star: {
      mainRadius: size,
      secondaryRadius: size * 0.5,
      aspectRatio: 1.0,
      petals: 5,
      rotation: 0,
    },
    bush: {
      mainRadius: size * 0.7,
      secondaryRadius: size * 0.9,
      aspectRatio: 1.0,
      rotation: 0,
    },
    flower: {
      mainRadius: size,
      secondaryRadius: size * 0.4,
      aspectRatio: 1.0,
      petals: 8,
      rotation: 0,
    },
    root: {
      mainRadius: size * 0.6,
      secondaryRadius: size * 0.3,
      aspectRatio: 1.2,
      rotation: 0,
    },
  };
  
  return shapeMap[visualDef.matureShape];
}
