/**
 * TLDR: Synergy system configuration — defines adjacency bonuses, polyculture mechanics, and negative interactions
 */

export enum SynergyTrait {
  SHADE_PROVIDER = 'shade_provider',
  SHADE_LOVER = 'shade_lover',
  NITROGEN_FIXER = 'nitrogen_fixer',
  PEST_DETERRENT = 'pest_deterrent',
  // TLDR: Negative synergy traits — introduced post-MVP for strategic depth
  WATER_COMPETITOR = 'water_competitor',
  ALLELOPATHIC = 'allelopathic',
  PEST_ATTRACTOR = 'pest_attractor',
}

export interface SynergyBonus {
  readonly name: string;
  readonly description: string;
  readonly growthSpeedMultiplier?: number;
  readonly healthBonus?: number;
  readonly pestResistanceRadius?: number;
  /** TLDR: True for negative synergies (penalties) */
  readonly isNegative?: boolean;
}

/** TLDR: Negative synergy effect applied to adjacent plants */
export interface NegativeSynergyEffect {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly warningText: string;
  /** TLDR: Multiplier applied to adjacent plants' water need (>1 = thirstier) */
  readonly waterNeedMultiplier?: number;
  /** TLDR: Multiplier applied to adjacent plants' growth speed (<1 = slower) */
  readonly growthSpeedMultiplier?: number;
  /** TLDR: Additional pest spawn chance in radius */
  readonly pestAttractionRadius?: number;
  readonly pestAttractionChance?: number;
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
  // TLDR: Negative synergy bonuses displayed in tooltip
  water_competition: {
    name: 'Water Competition',
    description: 'Heavy drinkers increase water needs of adjacent plants',
    isNegative: true,
  },
  allelopathy: {
    name: 'Allelopathy',
    description: 'Chemical compounds slow growth of adjacent plants',
    growthSpeedMultiplier: 0.8,
    isNegative: true,
  },
  pest_attraction: {
    name: 'Pest Magnet',
    description: 'Attracts pests to nearby tiles',
    isNegative: true,
  },
};

/** TLDR: Detailed negative synergy effect definitions */
export const NEGATIVE_SYNERGY_EFFECTS: Record<string, NegativeSynergyEffect> = {
  water_competition: {
    id: 'water_competition',
    name: 'Water Competition',
    description: 'Adjacent plants need 30% more water',
    warningText: '⚠️ This plant competes for water with neighbors',
    waterNeedMultiplier: 1.3,
  },
  allelopathy: {
    id: 'allelopathy',
    name: 'Allelopathy',
    description: 'Adjacent plants grow 20% slower',
    warningText: '⚠️ Chemical compounds slow nearby plant growth',
    growthSpeedMultiplier: 0.8,
  },
  pest_attraction: {
    id: 'pest_attraction',
    name: 'Pest Magnet',
    description: 'Increases pest spawn chance in a 2-tile radius',
    warningText: '⚠️ Attracts pests to nearby tiles',
    pestAttractionRadius: 2,
    pestAttractionChance: 0.15,
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
  // TLDR: Negative synergy visual config
  penaltyGlowColor: 0xff4444,
  penaltyGlowAlpha: 0.25,
  waterCompetitionMultiplier: 1.3,
  allelopathyGrowthPenalty: 0.2,
  pestAttractionRadius: 2,
  pestAttractionChance: 0.15,
} as const;
