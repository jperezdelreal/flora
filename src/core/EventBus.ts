/**
 * Typed event bus for decoupling game modules.
 * All event names and payload types are defined in EventMap.
 */

import type { GrowthStage } from '../entities/Plant';
import type { StructureType } from '../config/structures';

export interface EventMap {
  'scene:transition': { from: string; to: string };
  'scene:ready': { scene: string };
  'input:action': { action: string; state: 'pressed' | 'released' };
  // Plant lifecycle events
  'plant:created': { plantId: string; x: number; y: number };
  'plant:grew': { plantId: string; stage: GrowthStage };
  'plant:watered': { plantId: string; x: number; y: number };
  'plant:harvested': { plantId: string; seeds: number; isNewDiscovery: boolean };
  'plant:matured': { plantId: string; plantConfigId: string };
  'plant:died': { plantId: string; reason: string };
  // Player action events
  'action:consumed': { actionsRemaining: number; maxActions: number };
  // Day/season events
  'day:advanced': { day: number };
  'season:ended': { season: string; day: number };
  // Hazard events
  'pest:spawned': { pestId: string; plantId: string };
  'pest:removed': { pestId: string };
  'drought:started': { duration: number };
  'drought:ended': { duration: number };
  // Weather events
  'weather:warning': { type: string; daysUntil: number; startDay: number; data: unknown };
  'frost:started': { damagePerDay: number };
  'frost:ended': Record<string, never>;
  'heavy_rain:started': Record<string, never>;
  'heavy_rain:ended': Record<string, never>;
  // Discovery events
  'discovery:new': { plantId: string; plantName: string };
  // Unlock events
  'milestone:unlocked': { milestoneId: string; milestoneName: string };
  // Scoring events
  'score:updated': { total: number; lastAction: number };
  'score:milestone': { milestone: string; score: number };
  // Synergy events
  'synergy:activated': { plantId: string; synergyId: string; x: number; y: number };
  'synergy:tutorial': { synergyId: string };
  'synergy:warning': { plantId: string; synergyId: string; x: number; y: number };
  // Tutorial events
  'tutorial:started': Record<string, never>;
  'tutorial:completed': Record<string, never>;
  'tutorial:skipped': Record<string, never>;
  'tutorial:step': { stepId: string; stepIndex: number };
  // Structure events
  'structure:placed': { structureId: string; type: StructureType; row: number; col: number };
  'structure:removed': { structureId: string; type: StructureType };
  // Grid expansion events
  'grid:expanded': { rows: number; cols: number };
  // Weed events
  'weed:spawned': { weedId: string; row: number; col: number };
  'weed:removed': { weedId: string; row: number; col: number; compostYield: number };
  'weed:spread': { sourceWeedId: string; newWeedId: string; row: number; col: number };
  // Compost events
  'compost:generated': { amount: number; source: string };
  'compost:applied': { row: number; col: number; soilQualityBefore: number; soilQualityAfter: number };
  // Achievement events
  'achievement:unlocked': { achievementId: string; achievementName: string };
  // Accessibility events
  'accessibility:colorVisionChanged': { mode: string; label: string };
  'accessibility:settingsChanged': { setting: string; value: boolean | string };
  // Daily challenge events
  'daily:started': { seed: number; dateString: string; modifiers: string[] };
  'daily:scoreSubmitted': { seed: number; score: number; rank: number };
  // Tool progression events
  'tool:upgraded': { toolType: string; newTier: number; tierName: string };
  'tool:unlocked': { toolType: string; toolName: string };
  // TLDR: Touch/responsive events
  'touch:tap': { x: number; y: number };
  'touch:longpress': { x: number; y: number };
  'touch:pinch': { scale: number };
  'viewport:resized': { width: number; height: number; category: string };
  'viewport:orientationChanged': { orientation: string };
}

type EventName = keyof EventMap & string;
type Listener<T> = (data: T) => void;

export class EventBus {
  private listeners = new Map<string, Set<Listener<unknown>>>();

  on<E extends EventName>(event: E, listener: Listener<EventMap[E]>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as Listener<unknown>);
  }

  off<E extends EventName>(event: E, listener: Listener<EventMap[E]>): void {
    this.listeners.get(event)?.delete(listener as Listener<unknown>);
  }

  emit<E extends EventName>(event: E, data: EventMap[E]): void {
    this.listeners.get(event)?.forEach((fn) => fn(data));
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();
