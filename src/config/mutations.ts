/**
 * TLDR: Heirloom mutation config — defines variants, chances, and conditions for seed mutations
 */

import type { HeirloomVariant } from '../entities/Plant';

/** TLDR: Base mutation chance when harvesting a mature plant (5%) */
export const BASE_MUTATION_CHANCE = 0.05;

/** TLDR: Boosted mutation chance under perfect growing conditions (15%) */
export const PERFECT_CONDITION_MUTATION_CHANCE = 0.15;

/** TLDR: Soil quality threshold for "high soil quality" condition */
export const HIGH_SOIL_QUALITY_THRESHOLD = 85;

/** TLDR: Heirloom variant definitions per base plant type */
export const HEIRLOOM_VARIANTS: Record<string, HeirloomVariant[]> = {
  // Common plants
  tomato: [
    { id: 'tomato_golden', name: 'golden_tomato', displayName: 'Golden Tomato', tint: 0xffd700, growthSpeedBonus: 0.10, yieldSeedsBonus: 1 },
    { id: 'tomato_crystal', name: 'crystal_tomato', displayName: 'Crystal Tomato', tint: 0x87ceeb, growthSpeedBonus: 0.15, yieldSeedsBonus: 0 },
  ],
  lettuce: [
    { id: 'lettuce_ruby', name: 'ruby_lettuce', displayName: 'Ruby Lettuce', tint: 0xdc143c, growthSpeedBonus: 0.10, yieldSeedsBonus: 1 },
  ],
  carrot: [
    { id: 'carrot_purple', name: 'purple_carrot', displayName: 'Purple Carrot', tint: 0x9370db, growthSpeedBonus: 0.10, yieldSeedsBonus: 0 },
    { id: 'carrot_white', name: 'white_carrot', displayName: 'White Carrot', tint: 0xf0f0ff, growthSpeedBonus: 0.05, yieldSeedsBonus: 1 },
  ],
  radish: [
    { id: 'radish_golden', name: 'golden_radish', displayName: 'Golden Radish', tint: 0xffc800, growthSpeedBonus: 0.10, yieldSeedsBonus: 1 },
  ],
  pea: [
    { id: 'pea_midnight', name: 'midnight_pea', displayName: 'Midnight Pea', tint: 0x483d8b, growthSpeedBonus: 0.15, yieldSeedsBonus: 0 },
  ],
  // Uncommon plants
  sunflower: [
    { id: 'sunflower_moonlight', name: 'moonlight_sunflower', displayName: 'Moonlight Sunflower', tint: 0xc0c0f0, growthSpeedBonus: 0.10, yieldSeedsBonus: 1 },
  ],
  mint: [
    { id: 'mint_frost', name: 'frost_mint', displayName: 'Frost Mint', tint: 0xb0e0e6, growthSpeedBonus: 0.10, yieldSeedsBonus: 0 },
  ],
  pepper: [
    { id: 'pepper_ember', name: 'ember_pepper', displayName: 'Ember Pepper', tint: 0xff4500, growthSpeedBonus: 0.15, yieldSeedsBonus: 0 },
  ],
  basil: [
    { id: 'basil_amethyst', name: 'amethyst_basil', displayName: 'Amethyst Basil', tint: 0x9966cc, growthSpeedBonus: 0.10, yieldSeedsBonus: 1 },
  ],
  cucumber: [
    { id: 'cucumber_crystal', name: 'crystal_cucumber', displayName: 'Crystal Cucumber', tint: 0xe0ffff, growthSpeedBonus: 0.10, yieldSeedsBonus: 0 },
  ],
  blueberry: [
    { id: 'blueberry_starlight', name: 'starlight_blueberry', displayName: 'Starlight Blueberry', tint: 0xffd700, growthSpeedBonus: 0.10, yieldSeedsBonus: 1 },
  ],
  // Rare plants
  frost_willow: [
    { id: 'frost_willow_aurora', name: 'aurora_frost_willow', displayName: 'Aurora Frost Willow', tint: 0x00ff7f, growthSpeedBonus: 0.15, yieldSeedsBonus: 0 },
  ],
  lavender: [
    { id: 'lavender_stardust', name: 'stardust_lavender', displayName: 'Stardust Lavender', tint: 0xfff0f5, growthSpeedBonus: 0.10, yieldSeedsBonus: 1 },
  ],
  orchid: [
    { id: 'orchid_phantom', name: 'phantom_orchid', displayName: 'Phantom Orchid', tint: 0xdcdcdc, growthSpeedBonus: 0.15, yieldSeedsBonus: 0 },
  ],
  venus_flytrap: [
    { id: 'venus_flytrap_obsidian', name: 'obsidian_venus_flytrap', displayName: 'Obsidian Venus Flytrap', tint: 0x2f2f2f, growthSpeedBonus: 0.10, yieldSeedsBonus: 0 },
  ],
};

/** TLDR: Get all variant IDs across all plant types */
export function getAllHeirloomVariantIds(): string[] {
  return Object.values(HEIRLOOM_VARIANTS)
    .flat()
    .map((v) => v.id);
}

/** TLDR: Look up a variant by its ID */
export function getHeirloomVariantById(variantId: string): HeirloomVariant | undefined {
  for (const variants of Object.values(HEIRLOOM_VARIANTS)) {
    const found = variants.find((v) => v.id === variantId);
    if (found) return found;
  }
  return undefined;
}
