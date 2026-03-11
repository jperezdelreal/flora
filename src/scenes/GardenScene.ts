import { Container, Text } from 'pixi.js';
import type { Scene, SceneContext } from '../core';
import { GardenGrid } from '../entities/GardenGrid';
import { TileState } from '../entities/Tile';
import { Player } from '../entities/Player';
import { Plant } from '../entities/Plant';
import { GridSystem } from '../systems/GridSystem';
import { PlayerSystem } from '../systems/PlayerSystem';
import { ToolBar } from '../ui/ToolBar';
import { InputManager } from '../core/InputManager';

export class GardenScene implements Scene {
  readonly name = 'garden';
  private container = new Container();
  private grid!: GardenGrid;
  private gridSystem!: GridSystem;
  private player!: Player;
  private playerSystem!: PlayerSystem;
  private toolBar!: ToolBar;
  private plants: Map<string, Plant> = new Map();
  private infoText!: Text;
  private statusText!: Text;
  private input!: InputManager;

  async init(ctx: SceneContext): Promise<void> {
    const { input } = ctx;
    this.input = input;

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

    // Initialize player at center of grid
    this.player = new Player('player-1', {
      startRow: 4,
      startCol: 4,
      actionsPerDay: 3,
    });

    // Initialize player system
    this.playerSystem = new PlayerSystem(
      this.player,
      this.grid,
      this.input,
      this.plants,
    );
    this.playerSystem.setOnDayAdvance(() => {
      this.onDayAdvance();
    });
    this.container.addChild(this.playerSystem.getContainer());

    // Initialize tool bar
    this.toolBar = new ToolBar();
    this.toolBar.position(
      ctx.app.screen.width / 2 - 135,
      ctx.app.screen.height - 100,
    );
    this.toolBar.setOnToolSelect((tool) => {
      if (tool) {
        this.player.selectTool(tool);
      } else {
        this.player.deselectTool();
      }
      this.updateStatusText();
    });
    this.container.addChild(this.toolBar.getContainer());

    // Hook up grid click to player system
    this.setupGridClickHandling();

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
          const variation = ((row + col) % 3) * 15;
          tile.setSoilQuality(60 + variation);
        }
      }
    }

    // Info text at top
    this.infoText = new Text({
      text: '🌱 Garden Scene - Use WASD/Arrows to move, click tiles to move/use tools',
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: '#c8e6c9',
        align: 'center',
      },
    });
    this.infoText.anchor.set(0.5, 0);
    this.infoText.x = ctx.app.screen.width / 2;
    this.infoText.y = 20;
    this.container.addChild(this.infoText);

    // Status text (day, actions)
    this.statusText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: '#ffffff',
        align: 'left',
      },
    });
    this.statusText.x = 20;
    this.statusText.y = 50;
    this.container.addChild(this.statusText);

    // Initial render
    this.gridSystem.update();
    this.updateStatusText();
  }

  private setupGridClickHandling(): void {
    const gridContainer = this.gridSystem.getContainer();
    gridContainer.on('pointerdown', (event) => {
      const pos = event.global;
      const localPos = gridContainer.toLocal(pos);
      
      const tile = this.grid.getTileAtPosition(
        localPos.x,
        localPos.y,
        0,
        0,
      );

      if (tile) {
        // Check if player is on this tile and has tool selected
        const playerPos = this.player.getGridPosition();
        const selectedTool = this.player.getSelectedTool();

        if (tile.row === playerPos.row && tile.col === playerPos.col && selectedTool) {
          // Execute tool action
          const result = this.playerSystem.executeToolAction();
          if (result) {
            this.showActionMessage(result.message);
            this.updateStatusText();
            this.gridSystem.update();
          }
        } else {
          // Move to tile
          this.playerSystem.handleTileClick(tile.row, tile.col);
        }
      }
    });
  }

  private showActionMessage(message: string): void {
    this.infoText.text = message;
    setTimeout(() => {
      this.infoText.text = '🌱 Garden Scene - Use WASD/Arrows to move, click tiles to move/use tools';
    }, 2000);
  }

  private onDayAdvance(): void {
    // Advance all plants
    for (const plant of this.plants.values()) {
      plant.advanceDay();
    }
    this.updateStatusText();
  }

  private updateStatusText(): void {
    const day = this.player.getCurrentDay();
    const actions = this.player.getActionsRemaining();
    const maxActions = this.player.getState().maxActions;
    const tool = this.player.getSelectedTool();
    const toolName = tool ? tool.replace('_', ' ').toUpperCase() : 'None';
    
    this.statusText.text = `Day: ${day} | Actions: ${actions}/${maxActions} | Tool: ${toolName}`;
  }

  update(delta: number, _ctx: SceneContext): void {
    // Update player system (handles input and movement)
    this.playerSystem.update(delta);

    // Update grid system (re-renders if state changed)
    this.gridSystem.update();

    // Update info text based on selection
    const selectedTile = this.gridSystem.getSelectedTile();
    if (selectedTile && !this.player.isMoving()) {
      const pos = this.player.getGridPosition();
      if (selectedTile.row !== pos.row || selectedTile.col !== pos.col) {
        this.infoText.text = `Tile [${selectedTile.row}, ${selectedTile.col}] | State: ${selectedTile.state} | Soil: ${selectedTile.soilQuality}% | Moisture: ${selectedTile.moisture}%`;
      }
    }
  }

  destroy(): void {
    this.gridSystem.destroy();
    this.playerSystem.destroy();
    this.toolBar.destroy();
    this.plants.clear();
    this.container.destroy({ children: true });
    this.container = new Container();
  }
}
