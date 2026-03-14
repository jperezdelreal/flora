import { Entity } from './index';

export enum WeedState {
  SPROUTING = 'sprouting',
  ESTABLISHED = 'established',
  SPREADING = 'spreading',
}

export interface WeedConfig {
  readonly spawnRatePerDay: number;
  readonly growthDays: number;
  readonly spreadDays: number;
  readonly growthSlowPenalty: number;
  readonly compostYield: number;
}

export interface WeedData {
  weedId: string;
  state: WeedState;
  daysGrown: number;
  row: number;
  col: number;
}

export class Weed implements Entity {
  readonly id: string;
  x: number;
  y: number;
  active: boolean;
  private state: WeedState;
  private daysGrown: number;

  constructor(id: string, row: number, col: number) {
    this.id = id;
    this.x = col;
    this.y = row;
    this.active = true;
    this.state = WeedState.SPROUTING;
    this.daysGrown = 0;
  }

  getState(): WeedState { return this.state; }
  getDaysGrown(): number { return this.daysGrown; }
  getGridPosition(): { row: number; col: number } { return { row: this.y, col: this.x }; }

  advanceDay(config: WeedConfig): void {
    this.daysGrown++;
    if (this.daysGrown >= config.growthDays + config.spreadDays) {
      this.state = WeedState.SPREADING;
    } else if (this.daysGrown >= config.growthDays) {
      this.state = WeedState.ESTABLISHED;
    }
  }

  isEstablished(): boolean {
    return this.state === WeedState.ESTABLISHED || this.state === WeedState.SPREADING;
  }

  shouldSpread(): boolean { return this.state === WeedState.SPREADING; }

  toData(): WeedData {
    return { weedId: this.id, state: this.state, daysGrown: this.daysGrown, row: this.y, col: this.x };
  }

  static fromData(data: WeedData): Weed {
    const weed = new Weed(data.weedId, data.row, data.col);
    weed.state = data.state;
    weed.daysGrown = data.daysGrown;
    return weed;
  }
}
