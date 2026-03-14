/**
 * Seasonal color palettes for Flora.
 * Each season has a distinct visual identity: background, soil, sky, accent colors
 * and plant saturation adjustment.
 */

import { Season } from './seasons';

export interface SeasonalColorPalette {
  /** Main background/ground color */
  readonly background: number;
  /** Soil tile base color (interpolated with quality) */
  readonly soil: number;
  /** Sky gradient target */
  readonly sky: number;
  /** UI accent / particle highlight color */
  readonly accent: number;
  /** Plant color saturation multiplier (1.0 = normal) */
  readonly plantSaturation: number;
  /** Ambient particle configuration */
  readonly ambientParticles: {
    type: 'petals' | 'fireflies' | 'leaves' | 'snow';
    colors: number[];
    count: number;
  };
}

export const SEASONAL_PALETTES: Record<Season, SeasonalColorPalette> = {
  [Season.SPRING]: {
    background: 0xe8f5e9, // Light mint green
    soil: 0x8d6e63,       // Warm brown
    sky: 0x87ceeb,        // Sky blue
    accent: 0xffb7c5,     // Cherry blossom pink
    plantSaturation: 1.0,
    ambientParticles: {
      type: 'petals',
      colors: [0xffb7c5, 0xffc9d9, 0xffd4e5], // Light pink shades
      count: 15,
    },
  },
  [Season.SUMMER]: {
    background: 0xfff8e1, // Cream yellow
    soil: 0x795548,       // Medium brown
    sky: 0x64b5f6,        // Light blue
    accent: 0xffd54f,     // Golden yellow
    plantSaturation: 1.2,
    ambientParticles: {
      type: 'fireflies',
      colors: [0xffeb3b, 0xffd54f, 0xffc107], // Yellow/golden tones
      count: 12,
    },
  },
  [Season.FALL]: {
    background: 0xfbe9e7, // Warm peach
    soil: 0x5d4037,       // Dark brown
    sky: 0xffab91,        // Peachy orange
    accent: 0xff7043,     // Orange-red
    plantSaturation: 0.9,
    ambientParticles: {
      type: 'leaves',
      colors: [0xff7043, 0xff8a65, 0xd84315, 0xbf360c], // Orange/brown leaves
      count: 18,
    },
  },
  [Season.WINTER]: {
    background: 0xe3f2fd, // Light blue
    soil: 0x90a4ae,       // Frozen gray
    sky: 0xb0bec5,        // Cool gray-blue
    accent: 0x80deea,     // Ice blue
    plantSaturation: 0.7,
    ambientParticles: {
      type: 'snow',
      colors: [0xffffff, 0xf5f5f5, 0xe0e0e0], // White/light gray snow
      count: 20,
    },
  },
};

export function getSeasonalPalette(season: Season): SeasonalColorPalette {
  return SEASONAL_PALETTES[season];
}

/** Linear interpolation between two hex colors */
export function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;

  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;

  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const blue = Math.round(ab + (bb - ab) * t);

  return (r << 16) | (g << 8) | blue;
}

/** Adjust saturation of a hex color (1.0 = unchanged, 0.0 = grayscale, >1.0 = more vivid) */
export function adjustSaturation(color: number, factor: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;

  // Perceptual luminance weights
  const gray = 0.299 * r + 0.587 * g + 0.114 * b;

  const nr = Math.min(255, Math.max(0, Math.round(gray + (r - gray) * factor)));
  const ng = Math.min(255, Math.max(0, Math.round(gray + (g - gray) * factor)));
  const nb = Math.min(255, Math.max(0, Math.round(gray + (b - gray) * factor)));

  return (nr << 16) | (ng << 8) | nb;
}