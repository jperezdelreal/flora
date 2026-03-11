import { Container, Text } from 'pixi.js';
import type { Scene, SceneContext } from '../core';
import { GardenGrid } from '../entities/GardenGrid';
import { TileState } from '../entities/Tile';
import { GridSystem } from '../systems/GridSystem';

export class GardenScene implements Scene {
  readonly name = 'garden';
  private container = new Container();
  private grid!: GardenGrid;
  private gridSystem!: GridSystem;
  private infoText!: Text;

  async init(ctx: SceneContext): Promise<void> {
    ctx.sceneManager.stage.addChild(this.container);

    // Initialize garden grid (8x8)
    this.grid = new GardenGrid({
      rows: 8,
      cols: 8,
      tileSize: 64,
      padding: 4,
    });

    // Initialize grid rendering system
    this.gridSystem = new GridSystem(this.grid);
    this.gridSystem.centerInViewport(ctx.app.screen.width, ctx.app.screen.height);
    this.container.addChild(this.gridSystem.getContainer());

    // Add some demo state to tiles
    const demoTile1 = this.grid.getTile(2, 3);
    if (demoTile1) {
      demoTile1.state = TileState.OCCUPIED;
      demoTile1.setSoilQuality(85);
    }

    const demoTile2 = this.grid.getTile(4, 5);
    if (demoTile2) {
      demoTile2.state = TileState.PEST;
      demoTile2.setSoilQuality(45);
    }

    // Vary soil quality across grid for visual feedback
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const tile = this.grid.getTile(row, col);
        if (tile && tile.state === TileState.EMPTY) {
          // Create some variation: checkerboard-ish pattern
          const variation = ((row + col) % 3) * 15;
          tile.setSoilQuality(60 + variation);
        }
      }
    }

    // Info text at top
    this.infoText = new Text({
      text: '🌱 Garden Grid - Click tiles to select',
      style: {
        fontFamily: 'Arial',
        fontSize: 18,
        fill: '#c8e6c9',
        align: 'center',
      },
    });
    this.infoText.anchor.set(0.5, 0);
    this.infoText.x = ctx.app.screen.width / 2;
    this.infoText.y = 20;
    this.container.addChild(this.infoText);

    // Initial render
    this.gridSystem.update();
  }

  update(_delta: number, _ctx: SceneContext): void {
    // Update grid system (re-renders if state changed)
    this.gridSystem.update();

    // Update info text based on selection
    const selectedTile = this.gridSystem.getSelectedTile();
    if (selectedTile) {
      this.infoText.text = `Tile [${selectedTile.row}, ${selectedTile.col}] | State: ${selectedTile.state} | Soil: ${selectedTile.soilQuality}% | Moisture: ${selectedTile.moisture}%`;
    } else {
      this.infoText.text = '🌱 Garden Grid - Click tiles to select';
    }
  }

  destroy(): void {
    this.gridSystem.destroy();
    this.container.destroy({ children: true });
    this.container = new Container();
  }
}
