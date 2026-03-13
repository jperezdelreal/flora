export enum TileState {
  EMPTY = 'empty',
  OCCUPIED = 'occupied',
  PEST = 'pest',
  STRUCTURE = 'structure',
}

export interface TileData {
  state: TileState;
  soilQuality: number; // 0-100%
  moisture: number; // 0-100%
}

export class Tile {
  public state: TileState;
  public soilQuality: number;
  public moisture: number;
  public readonly row: number;
  public readonly col: number;

  constructor(row: number, col: number, data?: Partial<TileData>) {
    this.row = row;
    this.col = col;
    this.state = data?.state ?? TileState.EMPTY;
    this.soilQuality = data?.soilQuality ?? 75;
    this.moisture = data?.moisture ?? 50;
  }

  reset(): void {
    this.state = TileState.EMPTY;
    this.soilQuality = 75;
    this.moisture = 50;
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

  setSoilQuality(quality: number): void {
    this.soilQuality = Math.max(0, Math.min(100, quality));
  }

  setMoisture(moisture: number): void {
    this.moisture = Math.max(0, Math.min(100, moisture));
  }
}
