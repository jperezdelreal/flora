/**
 * TLDR: Animation timing and visual effect constants for game feel polish
 * All values are configurable here — no magic numbers in systems.
 */

export const ANIMATION = {
  // Plant growth scale pop
  GROWTH_SCALE_DURATION: 0.4,
  GROWTH_SCALE_OVERSHOOT: 1.25,

  // Plant idle sway (sine wave rotation)
  SWAY_AMPLITUDE: 0.04,
  SWAY_FREQUENCY: 1.2,
  // Idle sway x-offset on mature plants (gentle horizontal motion)
  SWAY_X_AMPLITUDE: 1.5,
  SWAY_X_FREQUENCY: 0.8,

  // Harvest burst particles
  HARVEST_PARTICLE_COUNT: 14,
  HARVEST_PARTICLE_LIFETIME: 0.7,
  HARVEST_PARTICLE_SPEED: 140,
  HARVEST_PARTICLE_SIZE: 4,
  HARVEST_SHAKE_DURATION: 0.15,
  HARVEST_SHAKE_INTENSITY: 4,

  // Water ripple
  WATER_RIPPLE_DURATION: 0.6,
  WATER_RIPPLE_RINGS: 3,
  WATER_RIPPLE_MAX_RADIUS: 28,
  WATER_RIPPLE_COLOR: 0x4fc3f7,

  // Synergy glow pulse (particle burst on activation)
  SYNERGY_GLOW_PULSE_SPEED: 2.0,
  SYNERGY_GLOW_MIN_ALPHA: 0.15,
  SYNERGY_GLOW_MAX_ALPHA: 0.6,
  SYNERGY_GLOW_RADIUS: 22,
  SYNERGY_GLOW_DURATION: 4.0,

  // TLDR: Persistent synergy aura on bonused plants (#316)
  SYNERGY_AURA_RADIUS: 20,
  SYNERGY_AURA_MIN_ALPHA: 0.1,
  SYNERGY_AURA_MAX_ALPHA: 0.4,
  SYNERGY_AURA_PULSE_SPEED: 1.8,

  // TLDR: Connection lines between synergized plants (#316)
  SYNERGY_LINE_WIDTH: 2,
  SYNERGY_LINE_ALPHA: 0.45,
  SYNERGY_LINE_DASH_SPEED: 2.0,

  // TLDR: Negative synergy red flash (#316)
  NEGATIVE_SYNERGY_FLASH_DURATION: 0.6,
  NEGATIVE_SYNERGY_FLASH_ALPHA: 0.35,

  // TLDR: Placement preview synergy hint (#316)
  SYNERGY_PREVIEW_ALPHA: 0.3,
  SYNERGY_PREVIEW_LINE_ALPHA: 0.25,

  // Day advance sky lerp
  DAY_SKY_LERP_DURATION: 1.0,

  // Pest crawl wobble
  PEST_CRAWL_AMPLITUDE: 1.5,
  PEST_CRAWL_SPEED: 3.0,

  // Button feedback
  BUTTON_HOVER_SCALE: 1.08,
  BUTTON_CLICK_SCALE: 0.92,
  BUTTON_BOUNCE_DURATION: 0.12,

  // Scene transitions (mirrors SceneManager defaults)
  SCENE_FADE_DURATION: 0.4,

  // TLDR: Menu button hover polish (#326)
  MENU_HOVER_SCALE: 1.05,
  MENU_HOVER_GLOW_ALPHA: 0.25,
  MENU_HOVER_GLOW_EXPAND: 6,

  // TLDR: Menu background parallax depth (#326)
  PARALLAX_INTENSITY_BG: 0.008,
  PARALLAX_INTENSITY_MID: 0.015,
  PARALLAX_INTENSITY_FG: 0.025,
  PARALLAX_SMOOTHING: 0.08,

  // Harvest screen pulse
  HARVEST_PULSE_OPACITY: 0.25,
  HARVEST_PULSE_DURATION: 0.35,

  // Harvest seed drop particles
  HARVEST_SEED_PARTICLE_COUNT: 6,

  // Pest squish effect
  PEST_SQUISH_PARTICLE_COUNT: 10,
  PEST_SQUISH_COLOR: 0x8d6e63,

  // Water droplet splash
  WATER_DROPLET_COUNT: 5,

  // Plant visual sizes per growth stage (radius)
  PLANT_SIZE_SEED: 4,
  PLANT_SIZE_SPROUT: 7,
  PLANT_SIZE_GROWING: 11,
  PLANT_SIZE_MATURE: 14,
  PLANT_SIZE_WILTING: 12,

  // Maturity celebration — pop, glow, sparkle when plant reaches harvest-ready
  MATURE_BOUNCE_PEAK_SCALE: 1.3,
  MATURE_BOUNCE_DURATION: 0.3,
  MATURE_PARTICLE_COUNT: 5,
  MATURE_PARTICLE_SPEED: 60,
  MATURE_PARTICLE_LIFETIME: 0.8,
  MATURE_PARTICLE_SIZE: 3,
  MATURE_GLOW_RADIUS: 20,
  MATURE_GLOW_PULSE_SPEED: 1.5,
  MATURE_GLOW_MIN_ALPHA: 0.1,
  MATURE_GLOW_MAX_ALPHA: 0.45,
  MATURE_FLOATING_TEXT_DURATION: 1.5,
  MATURE_FLOATING_TEXT_RISE_SPEED: 25,
  MATURE_FLOATING_TEXT_SIZE: 13,

  // TLDR: Season-end pacing — banner, count-up, flourish (#308)
  SEASON_END_BANNER_DURATION: 1.5,
  SEASON_END_BANNER_FADE_IN: 0.4,
  SEASON_END_BANNER_FADE_OUT: 0.3,
  SEASON_END_PARTICLE_COUNT: 24,
  SEASON_END_PARTICLE_SPEED: 80,
  SEASON_END_PARTICLE_LIFETIME: 2.0,
  SEASON_END_PARTICLE_SIZE: 5,
  SCORE_COUNTUP_DURATION: 2.5,
  SCORE_COUNTUP_CATEGORY_STAGGER: 0.3,
  SCORE_BUTTON_ENABLE_DELAY: 0.5,

  GUIDANCE_HINT_FADE_IN: 0.3,
  GUIDANCE_HINT_HOLD: 6.0,
  GUIDANCE_HINT_FADE_OUT: 0.5,

  // TLDR: Tool upgrade toast notification (#317)
  TOOL_UPGRADE_TOAST_DURATION: 4000,
  TOOL_UPGRADE_TOAST_FADE_IN: 400,
  TOOL_UPGRADE_TOAST_FADE_OUT: 600,
  TOOL_UPGRADE_TOAST_SCALE_START: 0.85,

  // TLDR: Tool upgrade celebration particles (#317)
  TOOL_UPGRADE_PARTICLE_COUNT: 12,
  TOOL_UPGRADE_PARTICLE_SPEED: 100,
  TOOL_UPGRADE_PARTICLE_LIFETIME: 0.8,
  TOOL_UPGRADE_PARTICLE_SIZE: 4,
  TOOL_UPGRADE_GLOW_DURATION: 1.5,

  // TLDR: Toolbar tier tooltip (#317)
  TOOL_TOOLTIP_WIDTH: 220,
  TOOL_TOOLTIP_PADDING: 10,
} as const;

// TLDR: Plant color palettes per rarity for growth visuals
export const PLANT_STAGE_COLORS: Record<string, number[]> = {
  seed: [0x8d6e63, 0x795548],
  sprout: [0x81c784, 0x66bb6a],
  growing: [0x4caf50, 0x43a047],
  mature: [0x388e3c, 0x2e7d32],
  wilting: [0x9e9e9e, 0x757575],
};

// TLDR: Rarity accent colors for harvest burst particles
export const RARITY_COLORS: Record<string, number[]> = {
  common: [0x81c784, 0xa5d6a7, 0xc8e6c9],
  uncommon: [0x4fc3f7, 0x81d4fa, 0xb3e5fc],
  rare: [0xba68c8, 0xce93d8, 0xe1bee7],
  heirloom: [0xffd54f, 0xffe082, 0xfff9c4],
};

// TLDR: Synergy glow colors (positive + negative)
export const SYNERGY_GLOW_COLORS: Record<string, number> = {
  shade_bonus: 0x4fc3f7,
  nitrogen_bonus: 0x66bb6a,
  polyculture: 0xffd54f,
  pest_deterrent: 0xce93d8,
  water_competition: 0xff5252,
  allelopathy: 0xff8a65,
  pest_attraction: 0xef5350,
};
