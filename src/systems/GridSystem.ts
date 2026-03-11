import { Container, Graphics, FederatedPointerEvent } from 'pixi.js';
import { GardenGrid } from '../entities/GardenGrid';
import { Tile, TileState } from '../entities/Tile';

export class GridSystem {
  private container: Container;
  private grid: GardenGrid;
  private tileGraphics: Map<Tile, Graphics>;
  private selectedTile: Tile | null = null;
  private selectionHighlight: Graphics;

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
    if (tile.isOccupied()) {
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

  public destroy(): void {
    this.container.destroy({ children: true });
    this.tileGraphics.clear();
  }
}
