// TLDR: Manages tool state, tiers, and unlocks based on player progression

import { System } from './index';
import { ToolType } from '../entities/Player';
import {
  ToolTier,
  TIER_NAMES,
  TIER_STARS,
  PROGRESSIVE_TOOLS,
  PROGRESSIVE_TOOL_BY_TYPE,
  type ProgressiveToolConfig,
  type ToolTierConfig,
} from '../config/tools';
import type { ToolProgressionSaveData } from '../config/saveSchema';
import type { SaveManager } from './SaveManager';
import type { UnlockSystem } from './UnlockSystem';
import { eventBus } from '../core/EventBus';

/** TLDR: Runtime tool state per tool type */
export interface ToolState {
  type: ToolType;
  unlocked: boolean;
  currentTier: ToolTier;
  maxAvailableTier: ToolTier;
}

/**
 * ToolSystem manages tool progression: tiers, unlocks, and persistence.
 * Subscribes to EventBus for milestone events and coordinates with UnlockSystem.
 */
export class ToolSystem implements System {
  readonly name = 'ToolSystem';
  private toolStates: Map<ToolType, ToolState> = new Map();
  private saveManager?: SaveManager;
  private unlockSystem?: UnlockSystem;
  private selectedTool: ToolType | null = null;

  // TLDR: Bound listeners for cleanup
  private boundOnMilestoneUnlocked: (data: { milestoneId: string; milestoneName: string }) => void;
  private boundOnPlantHarvested: (data: { plantId: string; seeds: number; isNewDiscovery: boolean }) => void;

  constructor(saveManager?: SaveManager, unlockSystem?: UnlockSystem) {
    this.saveManager = saveManager;
    this.unlockSystem = unlockSystem;

    this.boundOnMilestoneUnlocked = (data) => this.onMilestoneUnlocked(data);
    this.boundOnPlantHarvested = () => this.recheckUpgrades();

    this.initializeToolStates();
    this.loadFromStorage();
    this.recheckUpgrades();

    eventBus.on('milestone:unlocked', this.boundOnMilestoneUnlocked);
    eventBus.on('plant:harvested', this.boundOnPlantHarvested);
  }

  /** TLDR: Initialize all progressive tools with default state */
  private initializeToolStates(): void {
    for (const config of PROGRESSIVE_TOOLS) {
      this.toolStates.set(config.type, {
        type: config.type,
        unlocked: config.startsUnlocked,
        currentTier: ToolTier.BASIC,
        maxAvailableTier: ToolTier.BASIC,
      });
    }
    // TLDR: Non-progressive tools (harvest, remove_pest, remove_weed, compost) are always unlocked
    const alwaysUnlocked: ToolType[] = [
      ToolType.HARVEST,
      ToolType.REMOVE_PEST,
      ToolType.REMOVE_WEED,
      ToolType.COMPOST,
    ];
    for (const type of alwaysUnlocked) {
      if (!this.toolStates.has(type)) {
        this.toolStates.set(type, {
          type,
          unlocked: true,
          currentTier: ToolTier.BASIC,
          maxAvailableTier: ToolTier.BASIC,
        });
      }
    }
  }

  /** TLDR: Recheck all tool unlocks and tier upgrades based on current progress */
  private recheckUpgrades(): void {
    if (!this.unlockSystem) return;

    const progress = this.unlockSystem.getProgress();

    for (const config of PROGRESSIVE_TOOLS) {
      const state = this.toolStates.get(config.type);
      if (!state) continue;

      // Check tool unlock
      if (!state.unlocked && config.unlockCondition) {
        const currentValue = this.getConditionValue(config.unlockCondition.type, progress);
        if (currentValue >= config.unlockCondition.threshold) {
          state.unlocked = true;
          eventBus.emit('tool:unlocked', {
            toolType: config.type,
            toolName: config.name,
          });
        }
      }

      // Check tier upgrades
      if (state.unlocked) {
        for (const tierConfig of config.tiers) {
          if (tierConfig.unlockCondition) {
            const currentValue = this.getConditionValue(tierConfig.unlockCondition.type, progress);
            if (currentValue >= tierConfig.unlockCondition.threshold && tierConfig.tier > state.maxAvailableTier) {
              const oldTier = state.maxAvailableTier;
              state.maxAvailableTier = tierConfig.tier;
              state.currentTier = tierConfig.tier;
              if (oldTier !== tierConfig.tier) {
                eventBus.emit('tool:upgraded', {
                  toolType: config.type,
                  newTier: tierConfig.tier,
                  tierName: TIER_NAMES[tierConfig.tier],
                });
              }
            }
          }
        }
      }
    }

    this.saveToStorage();
  }

  /** TLDR: Get the current value for a condition type from unlock progress */
  private getConditionValue(
    type: 'harvests' | 'runs',
    progress: { plantsHarvested: number; runsCompleted: number },
  ): number {
    switch (type) {
      case 'harvests':
        return progress.plantsHarvested;
      case 'runs':
        return progress.runsCompleted;
      default:
        return 0;
    }
  }

  /** TLDR: Handle milestone unlocked event — recheck all tool states */
  private onMilestoneUnlocked(_data: { milestoneId: string; milestoneName: string }): void {
    this.recheckUpgrades();
  }

  // ── Public API ─────────────────────────────────────────────────

  /** TLDR: Check if a tool is unlocked */
  isToolUnlocked(type: ToolType): boolean {
    const state = this.toolStates.get(type);
    return state?.unlocked ?? true;
  }

  /** TLDR: Get the current tier of a tool */
  getToolTier(type: ToolType): ToolTier {
    const state = this.toolStates.get(type);
    return state?.currentTier ?? ToolTier.BASIC;
  }

  /** TLDR: Get tier display name */
  getToolTierName(type: ToolType): string {
    return TIER_NAMES[this.getToolTier(type)];
  }

  /** TLDR: Get tier star indicator */
  getToolTierStars(type: ToolType): string {
    return TIER_STARS[this.getToolTier(type)];
  }

  /** TLDR: Get the current tier config for a tool */
  getCurrentTierConfig(type: ToolType): ToolTierConfig | null {
    const progressive = PROGRESSIVE_TOOL_BY_TYPE[type];
    if (!progressive) return null;
    const currentTier = this.getToolTier(type);
    return progressive.tiers.find((t) => t.tier === currentTier) ?? progressive.tiers[0];
  }

  /** TLDR: Get the progressive config for a tool */
  getProgressiveConfig(type: ToolType): ProgressiveToolConfig | null {
    return PROGRESSIVE_TOOL_BY_TYPE[type] ?? null;
  }

  /** TLDR: Get the unlock hint for a locked tool */
  getUnlockHint(type: ToolType): string {
    const config = PROGRESSIVE_TOOL_BY_TYPE[type];
    return config?.unlockHint ?? '';
  }

  /** TLDR: Get all tool states */
  getAllToolStates(): Map<ToolType, ToolState> {
    return new Map(this.toolStates);
  }

  /** TLDR: Get the tile offsets for the current tier of a tool */
  getAffectedTiles(type: ToolType): Array<{ dRow: number; dCol: number }> {
    const tierConfig = this.getCurrentTierConfig(type);
    return tierConfig?.affectedTiles ?? [{ dRow: 0, dCol: 0 }];
  }

  /** TLDR: Check if a tool has multiple tiers */
  hasMultipleTiers(type: ToolType): boolean {
    const config = PROGRESSIVE_TOOL_BY_TYPE[type];
    return (config?.tiers.length ?? 0) > 1;
  }

  /** TLDR: Get/set selected tool (persists across days within a run) */
  getSelectedTool(): ToolType | null {
    return this.selectedTool;
  }

  setSelectedTool(tool: ToolType | null): void {
    this.selectedTool = tool;
    this.saveToStorage();
  }

  // ── Trellis helpers ────────────────────────────────────────────

  /** TLDR: Trellis growth boost value from config */
  getTrellisGrowthBoost(): number {
    const tierConfig = this.getCurrentTierConfig(ToolType.TRELLIS);
    return tierConfig?.effectParams['growthBoost'] ?? 0.25;
  }

  // ── Persistence ────────────────────────────────────────────────

  /** TLDR: Load tool progression from SaveManager */
  private loadFromStorage(): void {
    if (!this.saveManager) return;

    const data = this.saveManager.loadTools();
    if (!data) return;

    for (const [typeStr, tier] of Object.entries(data.toolTiers)) {
      const state = this.toolStates.get(typeStr as ToolType);
      if (state) {
        state.currentTier = tier as ToolTier;
        state.maxAvailableTier = tier as ToolTier;
      }
    }

    for (const typeStr of data.unlockedTools) {
      const state = this.toolStates.get(typeStr as ToolType);
      if (state) {
        state.unlocked = true;
      }
    }

    if (data.selectedTool) {
      this.selectedTool = data.selectedTool as ToolType;
    }
  }

  /** TLDR: Save tool progression via SaveManager */
  private saveToStorage(): void {
    if (!this.saveManager) return;

    const toolTiers: Record<string, number> = {};
    const unlockedTools: string[] = [];

    for (const [type, state] of this.toolStates) {
      toolTiers[type] = state.currentTier;
      if (state.unlocked) {
        unlockedTools.push(type);
      }
    }

    const data: ToolProgressionSaveData = {
      toolTiers,
      unlockedTools,
      selectedTool: this.selectedTool,
    };

    this.saveManager.saveTools(data);
  }

  // ── System interface ───────────────────────────────────────────

  update(_delta: number): void {
    // No per-frame update needed
  }

  destroy(): void {
    eventBus.off('milestone:unlocked', this.boundOnMilestoneUnlocked);
    eventBus.off('plant:harvested', this.boundOnPlantHarvested);
    this.toolStates.clear();
  }
}
