export enum TileState {
  EMPTY = 'empty',
  OCCUPIED = 'occupied',
  PEST = 'pest',
  STRUCTURE = 'structure',
  WEED = 'weed',
}

export interface TileData {
  state: TileState;
  soilQuality: number; // 0-100%
  moisture: number; // 0-100%
  weedId?: string;
}

export class Tile {
  public state: TileState;
  public soilQuality: number;
  public moisture: number;
  public readonly row: number;
  public readonly col: number;
  public weedId?: string;

  constructor(row: number, col: number, data?: Partial<TileData>) {
    this.row = row;
    this.col = col;
    this.state = data?.state ?? TileState.EMPTY;
    this.soilQuality = data?.soilQuality ?? 75;
    this.moisture = data?.moisture ?? 50;
    this.weedId = data?.weedId;
  }

  reset(): void {
    this.state = TileState.EMPTY;
    this.soilQuality = 75;
    this.moisture = 50;
    this.weedId = undefined;
  }

  isEmpty(): boolean {
    return this.state === TileState.EMPTY;
  }

  isOccupied(): boolean {
    return this.state === TileState.OCCUPIED;
  }

  hasPest(): boolean {
    return this.state === TileState.PEST;
  }

  hasStructure(): boolean {
    return this.state === TileState.STRUCTURE;
  }

  hasWeed(): boolean {
    return this.state === TileState.WEED;
  }

  setSoilQuality(quality: number): void {
    this.soilQuality = Math.max(0, Math.min(100, quality));
  }

  setMoisture(moisture: number): void {
    this.moisture = Math.max(0, Math.min(100, moisture));
  }
}
