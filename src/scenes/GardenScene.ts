import { Container, Text, Graphics } from 'pixi.js';
import type { Scene, SceneContext } from '../core';
import { GardenGrid } from '../entities/GardenGrid';
import { TileState, Tile } from '../entities/Tile';
import { Player } from '../entities/Player';
import { Plant, GrowthStage } from '../entities/Plant';
import { GridSystem } from '../systems/GridSystem';
import { PlayerSystem } from '../systems/PlayerSystem';
import { PlantSystem } from '../systems/PlantSystem';
import { EncyclopediaSystem } from '../systems/EncyclopediaSystem';
import { HazardSystem } from '../systems/HazardSystem';
import { WeatherSystem, WeatherEventType } from '../systems/WeatherSystem';
import { ScoringSystem } from '../systems/ScoringSystem';
import { SynergySystem } from '../systems/SynergySystem';
import { SaveManager } from '../systems/SaveManager';
import { AnimationSystem, Easing } from '../systems/AnimationSystem';
import { ParticleSystem } from '../systems/ParticleSystem';
import { ToolBar, Encyclopedia, DiscoveryPopup, HazardUI, HazardWarning, HazardTooltip, HUD, SeedInventory, PlantInfoPanel, DaySummary, PauseMenu, ScoreSummary, SaveIndicator, SynergyTooltip, TutorialOverlay } from '../ui';
import type { DaySummaryData, PauseMenuCallbacks, HazardWarningData } from '../ui';
import { InputManager } from '../core/InputManager';
import { GAME } from '../config';
import { Season, SEASON_CONFIG, getRandomSeason } from '../config/seasons';
import { getPlantsBySeason, PLANT_BY_ID } from '../config/plants';
import { eventBus } from '../core/EventBus';
import { audioManager } from '../systems';
import { ANIMATION, PLANT_STAGE_COLORS, RARITY_COLORS, SYNERGY_GLOW_COLORS } from '../config/animations';
import { TutorialSystem } from '../systems/TutorialSystem';

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
  private statusText!: Text;
  private helpText!: Text;
  private encyclopediaButton!: Graphics;
  private encyclopediaButtonText!: Text;
  private encyclopediaVisible = false;
  private input!: InputManager;
  private hazardSystem!: HazardSystem;
  private weatherSystem!: WeatherSystem;
  private hazardUI!: HazardUI;
  private hazardWarning!: HazardWarning;
  private hazardTooltip!: HazardTooltip;
  
  // New UI components
  private hud!: HUD;
  private seedInventory!: SeedInventory;
  private plantInfoPanel!: PlantInfoPanel;
  private daySummary!: DaySummary;
  private pauseMenu!: PauseMenu;
  private scoreSummary!: ScoreSummary;
  private scoringSystem!: ScoringSystem;
  private synergySystem!: SynergySystem;
  private synergyTooltip!: SynergyTooltip;
  private tutorialSystem!: TutorialSystem;
  private tutorialOverlay!: TutorialOverlay;
  private isPaused = false;
  
  // TLDR: Save system integration
  private saveManager: SaveManager;
  private saveIndicator!: SaveIndicator;
  
  // Session tracking
  private harvestedSeeds: Map<string, number> = new Map();
  private newDiscoveriesThisSeason: Set<string> = new Set();
  
  // Active season
  private currentSeason: Season = Season.SPRING;
  
  // Stored scene context (needed for season transitions)
  private _ctx!: SceneContext;
  
  // Keyboard handler reference for cleanup
  private boundOnKeyDown!: (e: KeyboardEvent) => void;
  private frameCounter = 0;

  // TLDR: Visual polish systems — animations, particles, plant visuals
  private animationSystem!: AnimationSystem;
  private particleSystem!: ParticleSystem;
  private plantVisualLayer!: Container;
  private plantVisuals: Map<string, Container> = new Map();
  private swayPhases: Map<string, number> = new Map();
  private shakeContainer!: Container;
  private shakeElapsed = 0;
  private shakeDuration = 0;
  private previousSkyColor = 0;
  private targetSkyColor = 0;
  private skyLerpElapsed = 0;
  private skyLerpDuration = 0;

  constructor(saveManager: SaveManager) {
    this.saveManager = saveManager;
  }

  async init(ctx: SceneContext): Promise<void> {
    const { input } = ctx;
    this.input = input;
    this._ctx = ctx;

    // TLDR: Shake container wraps scene content for harvest screen shake
    this.shakeContainer = new Container();
    ctx.sceneManager.stage.addChild(this.shakeContainer);
    this.shakeContainer.addChild(this.container);

    // Pick a random season for this run
    this.currentSeason = getRandomSeason();
    const seasonCfg = SEASON_CONFIG[this.currentSeason];

    // Apply season background color
    ctx.app.renderer.background.color = seasonCfg.backgroundColor;

    // Initialize encyclopedia system (with SaveManager persistence)
    this.encyclopediaSystem = new EncyclopediaSystem(this.saveManager);

    // Initialize synergy system
    this.synergySystem = new SynergySystem();

    // Initialize plant system (30 seconds per in-game day for demo)
    this.plantSystem = new PlantSystem({
      framesPerDay: GAME.TARGET_FPS * 30,
      encyclopediaSystem: this.encyclopediaSystem,
      synergySystem: this.synergySystem,
    });

    // Initialize hazard system with active season
    this.hazardSystem = new HazardSystem({
      seasonCount: 1,
      season: this.currentSeason,
      synergySystem: this.synergySystem,
    });

    // TLDR: Initialize weather system for weather events
    this.weatherSystem = new WeatherSystem({
      seasonCount: 1,
      season: this.currentSeason,
    });

    // Initialize scoring system (with SaveManager persistence)
    this.scoringSystem = new ScoringSystem(this.saveManager);

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
    this.gridSystem.setSeason(this.currentSeason);
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

    // Initialize hazard UI
    this.hazardUI = new HazardUI();
    this.hazardUI.setPosition(
      ctx.app.screen.width / 2 - 160,
      ctx.app.screen.height - 80
    );
    this.container.addChild(this.hazardUI.getContainer());

    // TLDR: Initialize hazard warning UI (2-day advance warnings)
    this.hazardWarning = new HazardWarning();
    this.hazardWarning.setPosition(
      (ctx.app.screen.width - 500) / 2,
      150
    );
    this.container.addChild(this.hazardWarning.getContainer());

    // TLDR: Initialize hazard tooltip (hover details)
    this.hazardTooltip = new HazardTooltip();
    this.container.addChild(this.hazardTooltip.getContainer());

    // Demo: Plant some starter plants for testing
    this.plantDemoPlants();

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
      this.newDiscoveriesThisSeason.add(event.config.displayName);
    });
    
    // Initialize HUD (replaces statusText/helpText)
    this.hud = new HUD();
    this.hud.setPosition(
      (ctx.app.screen.width - 600) / 2,
      10
    );
    this.hud.setSeason(this.currentSeason);
    this.container.addChild(this.hud.getContainer());
    
    // Initialize Seed Inventory (side panel)
    this.seedInventory = new SeedInventory();
    this.seedInventory.setPosition(10, 0);
    this.container.addChild(this.seedInventory.getContainer());
    
    // Initialize Plant Info Panel (tooltip)
    this.plantInfoPanel = new PlantInfoPanel();
    this.container.addChild(this.plantInfoPanel.getContainer());
    
    // Initialize Day Summary (full-screen overlay)
    this.daySummary = new DaySummary();
    this.daySummary.setOnNext(() => {
      this.startNewSeason();
    });
    this.container.addChild(this.daySummary.getContainer());
    
    // Initialize Pause Menu
    const pauseCallbacks: PauseMenuCallbacks = {
      onResume: () => {
        this.isPaused = false;
      },
      onRestart: () => {
        this.restartRun();
      },
      onEncyclopedia: () => {
        this.toggleEncyclopedia();
      },
      onHowToPlay: () => {
        this.tutorialOverlay.showHowToPlay();
      },
      onMainMenu: () => {
        // TODO: Navigate to main menu scene
        console.log('Main menu not implemented yet');
      },
    };
    this.pauseMenu = new PauseMenu(pauseCallbacks);
    this.container.addChild(this.pauseMenu.getContainer());
    
    // Initialize Score Summary (end-of-run)
    this.scoreSummary = new ScoreSummary();
    this.scoreSummary.setOnContinue(() => {
      this.startNewSeason();
    });
    this.container.addChild(this.scoreSummary.getContainer());
    
    // TLDR: Initialize save indicator (top-right, subscribes to SaveManager events)
    this.saveIndicator = new SaveIndicator(this.saveManager);
    this.saveIndicator.setPosition(ctx.app.screen.width - 120, 60);
    this.container.addChild(this.saveIndicator.getContainer());
    
    // TLDR: Initialize synergy tooltip
    this.synergyTooltip = new SynergyTooltip();
    this.synergyTooltip.centerHorizontally(ctx.app.screen.width);
    this.container.addChild(this.synergyTooltip.getContainer());
    
    // TLDR: Listen for synergy tutorial event
    eventBus.on('synergy:tutorial', (data) => {
      this.synergyTooltip.showTutorial(data.synergyId);
    });

    // TLDR: Listen for weather warning events
    eventBus.on('weather:warning', (data) => {
      this.handleWeatherWarning(data);
    });
    
    // TLDR: Initialize visual polish systems
    this.animationSystem = new AnimationSystem();
    this.particleSystem = new ParticleSystem();
    this.plantVisualLayer = new Container();
    this.gridSystem.getContainer().addChild(this.plantVisualLayer);
    this.container.addChild(this.particleSystem.getContainer());
    this.rebuildPlantVisuals();
    this.setupVisualListeners();

    // TLDR: Initialize tutorial system and overlay
    this.tutorialSystem = new TutorialSystem();
    this.tutorialOverlay = new TutorialOverlay();
    this.tutorialOverlay.setScreenSize(ctx.app.screen.width, ctx.app.screen.height);
    this.container.addChild(this.tutorialOverlay.getContainer());

    // TLDR: Wire tutorial callbacks
    this.tutorialSystem.onStep((step, index, total) => {
      this.tutorialOverlay.showStep(step, index, total);
    });
    this.tutorialSystem.onHint((hint) => {
      this.tutorialOverlay.showHint(hint);
    });
    this.tutorialSystem.onComplete(() => {
      this.tutorialOverlay.hideStep();
      eventBus.emit('tutorial:completed', {});
    });
    this.tutorialOverlay.onDismiss(() => {
      this.tutorialSystem.advanceStep();
    });
    this.tutorialOverlay.onSkip(() => {
      this.tutorialSystem.skipTutorial();
      eventBus.emit('tutorial:skipped', {});
    });

    // TLDR: Start guided tutorial on first run, otherwise enable contextual hints
    if (this.tutorialSystem.isFirstRun()) {
      this.tutorialSystem.startTutorial();
      eventBus.emit('tutorial:started', {});
    } else {
      this.tutorialSystem.enableContextualHints();
    }
    
    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Setup audio event listeners
    this.setupAudioListeners();

    // Setup click handler for harvesting (via gridSystem callback)
    this.gridSystem.onTileClick((row, col) => {
      if (this.isPaused) return; // Ignore clicks when paused
      
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
          
          // Track harvested seeds for day summary
          const currentCount = this.harvestedSeeds.get(result.plantId) || 0;
          this.harvestedSeeds.set(result.plantId, currentCount + result.seeds);
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

  private setupGridClickHandling(): void {
    // This method is no longer needed as we use gridSystem.onTileClick callback
    // Kept as stub in case needed for future direct grid container interactions
  }
  
  private setupKeyboardShortcuts(): void {
    // Store bound reference for proper cleanup
    this.boundOnKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Escape key - toggle pause menu
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
          this.pauseMenu.show();
        } else {
          this.pauseMenu.hide();
        }
      } else if (e.key === 'i' || e.key === 'I') {
        // I key - toggle seed inventory
        if (!this.isPaused && !this.encyclopediaVisible) {
          this.seedInventory.toggle();
        }
      }
    };
    window.addEventListener('keydown', this.boundOnKeyDown);
  }
  
  private startNewSeason(): void {
    // Reset session tracking
    this.harvestedSeeds.clear();
    this.newDiscoveriesThisSeason.clear();
    
    // Reset scoring for new run
    this.scoringSystem.reset();
    
    // Pick a new season (different from current when possible)
    const seasons: Season[] = [Season.SPRING, Season.SUMMER, Season.FALL, Season.WINTER];
    const otherSeasons = seasons.filter(s => s !== this.currentSeason);
    this.currentSeason = otherSeasons[Math.floor(Math.random() * otherSeasons.length)];
    
    // Apply new season visuals
    this.applySeason();
    
    // Reset player
    this.player.setGridPosition(4, 4);
    
    // Clear grid and plants
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const tile = this.grid.getTile(row, col);
        if (tile) {
          tile.state = TileState.EMPTY;
        }
      }
    }
    this.plants.clear();
    
    // Reset hazard system for the new season
    this.hazardSystem.reset(undefined, this.currentSeason);
    
    // Plant demo plants for next season
    this.plantDemoPlants();
    this.gridSystem.update();
    
    // TLDR: Rebuild plant visual layer for new season's plants
    this.rebuildPlantVisuals();
  }
  
  /** Apply seasonal visuals and hazard configuration to all systems */
  private applySeason(): void {
    const seasonCfg = SEASON_CONFIG[this.currentSeason];
    // Background color
    if (this._ctx) {
      this._ctx.app.renderer.background.color = seasonCfg.backgroundColor;
    }
    // Grid tint
    this.gridSystem.setSeason(this.currentSeason);
    // HUD season indicator
    this.hud.setSeason(this.currentSeason);
  }
  
  private showScoreSummary(): void {
    // TLDR: Trigger save on run end — score is persisted via SaveManager
    const isNewRecord = this.scoringSystem.saveScore();
    const breakdown = this.scoringSystem.getScoreBreakdown();
    const milestone = this.scoringSystem.getCurrentMilestone();
    const personalBest = this.scoringSystem.getPersonalBest();
    const highScores = this.scoringSystem.getHighScores();
    
    this.scoreSummary.show(breakdown, milestone, personalBest, highScores, isNewRecord);
  }

  private restartRun(): void {
    // Full restart: clear encyclopedia and start fresh with a new season
    this.encyclopediaSystem.reset();
    this.startNewSeason();
    this.isPaused = false;
  }

  private showActionMessage(message: string): void {
    this.infoText.text = message;
    setTimeout(() => {
      this.infoText.text = '🌱 Garden Scene - Use WASD/Arrows to move, click tiles to move/use tools';
    }, 2000);
  }

  private onDayAdvance(): void {
    const day = this.player.getCurrentDay();

    // Advance all plants
    for (const plant of this.plants.values()) {
      plant.advanceDay();
    }

    // TLDR: Notify hazard system of day advance (triggers pest windows)
    this.hazardSystem.onDayAdvance(day);

    // TLDR: Notify weather system of day advance (triggers weather events & warnings)
    this.weatherSystem.onDayAdvance(day);

    // Seasonal pest spawning: attempt to infest a random active plant
    const activePlants = Array.from(this.plants.values()).filter(p => p.active);
    if (activePlants.length > 0) {
      const target = activePlants[Math.floor(Math.random() * activePlants.length)];
      const tile = this.grid.getTile(target.y, target.x);
      if (tile && tile.state !== TileState.PEST) {
        const spawned = this.hazardSystem.trySpawnPestOnPlant(target);
        if (spawned) {
          tile.state = TileState.PEST;
        }
      }
    }

    // TLDR: Apply frost damage from WeatherSystem
    this.weatherSystem.applyFrostDamage(activePlants);

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
    // Choose demo plants that are available in the current season
    const seasonalPlants = getPlantsBySeason(this.currentSeason);
    
    // Prefer a mix of rarities; fall back to first available plants
    const demoSlots = [
      { row: 2, col: 2 },
      { row: 2, col: 4 },
      { row: 4, col: 3 },
      { row: 5, col: 5 },
    ];

    for (let i = 0; i < demoSlots.length && i < seasonalPlants.length; i++) {
      const plantConfig = seasonalPlants[i % seasonalPlants.length];
      const { row, col } = demoSlots[i];
      const plant = this.plantSystem.createPlant(plantConfig.id, col, row);
      if (plant) {
        const tile = this.grid.getTile(row, col);
        if (tile) {
          tile.state = TileState.OCCUPIED;
        }
      }
    }
  }

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
        }
      }
    }
  }

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
  
  private showDaySummary(): void {
    // Build summary data
    const encycStats = this.encyclopediaSystem.getStats();
    
    // Convert harvested seeds map to array
    const seedsHarvested = Array.from(this.harvestedSeeds.entries()).map(([plantId, count]) => {
      const config = this.plantSystem.getPlant(plantId)?.getConfig();
      return {
        name: config?.displayName || plantId,
        count,
      };
    });
    
    const summaryData: DaySummaryData = {
      day: this.player.getCurrentDay(),
      seedsHarvested,
      newDiscoveries: Array.from(this.newDiscoveriesThisSeason),
      encyclopediaProgress: {
        discovered: encycStats.discovered,
        total: encycStats.total,
      },
    };
    
    this.daySummary.show(summaryData);
  }

  update(delta: number, _ctx: SceneContext): void {
    // Don't update game logic when paused
    if (this.isPaused) {
      return;
    }
    
    // Update frame counter for day progress tracking
    this.frameCounter++;
    const framesPerDay = GAME.TARGET_FPS * 30; // 30 seconds per day
    const dayProgress = (this.frameCounter % framesPerDay) / framesPerDay;
    
    // Update player system (handles input and movement)
    this.playerSystem.update(delta);

    // Update plant system (advances growth)
    this.plantSystem.update(delta);
    
    // Update synergy system (recalculate synergies when needed)
    this.synergySystem.update(delta);

    // Update hazard system
    this.hazardSystem.update(delta);

    // TLDR: Update weather system
    this.weatherSystem.update(delta);

    // Update grid system (re-renders if state changed)
    this.gridSystem.update();

    // Update discovery popup animation
    this.discoveryPopup.update(delta * 1000); // Convert to ms
    
    // TLDR: Update tutorial hint animation
    this.tutorialOverlay.update(delta * 1000);
    
    // Update score summary animation
    this.scoreSummary.update(delta * 1000);

    // TLDR: Update hazard UI based on weather system status
    const droughtInfo = this.weatherSystem.getDroughtInfo();
    if (droughtInfo.active) {
      this.hazardUI.showDroughtWarning({
        daysRemaining: droughtInfo.daysRemaining,
        waterMultiplier: droughtInfo.multiplier,
      });
    } else {
      this.hazardUI.hideDroughtWarning();
    }

    const frostInfo = this.weatherSystem.getFrostInfo();
    if (frostInfo.active) {
      this.hazardUI.showFrostWarning({
        damagePerDay: frostInfo.damagePerDay,
      });
    } else {
      this.hazardUI.hideFrostWarning();
    }
    
    // TLDR: Update HUD weather warning (show active weather upcoming warnings)
    const upcomingWarnings = this.weatherSystem.getUpcomingWarnings();
    if (upcomingWarnings.length > 0) {
      const warning = upcomingWarnings[0];
      const warningText = this.getWeatherWarningText(warning.type, warning.daysUntil);
      this.hud.updateWeatherWarning(warningText);
    } else {
      this.hud.updateWeatherWarning('');
    }
    
    // Update HUD with current status
    const day = this.player.getCurrentDay();
    const actions = this.player.getActionsRemaining();
    const maxActions = this.player.getState().maxActions;
    this.hud.update(day, 12, dayProgress, actions, maxActions);
    
    // Update score display in HUD
    const scoreBreakdown = this.scoringSystem.getScoreBreakdown();
    const lastActionPoints = this.scoringSystem.getLastActionPoints();
    this.hud.updateScore(scoreBreakdown.total, lastActionPoints);
    
    // Clear last action points after 1 second
    if (lastActionPoints > 0) {
      setTimeout(() => this.scoringSystem.clearLastActionPoints(), 1000);
    }

    // Update help text with stats (keep for legacy but HUD now shows this)
    const stats = this.plantSystem.getStats();
    const encycStats = this.encyclopediaSystem.getStats();
    this.helpText.text = `Day: ${stats.currentDay} | Plants: ${stats.activePlants} (${stats.maturePlants} mature) | Discovered: ${encycStats.discovered}/${encycStats.total}`;

    // Update selected tile info and plant info panel
    const selectedTile = this.gridSystem.getSelectedTile();
    if (selectedTile && !this.player.isMoving()) {
      const pos = this.player.getGridPosition();
      if (selectedTile.row !== pos.row || selectedTile.col !== pos.col) {
        // Show tile info when hovering a different tile
        let stateText: string = selectedTile.state;
        if (selectedTile.hasPest()) {
          stateText += ' (click to remove)';
        }
        this.infoText.text = `Tile [${selectedTile.row}, ${selectedTile.col}] | State: ${stateText} | Soil: ${selectedTile.soilQuality}% | Moisture: ${selectedTile.moisture}%`;
        
        // Show plant info panel if tile has a plant
        if (selectedTile.state === TileState.OCCUPIED) {
          const plant = this.plantSystem.getPlantAt(selectedTile.col, selectedTile.row);
          if (plant) {
            // Convert grid position to screen position for tooltip
            const tilePos = this.grid.getTilePosition(selectedTile.row, selectedTile.col);
            const gridPos = this.gridSystem.getContainer().position;
            this.plantInfoPanel.showPlant(plant, gridPos.x + tilePos.x, gridPos.y + tilePos.y);
          } else {
            this.plantInfoPanel.hide();
          }
        } else {
          this.plantInfoPanel.hide();
        }
      } else if (selectedTile.state === TileState.OCCUPIED) {
        // Show plant info when on occupied tile
        const plant = this.plantSystem.getPlantAt(selectedTile.col, selectedTile.row);
        if (plant) {
          const state = plant.getState();
          this.infoText.text = `${state.config.displayName} | Stage: ${state.growthStage} | Health: ${Math.round(state.health)}% | Days: ${state.daysGrown}/${state.config.growthTime}`;
          
          // Show plant info panel
          const tilePos = this.grid.getTilePosition(selectedTile.row, selectedTile.col);
          const gridPos = this.gridSystem.getContainer().position;
          this.plantInfoPanel.showPlant(plant, gridPos.x + tilePos.x, gridPos.y + tilePos.y);
        } else {
          this.plantInfoPanel.hide();
        }
      } else {
        this.plantInfoPanel.hide();
      }
    } else {
      this.plantInfoPanel.hide();
    }
    
    // TLDR: Per-frame visual polish updates (sway, shake, sky lerp, particles)
    this.updateVisuals(delta);

    // Check for season end (day 12 reached)
    if (day >= 12 && !this.daySummary.isVisible() && !this.scoreSummary.isVisible()) {
      this.showScoreSummary();
    }
  }

  private setupAudioListeners(): void {
    // TLDR: Start ambient audio when scene initializes
    audioManager.startAmbient();

    // TLDR: Plant lifecycle sounds
    eventBus.on('plant:created', () => {
      audioManager.playSFX('PLANT');
    });

    eventBus.on('plant:watered', () => {
      audioManager.playSFX('WATER');
    });

    eventBus.on('plant:harvested', () => {
      audioManager.playSFX('HARVEST');
    });

    eventBus.on('plant:died', () => {
      audioManager.playSFX('WILT');
    });

    // TLDR: Pest sounds
    eventBus.on('pest:spawned', () => {
      audioManager.playSFX('PEST_APPEAR');
    });

    eventBus.on('pest:removed', () => {
      audioManager.playSFX('PEST_APPEAR');
    });

    // TLDR: Discovery chime
    eventBus.on('discovery:new', () => {
      audioManager.playSFX('HARVEST');
    });

    // TLDR: Day advancement chime
    eventBus.on('day:advanced', () => {
      audioManager.playSFX('PLANT');
    });
  }

  /**
   * TLDR: Handle weather warning event (2-day telegraph)
   */
  private handleWeatherWarning(data: { type: string; daysUntil: number; startDay: number; data: unknown }): void {
    const type = data.type as WeatherEventType;
    const warningData: HazardWarningData = {
      type,
      daysUntil: data.daysUntil,
      startDay: data.startDay,
      description: this.getWeatherDescription(type),
      mitigation: this.getWeatherMitigation(type),
    };
    this.hazardWarning.showWarning(warningData);
  }

  /**
   * TLDR: Get weather event description
   */
  private getWeatherDescription(type: WeatherEventType): string {
    switch (type) {
      case WeatherEventType.DROUGHT:
        return 'Soil dries 2x faster, water needs increased by 50%';
      case WeatherEventType.FROST:
        return 'Non-frost-resistant plants take damage each day';
      case WeatherEventType.HEAVY_RAIN:
        return 'Soil moisture locked at 100%, overwatering risk';
      default:
        return 'Unknown weather event';
    }
  }

  /**
   * TLDR: Get weather event mitigation advice
   */
  private getWeatherMitigation(type: WeatherEventType): string {
    switch (type) {
      case WeatherEventType.DROUGHT:
        return 'Water plants frequently to maintain soil moisture';
      case WeatherEventType.FROST:
        return 'Harvest vulnerable plants or protect with covers';
      case WeatherEventType.HEAVY_RAIN:
        return 'Avoid watering, ensure proper drainage';
      default:
        return 'Prepare accordingly';
    }
  }

  /**
   * TLDR: Get weather warning text for HUD
   */
  private getWeatherWarningText(type: WeatherEventType, daysUntil: number): string {
    const eventName = type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
    return `${eventName} in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`;
  }

  // ─── Visual Polish Methods ──────────────────────────────────────────

  /**
   * TLDR: Subscribe to EventBus for visual effects — growth, harvest, water, synergy
   */
  private setupVisualListeners(): void {
    eventBus.on('plant:created', (data) => {
      this.createPlantVisual(data.plantId, data.x, data.y);
    });

    eventBus.on('plant:grew', (data) => {
      this.animatePlantGrowth(data.plantId, data.stage);
    });

    eventBus.on('plant:watered', (data) => {
      this.triggerWaterRipple(data.x, data.y);
    });

    eventBus.on('plant:harvested', (data) => {
      this.triggerHarvestBurst(data.plantId);
      this.triggerScreenShake();
    });

    eventBus.on('plant:died', (data) => {
      this.removePlantVisual(data.plantId);
    });

    eventBus.on('synergy:activated', (data) => {
      this.triggerSynergyGlow(data.x, data.y, data.synergyId);
    });

    eventBus.on('day:advanced', () => {
      this.triggerDaySkyLerp();
    });
  }

  /**
   * TLDR: Create an animated visual container for a plant at grid position
   */
  private createPlantVisual(plantId: string, col: number, row: number): void {
    const plant = this.plantSystem.getPlant(plantId);
    if (!plant) return;

    const tilePos = this.grid.getTilePosition(row, col);
    const tileSize = this.grid.config.tileSize;

    const visual = new Container();
    visual.x = tilePos.x + tileSize / 2;
    visual.y = tilePos.y + tileSize / 2;
    visual.scale.set(0.01);

    const gfx = new Graphics();
    this.drawPlantShape(gfx, GrowthStage.SEED, plant.getConfig().rarity);
    visual.addChild(gfx);

    this.plantVisualLayer.addChild(visual);
    this.plantVisuals.set(plantId, visual);

    // TLDR: Random sway phase so plants don't oscillate in unison
    this.swayPhases.set(plantId, Math.random() * Math.PI * 2);

    // TLDR: Pop-in animation on creation
    this.animationSystem.tween(
      visual.scale as unknown as Record<string, unknown>,
      { x: 1, y: 1 },
      ANIMATION.GROWTH_SCALE_DURATION,
      { easing: Easing.backOut },
    );
  }

  /**
   * TLDR: Draw plant shape per growth stage — bigger and greener as it grows
   */
  private drawPlantShape(gfx: Graphics, stage: GrowthStage, rarity: string): void {
    gfx.clear();

    const sizeMap: Record<string, number> = {
      [GrowthStage.SEED]: ANIMATION.PLANT_SIZE_SEED,
      [GrowthStage.SPROUT]: ANIMATION.PLANT_SIZE_SPROUT,
      [GrowthStage.GROWING]: ANIMATION.PLANT_SIZE_GROWING,
      [GrowthStage.MATURE]: ANIMATION.PLANT_SIZE_MATURE,
    };
    const radius = sizeMap[stage] ?? ANIMATION.PLANT_SIZE_SEED;
    const colors = PLANT_STAGE_COLORS[stage] ?? PLANT_STAGE_COLORS.seed;
    const accentColors = RARITY_COLORS[rarity] ?? RARITY_COLORS.common;

    // TLDR: Outer glow ring for uncommon+ rarity
    if (rarity !== 'common' && stage === GrowthStage.MATURE) {
      gfx.circle(0, 0, radius + 4);
      gfx.fill({ color: accentColors[0], alpha: 0.3 });
    }

    gfx.circle(0, 0, radius);
    gfx.fill({ color: colors[0] });

    // TLDR: Inner highlight for depth
    if (radius > 5) {
      gfx.circle(-radius * 0.2, -radius * 0.2, radius * 0.4);
      gfx.fill({ color: colors[1], alpha: 0.5 });
    }
  }

  /**
   * TLDR: Animate plant visual when growth stage changes — scale pop + redraw
   */
  private animatePlantGrowth(plantId: string, stage: GrowthStage): void {
    const visual = this.plantVisuals.get(plantId);
    if (!visual) return;

    const plant = this.plantSystem.getPlant(plantId);
    if (!plant) return;

    // TLDR: Redraw at new stage size
    const gfx = visual.children[0] as Graphics;
    if (gfx) {
      this.drawPlantShape(gfx, stage, plant.getConfig().rarity);
    }

    // TLDR: Scale overshoot then settle — juicy growth feedback
    visual.scale.set(ANIMATION.GROWTH_SCALE_OVERSHOOT);
    this.animationSystem.tween(
      visual.scale as unknown as Record<string, unknown>,
      { x: 1, y: 1 },
      ANIMATION.GROWTH_SCALE_DURATION,
      { easing: Easing.elasticOut },
    );
  }

  /**
   * TLDR: Particle burst on harvest — colored by plant rarity
   */
  private triggerHarvestBurst(plantConfigId: string): void {
    const config = PLANT_BY_ID[plantConfigId];
    const rarity = config?.rarity ?? 'common';
    const colors = RARITY_COLORS[rarity] ?? RARITY_COLORS.common;

    // TLDR: Find position from any plant visual that no longer has a backing plant
    let burstX = this._ctx.app.screen.width / 2;
    let burstY = this._ctx.app.screen.height / 2;

    for (const [pid, visual] of this.plantVisuals) {
      const p = this.plantSystem.getPlant(pid);
      if (!p) {
        const gridPos = this.gridSystem.getContainer().position;
        burstX = gridPos.x + visual.x;
        burstY = gridPos.y + visual.y;
        this.removePlantVisual(pid);
        break;
      }
    }

    this.particleSystem.burst({
      x: burstX,
      y: burstY,
      count: ANIMATION.HARVEST_PARTICLE_COUNT,
      speed: ANIMATION.HARVEST_PARTICLE_SPEED,
      lifetime: ANIMATION.HARVEST_PARTICLE_LIFETIME,
      colors,
      size: ANIMATION.HARVEST_PARTICLE_SIZE,
    });
  }

  /**
   * TLDR: Brief screen shake on harvest for tactile feedback
   */
  private triggerScreenShake(): void {
    this.shakeElapsed = 0;
    this.shakeDuration = ANIMATION.HARVEST_SHAKE_DURATION;
  }

  /**
   * TLDR: Concentric water ripple at tile position
   */
  private triggerWaterRipple(col: number, row: number): void {
    const tilePos = this.grid.getTilePosition(row, col);
    const tileSize = this.grid.config.tileSize;
    const gridPos = this.gridSystem.getContainer().position;

    this.particleSystem.ripple({
      x: gridPos.x + tilePos.x + tileSize / 2,
      y: gridPos.y + tilePos.y + tileSize / 2,
      rings: ANIMATION.WATER_RIPPLE_RINGS,
      maxRadius: ANIMATION.WATER_RIPPLE_MAX_RADIUS,
      duration: ANIMATION.WATER_RIPPLE_DURATION,
      color: ANIMATION.WATER_RIPPLE_COLOR,
    });
  }

  /**
   * TLDR: Pulsing glow on synergy-bonused plant
   */
  private triggerSynergyGlow(col: number, row: number, synergyId: string): void {
    const tilePos = this.grid.getTilePosition(row, col);
    const tileSize = this.grid.config.tileSize;
    const gridPos = this.gridSystem.getContainer().position;
    const color = SYNERGY_GLOW_COLORS[synergyId] ?? 0xffffff;

    this.particleSystem.glow({
      x: gridPos.x + tilePos.x + tileSize / 2,
      y: gridPos.y + tilePos.y + tileSize / 2,
      radius: ANIMATION.SYNERGY_GLOW_RADIUS,
      color,
      pulseSpeed: ANIMATION.SYNERGY_GLOW_PULSE_SPEED,
      minAlpha: ANIMATION.SYNERGY_GLOW_MIN_ALPHA,
      maxAlpha: ANIMATION.SYNERGY_GLOW_MAX_ALPHA,
      duration: ANIMATION.SYNERGY_GLOW_DURATION,
    });
  }

  /**
   * TLDR: Smooth sky color transition on day advance
   */
  private triggerDaySkyLerp(): void {
    const seasonCfg = SEASON_CONFIG[this.currentSeason];
    const day = this.player.getCurrentDay();

    // TLDR: Shift background slightly darker/lighter based on time of day
    const dayFactor = (day % 12) / 12;
    const darken = 1.0 - 0.15 * Math.sin(dayFactor * Math.PI);

    const baseColor = seasonCfg.backgroundColor;
    const r = Math.round(((baseColor >> 16) & 0xff) * darken);
    const g = Math.round(((baseColor >> 8) & 0xff) * darken);
    const b = Math.round((baseColor & 0xff) * darken);

    this.previousSkyColor = seasonCfg.backgroundColor;
    this.targetSkyColor = (r << 16) | (g << 8) | b;
    this.skyLerpElapsed = 0;
    this.skyLerpDuration = ANIMATION.DAY_SKY_LERP_DURATION;
  }

  /**
   * TLDR: Remove plant visual container on death/harvest
   */
  private removePlantVisual(plantId: string): void {
    const visual = this.plantVisuals.get(plantId);
    if (visual) {
      visual.destroy({ children: true });
      this.plantVisuals.delete(plantId);
      this.swayPhases.delete(plantId);
    }
  }

  /**
   * TLDR: Rebuild all plant visuals (after season change / restart)
   */
  private rebuildPlantVisuals(): void {
    for (const [, visual] of this.plantVisuals) {
      visual.destroy({ children: true });
    }
    this.plantVisuals.clear();
    this.swayPhases.clear();

    const activePlants = this.plantSystem.getActivePlants();
    for (const plant of activePlants) {
      this.createPlantVisual(plant.id, plant.x, plant.y);
      const visual = this.plantVisuals.get(plant.id);
      if (visual) {
        visual.scale.set(1);
        const gfx = visual.children[0] as Graphics;
        if (gfx) {
          this.drawPlantShape(gfx, plant.getGrowthStage(), plant.getConfig().rarity);
        }
      }
    }
  }

  /**
   * TLDR: Per-frame visual updates — idle sway, screen shake, sky lerp, pest crawl
   */
  private updateVisuals(delta: number): void {
    const dt = delta / 60;
    const time = performance.now() / 1000;

    this.animationSystem.update(delta);
    this.particleSystem.update(delta);

    // TLDR: Idle sway — gentle sine rotation on each plant visual
    for (const [plantId, visual] of this.plantVisuals) {
      const phase = this.swayPhases.get(plantId) ?? 0;
      visual.rotation = Math.sin(time * ANIMATION.SWAY_FREQUENCY * Math.PI * 2 + phase) * ANIMATION.SWAY_AMPLITUDE;
    }

    // TLDR: Screen shake decay
    if (this.shakeDuration > 0) {
      this.shakeElapsed += dt;
      if (this.shakeElapsed < this.shakeDuration) {
        const intensity = ANIMATION.HARVEST_SHAKE_INTENSITY * (1 - this.shakeElapsed / this.shakeDuration);
        this.shakeContainer.x = (Math.random() - 0.5) * intensity * 2;
        this.shakeContainer.y = (Math.random() - 0.5) * intensity * 2;
      } else {
        this.shakeContainer.x = 0;
        this.shakeContainer.y = 0;
        this.shakeDuration = 0;
      }
    }

    // TLDR: Sky color lerp
    if (this.skyLerpDuration > 0) {
      this.skyLerpElapsed += dt;
      const t = Math.min(this.skyLerpElapsed / this.skyLerpDuration, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      const fromR = (this.previousSkyColor >> 16) & 0xff;
      const fromG = (this.previousSkyColor >> 8) & 0xff;
      const fromB = this.previousSkyColor & 0xff;
      const toR = (this.targetSkyColor >> 16) & 0xff;
      const toG = (this.targetSkyColor >> 8) & 0xff;
      const toB = this.targetSkyColor & 0xff;

      const r = Math.round(fromR + (toR - fromR) * eased);
      const g = Math.round(fromG + (toG - fromG) * eased);
      const b = Math.round(fromB + (toB - fromB) * eased);

      this._ctx.app.renderer.background.color = (r << 16) | (g << 8) | b;

      if (t >= 1) {
        this.skyLerpDuration = 0;
      }
    }

    // TLDR: Pest crawl wobble
    this.updatePestCrawl(time);

    // TLDR: Clean up visuals for plants that no longer exist
    for (const [plantId] of this.plantVisuals) {
      if (!this.plantSystem.getPlant(plantId)) {
        this.removePlantVisual(plantId);
      }
    }
  }

  /**
   * TLDR: Wobble pest markers on affected tiles for crawl animation
   */
  private updatePestCrawl(time: number): void {
    const gridContainer = this.gridSystem.getContainer();
    const tiles = this.grid.getAllTiles();
    for (const tile of tiles) {
      if (tile.hasPest()) {
        const tilePos = this.grid.getTilePosition(tile.row, tile.col);
        for (const child of gridContainer.children) {
          if (child instanceof Graphics && Math.abs(child.x - tilePos.x) < 1 && Math.abs(child.y - tilePos.y) < 1) {
            const wobbleX = Math.sin(time * ANIMATION.PEST_CRAWL_SPEED * Math.PI * 2 + tile.row) * ANIMATION.PEST_CRAWL_AMPLITUDE;
            const wobbleY = Math.cos(time * ANIMATION.PEST_CRAWL_SPEED * Math.PI * 2 + tile.col) * ANIMATION.PEST_CRAWL_AMPLITUDE;
            child.pivot.set(-wobbleX, -wobbleY);
            break;
          }
        }
      }
    }
  }

  destroy(): void {
    audioManager.stopAmbient();
    window.removeEventListener('keydown', this.boundOnKeyDown);
    this.animationSystem.destroy();
    this.particleSystem.destroy();
    for (const [, visual] of this.plantVisuals) {
      visual.destroy({ children: true });
    }
    this.plantVisuals.clear();
    this.swayPhases.clear();
    this.gridSystem.destroy();
    this.playerSystem.destroy();
    this.plantSystem.destroy();
    this.hazardSystem.destroy();
    this.weatherSystem.destroy();
    this.scoringSystem.destroy();
    this.synergySystem.destroy();
    this.toolBar.destroy();
    this.encyclopedia.destroy();
    this.discoveryPopup.destroy();
    this.hazardUI.destroy();
    this.hazardWarning.destroy();
    this.hazardTooltip.destroy();
    this.hud.destroy();
    this.seedInventory.destroy();
    this.plantInfoPanel.destroy();
    this.daySummary.destroy();
    this.pauseMenu.destroy();
    this.scoreSummary.destroy();
    this.saveIndicator.destroy();
    this.synergyTooltip.destroy();
    this.tutorialSystem.destroy();
    this.tutorialOverlay.destroy();
    this.plants.clear();
    this.shakeContainer.destroy({ children: true });
    this.container = new Container();
  }
}
