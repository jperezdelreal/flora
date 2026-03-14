/**
 * TLDR: Dedicated rendering system for garden tiles and structures.
 * Tiles respond visually to soil state (moisture, quality, planted, weed-infested).
 * Structures get unique procedural sprites (Greenhouse, Compost Bin, Rain Barrel, Trellis).
 * Decoupled from game logic — receives tile data, produces visuals.
 * Sprites cached per (tileState, season, moisture bucket) combination.
 */

import { Container, Graphics } from 'pixi.js';
import { Tile, TileState } from '../entities/Tile';
import type { GardenGrid } from '../entities/GardenGrid';
import { StructureType } from '../config/structures';
import { Season } from '../config/seasons';
import { getSeasonalPalette, lerpColor, adjustSaturation } from '../config/seasonalPalettes';
import { getActivePalette } from '../utils/accessibility';
import type { System } from './index';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TileRendererConfig {
  grid: GardenGrid;
}

interface TileVisualState {
  state: TileState;
  moistureBucket: number;
  qualityBucket: number;
  season: Season;
}

/** Structure types that TileRenderer can draw */
type RenderableStructure = StructureType | 'trellis';

// ─── Tile visual constants ──────────────────────────────────────────────────

/** Soil colors for moisture visualization */
const SOIL_COLORS = {
  dry: 0xc4a882,       // Light brown — dry soil
  moist: 0x5c3a1e,     // Dark brown — moist soil
  richEarth: 0x3d2817, // Rich dark earth — high quality
} as const;

/** Overlay colors for tile states */
const TILE_OVERLAYS = {
  planted: 0x4caf50,     // Green ring for planted tiles
  weedBase: 0x6b7a3d,   // Scraggly weed overlay base
  weedTip: 0x8b9a5b,    // Weed tip color
} as const;

/** Structure rendering colors */
const STRUCTURE_COLORS = {
  greenhouse: {
    frame: 0x90caf9,    // Glass blue frame
    tint: 0x81c784,     // Green tint
    pane: 0xb3e5fc,     // Glass pane
  },
  compost_bin: {
    wood: 0x8d6e63,     // Wooden slats
    soil: 0x5d4037,     // Compost soil inside
    slat: 0xa1887f,     // Individual slat highlight
  },
  rain_barrel: {
    body: 0x64b5f6,     // Cylindrical body
    band: 0x455a64,     // Metal bands
    water: 0x81d4fa,    // Water shimmer
  },
  trellis: {
    frame: 0xa1887f,    // Lattice wood color
    lattice: 0x8d6e63,  // Lattice detail
    join: 0x6d4c41,     // Join points
  },
} as const;

/** Seasonal tile tint multipliers */
const SEASONAL_TILE_TINTS: Record<Season, number> = {
  [Season.SPRING]: 0xf0fff0,  // Fresh green tinge
  [Season.SUMMER]: 0xfff8e0,  // Golden warmth
  [Season.FALL]: 0xfff0e0,    // Warm amber
  [Season.WINTER]: 0xe8f0ff,  // Frost blue
};

// ─── Cache helpers ──────────────────────────────────────────────────────────

/** Bucket moisture (0-100) into 5 discrete levels to limit cache entries */
function moistureBucket(moisture: number): number {
  return Math.floor(moisture / 20) * 20; // 0, 20, 40, 60, 80
}

/** Bucket soil quality (0-100) into 5 discrete levels */
function qualityBucket(quality: number): number {
  return Math.floor(quality / 20) * 20;
}

/** Generate a composite cache key for tile visuals */
function makeTileCacheKey(state: TileVisualState, structureType?: RenderableStructure): string {
  const base = `tile_${state.state}_m${state.moistureBucket}_q${state.qualityBucket}_${state.season}`;
  return structureType ? `${base}_${structureType}` : base;
}

// ─── TileRenderer ───────────────────────────────────────────────────────────

export class TileRenderer implements System {
  readonly name = 'TileRenderer';

  private tileLayer: Container;
  private tileGraphics = new Map<Tile, Graphics>();
  private visualStateCache = new Map<string, string>();
  private drawCache = new Map<string, (gfx: Graphics, size: number, padding: number) => void>();
  private currentSeason: Season = Season.SPRING;
  private grid: GardenGrid;

  /** Map from "row,col" → structure type for rendering */
  private structureMap = new Map<string, RenderableStructure>();

  constructor(config: TileRendererConfig) {
    this.grid = config.grid;
    this.tileLayer = new Container();
    this.initializeTiles();
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  getContainer(): Container {
    return this.tileLayer;
  }

  setSeason(season: Season): void {
    this.currentSeason = season;
    this.visualStateCache.clear();
    this.drawCache.clear();
    this.refreshAllTiles();
  }

  setGrid(grid: GardenGrid): void {
    // Tear down old tile graphics
    for (const [, gfx] of this.tileGraphics) {
      gfx.destroy();
    }
    this.tileGraphics.clear();
    this.visualStateCache.clear();
    this.drawCache.clear();

    this.grid = grid;
    this.initializeTiles();
  }

  /** Register a structure at a grid position for rendering */
  registerStructure(row: number, col: number, type: RenderableStructure): void {
    this.structureMap.set(`${row},${col}`, type);
    this.refreshTileAt(row, col);
  }

  /** Unregister a structure at a grid position */
  unregisterStructure(row: number, col: number): void {
    this.structureMap.delete(`${row},${col}`);
    this.refreshTileAt(row, col);
  }

  /** Force refresh a specific tile */
  refreshTileAt(row: number, col: number): void {
    const tile = this.grid.getTile(row, col);
    if (!tile) return;
    const gfx = this.tileGraphics.get(tile);
    if (gfx) this.renderTile(tile, gfx);
  }

  /** Force refresh all tiles */
  refreshAllTiles(): void {
    for (const [tile, gfx] of this.tileGraphics) {
      this.renderTile(tile, gfx);
    }
  }

  // ─── System interface ───────────────────────────────────────────────────

  update(_delta: number): void {
    for (const [tile, gfx] of this.tileGraphics) {
      const stateKey = this.computeVisualStateKey(tile);
      const cached = this.visualStateCache.get(`${tile.row},${tile.col}`);
      if (cached !== stateKey) {
        this.renderTile(tile, gfx);
        this.visualStateCache.set(`${tile.row},${tile.col}`, stateKey);
      }
    }
  }

  destroy(): void {
    this.tileLayer.destroy({ children: true });
    this.tileGraphics.clear();
    this.visualStateCache.clear();
    this.drawCache.clear();
    this.structureMap.clear();
  }

  // ─── Initialization ─────────────────────────────────────────────────────

  private initializeTiles(): void {
    const tiles = this.grid.getAllTiles();
    for (const tile of tiles) {
      const gfx = new Graphics();
      this.renderTile(tile, gfx);
      this.tileLayer.addChild(gfx);
      this.tileGraphics.set(tile, gfx);
    }
  }

  // ─── Core rendering ─────────────────────────────────────────────────────

  private computeVisualStateKey(tile: Tile): string {
    const structType = this.structureMap.get(`${tile.row},${tile.col}`);
    const vs: TileVisualState = {
      state: tile.state,
      moistureBucket: moistureBucket(tile.moisture),
      qualityBucket: qualityBucket(tile.soilQuality),
      season: this.currentSeason,
    };
    return makeTileCacheKey(vs, structType);
  }

  private renderTile(tile: Tile, gfx: Graphics): void {
    const pos = this.grid.getTilePosition(tile.row, tile.col);
    const size = this.grid.config.tileSize;
    const padding = this.grid.config.padding;

    gfx.clear();
    gfx.x = pos.x;
    gfx.y = pos.y;

    // Base soil with moisture-responsive darkness and quality
    const soilColor = this.computeSoilColor(tile.moisture, tile.soilQuality);
    gfx.rect(padding, padding, size - padding * 2, size - padding * 2);
    gfx.fill({ color: soilColor });

    // Border with seasonal tint
    const borderColor = this.getSeasonalBorderColor();
    gfx.rect(padding, padding, size - padding * 2, size - padding * 2);
    gfx.stroke({ color: borderColor, width: 1 });

    // State-specific overlays
    const structType = this.structureMap.get(`${tile.row},${tile.col}`);

    if (tile.state === TileState.STRUCTURE && structType) {
      this.drawStructureSprite(gfx, size, padding, structType);
    } else if (tile.state === TileState.OCCUPIED) {
      this.drawPlantedOverlay(gfx, size, padding);
    } else if (tile.state === TileState.WEED) {
      this.drawWeedOverlay(gfx, size, padding);
    } else if (tile.state === TileState.PEST) {
      this.drawPestOverlay(gfx, size, padding);
    }

    // High-quality soil sparkle (quality ≥ 80)
    if (tile.soilQuality >= 80 && tile.state !== TileState.STRUCTURE) {
      this.drawQualityIndicator(gfx, size, padding, tile.soilQuality);
    }
  }

  // ─── Soil color computation ─────────────────────────────────────────────

  /**
   * Compute soil color based on moisture and quality.
   * Moisture controls darkness: dry = light brown, moist = dark brown.
   * Quality adds richness: high quality = darker, richer earth.
   * Seasonal palette shifts the base color.
   */
  private computeSoilColor(moisture: number, quality: number): number {
    const palette = getActivePalette();
    const seasonPalette = getSeasonalPalette(this.currentSeason);

    // Base: lerp between dry and moist based on moisture level
    const moistureT = Math.min(1, Math.max(0, moisture / 100));
    let baseColor = lerpColor(SOIL_COLORS.dry, SOIL_COLORS.moist, moistureT);

    // Quality enrichment: blend toward rich earth for high quality
    const qualityT = Math.min(1, Math.max(0, quality / 100));
    if (qualityT > 0.6) {
      const richT = (qualityT - 0.6) / 0.4; // 0-1 range for quality 60-100
      baseColor = lerpColor(baseColor, SOIL_COLORS.richEarth, richT * 0.4);
    }

    // Apply seasonal soil tint
    baseColor = lerpColor(baseColor, seasonPalette.soil, 0.3);

    // Apply colorblind-safe soil overlay
    baseColor = lerpColor(baseColor, palette.soilBrown, 0.15);

    return baseColor;
  }

  private getSeasonalBorderColor(): number {
    const tint = SEASONAL_TILE_TINTS[this.currentSeason];
    return lerpColor(0x1a3a1a, tint, 0.2);
  }

  // ─── State overlays ─────────────────────────────────────────────────────

  /** Green ring to indicate a planted tile */
  private drawPlantedOverlay(gfx: Graphics, size: number, padding: number): void {
    const palette = getActivePalette();
    const cx = size / 2;
    const cy = size / 2;
    const radius = (size - padding * 4) / 2.8;

    gfx.circle(cx, cy, radius);
    gfx.stroke({ color: palette.accentGreen, width: 2, alpha: 0.6 });
  }

  /** Scraggly weed overlay — small irregular lines */
  private drawWeedOverlay(gfx: Graphics, size: number, padding: number): void {
    const cx = size / 2;
    const cy = size / 2;
    const spread = (size - padding * 4) / 3;

    // Draw 3-4 scraggly weed stalks
    const stalks = [
      { dx: -spread * 0.4, dy: 0, angle: -0.3 },
      { dx: spread * 0.3, dy: spread * 0.1, angle: 0.4 },
      { dx: -spread * 0.1, dy: -spread * 0.2, angle: -0.1 },
      { dx: spread * 0.2, dy: -spread * 0.3, angle: 0.2 },
    ];

    for (const stalk of stalks) {
      const sx = cx + stalk.dx;
      const sy = cy + stalk.dy + spread * 0.3;
      const tipX = sx + Math.sin(stalk.angle) * spread * 0.6;
      const tipY = sy - spread * 0.7;

      gfx.moveTo(sx, sy);
      gfx.lineTo(tipX, tipY);
      gfx.stroke({ color: TILE_OVERLAYS.weedBase, width: 2, alpha: 0.8 });

      // Small leaf at tip
      gfx.circle(tipX, tipY, 2);
      gfx.fill({ color: TILE_OVERLAYS.weedTip, alpha: 0.7 });
    }
  }

  /** Red dot marker for pest-infested tile */
  private drawPestOverlay(gfx: Graphics, size: number, padding: number): void {
    const palette = getActivePalette();
    const cx = size / 2;
    const cy = size / 2;
    const radius = (size - padding * 4) / 6;

    gfx.circle(cx, cy, radius);
    gfx.fill({ color: palette.danger, alpha: 0.8 });
  }

  /** Subtle sparkle dots for high-quality soil */
  private drawQualityIndicator(gfx: Graphics, size: number, padding: number, quality: number): void {
    const intensity = (quality - 80) / 20; // 0-1 for quality 80-100
    const count = Math.floor(2 + intensity * 3);
    const inner = padding * 2 + 4;
    const range = size - inner * 2;

    // Deterministic sparkle positions based on size
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      const sx = inner + (t * 0.7 + 0.15) * range;
      const sy = inner + ((t * 1.3 + 0.3) % 1) * range;

      gfx.circle(sx, sy, 1.5);
      gfx.fill({ color: 0xfff9c4, alpha: 0.3 + intensity * 0.3 });
    }
  }

  // ─── Structure sprites ──────────────────────────────────────────────────

  private drawStructureSprite(
    gfx: Graphics,
    size: number,
    padding: number,
    structType: RenderableStructure,
  ): void {
    switch (structType) {
      case StructureType.GREENHOUSE:
        this.drawGreenhouse(gfx, size, padding);
        break;
      case StructureType.COMPOST_BIN:
        this.drawCompostBin(gfx, size, padding);
        break;
      case StructureType.RAIN_BARREL:
        this.drawRainBarrel(gfx, size, padding);
        break;
      case StructureType.TRELLIS:
      case 'trellis':
        this.drawTrellis(gfx, size, padding);
        break;
    }
  }

  /** Greenhouse: glass frame with green tint and panes */
  private drawGreenhouse(gfx: Graphics, size: number, padding: number): void {
    const colors = STRUCTURE_COLORS.greenhouse;
    const cx = size / 2;
    const inset = padding * 2 + 2;
    const w = size - inset * 2;
    const h = size - inset * 2;
    const x = inset;
    const y = inset;

    // Glass pane background
    gfx.rect(x, y, w, h);
    gfx.fill({ color: colors.pane, alpha: 0.4 });

    // Triangular roof
    gfx.moveTo(x, y + h * 0.35);
    gfx.lineTo(cx, y);
    gfx.lineTo(x + w, y + h * 0.35);
    gfx.lineTo(x, y + h * 0.35);
    gfx.fill({ color: colors.tint, alpha: 0.5 });

    // Frame outline
    gfx.rect(x, y + h * 0.35, w, h * 0.65);
    gfx.stroke({ color: colors.frame, width: 1.5 });

    // Roof outline
    gfx.moveTo(x, y + h * 0.35);
    gfx.lineTo(cx, y);
    gfx.lineTo(x + w, y + h * 0.35);
    gfx.stroke({ color: colors.frame, width: 1.5 });

    // Vertical glass dividers
    gfx.moveTo(cx, y + h * 0.35);
    gfx.lineTo(cx, y + h);
    gfx.stroke({ color: colors.frame, width: 1, alpha: 0.6 });

    // Horizontal divider
    gfx.moveTo(x, y + h * 0.65);
    gfx.lineTo(x + w, y + h * 0.65);
    gfx.stroke({ color: colors.frame, width: 1, alpha: 0.6 });
  }

  /** Compost Bin: wooden slats with compost soil visible */
  private drawCompostBin(gfx: Graphics, size: number, padding: number): void {
    const colors = STRUCTURE_COLORS.compost_bin;
    const inset = padding * 2 + 3;
    const w = size - inset * 2;
    const h = size - inset * 2;
    const x = inset;
    const y = inset;

    // Compost soil fill inside
    gfx.rect(x + 2, y + 2, w - 4, h - 4);
    gfx.fill({ color: colors.soil });

    // Wooden slats (horizontal)
    const slatCount = 4;
    const slatH = h / slatCount;
    for (let i = 0; i < slatCount; i++) {
      const sy = y + i * slatH;
      gfx.rect(x, sy, w, slatH - 1);
      gfx.stroke({ color: colors.wood, width: 1.5 });

      // Slat highlight
      gfx.moveTo(x + 2, sy + slatH * 0.5);
      gfx.lineTo(x + w - 2, sy + slatH * 0.5);
      gfx.stroke({ color: colors.slat, width: 0.5, alpha: 0.5 });
    }

    // Corner posts
    gfx.rect(x, y, 3, h);
    gfx.fill({ color: colors.wood });
    gfx.rect(x + w - 3, y, 3, h);
    gfx.fill({ color: colors.wood });
  }

  /** Rain Barrel: cylindrical body with metal bands and water shimmer */
  private drawRainBarrel(gfx: Graphics, size: number, padding: number): void {
    const colors = STRUCTURE_COLORS.rain_barrel;
    const cx = size / 2;
    const cy = size / 2;
    const inset = padding * 2 + 3;
    const w = size - inset * 2;
    const h = size - inset * 2;
    const x = inset;
    const y = inset;

    // Barrel body (rounded rect simulating cylinder)
    gfx.roundRect(x, y, w, h, w * 0.2);
    gfx.fill({ color: colors.body, alpha: 0.9 });

    // Metal bands (top, middle, bottom)
    const bands = [0.15, 0.5, 0.85];
    for (const t of bands) {
      const bandY = y + h * t;
      gfx.moveTo(x + 2, bandY);
      gfx.lineTo(x + w - 2, bandY);
      gfx.stroke({ color: colors.band, width: 2 });
    }

    // Water shimmer (subtle highlight in upper third)
    gfx.ellipse(cx, y + h * 0.3, w * 0.3, h * 0.12);
    gfx.fill({ color: colors.water, alpha: 0.4 });

    // Small highlight reflection
    gfx.ellipse(cx - w * 0.15, y + h * 0.22, w * 0.08, h * 0.05);
    gfx.fill({ color: 0xffffff, alpha: 0.3 });
  }

  /** Trellis: lattice frame with cross-hatching */
  private drawTrellis(gfx: Graphics, size: number, padding: number): void {
    const colors = STRUCTURE_COLORS.trellis;
    const inset = padding * 2 + 2;
    const w = size - inset * 2;
    const h = size - inset * 2;
    const x = inset;
    const y = inset;

    // Outer frame
    gfx.rect(x, y, w, h);
    gfx.stroke({ color: colors.frame, width: 2 });

    // Lattice diagonal lines (\ direction)
    const step = w / 4;
    for (let i = 0; i <= 4; i++) {
      gfx.moveTo(x + i * step, y);
      gfx.lineTo(x + i * step - h * 0.5, y + h);
      gfx.stroke({ color: colors.lattice, width: 1, alpha: 0.7 });
    }

    // Lattice diagonal lines (/ direction)
    for (let i = 0; i <= 4; i++) {
      gfx.moveTo(x + i * step, y);
      gfx.lineTo(x + i * step + h * 0.5, y + h);
      gfx.stroke({ color: colors.lattice, width: 1, alpha: 0.7 });
    }

    // Join dots at corners
    const joinPositions = [
      { jx: x, jy: y }, { jx: x + w, jy: y },
      { jx: x, jy: y + h }, { jx: x + w, jy: y + h },
    ];
    for (const jp of joinPositions) {
      gfx.circle(jp.jx, jp.jy, 2);
      gfx.fill({ color: colors.join });
    }
  }
}
