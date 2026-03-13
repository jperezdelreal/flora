import { ToolType } from '../entities/Player';

/**
 * Unlock milestone definitions for Flora's meta-progression system.
 * Based on GDD §7 'Meta-Progression': discovery > grind
 */

export interface MilestoneConfig {
  id: string;
  displayName: string;
  description: string;
  threshold: number;
  rewardType: 'tool' | 'grid_expansion' | 'ability';
  rewardValue: ToolType | string;
  icon: string;
}

export type MilestoneType = 
  | 'plants_harvested'    // Total plants harvested across all runs
  | 'plants_matured'      // Plants successfully grown to maturity
  | 'plant_diversity'     // Unique plant species discovered
  | 'runs_completed';     // Total garden runs completed

/**
 * TLDR: Milestone definitions organized by progression type
 * Tier 1: 5 plants (basic tools)
 * Tier 2: 15 plants (advanced tools)
 * Tier 3: 30 plants (garden expansions)
 * Runs milestones: grid expansion at 10 & 20 runs, structure unlocks at 5 & 10 runs
 */
export const UNLOCK_MILESTONES: Record<MilestoneType, MilestoneConfig[]> = {
  plants_harvested: [
    {
      id: 'harvest_5',
      displayName: 'First Harvests',
      description: 'Harvest 5 plants to unlock the Watering Can+',
      threshold: 5,
      rewardType: 'tool',
      rewardValue: ToolType.WATER,
      icon: '💧',
    },
    {
      id: 'harvest_15',
      displayName: 'Experienced Gardener',
      description: 'Harvest 15 plants to unlock the Compost Bin',
      threshold: 15,
      rewardType: 'tool',
      rewardValue: ToolType.REMOVE_PEST,
      icon: '🗑️',
    },
    {
      id: 'harvest_30',
      displayName: 'Master Gardener',
      description: 'Harvest 30 plants to expand your garden to 10×10',
      threshold: 30,
      rewardType: 'grid_expansion',
      rewardValue: '10x10',
      icon: '🌟',
    },
  ],
  plants_matured: [
    {
      id: 'matured_3',
      displayName: 'Growing Confidence',
      description: 'Grow 3 plants to maturity',
      threshold: 3,
      rewardType: 'ability',
      rewardValue: 'faster_growth_tooltip',
      icon: '🌱',
    },
    {
      id: 'matured_10',
      displayName: 'Patient Cultivator',
      description: 'Grow 10 plants to maturity',
      threshold: 10,
      rewardType: 'ability',
      rewardValue: 'weather_forecast',
      icon: '🌿',
    },
  ],
  plant_diversity: [
    {
      id: 'diversity_3',
      displayName: 'Plant Explorer',
      description: 'Discover 3 different plant species',
      threshold: 3,
      rewardType: 'ability',
      rewardValue: 'seed_rarity_indicator',
      icon: '📖',
    },
    {
      id: 'diversity_6',
      displayName: 'Botanist',
      description: 'Discover 6 different plant species',
      threshold: 6,
      rewardType: 'ability',
      rewardValue: 'enhanced_encyclopedia',
      icon: '🔬',
    },
    {
      id: 'diversity_10',
      displayName: 'Flora Expert',
      description: 'Discover 10 different plant species',
      threshold: 10,
      rewardType: 'ability',
      rewardValue: 'all_plants_unlocked',
      icon: '🏆',
    },
  ],
  runs_completed: [
    {
      id: 'runs_5',
      displayName: 'Seasoned Gardener',
      description: 'Complete 5 runs to unlock the Rain Barrel',
      threshold: 5,
      rewardType: 'ability',
      rewardValue: 'rain_barrel',
      icon: '🛢️',
    },
    {
      id: 'runs_10',
      displayName: 'Garden Expansion I',
      description: 'Complete 10 runs to expand your garden to 10×10',
      threshold: 10,
      rewardType: 'grid_expansion',
      rewardValue: '10x10',
      icon: '🌟',
    },
    {
      id: 'runs_20',
      displayName: 'Garden Expansion II',
      description: 'Complete 20 runs to expand your garden to 12×12',
      threshold: 20,
      rewardType: 'grid_expansion',
      rewardValue: '12x12',
      icon: '🏆',
    },
  ],
};

/**
 * TLDR: Get all milestones sorted by threshold
 */
export function getAllMilestones(): MilestoneConfig[] {
  const allMilestones: MilestoneConfig[] = [];
  for (const milestones of Object.values(UNLOCK_MILESTONES)) {
    allMilestones.push(...milestones);
  }
  return allMilestones.sort((a, b) => a.threshold - b.threshold);
}

/**
 * TLDR: Get the next uncompleted milestone for a specific type
 */
export function getNextMilestone(
  type: MilestoneType,
  currentValue: number
): MilestoneConfig | null {
  const milestones = UNLOCK_MILESTONES[type];
  return milestones.find((m) => currentValue < m.threshold) ?? null;
}
