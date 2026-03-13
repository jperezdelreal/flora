/**
 * TLDR: Scoring configuration — point values, milestones, and bonus rules
 * Based on GDD §X (Run Scoring & Milestones)
 */

export interface ScoreConfig {
  harvest: {
    base: number;
    rarityMultiplier: Record<string, number>;
  };
  perfection: {
    perfectPlant: number;
    perfectRun: number;
  };
  diversity: {
    pointsPerUniqueType: number;
  };
  hazards: {
    pestRemoved: number;
    droughtSurvived: number;
  };
}

export interface MilestoneThreshold {
  name: string;
  threshold: number;
  color: number;
  textColor: string;
}

export const SCORE_CONFIG: ScoreConfig = {
  harvest: {
    base: 10,
    rarityMultiplier: {
      common: 1.0,
      uncommon: 1.5,
      rare: 2.0,
      heirloom: 3.0,
    },
  },
  perfection: {
    perfectPlant: 5,
    perfectRun: 200,
  },
  diversity: {
    pointsPerUniqueType: 50,
  },
  hazards: {
    pestRemoved: 15,
    droughtSurvived: 25,
  },
};

export const MILESTONE_THRESHOLDS: MilestoneThreshold[] = [
  { name: 'Bronze', threshold: 100, color: 0xcd7f32, textColor: '#cd7f32' },
  { name: 'Silver', threshold: 250, color: 0xc0c0c0, textColor: '#c0c0c0' },
  { name: 'Gold', threshold: 500, color: 0xffd700, textColor: '#ffd700' },
  { name: 'Platinum', threshold: 1000, color: 0xe5e4e2, textColor: '#e5e4e2' },
];

export function getScoreMilestone(score: number): MilestoneThreshold | null {
  let achieved: MilestoneThreshold | null = null;
  
  for (const milestone of MILESTONE_THRESHOLDS) {
    if (score >= milestone.threshold) {
      achieved = milestone;
    } else {
      break;
    }
  }
  
  return achieved;
}

export function getNextScoreMilestone(score: number): MilestoneThreshold | null {
  for (const milestone of MILESTONE_THRESHOLDS) {
    if (score < milestone.threshold) {
      return milestone;
    }
  }
  return null;
}
