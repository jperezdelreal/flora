/** Game constants and tuning values */

export const GAME = {
  TITLE: 'Flora',
  WIDTH: 800,
  HEIGHT: 600,
  BACKGROUND_COLOR: 0x2d5a27,
} as const;

export const SCENES = {
  BOOT: 'boot',
  MENU: 'menu',
  GARDEN: 'garden',
  EXPLORATION: 'exploration',
  GAME_OVER: 'game-over',
} as const;
