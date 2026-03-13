import { Container, Graphics, FederatedPointerEvent } from 'pixi.js';
import { GardenGrid } from '../entities/GardenGrid';
import { Tile, TileState } from '../entities/Tile';
import { Structure } from '../entities/Structure';
import { StructureType, STRUCTURE_CONFIGS } from '../config/structures';
import { Season, SEASON_CONFIG } from '../config/seasons';
import { eventBus } from '../core/EventBus';

export class GridSystem {
  private container: Container;
  private grid: GardenGrid;
  private tileGraphics: Map<Tile, Graphics>;
  private selectedTile: Tile | null = null;
  private selectionHighlight: Graphics;
  private tileClickCallbacks: Array<(row: number, col: number) => void> = [];
  private onTileClickCallback?: (tile: Tile) => void;
  private structures: Map<string, Structure> = new Map();
  private structureGraphics: Map<string, Graphics> = new Map();

  constructor(grid: GardenGrid) {
    this.grid = grid;
    this.container = new Container();
    this.tileGraphics = new Map();
    this.selectionHighlight = new Graphics();
    this.container.addChild(this.selectionHighlight);

    this.initializeGrid();
    this.setupInteraction();
  }

  private initializeGrid(): void {
    const tiles = this.grid.getAllTiles();
    
    for (const tile of tiles) {
      const graphics = new Graphics();
      this.renderTile(tile, graphics);
      this.container.addChild(graphics);
      this.tileGraphics.set(tile, graphics);
    }
  }

  private renderTile(tile: Tile, graphics: Graphics): void {
    const pos = this.grid.getTilePosition(tile.row, tile.col);
    const size = this.grid.config.tileSize;
    const padding = this.grid.config.padding;

    graphics.clear();
    graphics.x = pos.x;
    graphics.y = pos.y;

    // Base soil color with quality variation
    const soilColor = this.getSoilColor(tile.soilQuality);
    graphics.rect(padding, padding, size - padding * 2, size - padding * 2);
    graphics.fill({ color: soilColor });

    // Border
    graphics.rect(padding, padding, size - padding * 2, size - padding * 2);
    graphics.stroke({ color: 0x1a3a1a, width: 1 });

    // State-specific rendering
    if (tile.hasStructure()) {
      const structure = this.getStructureAt(tile.row, tile.col);
      if (structure) {
        this.renderStructureMarker(graphics, size, padding, structure.type);
      }
    } else if (tile.isOccupied()) {
      this.renderOccupiedMarker(graphics, size, padding);
    } else if (tile.hasPest()) {
      this.renderPestMarker(graphics, size, padding);
    }
  }

  private getSoilColor(soilQuality: number): number {
    // Soil quality 0-100% maps to darker to lighter brown
    const minColor = 0x3d2817; // Dark brown (poor soil)
    const maxColor = 0x6b4423; // Rich brown (good soil)

    const t = soilQuality / 100;
    const r1 = (minColor >> 16) & 0xff;
    const g1 = (minColor >> 8) & 0xff;
    const b1 = minColor & 0xff;

    const r2 = (maxColor >> 16) & 0xff;
    const g2 = (maxColor >> 8) & 0xff;
    const b2 = maxColor & 0xff;

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return (r << 16) | (g << 8) | b;
  }

  private renderOccupiedMarker(graphics: Graphics, size: number, padding: number): void {
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size - padding * 4) / 4;

    graphics.circle(centerX, centerY, radius);
    graphics.fill({ color: 0x4caf50 });
  }

  private renderPestMarker(graphics: Graphics, size: number, padding: number): void {
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size - padding * 4) / 6;

    graphics.circle(centerX, centerY, radius);
    graphics.fill({ color: 0xff5252 });
  }

  /** TLDR: Draw a structure icon on the tile */
  private renderStructureMarker(graphics: Graphics, size: number, padding: number, structureType: StructureType): void {
    const centerX = size / 2;
    const centerY = size / 2;
    const half = (size - padding * 4) / 3;
    const config = STRUCTURE_CONFIGS[structureType];

    graphics.roundRect(centerX - half, centerY - half, half * 2, half * 2, 4);
    graphics.fill({ color: config.color });
    graphics.roundRect(centerX - half, centerY - half, half * 2, half * 2, 4);
    graphics.stroke({ color: 0xffffff, width: 1.5 });
  }

  private setupInteraction(): void {
    this.container.eventMode = 'static';
    this.container.hitArea = {
      contains: (x: number, y: number) => {
        const dims = this.grid.getGridDimensions();
        return x >= 0 && x < dims.width && y >= 0 && y < dims.height;
      },
    };

    this.container.on('pointerdown', this.onPointerDown.bind(this));
  }

  private onPointerDown(event: FederatedPointerEvent): void {
    const pos = event.global;
    const localPos = this.container.toLocal(pos);
    
    const tile = this.grid.getTileAtPosition(
      localPos.x,
      localPos.y,
      0,
      0
    );

    if (tile) {
      this.selectTile(tile);
    }
  }

  private selectTile(tile: Tile): void {
    this.selectedTile = tile;
    this.updateSelectionHighlight();
    
    // Notify all registered callbacks (row/col pattern)
    for (const callback of this.tileClickCallbacks) {
      callback(tile.row, tile.col);
    }
    
    // Notify single callback (tile pattern)
    if (this.onTileClickCallback) {
      this.onTileClickCallback(tile);
    }
  }

  /** Register a callback to be notified when a tile is clicked */
  public onTileClick(callback: ((row: number, col: number) => void) | ((tile: Tile) => void)): void {
    if (callback.length === 1) {
      // Single parameter - tile pattern
      this.onTileClickCallback = callback as (tile: Tile) => void;
    } else {
      // Two parameters - row/col pattern
      this.tileClickCallbacks.push(callback as (row: number, col: number) => void);
    }
  }

  private updateSelectionHighlight(): void {
    this.selectionHighlight.clear();

    if (!this.selectedTile) return;

    const pos = this.grid.getTilePosition(
      this.selectedTile.row,
      this.selectedTile.col
    );
    const size = this.grid.config.tileSize;
    const padding = this.grid.config.padding;

    this.selectionHighlight.rect(
      pos.x + padding,
      pos.y + padding,
      size - padding * 2,
      size - padding * 2
    );
    this.selectionHighlight.stroke({ color: 0xffeb3b, width: 3 });
  }

  public update(): void {
    // Re-render tiles if state changed
    for (const [tile, graphics] of this.tileGraphics) {
      this.renderTile(tile, graphics);
    }
  }

  public getContainer(): Container {
    return this.container;
  }

  public getSelectedTile(): Tile | null {
    return this.selectedTile;
  }

  public centerInViewport(viewportWidth: number, viewportHeight: number): void {
    const dims = this.grid.getGridDimensions();
    this.container.x = (viewportWidth - dims.width) / 2;
    this.container.y = (viewportHeight - dims.height) / 2;
  }

  /**
   * Apply a seasonal color tint to the grid.
   * Uses the SEASON_CONFIG gridTint value (0xffffff = no tint).
   */
  public setSeason(season: Season): void {
    this.container.tint = SEASON_CONFIG[season].gridTint;
  }

  /**
   * TLDR: Rebuild grid for a new GardenGrid (used after grid expansion)
   */
  public resize(newGrid: GardenGrid): void {
    // TLDR: Tear down old tile graphics
    for (const [, gfx] of this.tileGraphics) {
      gfx.destroy();
    }
    this.tileGraphics.clear();
    this.selectionHighlight.clear();
    this.selectedTile = null;

    this.grid = newGrid;
    this.initializeGrid();
    this.setupInteraction();
  }

  /** TLDR: Get the underlying grid */
  public getGrid(): GardenGrid {
    return this.grid;
  }

  // ─── Structure helpers ──────────────────────────────────────────────

  /** TLDR: Place a structure on the grid */
  public placeStructure(structure: Structure): boolean {
    const tile = this.grid.getTile(structure.row, structure.col);
    if (!tile || !tile.isEmpty()) return false;

    tile.state = TileState.STRUCTURE;
    this.structures.set(structure.id, structure);

    eventBus.emit('structure:placed', {
      structureId: structure.id,
      type: structure.type,
      row: structure.row,
      col: structure.col,
    });

    return true;
  }

  /** TLDR: Remove a structure from the grid */
  public removeStructure(structureId: string): boolean {
    const structure = this.structures.get(structureId);
    if (!structure) return false;

    const tile = this.grid.getTile(structure.row, structure.col);
    if (tile) {
      tile.state = TileState.EMPTY;
    }

    this.structures.delete(structureId);
    const gfx = this.structureGraphics.get(structureId);
    if (gfx) {
      gfx.destroy();
      this.structureGraphics.delete(structureId);
    }

    eventBus.emit('structure:removed', {
      structureId: structure.id,
      type: structure.type,
    });

    return true;
  }

  /** TLDR: Get structure at a specific tile */
  public getStructureAt(row: number, col: number): Structure | undefined {
    for (const s of this.structures.values()) {
      if (s.row === row && s.col === col) return s;
    }
    return undefined;
  }

  /** TLDR: Get all placed structures */
  public getStructures(): Structure[] {
    return Array.from(this.structures.values());
  }

  /** TLDR: Check if a specific structure type is placed anywhere */
  public hasStructureType(type: StructureType): boolean {
    for (const s of this.structures.values()) {
      if (s.type === type) return true;
    }
    return false;
  }

  /** TLDR: Get all structures of a specific type */
  public getStructuresByType(type: StructureType): Structure[] {
    return Array.from(this.structures.values()).filter((s) => s.type === type);
  }

  public destroy(): void {
    this.container.destroy({ children: true });
    this.tileGraphics.clear();
    this.structures.clear();
    for (const [, gfx] of this.structureGraphics) {
      gfx.destroy();
    }
    this.structureGraphics.clear();
  }
}
