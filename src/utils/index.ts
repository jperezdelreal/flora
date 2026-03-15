// Utility helpers: math, RNG, collections, type guards

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Linear interpolation between a and b by factor t */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

/** Seeded pseudo-random number generator (xorshift32) */
export function createRng(seed: number) {
  let state = seed;
  return (): number => {
    state ^= state << 13;
    state ^= state >> 17;
    state ^= state << 5;
    return (state >>> 0) / 0xffffffff;
  };
}

export { ObjectPool } from './objectPool';
export type { PoolConfig } from './objectPool';
export {
  initAriaLiveRegion,
  announce,
  loadAccessibilityPrefs,
  saveAccessibilityPrefs,
  getAccessibilityPrefs,
  getActivePalette,
  setColorVisionMode,
  cycleColorVisionMode,
  getColorVisionLabel,
  drawFocusRing,
  prefersReducedMotion,
  shouldReduceMotion,
  setReducedMotion,
} from './accessibility';

// TLDR: Responsive viewport utilities
export {
  getViewportInfo,
  getViewportCategory,
  getOrientation,
  isTouchDevice,
  getDevicePixelRatio,
  calculateUIScale,
  calculateGridScale,
  responsiveFontSize,
  ensureTouchTarget,
  shouldShowOrientationHint,
  BREAKPOINTS,
  MIN_TOUCH_TARGET,
} from './responsive';
export type {
  ViewportCategory,
  ViewportInfo,
  Orientation,
} from './responsive';
