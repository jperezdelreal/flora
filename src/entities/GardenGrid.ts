import { Tile, TileState } from './Tile';

export interface GridConfig {
  rows: number;
  cols: number;
  tileSize: number;
  padding: number;
}

export class GardenGrid {
  private tiles: Tile[][];
  public readonly config: GridConfig;

  constructor(config?: Partial<GridConfig>) {
    this.config = {
      rows: config?.rows ?? 8,
      cols: config?.cols ?? 8,
      tileSize: config?.tileSize ?? 64,
      padding: config?.padding ?? 4,
    };

    this.tiles = this.initializeTiles();
  }

  private initializeTiles(): Tile[][] {
    const tiles: Tile[][] = [];
    for (let row = 0; row < this.config.rows; row++) {
      tiles[row] = [];
      for (let col = 0; col < this.config.cols; col++) {
        tiles[row][col] = new Tile(row, col);
      }
    }
    return tiles;
  }

  getTile(row: number, col: number): Tile | null {
    if (row < 0 || row >= this.config.rows || col < 0 || col >= this.config.cols) {
      return null;
    }
    return this.tiles[row][col];
  }

  getTileAtPosition(x: number, y: number, gridX: number, gridY: number): Tile | null {
    const relativeX = x - gridX;
    const relativeY = y - gridY;

    const col = Math.floor(relativeX / this.config.tileSize);
    const row = Math.floor(relativeY / this.config.tileSize);

    return this.getTile(row, col);
  }

  getAllTiles(): Tile[] {
    const allTiles: Tile[] = [];
    for (let row = 0; row < this.config.rows; row++) {
      for (let col = 0; col < this.config.cols; col++) {
        allTiles.push(this.tiles[row][col]);
      }
    }
    return allTiles;
  }

  resetAllTiles(): void {
    for (let row = 0; row < this.config.rows; row++) {
      for (let col = 0; col < this.config.cols; col++) {
        this.tiles[row][col].reset();
      }
    }
  }

  getGridDimensions(): { width: number; height: number } {
    const width = this.config.cols * this.config.tileSize;
    const height = this.config.rows * this.config.tileSize;
    return { width, height };
  }

  getTilePosition(row: number, col: number): { x: number; y: number } {
    return {
      x: col * this.config.tileSize,
      y: row * this.config.tileSize,
    };
  }
}
