import { Entity } from './index';

export enum HazardType {
  PEST = 'pest',
  DROUGHT = 'drought',
}

export enum PestState {
  SPAWNED = 'spawned',
  ACTIVE = 'active',
  REMOVED = 'removed',
}

export interface PestData {
  targetPlantId: string;
  spawnDay: number;
  state: PestState;
  damagePerDay: number;
}

export interface DroughtData {
  startDay: number;
  duration: number;
  daysRemaining: number;
  waterNeedMultiplier: number; // e.g., 1.5 = 50% increase
  isActive: boolean;
}

export type HazardData = PestData | DroughtData;

/**
 * Hazard entity — represents environmental challenges (pests, weather)
 * Pests target individual plants; weather hazards affect the entire garden
 */
export class Hazard implements Entity {
  readonly id: string;
  x: number;
  y: number;
  active: boolean;
  readonly type: HazardType;
  private data: HazardData;

  constructor(
    id: string,
    type: HazardType,
    data: HazardData,
    x: number = 0,
    y: number = 0,
  ) {
    this.id = id;
    this.type = type;
    this.data = data;
    this.x = x;
    this.y = y;
    this.active = true;
  }

  /** Get read-only hazard data */
  getData(): Readonly<HazardData> {
    return { ...this.data };
  }

  /** Check if this is a pest hazard */
  isPest(): boolean {
    return this.type === HazardType.PEST;
  }

  /** Check if this is a drought hazard */
  isDrought(): boolean {
    return this.type === HazardType.DROUGHT;
  }

  /** Get pest data (throws if not a pest) */
  getPestData(): PestData {
    if (!this.isPest()) {
      throw new Error('Hazard is not a pest');
    }
    return this.data as PestData;
  }

  /** Get drought data (throws if not a drought) */
  getDroughtData(): DroughtData {
    if (!this.isDrought()) {
      throw new Error('Hazard is not a drought');
    }
    return this.data as DroughtData;
  }

  /** Update pest state */
  updatePestState(state: PestState): void {
    if (this.isPest()) {
      (this.data as PestData).state = state;
      if (state === PestState.REMOVED) {
        this.active = false;
      }
    }
  }

  /** Advance drought by one day */
  advanceDrought(): void {
    if (this.isDrought()) {
      const drought = this.data as DroughtData;
      if (drought.daysRemaining > 0) {
        drought.daysRemaining--;
      }
      if (drought.daysRemaining <= 0) {
        drought.isActive = false;
        this.active = false;
      }
    }
  }
}
