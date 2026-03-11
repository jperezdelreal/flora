import { Graphics, Text, Container } from 'pixi.js';
import type { Scene, SceneContext } from '../core';
import { GARDEN, COLORS } from '../config';
import { HUD, ToolBar, PlantInfo, DaySummary, SeedInventory, PauseMenu } from '../ui';
import type { ToolType, PlantData, SummaryData, Seed } from '../ui';

/**
 * Garden scene — main gameplay view with UI/HUD
 * Displays 8x8 plot grid, HUD, toolbar, plant info, and menus
 */
export class GardenScene implements Scene {
  readonly name = 'garden';
  private container = new Container();
  private hud!: HUD;
  private toolBar!: ToolBar;
  private plantInfo!: PlantInfo;
  private daySummary!: DaySummary;
  private seedInventory!: SeedInventory;
  private pauseMenu!: PauseMenu;
  private isPaused = false;

  async init(ctx: SceneContext): Promise<void> {
    const { app, input } = ctx;
    const sceneStage = app.stage.children[0] as Container;
    sceneStage.addChild(this.container);

    const cx = app.screen.width / 2;
    const cy = app.screen.height / 2;

    // Sky / background
    const bg = new Graphics();
    bg.rect(0, 0, app.screen.width, app.screen.height);
    bg.fill({ color: COLORS.SKY_BLUE });
    this.container.addChild(bg);

    // Ground strip
    const ground = new Graphics();
    ground.rect(0, app.screen.height * 0.55, app.screen.width, app.screen.height * 0.45);
    ground.fill({ color: COLORS.MID_GREEN });
    this.container.addChild(ground);

    // 8x8 garden grid (centered)
    const gridWidth = GARDEN.GRID_COLS * GARDEN.CELL_SIZE;
    const gridHeight = GARDEN.GRID_ROWS * GARDEN.CELL_SIZE;
    const gridX = cx - gridWidth / 2;
    const gridY = cy - gridHeight / 2 + 40;

    for (let row = 0; row < GARDEN.GRID_ROWS; row++) {
      for (let col = 0; col < GARDEN.GRID_COLS; col++) {
        const cell = new Graphics();
        const x = gridX + col * GARDEN.CELL_SIZE;
        const y = gridY + row * GARDEN.CELL_SIZE;
        cell.rect(x, y, GARDEN.CELL_SIZE, GARDEN.CELL_SIZE);
        cell.fill({ color: GARDEN.SOIL_COLOR });
        cell.stroke({ color: GARDEN.CELL_BORDER_COLOR, width: 1 });
        cell.eventMode = 'static';
        cell.cursor = 'pointer';
        
        // Demo: show plant info on cell click
        cell.on('pointerdown', () => {
          this.showDemoPlantInfo(x + GARDEN.CELL_SIZE / 2, y - 10);
        });
        
        this.container.addChild(cell);
      }
    }

    // Title
    const title = new Text({
      text: '🌿 Flora',
      style: {
        fontFamily: 'Arial',
        fontSize: 32,
        fill: '#ffffff',
        align: 'center',
        dropShadow: {
          color: '#000000',
          blur: 4,
          distance: 2,
          angle: Math.PI / 4,
        },
      },
    });
    title.anchor.set(0.5);
    title.x = cx;
    title.y = 36;
    this.container.addChild(title);

    // Initialize UI components
    this.hud = new HUD();
    this.hud.setPosition(20, 10);
    this.hud.updateState({ currentDay: 1, totalDays: 12, season: 'Spring' });
    this.container.addChild(this.hud);

    this.toolBar = new ToolBar(app.screen.width);
    this.toolBar.setPosition(0, app.screen.height - 80);
    this.toolBar.setToolSelectCallback((tool: ToolType) => {
      console.log(`Selected tool: ${tool}`);
    });
    this.container.addChild(this.toolBar);

    this.plantInfo = new PlantInfo();
    this.container.addChild(this.plantInfo);

    this.daySummary = new DaySummary(app.screen.width, app.screen.height);
    this.daySummary.setContinueCallback(() => {
      this.daySummary.hide();
      console.log('Continue to next season');
    });
    this.container.addChild(this.daySummary);

    this.seedInventory = new SeedInventory();
    this.seedInventory.setPosition(app.screen.width - 220, 100);
    this.seedInventory.setSeeds([
      { name: 'Tomato', icon: '🍅', available: true },
      { name: 'Lettuce', icon: '🥬', available: true },
      { name: 'Carrot', icon: '🥕', available: true },
      { name: 'Sunflower', icon: '🌻', available: true },
      { name: 'Mint', icon: '🌿', available: false },
      { name: 'Frost Willow', icon: '❄️', available: false },
    ]);
    this.container.addChild(this.seedInventory);

    this.pauseMenu = new PauseMenu(app.screen.width, app.screen.height);
    this.pauseMenu.setActionCallback((action) => {
      switch (action) {
        case 'resume':
          this.togglePause();
          break;
        case 'main-menu':
          console.log('Return to main menu');
          break;
        case 'restart':
          console.log('Restart run');
          break;
        case 'encyclopedia':
          console.log('View encyclopedia');
          break;
      }
    });
    this.container.addChild(this.pauseMenu);

    // Hint text (updated for UI demo)
    const hint = new Text({
      text: 'Click cells to see plant info · Press ESC to pause · Press SPACE to show day summary',
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: '#1a3a18',
        align: 'center',
      },
    });
    hint.anchor.set(0.5);
    hint.x = cx;
    hint.y = app.screen.height - 100;
    this.container.addChild(hint);
  }

  private showDemoPlantInfo(x: number, y: number): void {
    const demoData: PlantData = {
      name: 'Tomato',
      growthPercent: Math.floor(Math.random() * 100),
      waterStatus: ['Thirsty', 'Hydrated', 'Overwatered'][Math.floor(Math.random() * 3)],
      health: Math.floor(Math.random() * 100),
    };
    this.plantInfo.show(demoData, x, y);
    
    // Auto-hide after 3 seconds
    setTimeout(() => this.plantInfo.hide(), 3000);
  }

  private showDemoSummary(): void {
    const demoData: SummaryData = {
      harvestedSeeds: ['Tomato (x3)', 'Lettuce (x2)', 'Carrot (x1)'],
      encyclopediaUpdates: ['Discovered: Sunflower', 'Updated: Tomato growth data'],
      unlocksEarned: ['Watering Can+', 'New seed: Mint'],
    };
    this.daySummary.show(demoData);
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.pauseMenu.show();
    } else {
      this.pauseMenu.hide();
    }
  }

  update(_dt: number, ctx: SceneContext): void {
    const { input } = ctx;
    
    // Handle pause toggle
    if (input.isPressed('pause')) {
      this.togglePause();
    }
    
    // Handle demo summary (confirm action mapped to Space)
    if (input.isPressed('confirm')) {
      this.showDemoSummary();
    }
    
    // Gameplay systems will hook in here
  }

  destroy(): void {
    this.container.destroy({ children: true });
    this.container = new Container();
  }
}
