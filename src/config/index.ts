/** Game constants and tuning values */

export const GAME = {
  TITLE: 'Flora',
  WIDTH: 800,
  HEIGHT: 600,
  TARGET_FPS: 60,
  BACKGROUND_COLOR: 0xF0E6D3,
  BOOT_DURATION_MS: 2000,
} as const;

export const SCENES = {
  BOOT: 'boot',
  MENU: 'menu',
  SEED_SELECTION: 'seed-selection',
  GARDEN: 'garden',
  ENCYCLOPEDIA: 'encyclopedia',
  ACHIEVEMENTS: 'achievements',
  EXPLORATION: 'exploration',
  GAME_OVER: 'game-over',
  RESULTS: 'results',
  DAILY_CHALLENGE: 'daily-challenge',
} as const;

export const GARDEN = {
  GRID_COLS: 8,
  GRID_ROWS: 8,
  CELL_SIZE: 48,
  GRID_COLOR: 0x3e7a38,
  CELL_BORDER_COLOR: 0x2d5a27,
  SOIL_COLOR: 0xD4B896,          // TLDR: Warm sand (Sabrina §1.2)
} as const;

/** TLDR: Config-driven grid expansion thresholds (GDD §7) */
export const GRID_EXPANSION = {
  /** TLDR: Runs required → unlocked grid size */
  TIERS: [
    { runsRequired: 0, rows: 8, cols: 8 },
    { runsRequired: 10, rows: 10, cols: 10 },
    { runsRequired: 20, rows: 12, cols: 12 },
  ],
} as const;

export const COLORS = {
  DARK_GREEN: 0x2d5a27,
  MID_GREEN: 0x3e7a38,
  LIGHT_GREEN: 0x88d498,
  PALE_GREEN: 0xc8e6c9,
  ACCENT_GREEN: 0x7FB069,       // TLDR: Sage green (Sabrina §1.2)
  SOIL_BROWN: 0x5c3a1e,
  SOIL_LIGHT: 0xDFC8A8,         // TLDR: Warm sand light (Sabrina §1.2)
  SEED_SHELL: 0x4a3626,
  SKY_BLUE: 0x87ceeb,
  WHITE: 0xffffff,
  BLACK: 0x000000,
  // Soil quality visual colors
  SOIL_DEPLETED: 0xb8a88a,     // Grayish beige - depleted soil (<25%)
  SOIL_RICH: 0x3d2817,         // Rich dark earth - high quality (>75%)
  SOIL_QUALITY_GLOW: 0xfff9c4, // Warm sparkle for high-quality soil
  PLANT_SOIL_GLOW: 0xa5d6a7,   // Subtle green glow behind plants on rich soil
  COMPOST_PARTICLE: 0x5d4037,  // Compost particle color for animation
} as const;

/** TLDR: UI component color palette — warm parchment inversion (Sabrina §4.2) */
export const UI_COLORS = {
  // TLDR: Warm parchment palette (Sabrina spec Items 5+7)
  BUTTON_BG: 0xFAF3E8,
  BUTTON_BORDER: 0xD4C4A8,
  BUTTON_HOVER_BG: 0xF2E8D4,
  BUTTON_HOVER_BORDER: 0xD4C4A8,
  BUTTON_SELECTED_BG: 0xC5DEB5,
  BUTTON_SELECTED_BORDER: 0x7FB069,
  BUTTON_LOCKED_BG: 0xE8E0D8,
  BUTTON_LOCKED_BORDER: 0xD0C8C0,
  BUTTON_UNLOCK_HIGHLIGHT: 0x7dc97f,
  BUTTON_UNLOCK_BORDER: 0xa8e6a0,
  BUTTON_UPGRADE_HIGHLIGHT: 0xffc857,
  BUTTON_UPGRADE_BORDER: 0xffd97d,
  TEXT_PRIMARY: '#5E4B3B',
  TEXT_DISABLED: '#B0A898',
  TEXT_TIER_STAR: '#ffc857',
  TEXT_HINT: '#8B7355',
  // TLDR: Panel and overlay colors — parchment (Sabrina §4.2)
  PANEL_BG: 0xFAF3E8,
  PANEL_BORDER: 0xD4C4A8,
  OVERLAY_DARK: 0x1a1512,
  MENU_PANEL_BG: 0xFAF3E8,
  MENU_PANEL_BORDER: 0xD4C4A8,
  MENU_ITEM_BG: 0xE8DCC8,
  MENU_ITEM_BORDER: 0xC9B896,
  MENU_ITEM_HOVER_BG: 0xC5DEB5,
  MENU_ITEM_HOVER_BORDER: 0x7FB069,
  // Seed Selection Scene palette
  BG_WARM_CREAM: 0xfff8e7,
  HILLS_SAGE_GREEN: 0xc8d9ac,
  HILLS_FG_SAGE: 0xa5c882,
  SEASON_BAR_FOREST: 0x3d5a3d,
  TEXT_CREAM: '#f5f5dc',
  TEXT_FOREST_GREEN: '#3d5a3d',
  TEXT_MID_GREEN: '#5a7a5a',
  TEXT_GRAY_GREEN: '#7a8a7a',
  DAILY_BUTTON_CREAM: 0xfff9e6,
  DAILY_BORDER_ORANGE: 0xffa726,
  TEXT_DAILY_ORANGE: '#d68910',
  TEXT_DAILY_BROWN: '#8a6b3a',
  START_BUTTON_GREEN: 0x4caf50,
  START_BUTTON_HOVER_GREEN: 0x5cbf60,
  START_BUTTON_BORDER: 0x66bb6a,
  FLOWER_PINK: 0xffb7c5,
  FLOWER_GOLD: 0xffd700,
  FLOWER_RED: 0xff6b6b,
  FLOWER_SKY_BLUE: 0x87ceeb,
  FLOWER_PLUM: 0xdda0dd,
  TOOLBAR_SEPARATOR: 0xD4C4A8,
  // TLDR: Tile hover and seed selection highlight colors
  TILE_HOVER_FILL: 0xffffff,
  SEED_SELECTED_BG: 0xC5DEB5,
  SEED_SELECTED_BORDER: 0x7FB069,
  TILE_SEED_PREVIEW: 0x7FB069,
  // TLDR: Button hover glow color (#326)
  BUTTON_GLOW: 0x7FB069,
  BACK_BUTTON_BG: 0xE8DCC8,
  BACK_BUTTON_BORDER: 0xC9B896,
  BACK_BUTTON_HOVER_BG: 0xC5DEB5,
  BACK_BUTTON_HOVER_BORDER: 0x7FB069,
  // TLDR: Scene panel/card colors — warm parchment (Sabrina §4.2)
  SCENE_HEADER_BG: 0xF0E6D3,
  SCENE_CARD_BG: 0xFAF3E8,
  SCENE_CARD_SELECTED_BG: 0xC5DEB5,
  SCENE_FILTER_BG: 0xF0E6D3,
  UNDISCOVERED_GRAY: 0xE8E0D8,
  PROGRESS_BAR_BG: 0xE8E0D8,
  HILLS_DARK_MID: 0x1e4d1a,
  HILLS_DARK_FG: 0x163d13,
  // TLDR: Text colors — warm brown on light (Sabrina §4.3)
  TEXT_WHITE: '#5E4B3B',
  TEXT_LIGHT_GRAY: '#5E4B3B',
  TEXT_MID_GRAY: '#8B7355',
  TEXT_DARK_GRAY: '#8B7355',
  TEXT_DIM_GRAY: '#8B7355',
  TEXT_FADED: '#A09080',
  TEXT_DARKEST: '#5E4B3B',
  TEXT_GOLD: '#daa520',
} as const;

/** TLDR: Rarity colors for UI badges/borders (#334) */
export const RARITY_UI_COLORS: Record<string, number> = {
  common: 0x4caf50,
  uncommon: 0x2196f3,
  rare: 0x9c27b0,
  heirloom: 0xffd700,
} as const;

/** TLDR: Rarity colors as CSS strings for text (#334) */
export const RARITY_UI_TEXT_COLORS: Record<string, string> = {
  common: '#4caf50',
  uncommon: '#2196f3',
  rare: '#9c27b0',
  heirloom: '#ffd700',
} as const;

/** TLDR: Touch gesture tuning values */
export const TOUCH = {
  LONG_PRESS_MS: 500,
  DRAG_THRESHOLD_PX: 10,
  PINCH_MIN_SCALE: 0.5,
  PINCH_MAX_SCALE: 2.0,
  HAPTIC_ENABLED: true,
  MIN_TOUCH_TARGET_PX: 44,
} as const;

export * from './seasons';
export * from './plants';
export * from './tools';
export * from './hazards';
export * from './audio';
export * from './synergies';
export type { MilestoneConfig, MilestoneType } from './unlocks';
export { UNLOCK_MILESTONES, getAllMilestones } from './unlocks';
export { getNextMilestone as getNextUnlockMilestone } from './unlocks';
export * from './scoring';
export * from './animations';
export * from './structures';
export * from './accessibility';
export * from './modifiers';
export * from './cosmetics';
