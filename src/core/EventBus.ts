/**
 * Typed event bus for decoupling game modules.
 * All event names and payload types are defined in EventMap.
 */

export interface EventMap {
  'scene:transition': { from: string; to: string };
  'scene:ready': { scene: string };
  'input:action': { action: string; state: 'pressed' | 'released' };
  // Add game events here as development progresses, e.g.:
  // 'plant:grew': { plantId: string; stage: number };
  // 'day:ended': { dayNumber: number };
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
