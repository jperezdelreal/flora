// TLDR: Accessibility configuration — colorblind palettes, focus styles, ARIA settings

/** TLDR: Supported colorblind vision modes */
export type ColorVisionMode = 'normal' | 'deuteranopia' | 'protanopia' | 'tritanopia';

/** TLDR: Palette override for a single vision mode */
export interface ColorPalette {
  darkGreen: number;
  midGreen: number;
  lightGreen: number;
  paleGreen: number;
  accentGreen: number;
  soilBrown: number;
  warning: number;
  danger: number;
  info: number;
  success: number;
}

/** TLDR: Default palette matches existing COLORS config */
const NORMAL_PALETTE: ColorPalette = {
  darkGreen: 0x2d5a27,
  midGreen: 0x3e7a38,
  lightGreen: 0x88d498,
  paleGreen: 0xc8e6c9,
  accentGreen: 0x66bb6a,
  soilBrown: 0x5c3a1e,
  warning: 0xff9800,
  danger: 0xff5252,
  info: 0x42a5f5,
  success: 0x66bb6a,
};

/** TLDR: Deuteranopia-safe palette — avoids red-green confusion */
const DEUTERANOPIA_PALETTE: ColorPalette = {
  darkGreen: 0x2a4858,
  midGreen: 0x3d7a9e,
  lightGreen: 0x7ec8e3,
  paleGreen: 0xc5e3f0,
  accentGreen: 0x56b4e9,
  soilBrown: 0x5c3a1e,
  warning: 0xe69f00,
  danger: 0xcc79a7,
  info: 0x56b4e9,
  success: 0x009e73,
};

/** TLDR: Protanopia-safe palette — avoids red confusion */
const PROTANOPIA_PALETTE: ColorPalette = {
  darkGreen: 0x2a4858,
  midGreen: 0x3d7a9e,
  lightGreen: 0x7ec8e3,
  paleGreen: 0xc5e3f0,
  accentGreen: 0x56b4e9,
  soilBrown: 0x5c3a1e,
  warning: 0xe69f00,
  danger: 0xcc79a7,
  info: 0x56b4e9,
  success: 0x009e73,
};

/** TLDR: Tritanopia-safe palette — avoids blue-yellow confusion */
const TRITANOPIA_PALETTE: ColorPalette = {
  darkGreen: 0x332a27,
  midGreen: 0x5a4a38,
  lightGreen: 0xd4a574,
  paleGreen: 0xe8d5c4,
  accentGreen: 0xc87533,
  soilBrown: 0x5c3a1e,
  warning: 0xff6b35,
  danger: 0xff5252,
  info: 0x8a7967,
  success: 0xc87533,
};

/** TLDR: Map from vision mode to its palette */
export const COLOR_PALETTES: Record<ColorVisionMode, ColorPalette> = {
  normal: NORMAL_PALETTE,
  deuteranopia: DEUTERANOPIA_PALETTE,
  protanopia: PROTANOPIA_PALETTE,
  tritanopia: TRITANOPIA_PALETTE,
};

/** TLDR: Focus indicator styling for keyboard navigation */
export const FOCUS_STYLE = {
  COLOR: 0xffff00,
  WIDTH: 3,
  PADDING: 4,
  BORDER_RADIUS: 6,
} as const;

/** TLDR: Persisted accessibility preferences */
export interface AccessibilityPreferences {
  colorVisionMode: ColorVisionMode;
  reducedMotion: boolean;
  highContrast: boolean;
}

/** TLDR: Default accessibility settings */
export const DEFAULT_ACCESSIBILITY: AccessibilityPreferences = {
  colorVisionMode: 'normal',
  reducedMotion: false,
  highContrast: false,
};
