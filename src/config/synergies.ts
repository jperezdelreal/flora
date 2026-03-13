/**
 * TLDR: Synergy system configuration — defines adjacency bonuses and polyculture mechanics
 */

export enum SynergyTrait {
  SHADE_PROVIDER = 'shade_provider',
  SHADE_LOVER = 'shade_lover',
  NITROGEN_FIXER = 'nitrogen_fixer',
  PEST_DETERRENT = 'pest_deterrent',
}

export interface SynergyBonus {
  readonly name: string;
  readonly description: string;
  readonly growthSpeedMultiplier?: number;
  readonly healthBonus?: number;
  readonly pestResistanceRadius?: number;
}

export const SYNERGY_BONUSES: Record<string, SynergyBonus> = {
  shade_bonus: {
    name: 'Shade Bonus',
    description: 'Tall plants provide shade for shade-loving neighbors',
    growthSpeedMultiplier: 1.15,
  },
  nitrogen_bonus: {
    name: 'Nitrogen Boost',
    description: 'Nitrogen fixers enrich soil for adjacent plants',
    healthBonus: 20,
  },
  pest_deterrent: {
    name: 'Pest Deterrent',
    description: 'Aromatic plants deter pests in nearby area',
    pestResistanceRadius: 2,
  },
  polyculture: {
    name: 'Polyculture Bonus',
    description: '3+ different plant types adjacent = +10% growth speed',
    growthSpeedMultiplier: 1.1,
  },
};

export const SYNERGY_CONFIG = {
  polycultureMinTypes: 3,
  polycultureGrowthBonus: 0.1,
  shadeBonusMultiplier: 0.15,
  nitrogenHealthBonus: 20,
  pestDeterrentRadius: 2,
  bonusGlowColor: 0xffd700,
  bonusGlowAlpha: 0.3,
} as const;
