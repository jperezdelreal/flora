import { Entity } from './index';

export enum PestType {
  APHID = 'aphid',
  SLUG = 'slug',
  BEETLE = 'beetle',
}

export enum PestState {
  SPAWNED = 'spawned',
  ACTIVE = 'active',
  REMOVED = 'removed',
}

export interface PestConfig {
  type: PestType;
  displayName: string;
  damagePerDay: number;
  spreadChance: number;
  targetPreference: 'young' | 'mature' | 'any';
  resistantPlants: string[];
}

export interface PestData {
  type: PestType;
  targetPlantId: string;
  spawnDay: number;
  state: PestState;
  damagePerDay: number;
  hasSpread: boolean;
}

/**
 * TLDR: Pest entity with unique behaviors per type
 * - Aphids: spread to adjacent tiles
 * - Slugs: target young plants (seedling/growing)
 * - Beetles: target mature plants
 */
export class Pest implements Entity {
  readonly id: string;
  readonly type: PestType;
  x: number;
  y: number;
  active: boolean;
  private data: PestData;

  constructor(
    id: string,
    type: PestType,
    targetPlantId: string,
    spawnDay: number,
    damagePerDay: number,
    x: number,
    y: number,
  ) {
    this.id = id;
    this.type = type;
    this.x = x;
    this.y = y;
    this.active = true;
    this.data = {
      type,
      targetPlantId,
      spawnDay,
      state: PestState.ACTIVE,
      damagePerDay,
      hasSpread: false,
    };
  }

  getData(): Readonly<PestData> {
    return { ...this.data };
  }

  getState(): PestState {
    return this.data.state;
  }

  setState(state: PestState): void {
    this.data.state = state;
    if (state === PestState.REMOVED) {
      this.active = false;
    }
  }

  getDamagePerDay(): number {
    return this.data.damagePerDay;
  }

  getTargetPlantId(): string {
    return this.data.targetPlantId;
  }

  markAsSpread(): void {
    this.data.hasSpread = true;
  }

  hasSpread(): boolean {
    return this.data.hasSpread;
  }
}
