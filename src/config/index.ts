/** Game constants and tuning values */

export const GAME = {
  TITLE: 'Flora',
  WIDTH: 800,
  HEIGHT: 600,
  TARGET_FPS: 60,
  BACKGROUND_COLOR: 0x2d5a27,
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
} as const;

export const GARDEN = {
  GRID_COLS: 8,
  GRID_ROWS: 8,
  CELL_SIZE: 48,
  GRID_COLOR: 0x3e7a38,
  CELL_BORDER_COLOR: 0x2d5a27,
  SOIL_COLOR: 0x5c3a1e,
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
  ACCENT_GREEN: 0x66bb6a,
  SOIL_BROWN: 0x5c3a1e,
  SKY_BLUE: 0x87ceeb,
  WHITE: 0xffffff,
  BLACK: 0x000000,
} as const;

/** TLDR: UI component color palette */
export const UI_COLORS = {
  BUTTON_BG: 0x2c2c2c,
  BUTTON_BORDER: 0x4a4a4a,
  BUTTON_HOVER_BG: 0x3c3c3c,
  BUTTON_HOVER_BORDER: 0x6a6a6a,
  BUTTON_SELECTED_BG: 0x4a9eff,
  BUTTON_SELECTED_BORDER: 0x2d7acc,
  BUTTON_LOCKED_BG: 0x1a1a1a,
  BUTTON_LOCKED_BORDER: 0x3a3a3a,
  BUTTON_UNLOCK_HIGHLIGHT: 0x4caf50,
  BUTTON_UNLOCK_BORDER: 0x66bb6a,
  TEXT_PRIMARY: '#ffffff',
  TEXT_DISABLED: '#666666',
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
