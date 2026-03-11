<<<<<<< HEAD
import { Container, Text, Graphics } from 'pixi.js';
import type { Scene, SceneContext } from '../core';
import { GardenGrid } from '../entities/GardenGrid';
import { TileState } from '../entities/Tile';
import { Player } from '../entities/Player';
import { Plant } from '../entities/Plant';
import { GridSystem } from '../systems/GridSystem';
import { PlayerSystem } from '../systems/PlayerSystem';
import { PlantSystem } from '../systems/PlantSystem';
import { EncyclopediaSystem } from '../systems/EncyclopediaSystem';
import { ToolBar } from '../ui/ToolBar';
import { Encyclopedia } from '../ui/Encyclopedia';
import { DiscoveryPopup } from '../ui/DiscoveryPopup';
import { InputManager } from '../core/InputManager';
import { GAME } from '../config';
=======
import { Application, Container, Text } from 'pixi.js';
import type { Scene, SceneContext } from '../core';
import { GardenGrid } from '../entities/GardenGrid';
import { TileState, Tile } from '../entities/Tile';
import { GridSystem } from '../systems/GridSystem';
import { HazardSystem } from '../systems/HazardSystem';
import { PlantSystem } from '../systems/PlantSystem';
import { HazardUI } from '../ui/HazardUI';
>>>>>>> 0b67f98 (feat: add hazard UI indicators and pest removal action)

export class GardenScene implements Scene {
  readonly name = 'garden';
  private container = new Container();
  private grid!: GardenGrid;
  private gridSystem!: GridSystem;
  private player!: Player;
  private playerSystem!: PlayerSystem;
  private toolBar!: ToolBar;
  private plants: Map<string, Plant> = new Map();
  private plantSystem!: PlantSystem;
  private encyclopediaSystem!: EncyclopediaSystem;
  private encyclopedia!: Encyclopedia;
  private discoveryPopup!: DiscoveryPopup;
  private infoText!: Text;
<<<<<<< HEAD
  private statusText!: Text;
  private helpText!: Text;
  private encyclopediaButton!: Graphics;
  private encyclopediaButtonText!: Text;
  private encyclopediaVisible = false;
  private input!: InputManager;

  async init(ctx: SceneContext): Promise<void> {
    const { input } = ctx;
    this.input = input;

    ctx.sceneManager.stage.addChild(this.container);

    // Initialize encyclopedia system (with localStorage persistence)
    this.encyclopediaSystem = new EncyclopediaSystem();

    // Initialize plant system (30 seconds per in-game day for demo)
    this.plantSystem = new PlantSystem({
      framesPerDay: GAME.TARGET_FPS * 30,
      encyclopediaSystem: this.encyclopediaSystem,
    });
=======
  private hazardSystem!: HazardSystem;
  private plantSystem!: PlantSystem;
  private hazardUI!: HazardUI;

  async init(ctx: SceneContext): Promise<void> {
    const { app } = ctx;
    const sceneManager = app.stage.children[0] as Container;
    sceneManager.addChild(this.container);
>>>>>>> 0b67f98 (feat: add hazard UI indicators and pest removal action)

    // Initialize systems
    this.plantSystem = new PlantSystem({ framesPerDay: 60 * 5 });
    this.hazardSystem = new HazardSystem({
      seasonCount: 1,
      enablePests: true,
      enableDrought: true,
    });

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

<<<<<<< HEAD
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

    // Demo: Plant some starter plants for testing
    this.plantDemoPlants();
=======
    // Setup tile click handler for pest removal
    this.gridSystem.onTileClick(this.handleTileClick.bind(this));

    // Initialize hazard UI
    this.hazardUI = new HazardUI();
    this.hazardUI.setPosition(
      app.screen.width / 2 - 160,
      app.screen.height - 80
    );
    this.container.addChild(this.hazardUI.getContainer());
>>>>>>> 0b67f98 (feat: add hazard UI indicators and pest removal action)

    // Add some demo state to tiles
    const demoTile1 = this.grid.getTile(2, 3);
    if (demoTile1) {
      demoTile1.state = TileState.OCCUPIED;
      demoTile1.setSoilQuality(85);
      
      // Create a demo plant (x=col, y=row)
      const plant = this.plantSystem.createPlant('basil', demoTile1.col, demoTile1.row);
      if (plant) {
        // Simulate pest spawn for demo
        const pestSpawned = this.hazardSystem.trySpawnPestOnPlant(plant);
        if (pestSpawned) {
          demoTile1.state = TileState.PEST;
        }
      }
    }

    const demoTile2 = this.grid.getTile(4, 5);
    if (demoTile2) {
      demoTile2.state = TileState.PEST;
      demoTile2.setSoilQuality(45);
    }

    // Simulate drought for demo (trigger at day 5)
    this.hazardSystem.onDayAdvance(5);

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
<<<<<<< HEAD
      text: '🌱 Garden Scene - Use WASD/Arrows to move, click tiles to move/use tools',
=======
      text: '🌱 Garden - Click pest tiles to remove',
>>>>>>> 0b67f98 (feat: add hazard UI indicators and pest removal action)
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

    // Help text (plant stats)
    this.helpText = new Text({
      text: 'Day: 0 | Plants: 0 | Discovered: 0/12',
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: '#aaaaaa',
        align: 'center',
      },
    });
    this.helpText.anchor.set(0.5, 0);
    this.helpText.x = ctx.app.screen.width / 2;
    this.helpText.y = 50;
    this.container.addChild(this.helpText);

    // Encyclopedia button (top-right)
    this.encyclopediaButton = new Graphics();
    this.encyclopediaButton.roundRect(0, 0, 140, 40, 8);
    this.encyclopediaButton.fill({ color: 0x2a2a2a, alpha: 0.9 });
    this.encyclopediaButton.stroke({ color: 0x4caf50, width: 2 });
    this.encyclopediaButton.x = ctx.app.screen.width - 160;
    this.encyclopediaButton.y = 15;
    this.encyclopediaButton.eventMode = 'static';
    this.encyclopediaButton.cursor = 'pointer';
    this.encyclopediaButton.on('pointerdown', () => this.toggleEncyclopedia());
    this.container.addChild(this.encyclopediaButton);

    this.encyclopediaButtonText = new Text({
      text: '📖 Encyclopedia',
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: '#4caf50',
        fontWeight: 'bold',
      },
    });
    this.encyclopediaButtonText.anchor.set(0.5, 0.5);
    this.encyclopediaButtonText.x = this.encyclopediaButton.x + 70;
    this.encyclopediaButtonText.y = this.encyclopediaButton.y + 20;
    this.container.addChild(this.encyclopediaButtonText);

    // Initialize Encyclopedia UI
    this.encyclopedia = new Encyclopedia();
    this.encyclopedia.setPosition(
      (ctx.app.screen.width - 800) / 2,
      (ctx.app.screen.height - 600) / 2
    );
    this.encyclopedia.hide();
    this.container.addChild(this.encyclopedia.getContainer());

    // Initialize Discovery Popup
    this.discoveryPopup = new DiscoveryPopup();
    this.discoveryPopup.setPosition(ctx.app.screen.width, ctx.app.screen.height);
    this.container.addChild(this.discoveryPopup.getContainer());

    // Listen for discovery events
    this.encyclopediaSystem.onDiscovery((event) => {
      this.discoveryPopup.show(event.config);
    });

    // Setup click handler for harvesting (via gridSystem callback)
    this.gridSystem.onTileClick((row, col) => {
      // Let player system handle clicks first if player is moving or needs to interact
      const playerPos = this.player.getGridPosition();
      const selectedTool = this.player.getSelectedTool();

      if (row === playerPos.row && col === playerPos.col && selectedTool) {
        // Player is on this tile with a tool - execute tool action
        const result = this.playerSystem.executeToolAction();
        if (result) {
          this.showActionMessage(result.message);
          this.updateStatusText();
          this.gridSystem.update();
        }
        return;
      }

      // Otherwise, check for harvesting mature plants
      const tile = this.grid.getTile(row, col);
      if (tile && tile.state === TileState.OCCUPIED) {
        const result = this.plantSystem.harvestPlant(col, row);
        if (result.success) {
          tile.state = TileState.EMPTY;
          this.updateInfoText(`Harvested! +${result.seeds} seeds`);
        }
      } else {
        // Move to tile
        this.playerSystem.handleTileClick(row, col);
      }
    });

    // Initial render
    this.gridSystem.update();
    this.updateStatusText();
    this.updateEncyclopediaEntries();
  }

<<<<<<< HEAD
  private setupGridClickHandling(): void {
    // This method is no longer needed as we use gridSystem.onTileClick callback
    // Kept as stub in case needed for future direct grid container interactions
  }

  private showActionMessage(message: string): void {
    this.infoText.text = message;
    setTimeout(() => {
      this.infoText.text = '🌱 Garden Scene - Use WASD/Arrows to move, click tiles to move/use tools';
    }, 2000);
  }

  private onDayAdvance(): void {
    // Advance all plants in the player's plant map
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

  private plantDemoPlants(): void {
    // Plant a variety of plants at different stages for demo
    const demoPlants = [
      { id: 'tomato', row: 2, col: 2 },
      { id: 'lettuce', row: 2, col: 4 },
      { id: 'carrot', row: 4, col: 3 },
      { id: 'sunflower', row: 5, col: 5 },
    ];

    for (const { id, row, col } of demoPlants) {
      const plant = this.plantSystem.createPlant(id, col, row);
      if (plant) {
        const tile = this.grid.getTile(row, col);
        if (tile) {
          tile.state = TileState.OCCUPIED;
=======
  private handleTileClick(tile: Tile): void {
    // Handle pest removal
    if (tile.hasPest()) {
      // Get pest at this tile (x=col, y=row in grid coordinates)
      const pest = this.hazardSystem.getPestAt(tile.col, tile.row);
      if (pest) {
        const removed = this.hazardSystem.removePest(pest.id);
        if (removed) {
          // Clear pest state from tile
          tile.state = TileState.OCCUPIED;
          // TODO: Deduct action point when action system is implemented
          this.updateInfoText(`Pest removed from [${tile.row}, ${tile.col}]!`);
>>>>>>> 0b67f98 (feat: add hazard UI indicators and pest removal action)
        }
      }
    }
  }

<<<<<<< HEAD
  private toggleEncyclopedia(): void {
    this.encyclopediaVisible = !this.encyclopediaVisible;
    if (this.encyclopediaVisible) {
      this.updateEncyclopediaEntries();
      this.encyclopedia.show();
    } else {
      this.encyclopedia.hide();
    }
  }

  private updateEncyclopediaEntries(): void {
    const entries = this.encyclopediaSystem.getEntries();
    this.encyclopedia.setEntries(entries);
  }

  private updateInfoText(message: string): void {
    this.infoText.text = message;
    // Reset after 2 seconds
    setTimeout(() => {
      this.infoText.text = '🌱 Garden Scene - Use WASD/Arrows to move, click tiles to move/use tools';
    }, 2000);
  }

  update(delta: number, _ctx: SceneContext): void {
    // Update player system (handles input and movement)
    this.playerSystem.update(delta);

    // Update plant system (advances growth)
    this.plantSystem.update(delta);

    // Update grid system (re-renders if state changed)
    this.gridSystem.update();

    // Update discovery popup animation
    this.discoveryPopup.update(delta * 1000); // Convert to ms

    // Update help text with stats
    const stats = this.plantSystem.getStats();
    const encycStats = this.encyclopediaSystem.getStats();
    this.helpText.text = `Day: ${stats.currentDay} | Plants: ${stats.activePlants} (${stats.maturePlants} mature) | Discovered: ${encycStats.discovered}/${encycStats.total}`;

    // Update selected tile info
    const selectedTile = this.gridSystem.getSelectedTile();
    if (selectedTile && !this.player.isMoving()) {
      const pos = this.player.getGridPosition();
      if (selectedTile.row !== pos.row || selectedTile.col !== pos.col) {
        // Show tile info when hovering a different tile
        this.infoText.text = `Tile [${selectedTile.row}, ${selectedTile.col}] | State: ${selectedTile.state} | Soil: ${selectedTile.soilQuality}% | Moisture: ${selectedTile.moisture}%`;
      } else if (selectedTile.state === TileState.OCCUPIED) {
        // Show plant info when on occupied tile
        const plant = this.plantSystem.getPlantAt(selectedTile.col, selectedTile.row);
        if (plant) {
          const state = plant.getState();
          this.infoText.text = `${state.config.displayName} | Stage: ${state.growthStage} | Health: ${Math.round(state.health)}% | Days: ${state.daysGrown}/${state.config.growthTime}`;
        }
      }
=======
  private updateInfoText(text: string): void {
    this.infoText.text = text;
  }

  update(_delta: number, ctx: SceneContext): void {
    // Update grid system (re-renders if state changed)
    this.gridSystem.update();

    // Update hazard UI based on drought status
    const droughtInfo = this.hazardSystem.getDroughtInfo();
    if (droughtInfo.active) {
      this.hazardUI.showDroughtWarning({
        daysRemaining: droughtInfo.daysRemaining,
        waterMultiplier: droughtInfo.multiplier,
      });
    } else {
      this.hazardUI.hideDroughtWarning();
    }

    // Update info text based on selection
    const selectedTile = this.gridSystem.getSelectedTile();
    if (selectedTile) {
      let stateText: string = selectedTile.state;
      if (selectedTile.hasPest()) {
        stateText += ' (click to remove)';
      }
      this.infoText.text = `Tile [${selectedTile.row}, ${selectedTile.col}] | State: ${stateText} | Soil: ${selectedTile.soilQuality}%`;
    } else {
      this.infoText.text = '🌱 Garden - Click pest tiles to remove';
>>>>>>> 0b67f98 (feat: add hazard UI indicators and pest removal action)
    }
  }

  destroy(): void {
    this.gridSystem.destroy();
<<<<<<< HEAD
    this.playerSystem.destroy();
    this.plantSystem.destroy();
    this.toolBar.destroy();
    this.encyclopedia.destroy();
    this.discoveryPopup.destroy();
    this.plants.clear();
=======
    this.hazardSystem.destroy();
    this.plantSystem.destroy();
    this.hazardUI.destroy();
>>>>>>> 0b67f98 (feat: add hazard UI indicators and pest removal action)
    this.container.destroy({ children: true });
    this.container = new Container();
  }
}
