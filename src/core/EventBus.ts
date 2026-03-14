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
  // Achievement events
  'achievement:unlocked': { achievementId: string; achievementName: string };
  // Accessibility events
  'accessibility:colorVisionChanged': { mode: string; label: string };
  'accessibility:settingsChanged': { setting: string; value: boolean | string };
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
