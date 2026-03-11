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
  GARDEN: 'garden',
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

// Export plant configurations
export * from './plants';
export * from './tools';
export * from './hazards';
