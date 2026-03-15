// TLDR: Cosmetic definitions — seed packet skins, HUD theme palettes, badge displays

import type { CosmeticRewardType } from './achievements';

/** TLDR: Seed packet skin visual definition */
export interface SeedSkinConfig {
  readonly id: string;
  readonly displayName: string;
  readonly borderColor: number;
  readonly bgColor: number;
  readonly bgAlpha: number;
  readonly bannerColor: number;
  readonly bannerAlpha: number;
  readonly accentColor: string;
  readonly glowColor: number;
  readonly emoji: string;
}

/** TLDR: HUD theme color palette override */
export interface HudThemeConfig {
  readonly id: string;
  readonly displayName: string;
  readonly panelBg: number;
  readonly panelBgAlpha: number;
  readonly panelBorder: number;
  readonly primaryTextColor: string;
  readonly secondaryTextColor: string;
  readonly tertiaryTextColor: string;
  readonly accentColor: number;
  readonly progressBarColor: number;
  readonly phaseBarBg: number;
  readonly hintBgColor: number;
}

/** TLDR: Badge display definition */
export interface BadgeConfig {
  readonly id: string;
  readonly displayName: string;
  readonly icon: string;
  readonly borderColor: number;
  readonly bgColor: number;
}

/** TLDR: Unified cosmetic lookup entry */
export interface CosmeticDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly type: CosmeticRewardType;
}

// ── Seed Skins ──────────────────────────────────────────────────────

export const SEED_SKINS: Record<string, SeedSkinConfig> = {
  skin_golden: {
    id: 'skin_golden',
    displayName: 'Golden Seed Packet',
    borderColor: 0xffd700,
    bgColor: 0xfff8dc,
    bgAlpha: 0.98,
    bannerColor: 0xffd700,
    bannerAlpha: 0.3,
    accentColor: '#b8860b',
    glowColor: 0xffd700,
    emoji: '✨',
  },
  skin_crystalline: {
    id: 'skin_crystalline',
    displayName: 'Crystalline Seed Packet',
    borderColor: 0x87ceeb,
    bgColor: 0xf0f8ff,
    bgAlpha: 0.96,
    bannerColor: 0x87ceeb,
    bannerAlpha: 0.25,
    accentColor: '#4682b4',
    glowColor: 0xadd8e6,
    emoji: '💎',
  },
  skin_bloom: {
    id: 'skin_bloom',
    displayName: 'Bloom Seed Packet',
    borderColor: 0xff69b4,
    bgColor: 0xfff0f5,
    bgAlpha: 0.98,
    bannerColor: 0xff69b4,
    bannerAlpha: 0.25,
    accentColor: '#c71585',
    glowColor: 0xffb6c1,
    emoji: '🌸',
  },
  skin_radiant: {
    id: 'skin_radiant',
    displayName: 'Radiant Seed Packet',
    borderColor: 0xff8c00,
    bgColor: 0xfffaf0,
    bgAlpha: 0.98,
    bannerColor: 0xff8c00,
    bannerAlpha: 0.28,
    accentColor: '#ff4500',
    glowColor: 0xffa500,
    emoji: '☀️',
  },
} as const;

// ── HUD Themes ──────────────────────────────────────────────────────

/** TLDR: Default HUD theme — matches existing warm cozy palette */
export const DEFAULT_HUD_THEME: HudThemeConfig = {
  id: 'default',
  displayName: 'Default',
  panelBg: 0x2a2520,
  panelBgAlpha: 0.92,
  panelBorder: 0x6b5b4e,
  primaryTextColor: '#f5e6d3',
  secondaryTextColor: '#d4a574',
  tertiaryTextColor: '#8a7a6a',
  accentColor: 0xa8e6cf,
  progressBarColor: 0xa8e6cf,
  phaseBarBg: 0x2a2520,
  hintBgColor: 0x2e7d32,
};

export const HUD_THEMES: Record<string, HudThemeConfig> = {
  theme_autumn_glow: {
    id: 'theme_autumn_glow',
    displayName: 'Autumn Glow Theme',
    panelBg: 0x3d2a1a,
    panelBgAlpha: 0.92,
    panelBorder: 0xd4843e,
    primaryTextColor: '#ffe4c4',
    secondaryTextColor: '#e8a85c',
    tertiaryTextColor: '#a0785a',
    accentColor: 0xffcc80,
    progressBarColor: 0xffab40,
    phaseBarBg: 0x3d2a1a,
    hintBgColor: 0xbf6c10,
  },
  theme_spring_meadow: {
    id: 'theme_spring_meadow',
    displayName: 'Spring Meadow Theme',
    panelBg: 0x1a3a1a,
    panelBgAlpha: 0.92,
    panelBorder: 0x66bb6a,
    primaryTextColor: '#e8f5e9',
    secondaryTextColor: '#a5d6a7',
    tertiaryTextColor: '#81c784',
    accentColor: 0xc8e6c9,
    progressBarColor: 0x66bb6a,
    phaseBarBg: 0x1a3a1a,
    hintBgColor: 0x388e3c,
  },
  theme_frost_blue: {
    id: 'theme_frost_blue',
    displayName: 'Frost Blue Theme',
    panelBg: 0x1a2a3d,
    panelBgAlpha: 0.92,
    panelBorder: 0x64b5f6,
    primaryTextColor: '#e3f2fd',
    secondaryTextColor: '#90caf9',
    tertiaryTextColor: '#78909c',
    accentColor: 0xbbdefb,
    progressBarColor: 0x42a5f5,
    phaseBarBg: 0x1a2a3d,
    hintBgColor: 0x1565c0,
  },
  theme_golden_hour: {
    id: 'theme_golden_hour',
    displayName: 'Golden Hour Theme',
    panelBg: 0x3d3020,
    panelBgAlpha: 0.92,
    panelBorder: 0xffc107,
    primaryTextColor: '#fff8e1',
    secondaryTextColor: '#ffe082',
    tertiaryTextColor: '#bcaa6e',
    accentColor: 0xffd54f,
    progressBarColor: 0xffca28,
    phaseBarBg: 0x3d3020,
    hintBgColor: 0xf9a825,
  },
} as const;

// ── Badges ──────────────────────────────────────────────────────────

export const BADGE_CONFIGS: Record<string, BadgeConfig> = {
  badge_first_harvest: {
    id: 'badge_first_harvest',
    displayName: 'Sprout Badge',
    icon: '🌱',
    borderColor: 0x4caf50,
    bgColor: 0x1b5e20,
  },
  badge_drought: {
    id: 'badge_drought',
    displayName: 'Drought Badge',
    icon: '🏜️',
    borderColor: 0xffa726,
    bgColor: 0x5d3a1a,
  },
  badge_explorer: {
    id: 'badge_explorer',
    displayName: 'Explorer Badge',
    icon: '🔍',
    borderColor: 0x9c27b0,
    bgColor: 0x4a148c,
  },
  badge_speed: {
    id: 'badge_speed',
    displayName: 'Speed Badge',
    icon: '⚡',
    borderColor: 0xffd700,
    bgColor: 0x5d4a00,
  },
  badge_weed_warrior: {
    id: 'badge_weed_warrior',
    displayName: 'Weed Warrior Badge',
    icon: '🌿',
    borderColor: 0x66bb6a,
    bgColor: 0x1b5e20,
  },
  badge_composter: {
    id: 'badge_composter',
    displayName: 'Composter Badge',
    icon: '🪴',
    borderColor: 0x8d6e63,
    bgColor: 0x3e2723,
  },
} as const;

// ── Helpers ─────────────────────────────────────────────────────────

/** TLDR: Get seed skin config by reward ID, or null if not found */
export function getSeedSkin(id: string): SeedSkinConfig | null {
  return SEED_SKINS[id] ?? null;
}

/** TLDR: Get HUD theme config by reward ID, or default theme */
export function getHudTheme(id: string | null): HudThemeConfig {
  if (id && HUD_THEMES[id]) return HUD_THEMES[id];
  return DEFAULT_HUD_THEME;
}

/** TLDR: Get badge config by reward ID, or null if not found */
export function getBadgeConfig(id: string): BadgeConfig | null {
  return BADGE_CONFIGS[id] ?? null;
}

/** TLDR: All cosmetic IDs for validation */
export function getAllCosmeticIds(): string[] {
  return [
    ...Object.keys(SEED_SKINS),
    ...Object.keys(HUD_THEMES),
    ...Object.keys(BADGE_CONFIGS),
  ];
}
