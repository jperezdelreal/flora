/**
 * TLDR: Responsive viewport utilities — breakpoints, DPI awareness, scaling, and orientation
 */

/** TLDR: Breakpoint thresholds for responsive layout decisions */
export const BREAKPOINTS = {
  MOBILE_SM: 320,
  MOBILE: 480,
  TABLET: 768,
  DESKTOP: 1024,
  DESKTOP_LG: 1440,
  DESKTOP_XL: 2560,
} as const;

/** TLDR: Minimum touch target size per WCAG/Apple guidelines */
export const MIN_TOUCH_TARGET = 44;

/** TLDR: Viewport size category for layout decisions */
export type ViewportCategory = 'mobile-sm' | 'mobile' | 'tablet' | 'desktop' | 'desktop-lg';

/** TLDR: Orientation of the viewport */
export type Orientation = 'portrait' | 'landscape';

/** TLDR: Complete viewport info snapshot */
export interface ViewportInfo {
  width: number;
  height: number;
  dpr: number;
  category: ViewportCategory;
  orientation: Orientation;
  isTouchDevice: boolean;
  scaleFactor: number;
}

/** TLDR: Determine viewport category from width */
export function getViewportCategory(width: number): ViewportCategory {
  if (width < BREAKPOINTS.MOBILE) return 'mobile-sm';
  if (width < BREAKPOINTS.TABLET) return 'mobile';
  if (width < BREAKPOINTS.DESKTOP) return 'tablet';
  if (width < BREAKPOINTS.DESKTOP_LG) return 'desktop';
  return 'desktop-lg';
}

/** TLDR: Detect current orientation */
export function getOrientation(width: number, height: number): Orientation {
  return width >= height ? 'landscape' : 'portrait';
}

/** TLDR: Check if the device supports touch input */
export function isTouchDevice(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  );
}

/** TLDR: Get device pixel ratio, clamped to reasonable range */
export function getDevicePixelRatio(): number {
  return Math.min(window.devicePixelRatio || 1, 3);
}

/** TLDR: Calculate a scale factor for UI elements based on viewport width */
export function calculateUIScale(viewportWidth: number): number {
  if (viewportWidth < BREAKPOINTS.MOBILE) return 0.75;
  if (viewportWidth < BREAKPOINTS.TABLET) return 0.85;
  if (viewportWidth < BREAKPOINTS.DESKTOP) return 0.95;
  return 1.0;
}

/** TLDR: Calculate optimal tile size to fit a grid in the viewport while maintaining aspect ratio */
export function calculateGridScale(
  viewportWidth: number,
  viewportHeight: number,
  gridCols: number,
  gridRows: number,
  padding: number,
  maxTileSize: number = 64,
): { tileSize: number; scale: number; offsetX: number; offsetY: number } {
  // TLDR: Reserve space for HUD at top and toolbar at bottom
  const hudHeight = 150;
  const toolbarHeight = 120;
  const horizontalPadding = 20;

  const availableWidth = viewportWidth - horizontalPadding * 2;
  const availableHeight = viewportHeight - hudHeight - toolbarHeight;

  const tileSizeFromWidth = (availableWidth - padding * (gridCols + 1)) / gridCols;
  const tileSizeFromHeight = (availableHeight - padding * (gridRows + 1)) / gridRows;

  const tileSize = Math.min(tileSizeFromWidth, tileSizeFromHeight, maxTileSize);
  const clampedTileSize = Math.max(tileSize, 24);

  const gridWidth = clampedTileSize * gridCols + padding * (gridCols + 1);
  const gridHeight = clampedTileSize * gridRows + padding * (gridRows + 1);

  const scale = clampedTileSize / maxTileSize;
  const offsetX = (viewportWidth - gridWidth) / 2;
  const offsetY = hudHeight + (availableHeight - gridHeight) / 2;

  return { tileSize: clampedTileSize, scale, offsetX, offsetY };
}

/** TLDR: Calculate font size that scales with viewport */
export function responsiveFontSize(
  baseSizePx: number,
  viewportWidth: number,
  minSizePx: number = 10,
  maxSizePx: number = 48,
): number {
  const scale = calculateUIScale(viewportWidth);
  return Math.max(minSizePx, Math.min(maxSizePx, Math.round(baseSizePx * scale)));
}

/** TLDR: Ensure touch target meets minimum size, returning adjusted size */
export function ensureTouchTarget(sizePx: number): number {
  return Math.max(sizePx, MIN_TOUCH_TARGET);
}

/** TLDR: Build a complete viewport info snapshot */
export function getViewportInfo(): ViewportInfo {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const dpr = getDevicePixelRatio();
  const category = getViewportCategory(width);
  const orientation = getOrientation(width, height);
  const touch = isTouchDevice();
  const scaleFactor = calculateUIScale(width);

  return {
    width,
    height,
    dpr,
    category,
    orientation,
    isTouchDevice: touch,
    scaleFactor,
  };
}

/** TLDR: Check if orientation hint should display (portrait on small screens) */
export function shouldShowOrientationHint(width: number, height: number): boolean {
  const orientation = getOrientation(width, height);
  const category = getViewportCategory(width);
  return orientation === 'portrait' && (category === 'mobile-sm' || category === 'mobile');
}
