// TLDR: WeedSystem manages weed lifecycle

import { System } from './index';
import { Weed, WeedState, type WeedData } from '../entities/Weed';
import { Tile, TileState } from '../entities/Tile';
import { GardenGrid } from '../entities/GardenGrid';
import { eventBus } from '../core/EventBus';
import { getWeedConfig, COMPOST_CONFIG } from '../config/weeds';
import { Season } from '../config/seasons';

export interface WeedSystemConfig {
  grid: GardenGrid;
  season: Season;
}

export class WeedSystem implements System {
  readonly name = 'WeedSystem';
  private weeds: Map<string, Weed> = new Map();
  private grid: GardenGrid;
  private season: Season;
  private compostPoints = 0;

  constructor(config: WeedSystemConfig) {
    this.grid = config.grid;
    this.season = config.season;
    eventBus.on('day:advanced', () => { this.onDayAdvance(); });
    eventBus.on('plant:died', (data) => {
      this.generateCompost(COMPOST_CONFIG.DEAD_PLANT_YIELD, `dead_plant_${data.plantId}`);
    });
  }

  private onDayAdvance(): void {
    const weedConfig = getWeedConfig(this.season);
    const weedsToSpread: Weed[] = [];
    for (const weed of this.weeds.values()) {
      weed.advanceDay(weedConfig);
      if (weed.shouldSpread()) weedsToSpread.push(weed);
    }
    for (const weed of weedsToSpread) this.trySpreadWeed(weed);
    this.trySpawnWeeds(weedConfig);
  }

  private trySpawnWeeds(config: { spawnRatePerDay: number }): void {
    const emptyTiles: Tile[] = [];
    for (let row = 0; row < this.grid.config.rows; row++) {
      for (let col = 0; col < this.grid.config.cols; col++) {
        const tile = this.grid.getTile(row, col);
        if (tile && tile.isEmpty()) emptyTiles.push(tile);
      }
    }
    for (const tile of emptyTiles) {
      if (Math.random() < config.spawnRatePerDay) this.spawnWeed(tile.row, tile.col);
    }
  }

  spawnWeed(row: number, col: number): Weed | null {
    const tile = this.grid.getTile(row, col);
    if (!tile || !tile.isEmpty()) return null;
    const weedId = `weed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const weed = new Weed(weedId, row, col);
    this.weeds.set(weedId, weed);
    tile.state = TileState.WEED;
    tile.weedId = weedId;
    eventBus.emit('weed:spawned', { weedId, row, col });
    return weed;
  }

  private trySpreadWeed(weed: Weed): void {
    const pos = weed.getGridPosition();
    const adjacentTiles = [
      { row: pos.row - 1, col: pos.col },
      { row: pos.row + 1, col: pos.col },
      { row: pos.row, col: pos.col - 1 },
      { row: pos.row, col: pos.col + 1 },
    ];
    const emptyAdjacent = adjacentTiles.filter((adj) => {
      const tile = this.grid.getTile(adj.row, adj.col);
      return tile && tile.isEmpty();
    });
    if (emptyAdjacent.length > 0) {
      const target = emptyAdjacent[Math.floor(Math.random() * emptyAdjacent.length)];
      const newWeed = this.spawnWeed(target.row, target.col);
      if (newWeed) {
        eventBus.emit('weed:spread', {
          sourceWeedId: weed.id, newWeedId: newWeed.id, row: target.row, col: target.col,
        });
      }
    }
  }

  removeWeed(row: number, col: number): boolean {
    const tile = this.grid.getTile(row, col);
    if (!tile || !tile.hasWeed() || !tile.weedId) return false;
    const weedId = tile.weedId;
    const weed = this.weeds.get(weedId);
    if (!weed) return false;
    const compostYield = getWeedConfig(this.season).compostYield;
    this.generateCompost(compostYield, `weed_${weedId}`);
    this.weeds.delete(weedId);
    tile.state = TileState.EMPTY;
    tile.weedId = undefined;
    eventBus.emit('weed:removed', { weedId, row, col, compostYield });
    return true;
  }

  private generateCompost(amount: number, source: string): void {
    this.compostPoints += amount;
    eventBus.emit('compost:generated', { amount, source });
  }

  applyCompost(row: number, col: number): boolean {
    if (this.compostPoints < COMPOST_CONFIG.POINTS_PER_APPLICATION) return false;
    const tile = this.grid.getTile(row, col);
    if (!tile) return false;
    const soilQualityBefore = tile.soilQuality;
    const newSoilQuality = Math.min(100, tile.soilQuality + COMPOST_CONFIG.SOIL_QUALITY_BOOST);
    tile.setSoilQuality(newSoilQuality);
    this.compostPoints -= COMPOST_CONFIG.POINTS_PER_APPLICATION;
    eventBus.emit('compost:applied', { row, col, soilQualityBefore, soilQualityAfter: newSoilQuality });
    return true;
  }

  getWeedAt(row: number, col: number): Weed | undefined {
    const tile = this.grid.getTile(row, col);
    if (!tile || !tile.weedId) return undefined;
    return this.weeds.get(tile.weedId);
  }

  getWeeds(): Weed[] { return Array.from(this.weeds.values()); }
  getCompostPoints(): number { return this.compostPoints; }
  canApplyCompost(): boolean { return this.compostPoints >= COMPOST_CONFIG.POINTS_PER_APPLICATION; }

  hasAdjacentEstablishedWeeds(row: number, col: number): boolean {
    const adjacentPositions = [
      { row: row - 1, col }, { row: row + 1, col },
      { row, col: col - 1 }, { row, col: col + 1 },
    ];
    for (const pos of adjacentPositions) {
      const weed = this.getWeedAt(pos.row, pos.col);
      if (weed && weed.isEstablished()) return true;
    }
    return false;
  }

  getGrowthPenaltyMultiplier(row: number, col: number): number {
    if (this.hasAdjacentEstablishedWeeds(row, col)) return getWeedConfig(this.season).growthSlowPenalty;
    return 1.0;
  }

  toData(): { weeds: WeedData[]; compostPoints: number } {
    return {
      weeds: Array.from(this.weeds.values()).map((w) => w.toData()),
      compostPoints: this.compostPoints,
    };
  }

  fromData(data: { weeds: WeedData[]; compostPoints: number }): void {
    this.weeds.clear();
    this.compostPoints = data.compostPoints;
    for (const weedData of data.weeds) {
      const weed = Weed.fromData(weedData);
      this.weeds.set(weed.id, weed);
      const tile = this.grid.getTile(weed.y, weed.x);
      if (tile) { tile.state = TileState.WEED; tile.weedId = weed.id; }
    }
  }

  update(_delta: number): void {}

  destroy(): void {
    this.weeds.clear();
    this.compostPoints = 0;
  }
}
