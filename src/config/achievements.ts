// TLDR: Achievement definitions — 12 achievements across 5 categories with cosmetic rewards

/** TLDR: Achievement category for badge gallery grouping */
export type AchievementCategory = 'harvest' | 'survival' | 'synergy' | 'exploration' | 'mastery';

/** TLDR: Cosmetic reward types earned by unlocking achievements */
export type CosmeticRewardType = 'seed_skin' | 'hud_theme' | 'badge';

/** TLDR: Cosmetic reward definition */
export interface CosmeticReward {
  readonly type: CosmeticRewardType;
  readonly id: string;
  readonly displayName: string;
}

/** TLDR: Single achievement definition */
export interface AchievementConfig {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;
  readonly category: AchievementCategory;
  readonly icon: string;
  readonly reward: CosmeticReward;
  /** TLDR: For threshold-based achievements — system checks current value >= threshold */
  readonly threshold?: number;
}

/** TLDR: All achievement definitions — GDD §7 categories: harvest, survival, synergy, exploration, mastery */
export const ACHIEVEMENTS: readonly AchievementConfig[] = [
  // ---- Harvest (3) ----
  {
    id: 'first_harvest',
    displayName: 'First Sprout',
    description: 'Harvest your very first plant.',
    category: 'harvest',
    icon: '🌱',
    threshold: 1,
    reward: { type: 'badge', id: 'badge_first_harvest', displayName: 'Sprout Badge' },
  },
  {
    id: 'tomato_lover',
    displayName: 'Tomato Lover',
    description: 'Grow and harvest 10 Tomatoes across all runs.',
    category: 'harvest',
    icon: '🍅',
    threshold: 10,
    reward: { type: 'seed_skin', id: 'skin_golden', displayName: 'Golden Seed Packet' },
  },
  {
    id: 'bountiful_harvest',
    displayName: 'Bountiful Harvest',
    description: 'Harvest 50 plants in total.',
    category: 'harvest',
    icon: '🧺',
    threshold: 50,
    reward: { type: 'hud_theme', id: 'theme_autumn_glow', displayName: 'Autumn Glow Theme' },
  },

  // ---- Survival (2) ----
  {
    id: 'frost_harvester',
    displayName: 'Frost Harvester',
    description: 'Harvest a plant during a Winter season.',
    category: 'survival',
    icon: '❄️',
    reward: { type: 'seed_skin', id: 'skin_crystalline', displayName: 'Crystalline Seed Packet' },
  },
  {
    id: 'drought_survivor',
    displayName: 'Drought Survivor',
    description: 'End a drought without losing any plants.',
    category: 'survival',
    icon: '🏜️',
    reward: { type: 'badge', id: 'badge_drought', displayName: 'Drought Badge' },
  },

  // ---- Synergy (2) ----
  {
    id: 'polyculture_master',
    displayName: 'Five-Plant Polyculture',
    description: 'Have 5 different plant types growing simultaneously.',
    category: 'synergy',
    icon: '🌈',
    threshold: 5,
    reward: { type: 'seed_skin', id: 'skin_bloom', displayName: 'Bloom Seed Packet' },
  },
  {
    id: 'synergy_adept',
    displayName: 'Synergy Adept',
    description: 'Activate 10 synergy bonuses across all runs.',
    category: 'synergy',
    icon: '🤝',
    threshold: 10,
    reward: { type: 'hud_theme', id: 'theme_spring_meadow', displayName: 'Spring Meadow Theme' },
  },

  // ---- Exploration (2) ----
  {
    id: 'plant_explorer',
    displayName: 'Plant Explorer',
    description: 'Discover 6 unique plant species.',
    category: 'exploration',
    icon: '🔍',
    threshold: 6,
    reward: { type: 'badge', id: 'badge_explorer', displayName: 'Explorer Badge' },
  },
  {
    id: 'flora_completionist',
    displayName: 'Flora Completionist',
    description: 'Discover all 12 plant species in the encyclopedia.',
    category: 'exploration',
    icon: '📚',
    threshold: 12,
    reward: { type: 'hud_theme', id: 'theme_frost_blue', displayName: 'Frost Blue Theme' },
  },

  // ---- Mastery (3) ----
  {
    id: 'perfect_season',
    displayName: 'Perfect Season',
    description: 'Complete a season without any plant dying.',
    category: 'mastery',
    icon: '✨',
    reward: { type: 'seed_skin', id: 'skin_radiant', displayName: 'Radiant Seed Packet' },
  },
  {
    id: 'speed_grower',
    displayName: 'Speed Grower',
    description: 'Harvest 3 plants in a single day.',
    category: 'mastery',
    icon: '⚡',
    threshold: 3,
    reward: { type: 'badge', id: 'badge_speed', displayName: 'Speed Badge' },
  },
  {
    id: 'seasoned_veteran',
    displayName: 'Seasoned Veteran',
    description: 'Complete 10 garden runs.',
    category: 'mastery',
    icon: '🏅',
    threshold: 10,
    reward: { type: 'hud_theme', id: 'theme_golden_hour', displayName: 'Golden Hour Theme' },
  },
] as const;

/** TLDR: Lookup achievement config by ID */
export const ACHIEVEMENT_BY_ID: Record<string, AchievementConfig> = ACHIEVEMENTS.reduce(
  (acc, a) => {
    acc[a.id] = a;
    return acc;
  },
  {} as Record<string, AchievementConfig>,
);

/** TLDR: Get achievements filtered by category */
export function getAchievementsByCategory(category: AchievementCategory): AchievementConfig[] {
  return ACHIEVEMENTS.filter((a) => a.category === category);
}

/** TLDR: All available categories for gallery tab rendering */
export const ACHIEVEMENT_CATEGORIES: readonly AchievementCategory[] = [
  'harvest',
  'survival',
  'synergy',
  'exploration',
  'mastery',
];

/** TLDR: Human-readable category labels */
export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  harvest: '🌾 Harvest',
  survival: '🛡️ Survival',
  synergy: '🤝 Synergy',
  exploration: '🔍 Exploration',
  mastery: '⭐ Mastery',
};
