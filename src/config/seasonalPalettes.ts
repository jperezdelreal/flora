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
  /** Color temperature tint applied to plant rendering (lerped with base colors) */
  readonly plantColorShift: number;
  /** Intensity of the color temperature shift (0.0 = none, 1.0 = full tint) */
  readonly plantColorShiftIntensity: number;
  /** Ambient particle configuration */
  readonly ambientParticles: {
    type: 'petals' | 'fireflies' | 'leaves' | 'snow';
    colors: number[];
    count: number;
  };
}

// TLDR: Sabrina "Cozy Redesign" §1.3 — exact seasonal palettes
export const SEASONAL_PALETTES: Record<Season, SeasonalColorPalette> = {
  // "Morning Dew" — soft sky-to-green gradient, pink petal accents
  [Season.SPRING]: {
    background: 0xE8F5E0,   // §1.3 Spring gradient end (meadow green)
    soil: 0xB8976A,          // §1.3 Spring soil
    sky: 0xC5E8F0,           // §1.3 Spring gradient start (pale robin-egg)
    accent: 0xFFC8D0,        // §1.3 Spring particle color
    plantSaturation: 1.0,
    plantColorShift: 0xf8e0f0,
    plantColorShiftIntensity: 0.08,
    ambientParticles: {
      type: 'petals',
      colors: [0xFFC8D0, 0xffc9d9, 0xffd4e5],
      count: 15,
    },
  },
  // "Golden Hour" — warm sky-to-cream gradient, golden accents
  [Season.SUMMER]: {
    background: 0xFFF3D6,   // §1.3 Summer gradient end (warm cream)
    soil: 0xC9A06C,          // §1.3 Summer soil
    sky: 0x7EC8E3,           // §1.3 Summer gradient start (cerulean)
    accent: 0xFFF5B8,        // §1.3 Summer particle color
    plantSaturation: 1.2,
    plantColorShift: 0xfff0c0,
    plantColorShiftIntensity: 0.1,
    ambientParticles: {
      type: 'fireflies',
      colors: [0xFFF5B8, 0xffd54f, 0xffc107],
      count: 12,
    },
  },
  // "Warm Embers" — amber-to-parchment gradient, burnt orange accents
  [Season.FALL]: {
    background: 0xF0DFC8,   // §1.3 Fall gradient end (parchment)
    soil: 0x8B6844,          // §1.3 Fall soil
    sky: 0xE8C8A0,           // §1.3 Fall gradient start (warm amber)
    accent: 0xD4855F,        // §1.3 Fall particle color
    plantSaturation: 0.9,
    plantColorShift: 0xffd0a0,
    plantColorShiftIntensity: 0.12,
    ambientParticles: {
      type: 'leaves',
      colors: [0xD4855F, 0xff8a65, 0xd84315, 0xbf360c],
      count: 18,
    },
  },
  // "Quiet Hearth" — steel blue-to-warm gray gradient, soft snow accents
  [Season.WINTER]: {
    background: 0xE8E4E0,   // §1.3 Winter gradient end (warm gray)
    soil: 0x9E9080,          // §1.3 Winter soil
    sky: 0xC8D8E8,           // §1.3 Winter gradient start (steel blue)
    accent: 0xF0ECE8,        // §1.3 Winter particle color
    plantSaturation: 0.7,
    plantColorShift: 0xc8e0f8,
    plantColorShiftIntensity: 0.15,
    ambientParticles: {
      type: 'snow',
      colors: [0xF0ECE8, 0xf5f5f5, 0xe0e0e0],
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