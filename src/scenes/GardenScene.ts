import { Container, Text, Graphics } from 'pixi.js';
import type { Scene, SceneContext } from '../core';
import { GardenGrid } from '../entities/GardenGrid';
import { TileState, Tile } from '../entities/Tile';
import { Player, ToolType } from '../entities/Player';
import { Plant, GrowthStage } from '../entities/Plant';
import { Structure } from '../entities/Structure';
import { GridSystem } from '../systems/GridSystem';
import { PlayerSystem } from '../systems/PlayerSystem';
import { PlantSystem } from '../systems/PlantSystem';
import { EncyclopediaSystem } from '../systems/EncyclopediaSystem';
import { HazardSystem } from '../systems/HazardSystem';
import { WeatherSystem, WeatherEventType } from '../systems/WeatherSystem';
import { ScoringSystem } from '../systems/ScoringSystem';
import { SynergySystem } from '../systems/SynergySystem';
import { UnlockSystem } from '../systems/UnlockSystem';
import { ToolSystem } from '../systems/ToolSystem';
import type { ToolTier } from '../config/tools';
import { TOOL_BY_TYPE } from '../config/tools';
import { SaveManager } from '../systems/SaveManager';
import { AnimationSystem, Easing } from '../systems/AnimationSystem';
import { ParticleSystem } from '../systems/ParticleSystem';
import { AchievementSystem } from '../systems/AchievementSystem';
import { PlantRenderer } from '../systems/PlantRenderer';
import { TileRenderer } from '../systems/TileRenderer';
import { SeedSelectionSystem } from '../systems/SeedSelectionSystem';
import { ToolBar, RestButton, Encyclopedia, DiscoveryPopup, HazardUI, HazardWarning, HazardTooltip, HUD, SeedInventory, PlantInfoPanel, DaySummary, PauseMenu, ScoreSummary, SaveIndicator, SynergyTooltip, TutorialOverlay, AchievementNotification, AchievementGallery } from '../ui';
import type { DaySummaryData, PauseMenuCallbacks, HazardWarningData, GamePhase } from '../ui';
import { InputManager } from '../core/InputManager';
import { TouchController } from '../core/TouchController';
import { GAME, TOUCH, SCENES, COLORS, UI_COLORS } from '../config';
import { MenuScene } from './MenuScene';
import { setResultsData } from './ResultsScene';
import { StructureType, STRUCTURE_CONFIGS, GREENHOUSE_BONUS_DAYS, COMPOST_SOIL_BOOST, COMPOST_TOOL_BOOST, RAIN_BARREL_WATER_COUNT } from '../config/structures';
import { Season, SEASON_CONFIG, SEASON_ORDER, MULTI_SEASON_DAYS, MULTI_SEASON_SCORE_MULTIPLIER, getRandomSeason } from '../config/seasons';
import { getSeasonalPalette, lerpColor } from '../config/seasonalPalettes';
import { eventBus, type EventMap } from '../core/EventBus';
import { audioManager } from '../systems';
import { ANIMATION, SYNERGY_GLOW_COLORS } from '../config/animations';
import {
  getPlantVisual,
} from '../config/plantVisuals';
import { TutorialSystem } from '../systems/TutorialSystem';
import { WeedSystem } from '../systems/WeedSystem';
import {
  getViewportInfo,
  calculateGridScale,
  shouldShowOrientationHint,
  isTouchDevice,
} from '../utils/responsive';
import type { ViewportInfo } from '../utils/responsive';

export class GardenScene implements Scene {
  readonly name = 'garden';
  private container = new Container();
  private grid!: GardenGrid;
  private gridSystem!: GridSystem;
  private player!: Player;
  private playerSystem!: PlayerSystem;
  private toolBar!: ToolBar;
  private restButton!: RestButton;
  private plants: Map<string, Plant> = new Map();
  private plantSystem!: PlantSystem;
  private encyclopediaSystem!: EncyclopediaSystem;
  private encyclopedia!: Encyclopedia;
  private discoveryPopup!: DiscoveryPopup;
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
  
  // TLDR: Achievement system integration
  private achievementSystem!: AchievementSystem;
  private achievementNotification!: AchievementNotification;
  private achievementGallery!: AchievementGallery;
  private weedSystem!: WeedSystem;
  
  // TLDR: Save system integration
  private saveManager: SaveManager;
  private saveIndicator!: SaveIndicator;
  private unlockSystem!: UnlockSystem;
  private toolSystem!: ToolSystem;
  
  // TLDR: Structure placement state
  private structurePlacementMode: StructureType | null = null;

  // TLDR: BUG-008 — pending tool action after auto-move completes
  private pendingToolAction: { row: number; col: number } | null = null;

  // TLDR: SeedSelectionSystem for wiring actual run seed pool (#242)
  private seedSelectionSystem: SeedSelectionSystem;
  
  // TLDR: Season length (may be extended by Greenhouse)
  private maxSeasonDays = 12;
  
  // Session tracking
  private harvestedSeeds: Map<string, number> = new Map();
  private newDiscoveriesThisSeason: Set<string> = new Set();
  
  // Active season
  private currentSeason: Season = Season.SPRING;

  // TLDR: Multi-season run state (#201)
  private isMultiSeasonRun = false;
  private multiSeasonIndex = 0;
  private multiSeasonScoreAccumulator = 0;
  
  // Stored scene context (needed for season transitions)
  private _ctx!: SceneContext;
  
  // Keyboard handler reference for cleanup
  private boundOnKeyDown!: (e: KeyboardEvent) => void;
  private frameCounter = 0;

  // TLDR: Visual polish systems — animations, particles, plant visuals
  private animationSystem!: AnimationSystem;
  private particleSystem!: ParticleSystem;
  private plantRenderer!: PlantRenderer;
  private tileRenderer!: TileRenderer;
  private shakeContainer!: Container;
  private shakeElapsed = 0;
  private shakeDuration = 0;
  private previousSkyColor = 0;
  private targetSkyColor = 0;
  private skyLerpElapsed = 0;
  private skyLerpDuration = 0;

  // TLDR: Seasonal palette transition state (smooth 2s crossfade)
  private seasonTransitionFrom: { bg: number; tint: number } | null = null;
  private seasonTransitionTarget: { bg: number; tint: number } | null = null;
  private seasonTransitionElapsed = 0;
  private readonly SEASON_TRANSITION_DURATION = 2.0;

  // TLDR: Season-end banner state (#308)
  private seasonEndBanner: Container | null = null;
  private seasonEndBannerElapsed = 0;
  private seasonEndBannerActive = false;

  // TLDR: Touch controller and responsive state
  private touchController!: TouchController;
  private viewportInfo!: ViewportInfo;
  private gardenZoomScale = 1;
  private orientationHint: Container | null = null;
  private boundOnResize!: () => void;

  // TLDR: Track EventBus listeners for cleanup in destroy() — prevents memory leaks
  private eventCleanups: Array<() => void> = [];

  constructor(saveManager: SaveManager, seedSelectionSystem: SeedSelectionSystem) {
    this.saveManager = saveManager;
    this.seedSelectionSystem = seedSelectionSystem;
  }

  // TLDR: Wrapper for eventBus.on that auto-tracks listeners for cleanup in destroy()
  private listenTo<E extends keyof EventMap & string>(
    event: E,
    listener: (data: EventMap[E]) => void,
  ): void {
    eventBus.on(event, listener);
    this.eventCleanups.push(() => eventBus.off(event, listener));
  }

  async init(ctx: SceneContext): Promise<void> {
    const { input } = ctx;
    this.input = input;
    this._ctx = ctx;

    // TLDR: Shake container wraps scene content for harvest screen shake
    this.shakeContainer = new Container();
    ctx.sceneManager.stage.addChild(this.shakeContainer);
    this.shakeContainer.addChild(this.container);

    // TLDR: Use season selected by player in SeedSelectionScene (#201)
    this.currentSeason = this.seedSelectionSystem.getSelectedSeason();
    this.isMultiSeasonRun = this.seedSelectionSystem.isMultiSeasonMode();
    this.multiSeasonIndex = 0;
    this.multiSeasonScoreAccumulator = 0;
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

    // TLDR: Apply multi-season 2× score multiplier (#201)
    if (this.isMultiSeasonRun) {
      this.scoringSystem.setScoreMultiplier(MULTI_SEASON_SCORE_MULTIPLIER);
      this.maxSeasonDays = MULTI_SEASON_DAYS;
    }

    // TLDR: Initialize unlock system (with SaveManager persistence)
    this.unlockSystem = new UnlockSystem(this.saveManager);

    // TLDR: Initialize tool system (tracks tool tiers, unlocks, selection)
    this.toolSystem = new ToolSystem(this.saveManager, this.unlockSystem);

    // TLDR: Determine grid size from unlock progress
    const gridSize = this.unlockSystem.getUnlockedGridSize();

    // Initialize garden grid (dynamic size based on unlocks)
    this.grid = new GardenGrid({
      rows: gridSize.rows,
      cols: gridSize.cols,
      tileSize: 64,
      padding: 4,
    });

    // Initialize grid rendering system
    this.gridSystem = new GridSystem(this.grid);
    this.gridSystem.centerInViewport(ctx.app.screen.width, ctx.app.screen.height);
    this.gridSystem.setSeason(this.currentSeason);
    this.container.addChild(this.gridSystem.getContainer());

    this.weedSystem = new WeedSystem({ grid: this.grid, season: this.currentSeason });
    this.plantSystem.setWeedSystem(this.weedSystem);

    // Initialize player at center of grid
    const gridRows = this.grid.config.rows;
    const gridCols = this.grid.config.cols;
    this.player = new Player('player-1', {
      startRow: Math.floor(gridRows / 2),
      startCol: Math.floor(gridCols / 2),
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
    this.toolBar = new ToolBar(this.toolSystem);
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
    });
    this.container.addChild(this.toolBar.getContainer());

    // TLDR: Initialize rest button (#244)
    this.restButton = new RestButton();
    this.restButton.position(
      ctx.app.screen.width / 2 + 220,
      ctx.app.screen.height - 100,
    );
    this.restButton.setOnClick(() => this.handleRestAction());
    this.container.addChild(this.restButton.getContainer());

    // TLDR: Wire tool unlock/upgrade events to ToolBar UI
    this.listenTo('tool:unlocked', (data) => {
      this.toolBar.unlockTool(data.toolType as ToolType);
    });
    this.listenTo('tool:upgraded', (data) => {
      this.toolBar.updateToolTier(data.toolType as ToolType, data.newTier as ToolTier);
    });
    
    // TLDR: Wire action consumed event to HUD flash animation (#250)
    this.listenTo('action:consumed', () => {
      this.hud.flashActionConsumed();
    });

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

    // TLDR: Initialize Encyclopedia UI — clamped positioning for small screens (BUG-010)
    this.encyclopedia = new Encyclopedia();
    this.encyclopedia.setPosition(
      Math.max(10, (ctx.app.screen.width - 800) / 2),
      Math.max(10, (ctx.app.screen.height - 600) / 2)
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

      // TLDR: Play discovery chime and update HUD counter
      audioManager.playSFX('HARVEST');
      this.updateHudDiscoveryCount();

      // TLDR: Screen flash for rare+ discoveries
      if (this.discoveryPopup.isRarePlus()) {
        this.triggerScreenPulse();
      }
    });
    
    // Initialize HUD
    this.hud = new HUD();
    this.hud.resize(ctx.app.screen.width);
    this.hud.setPosition(
      Math.max(10, (ctx.app.screen.width - this.hud.getPanelWidth()) / 2),
      10
    );
    this.hud.setSeason(this.currentSeason);
    this.container.addChild(this.hud.getContainer());
    this.updateHudDiscoveryCount();
    
    // Initialize Seed Inventory (side panel)
    this.seedInventory = new SeedInventory(ctx.app.screen.height);
    this.seedInventory.setPosition(10, 0);
    this.container.addChild(this.seedInventory.getContainer());

    // TLDR: Wire actual run seed pool from SeedSelectionSystem (#242)
    const currentPool = this.seedSelectionSystem.getCurrentPool();
    if (currentPool && currentPool.seeds.length > 0) {
      this.seedInventory.setAvailableSeeds(currentPool.seeds);
    }
    
    // Initialize Plant Info Panel (tooltip)
    this.plantInfoPanel = new PlantInfoPanel();
    this.container.addChild(this.plantInfoPanel.getContainer());
    
    // TLDR: DaySummary initialized here, added to overlayLayer below for z-order
    this.daySummary = new DaySummary();
    this.daySummary.setOnNext(() => {
      // TLDR: BUG-013 fix — dismiss overlay and continue playing (day already advanced)
      this.gridSystem.update();
    });
    
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
      onAchievements: () => {
        this.toggleAchievementGallery();
      },
      onHowToPlay: () => {
        this.tutorialOverlay.showHowToPlay();
      },
      onMainMenu: () => {
        // TLDR: Save garden state, then navigate to MenuScene main menu
        this.saveGardenState();
        MenuScene.skipTitle = true;
        this._ctx.sceneManager.transitionTo(SCENES.MENU, { type: 'fade' }).catch(console.error);
      },
    };
    // TLDR: PauseMenu initialized here, added to overlayLayer below for z-order
    this.pauseMenu = new PauseMenu(ctx.app.screen.width, ctx.app.screen.height, pauseCallbacks);
    
    // TLDR: ScoreSummary initialized here, added to overlayLayer below for z-order
    this.scoreSummary = new ScoreSummary();
    this.scoreSummary.setOnContinue(() => {
      this.startNewSeason();
    });
    
    // TLDR: Initialize save indicator (top-right, subscribes to SaveManager events)
    this.saveIndicator = new SaveIndicator(this.saveManager);
    this.saveIndicator.setPosition(ctx.app.screen.width - 120, 60);
    this.container.addChild(this.saveIndicator.getContainer());
    
    // TLDR: Initialize synergy tooltip
    this.synergyTooltip = new SynergyTooltip();
    this.synergyTooltip.centerHorizontally(ctx.app.screen.width);
    this.container.addChild(this.synergyTooltip.getContainer());
    
    // TLDR: Listen for synergy tutorial event
    this.listenTo('synergy:tutorial', (data) => {
      this.synergyTooltip.showTutorial(data.synergyId);
    });

    // TLDR: Listen for weather warning events
    this.listenTo('weather:warning', (data) => {
      this.handleWeatherWarning(data);
    });
    
    // TLDR: Initialize visual polish systems
    this.animationSystem = new AnimationSystem();
    this.particleSystem = new ParticleSystem();

    // TLDR: TileRenderer — dedicated visuals for soil, structures, weed overlays
    this.tileRenderer = new TileRenderer({ grid: this.grid });
    this.tileRenderer.setSeason(this.currentSeason);
    this.gridSystem.setTileRenderer(this.tileRenderer);

    this.plantRenderer = new PlantRenderer({
      animationSystem: this.animationSystem,
      plantSystem: this.plantSystem,
      grid: this.grid,
    });
    this.gridSystem.getContainer().addChild(this.plantRenderer.getContainer());
    this.container.addChild(this.particleSystem.getContainer());
    this.plantRenderer.rebuildAllVisuals();
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

    // TLDR: Initialize achievement system (with SaveManager persistence)
    this.achievementSystem = new AchievementSystem(this.saveManager);
    this.achievementSystem.setSeason(this.currentSeason);

    // TLDR: Achievement notification popup (on unlock)
    this.achievementNotification = new AchievementNotification();
    this.achievementNotification.setPosition(ctx.app.screen.width, ctx.app.screen.height);
    this.container.addChild(this.achievementNotification.getContainer());

    this.achievementSystem.onUnlock((config) => {
      this.achievementNotification.show(config);
    });

    // TLDR: Achievement gallery — clamped positioning for small screens (BUG-010)
    this.achievementGallery = new AchievementGallery();
    this.achievementGallery.setPosition(
      Math.max(10, (ctx.app.screen.width - 800) / 2),
      Math.max(10, (ctx.app.screen.height - 600) / 2),
    );
    this.achievementGallery.hide();
    this.container.addChild(this.achievementGallery.getContainer());

    // TLDR: Overlay layer sits above ALL gameplay UI — prevents z-order bugs (BUG-007)
    const overlayLayer = new Container();
    overlayLayer.addChild(this.daySummary.getContainer());
    overlayLayer.addChild(this.scoreSummary.getContainer());
    overlayLayer.addChild(this.pauseMenu.getContainer());
    this.container.addChild(overlayLayer);

    // TLDR: Load persisted structures from save data
    this.loadStructuresFromSave();

    // TLDR: Wire structure effect events (compost bin converts dead plants to soil boost)
    this.listenTo('plant:died', (data) => {
      this.applyCompostEffect(data.plantId);
    });
    
    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();

    // TLDR: Initialize touch controller — unified pointer abstraction for mobile
    this.touchController = new TouchController(this.shakeContainer, {
      longPressMs: TOUCH.LONG_PRESS_MS,
      dragThresholdPx: TOUCH.DRAG_THRESHOLD_PX,
      pinchMinScale: TOUCH.PINCH_MIN_SCALE,
      pinchMaxScale: TOUCH.PINCH_MAX_SCALE,
      hapticEnabled: TOUCH.HAPTIC_ENABLED,
    });

    this.touchController.setCallbacks({
      onTap: (evt) => {
        eventBus.emit('touch:tap', { x: evt.position.x, y: evt.position.y });
      },
      onLongPress: (evt) => {
        // TLDR: Long-press opens plant info panel at the pressed tile
        eventBus.emit('touch:longpress', { x: evt.position.x, y: evt.position.y });
      },
      onPinch: (evt) => {
        if (evt.scale !== undefined) {
          this.gardenZoomScale = evt.scale;
          this.gridSystem.getContainer().scale.set(evt.scale);
          eventBus.emit('touch:pinch', { scale: evt.scale });
        }
      },
      onPinchEnd: () => {
        // TLDR: Snap scale to grid after pinch ends
        this.touchController.setBasePinchScale(this.gardenZoomScale);
      },
    });

    // TLDR: Capture viewport info and apply responsive layout
    this.viewportInfo = getViewportInfo();
    this.applyResponsiveLayout(ctx);

    // TLDR: Listen for window resize to re-layout
    this.boundOnResize = () => {
      this.viewportInfo = getViewportInfo();
      this.applyResponsiveLayout(this._ctx);
      const { width, height, category } = this.viewportInfo;
      eventBus.emit('viewport:resized', { width, height, category });
    };
    window.addEventListener('resize', this.boundOnResize);

    // Setup audio event listeners
    this.setupAudioListeners();

    // TLDR: BUG-001/003/008 — restructured click handler for planting, movement, and auto-move
    this.gridSystem.onTileClick((row, col) => {
      if (this.isPaused) return;

      // TLDR: Handle structure placement mode first
      if (this.structurePlacementMode) {
        this.tryPlaceStructure(row, col);
        return;
      }

      const playerPos = this.player.getGridPosition();
      const selectedTool = this.player.getSelectedTool();
      const tile = this.grid.getTile(row, col);
      if (!tile) return;

      const isOnTile = row === playerPos.row && col === playerPos.col;

      if (isOnTile && selectedTool) {
        // TLDR: Player on tile with tool — execute tool action
        this.executeToolOnCurrentTile();
        return;
      }

      if (!isOnTile && selectedTool && this.player.hasActionsRemaining()) {
        // TLDR: BUG-008 fix — auto-move to tile, then execute tool on arrival
        this.pendingToolAction = { row, col };
        this.playerSystem.handleTileClick(row, col);
        return;
      }

      // TLDR: BUG-003 fix — move to tile regardless of occupancy
      this.playerSystem.handleTileClick(row, col);
    });

    // Apply seasonal palette (soil color, ambient particles)
    this.applySeason(false);

    // Start ambient audio loop
    audioManager.startAmbient();

    // Initial render
    this.gridSystem.update();
    this.updateEncyclopediaEntries();
  }

  private setupGridClickHandling(): void {
    // This method is no longer needed as we use gridSystem.onTileClick callback
    // Kept as stub in case needed for future direct grid container interactions
  }

  /** TLDR: Apply responsive layout — repositions/scales UI for current viewport */
  private applyResponsiveLayout(ctx: SceneContext): void {
    const w = ctx.app.screen.width;
    const h = ctx.app.screen.height;

    // TLDR: Re-center grid for current viewport
    this.gridSystem.centerInViewport(w, h);

    // TLDR: Responsive grid scaling via viewport-aware calculation
    const gridInfo = calculateGridScale(
      w,
      h,
      this.grid.config.cols,
      this.grid.config.rows,
      this.grid.config.padding ?? 4,
      this.grid.config.tileSize,
    );
    const gardenContainer = this.gridSystem.getContainer();
    gardenContainer.scale.set(gridInfo.scale * this.gardenZoomScale);
    gardenContainer.x = gridInfo.offsetX;
    gardenContainer.y = gridInfo.offsetY;

    // TLDR: Re-position HUD (responsive width)
    this.hud.resize(w);
    this.hud.setPosition(Math.max(10, (w - this.hud.getPanelWidth()) / 2), 10);

    // TLDR: Re-position toolbar centered at bottom
    this.toolBar.position(w / 2 - 135, h - 100);
    
    // TLDR: Position rest button to the right of toolbar
    this.restButton.position(w / 2 + 220, h - 100);

    // TLDR: Orientation hint for portrait on small screens
    if (shouldShowOrientationHint(w, h)) {
      this.showOrientationHint(ctx);
    } else {
      this.hideOrientationHint();
    }
  }

  /** TLDR: Show a gentle hint to rotate to landscape */
  private showOrientationHint(ctx: SceneContext): void {
    if (this.orientationHint) return;

    this.orientationHint = new Container();

    const bg = new Graphics();
    bg.rect(0, 0, ctx.app.screen.width, ctx.app.screen.height);
    bg.fill({ color: 0x000000, alpha: 0.7 });
    this.orientationHint.addChild(bg);

    const hint = new Text({
      text: '📱 Rotate your device for the best experience',
      style: {
        fontFamily: 'Arial',
        fontSize: 18,
        fill: '#c8e6c9',
        align: 'center',
        wordWrap: true,
        wordWrapWidth: ctx.app.screen.width - 40,
      },
    });
    hint.anchor.set(0.5, 0.5);
    hint.x = ctx.app.screen.width / 2;
    hint.y = ctx.app.screen.height / 2;
    this.orientationHint.addChild(hint);

    // TLDR: Auto-dismiss after 3 seconds
    this.container.addChild(this.orientationHint);
    const hintRef = this.orientationHint;
    setTimeout(() => {
      if (hintRef.parent) {
        hintRef.parent.removeChild(hintRef);
        hintRef.destroy({ children: true });
      }
      if (this.orientationHint === hintRef) {
        this.orientationHint = null;
      }
    }, 3000);
  }

  /** TLDR: Remove orientation hint if visible */
  private hideOrientationHint(): void {
    if (this.orientationHint) {
      if (this.orientationHint.parent) {
        this.orientationHint.parent.removeChild(this.orientationHint);
      }
      this.orientationHint.destroy({ children: true });
      this.orientationHint = null;
    }
  }
  
  private setupKeyboardShortcuts(): void {
    // TLDR: Number-key → ToolType mapping for keyboard tool selection (#283)
    const keyToolMap: Record<string, ToolType> = {
      '1': ToolType.SEED,
      '2': ToolType.WATER,
      '3': ToolType.HARVEST,
      '4': ToolType.REMOVE_PEST,
      '5': ToolType.REMOVE_WEED,
      '6': ToolType.COMPOST,
      '7': ToolType.PEST_SPRAY,
      '8': ToolType.SOIL_TESTER,
      '9': ToolType.TRELLIS,
    };

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
      } else if (keyToolMap[e.key] && !this.isPaused && !this.encyclopediaVisible) {
        // TLDR: Number keys 1-9 select tools via keyboard (#283)
        const toolType = keyToolMap[e.key];
        const toolConfig = TOOL_BY_TYPE[toolType];

        this.player.selectTool(toolType);
        this.toolBar.setSelectedTool(toolType);

        const displayName = toolConfig.displayName;
        this.hud.setHint(`🔧 ${displayName} tool selected`);

        eventBus.emit('tool:selected', {
          toolType: toolType,
          toolName: displayName,
        });
      }
    };
    window.addEventListener('keydown', this.boundOnKeyDown);
  }
  
  private startNewSeason(): void {
    // TLDR: Record the completed run for unlock progression
    this.unlockSystem.recordRunCompleted();

    // TLDR: Finalize achievement tracking for the ending run
    this.achievementSystem.onRunEnd();

    // Reset session tracking
    this.harvestedSeeds.clear();
    this.newDiscoveriesThisSeason.clear();
    
    // Reset scoring for new run
    this.scoringSystem.reset();
    
    // Pick a new season (different from current when possible)
    const seasons: Season[] = [Season.SPRING, Season.SUMMER, Season.FALL, Season.WINTER];
    const otherSeasons = seasons.filter(s => s !== this.currentSeason);
    const previousSeason = this.currentSeason;
    this.currentSeason = otherSeasons[Math.floor(Math.random() * otherSeasons.length)];
    
    // Apply new season visuals (smooth 2s transition)
    this.applySeason(true, previousSeason);

    // TLDR: Reset achievement run trackers and set new season
    this.achievementSystem.resetRun();
    this.achievementSystem.setSeason(this.currentSeason);

    // TLDR: Check if grid should expand based on new run count
    const gridSize = this.unlockSystem.getUnlockedGridSize();
    if (gridSize.rows !== this.grid.config.rows || gridSize.cols !== this.grid.config.cols) {
      this.expandGrid(gridSize.rows, gridSize.cols);
    }
    
    // Reset player
    const centerRow = Math.floor(gridSize.rows / 2);
    const centerCol = Math.floor(gridSize.cols / 2);
    this.player.setGridPosition(centerRow, centerCol);
    
    // Clear grid and plants
    for (let row = 0; row < this.grid.config.rows; row++) {
      for (let col = 0; col < this.grid.config.cols; col++) {
        const tile = this.grid.getTile(row, col);
        if (tile && !tile.hasStructure()) {
          tile.state = TileState.EMPTY;
        }
      }
    }
    this.plants.clear();
    
    // Reset hazard system for the new season
    this.hazardSystem.reset(undefined, this.currentSeason);

    // TLDR: Recalculate season length (Greenhouse extends by 2 days)
    const baseDays = this.isMultiSeasonRun ? MULTI_SEASON_DAYS : 12;
    this.maxSeasonDays = baseDays + (this.gridSystem.hasStructureType(StructureType.GREENHOUSE) ? GREENHOUSE_BONUS_DAYS : 0);
    
    this.gridSystem.update();
    
    // TLDR: Rebuild plant visual layer for new season's plants
    this.plantRenderer.setSeason(this.currentSeason);
    this.plantRenderer.rebuildAllVisuals();

    // TLDR: Persist garden state after season start
    this.saveGardenState();
  }
  
  /** Apply seasonal visuals and hazard configuration to all systems */
  private applySeason(smooth = false, previousSeason?: Season): void {
    const seasonCfg = SEASON_CONFIG[this.currentSeason];
    const palette = getSeasonalPalette(this.currentSeason);

    if (smooth && this._ctx && previousSeason) {
      // Capture previous season's colors for smooth 2s crossfade
      const prevPalette = getSeasonalPalette(previousSeason);
      const prevCfg = SEASON_CONFIG[previousSeason];
      this.seasonTransitionFrom = {
        bg: prevPalette.background,
        tint: prevCfg.gridTint,
      };
      this.seasonTransitionTarget = {
        bg: palette.background,
        tint: seasonCfg.gridTint,
      };
      this.seasonTransitionElapsed = 0;
    } else if (this._ctx) {
      // Instant apply (first load)
      this._ctx.app.renderer.background.color = palette.background;
    }

    // Grid tint & seasonal soil
    this.gridSystem.setSeason(this.currentSeason);
    this.gridSystem.setSeasonalSoilColor(palette.soil);
    // TileRenderer seasonal palette
    this.tileRenderer.setSeason(this.currentSeason);
    // HUD season indicator
    this.hud.setSeason(this.currentSeason);
    // Ambient particles for season atmosphere
    this.startSeasonalAmbientParticles();
  }

  /** Start ambient particles matching the current season */
  private startSeasonalAmbientParticles(): void {
    if (!this._ctx) return;
    const w = this._ctx.app.screen.width;
    const h = this._ctx.app.screen.height;

    const palette = getSeasonalPalette(this.currentSeason);
    const cfg = palette.ambientParticles;
    
    this.particleSystem.startAmbientParticles({
      type: cfg.type,
      count: cfg.count,
      bounds: { width: w, height: h },
      colors: cfg.colors,
    });
  }
  
  /**
   * TLDR: Show "Season Over" banner with particles and darkening before score summary (#308)
   */
  private showSeasonEndBanner(): void {
    this.seasonEndBannerActive = true;
    this.seasonEndBannerElapsed = 0;

    const w = this._ctx.app.screen.width;
    const h = this._ctx.app.screen.height;
    const palette = getSeasonalPalette(this.currentSeason);
    const seasonCfg = SEASON_CONFIG[this.currentSeason];

    this.seasonEndBanner = new Container();

    // TLDR: Dark overlay that fades in
    const overlay = new Graphics();
    overlay.rect(0, 0, w, h);
    overlay.fill({ color: COLORS.BLACK, alpha: 0.7 });
    overlay.alpha = 0;
    overlay.label = 'bannerOverlay';
    this.seasonEndBanner.addChild(overlay);

    // TLDR: Season-themed accent line
    const accentLine = new Graphics();
    accentLine.rect(w * 0.15, h * 0.42, w * 0.7, 3);
    accentLine.fill({ color: palette.accent, alpha: 0.8 });
    accentLine.alpha = 0;
    accentLine.label = 'accentLine';
    this.seasonEndBanner.addChild(accentLine);

    // TLDR: Main "Season Over" text
    const bannerText = new Text({
      text: `${seasonCfg.emoji} Season Over`,
      style: {
        fontFamily: 'Arial',
        fontSize: 48,
        fill: UI_COLORS.TEXT_PRIMARY,
        fontWeight: 'bold',
        align: 'center',
      },
    });
    bannerText.anchor.set(0.5, 0.5);
    bannerText.x = w / 2;
    bannerText.y = h / 2 - 10;
    bannerText.alpha = 0;
    bannerText.label = 'bannerText';
    this.seasonEndBanner.addChild(bannerText);

    // TLDR: Season name subtitle
    const subtitleText = new Text({
      text: seasonCfg.displayName,
      style: {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: palette.accent.toString(16).padStart(6, '0').replace(/^/, '#'),
        align: 'center',
      },
    });
    subtitleText.anchor.set(0.5, 0.5);
    subtitleText.x = w / 2;
    subtitleText.y = h / 2 + 35;
    subtitleText.alpha = 0;
    subtitleText.label = 'subtitleText';
    this.seasonEndBanner.addChild(subtitleText);

    // TLDR: Bottom accent line
    const accentLine2 = new Graphics();
    accentLine2.rect(w * 0.15, h * 0.58, w * 0.7, 3);
    accentLine2.fill({ color: palette.accent, alpha: 0.8 });
    accentLine2.alpha = 0;
    accentLine2.label = 'accentLine2';
    this.seasonEndBanner.addChild(accentLine2);

    this.container.addChild(this.seasonEndBanner);

    // TLDR: Spawn celebration particles in seasonal colors
    const particleColors = palette.ambientParticles.colors;
    for (let i = 0; i < ANIMATION.SEASON_END_PARTICLE_COUNT; i++) {
      this.particleSystem.burst({
        x: Math.random() * w,
        y: h * 0.3 + Math.random() * h * 0.4,
        count: 1,
        speed: ANIMATION.SEASON_END_PARTICLE_SPEED + Math.random() * 40,
        lifetime: ANIMATION.SEASON_END_PARTICLE_LIFETIME + Math.random(),
        colors: particleColors as number[],
        size: ANIMATION.SEASON_END_PARTICLE_SIZE,
        gravity: -20 - Math.random() * 15,
        fadeOut: true,
        shrink: true,
      });
    }
  }

  /**
   * TLDR: Animate the season-end banner — fade in, hold, fade out, then show score summary (#308)
   */
  private updateSeasonEndBanner(dt: number): void {
    if (!this.seasonEndBanner) return;

    this.seasonEndBannerElapsed += dt;
    const fadeIn = ANIMATION.SEASON_END_BANNER_FADE_IN;
    const duration = ANIMATION.SEASON_END_BANNER_DURATION;
    const fadeOut = ANIMATION.SEASON_END_BANNER_FADE_OUT;
    const totalDuration = fadeIn + duration + fadeOut;

    const overlay = this.seasonEndBanner.getChildByLabel('bannerOverlay');
    const bannerText = this.seasonEndBanner.getChildByLabel('bannerText');
    const subtitleText = this.seasonEndBanner.getChildByLabel('subtitleText');
    const accentLine = this.seasonEndBanner.getChildByLabel('accentLine');
    const accentLine2 = this.seasonEndBanner.getChildByLabel('accentLine2');

    if (this.seasonEndBannerElapsed <= fadeIn) {
      // TLDR: Fade in phase
      const t = this.seasonEndBannerElapsed / fadeIn;
      const eased = t * t * (3 - 2 * t); // smoothstep
      if (overlay) overlay.alpha = eased;
      if (bannerText) bannerText.alpha = eased;
      if (subtitleText) subtitleText.alpha = eased * 0.8;
      if (accentLine) accentLine.alpha = eased;
      if (accentLine2) accentLine2.alpha = eased;
    } else if (this.seasonEndBannerElapsed <= fadeIn + duration) {
      // TLDR: Hold phase — everything fully visible
      if (overlay) overlay.alpha = 1;
      if (bannerText) bannerText.alpha = 1;
      if (subtitleText) subtitleText.alpha = 0.8;
      if (accentLine) accentLine.alpha = 1;
      if (accentLine2) accentLine2.alpha = 1;
    } else if (this.seasonEndBannerElapsed <= totalDuration) {
      // TLDR: Fade out phase
      const fadeOutElapsed = this.seasonEndBannerElapsed - fadeIn - duration;
      const t = 1 - fadeOutElapsed / fadeOut;
      if (overlay) overlay.alpha = t;
      if (bannerText) bannerText.alpha = t;
      if (subtitleText) subtitleText.alpha = t * 0.8;
      if (accentLine) accentLine.alpha = t;
      if (accentLine2) accentLine2.alpha = t;
    } else {
      // TLDR: Banner complete — clean up and show score summary
      this.seasonEndBannerActive = false;
      this.container.removeChild(this.seasonEndBanner);
      this.seasonEndBanner.destroy({ children: true });
      this.seasonEndBanner = null;
      this.showScoreSummary();
    }
  }

  private showScoreSummary(): void {
    // TLDR: Apply multi-season score multiplier before saving
    if (this.isMultiSeasonRun) {
      this.multiSeasonScoreAccumulator += this.scoringSystem.getScoreBreakdown().total;
    }

    // TLDR: Trigger save on run end — score is persisted via SaveManager
    const isNewRecord = this.scoringSystem.saveScore();
    const breakdown = this.scoringSystem.getScoreBreakdown();
    const milestone = this.scoringSystem.getCurrentMilestone();
    const personalBest = this.scoringSystem.getPersonalBest();
    const highScores = this.scoringSystem.getHighScores();

    // TLDR: Record run completion for unlock progression
    this.unlockSystem.recordRunCompleted();
    this.achievementSystem.onRunEnd();

    // TLDR: Collect harvested plants summary for ResultsScene
    const harvestedPlants = Array.from(this.harvestedSeeds.entries()).map(([plantId, count]) => {
      const config = this.plantSystem.getPlant(plantId)?.getConfig();
      return { name: config?.displayName || plantId, count };
    });

    // TLDR: Stage results data and transition to dedicated ResultsScene (#304)
    setResultsData({
      breakdown,
      milestone,
      personalBest,
      highScores,
      isNewRecord,
      harvestedPlants,
      newDiscoveries: Array.from(this.newDiscoveriesThisSeason),
      isMultiSeasonRun: this.isMultiSeasonRun,
    });

    this._ctx.sceneManager.transitionTo(SCENES.RESULTS, { type: 'fade' }).catch(console.error);

    // TLDR: Emit multi-season completion event
    if (this.isMultiSeasonRun && this.multiSeasonIndex >= SEASON_ORDER.length - 1) {
      eventBus.emit('multiseason:completed', {
        finalScore: this.multiSeasonScoreAccumulator,
        seasonsPlayed: SEASON_ORDER.length,
      });
    }
  }

  /**
   * TLDR: Advance to next season in multi-season run (#201)
   * Preserves plants/structures, resets day counter, transitions to next season.
   */
  private advanceMultiSeason(): void {
    const previousSeason = this.currentSeason;
    this.multiSeasonIndex++;
    this.currentSeason = SEASON_ORDER[this.multiSeasonIndex];

    // TLDR: Accumulate score from completed mini-season
    this.multiSeasonScoreAccumulator += this.scoringSystem.getScoreBreakdown().total;

    // TLDR: Emit transition event
    eventBus.emit('multiseason:transition', {
      fromSeason: previousSeason,
      toSeason: this.currentSeason,
      seasonIndex: this.multiSeasonIndex,
      totalSeasons: SEASON_ORDER.length,
    });

    // TLDR: Reset day counter for mini-season
    this.player.resetDay();

    // TLDR: Apply new season visuals (smooth 2s transition)
    this.applySeason(true, previousSeason);

    // TLDR: Reset hazard/weather systems for new season
    this.hazardSystem.reset(undefined, this.currentSeason);
    this.weatherSystem.reset(undefined, this.currentSeason);

    // TLDR: Set mini-season length (3 days per mini-season in multi-season mode)
    this.maxSeasonDays = MULTI_SEASON_DAYS + (this.gridSystem.hasStructureType(StructureType.GREENHOUSE) ? GREENHOUSE_BONUS_DAYS : 0);

    // TLDR: Update plant renderer for new season
    this.plantRenderer.setSeason(this.currentSeason);
    this.plantRenderer.rebuildAllVisuals();

    // TLDR: Update achievement system
    this.achievementSystem.setSeason(this.currentSeason);

    // TLDR: Show transition message
    this.showActionMessage(`🌍 Season ${this.multiSeasonIndex + 1}/${SEASON_ORDER.length}: ${SEASON_CONFIG[this.currentSeason].emoji} ${SEASON_CONFIG[this.currentSeason].displayName}`);

    this.gridSystem.update();
  }

  private restartRun(): void {
    // Full restart: clear encyclopedia and start fresh with a new season
    this.encyclopediaSystem.reset();
    this.startNewSeason();
    this.isPaused = false;
  }

  private showActionMessage(message: string): void {
    // TLDR: BUG-014 fix — route action messages to HUD hint system
    this.hud.setHint(message);
  }

  /**
   * TLDR: Handle rest action — skip remaining actions and advance to next day (#244)
   */
  private handleRestAction(): void {
    if (!this.player.hasActionsRemaining()) {
      return;
    }

    // TLDR: Execute rest via PlayerSystem
    this.playerSystem.rest();
    
    // TLDR: Visual feedback — update hint
    this.hud.setHint('🌙 You rest and prepare for tomorrow...');
  }

  /**
   * TLDR: BUG-001/008 — execute the selected tool on the player's current tile
   */
  private executeToolOnCurrentTile(): void {
    const selectedTool = this.player.getSelectedTool();
    if (!selectedTool) return;

    if (selectedTool === ToolType.SEED) {
      this.handleSeedPlanting();
      return;
    }

    // TLDR: Route harvest through PlantSystem so plant:harvested event fires
    if (selectedTool === ToolType.HARVEST) {
      this.handleHarvestAction();
      return;
    }

    const result = this.playerSystem.executeToolAction();
    if (result) {
      this.showActionMessage(result.message);
      this.gridSystem.update();

      // TLDR: Compost tool visual feedback — particle animation + event
      if (result.success && selectedTool === ToolType.COMPOST) {
        const pos = this.player.getGridPosition();
        const tile = this.grid.getTile(pos.row, pos.col);
        if (tile) {
          this.tileRenderer.playCompostAnimation(pos.row, pos.col);
          this.tileRenderer.refreshTileAt(pos.row, pos.col);
          eventBus.emit('compost:applied', {
            row: pos.row,
            col: pos.col,
            soilQualityBefore: tile.soilQuality - COMPOST_TOOL_BOOST,
            soilQualityAfter: tile.soilQuality,
          });
        }
      }
    }
  }

  /**
   * TLDR: BUG-001 — plant a seed on the player's current empty tile
   */
  private handleSeedPlanting(): void {
    const pos = this.player.getGridPosition();
    const tile = this.grid.getTile(pos.row, pos.col);

    if (!tile || !tile.isEmpty()) {
      this.showActionMessage('Can only plant on empty tiles');
      return;
    }
    if (!this.player.hasActionsRemaining()) {
      this.showActionMessage('No actions remaining');
      return;
    }

    // TLDR: Get first available seed from the run's seed pool
    const pool = this.seedSelectionSystem.getCurrentPool();
    if (!pool || pool.seeds.length === 0) {
      this.showActionMessage('No seeds available');
      return;
    }

    const seedConfig = pool.seeds[0];
    const plant = this.plantSystem.createPlant(seedConfig.id, pos.col, pos.row);
    if (plant) {
      tile.state = TileState.OCCUPIED;
      this.plants.set(plant.id, plant);
      this.player.consumeAction();

      eventBus.emit('action:consumed', {
        actionsRemaining: this.player.getActionsRemaining(),
        maxActions: this.player.getMaxActions(),
      });

      this.showActionMessage(`🌱 Planted ${seedConfig.displayName}!`);

      // TLDR: Auto-advance day when no actions remain
      if (!this.player.hasActionsRemaining()) {
        this.player.advanceDay();
        this.onDayAdvance();
      }

      this.gridSystem.update();
    }
  }

  /**
   * TLDR: Harvest a mature plant via PlantSystem so plant:harvested event fires
   */
  private handleHarvestAction(): { success: boolean; message: string } {
    const pos = this.player.getGridPosition();
    if (!this.player.hasActionsRemaining()) {
      this.showActionMessage('No actions remaining');
      return { success: false, message: 'No actions remaining' };
    }

    const result = this.plantSystem.harvestPlant(pos.col, pos.row);
    if (!result.success) {
      const msg = result.plantId ? 'Plant is not ready to harvest' : 'No plant to harvest here';
      this.showActionMessage(msg);
      return { success: false, message: msg };
    }

    // Clear the tile
    const tile = this.grid.getTile(pos.row, pos.col);
    if (tile) tile.state = TileState.EMPTY;

    // Track harvested seeds for results screen
    const prev = this.harvestedSeeds.get(result.plantId) || 0;
    this.harvestedSeeds.set(result.plantId, prev + result.seeds);

    this.player.consumeAction();
    eventBus.emit('action:consumed', {
      actionsRemaining: this.player.getActionsRemaining(),
      maxActions: this.player.getMaxActions(),
    });

    const msg = `Harvested! Got ${result.seeds} seeds`;
    this.showActionMessage(msg);

    // TLDR: Auto-advance day when no actions remain
    if (!this.player.hasActionsRemaining()) {
      this.player.advanceDay();
      this.onDayAdvance();
    }

    this.gridSystem.update();
    return { success: true, message: msg };
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

    // TLDR: Apply Rain Barrel auto-watering effect
    this.applyRainBarrelEffect();

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

    // TLDR: Show brief day advance summary (#241)
    this.showDayAdvanceSummary(day);
  }

  /**
   * TLDR: Determine current game phase based on game state (#241)
   */
  private determineGamePhase(): GamePhase {
    const actions = this.player.getActionsRemaining();
    const activePlants = Array.from(this.plants.values()).filter(p => p.active);
    const maturePlants = activePlants.filter(p => p.getState().growthStage === GrowthStage.MATURE);

    if (actions === 0) {
      return 'day_end';
    }
    if (maturePlants.length > 0) {
      return 'harvest';
    }
    if (activePlants.length > 0) {
      return 'tending';
    }
    return 'planting';
  }

  /**
   * TLDR: Get contextual hint based on current phase and actions (#250)
   */
  private getContextualHint(phase: GamePhase, actions: number): string {
    // TLDR: Show remaining actions hint when player has actions left
    if (actions > 1) {
      return `💡 You have ${actions} actions left! Keep planting, watering, or harvesting`;
    }
    if (actions === 1) {
      return `💡 Last action! Use it wisely — the day will advance after this`;
    }
    if (actions === 0) {
      return '⏰ No actions left — day will advance soon!';
    }
    
    // TLDR: Phase-specific hints (fallback if action count unclear)
    switch (phase) {
      case 'planting':
        return 'Select Seed tool and tap an empty tile to plant';
      case 'tending':
        return 'Select Watering Can and tap planted tiles to water';
      case 'harvest':
        return 'Tap mature plants (glowing) to harvest them!';
      case 'day_end':
        return '';
    }
  }

  /**
   * TLDR: Show brief day advance summary with clearer messaging (#250)
   */
  private showDayAdvanceSummary(day: number): void {
    const activePlants = Array.from(this.plants.values()).filter(p => p.active);
    const maturePlants = activePlants.filter(p => p.getState().growthStage === GrowthStage.MATURE);
    
    // TLDR: Clear, actionable message about what happened
    const parts: string[] = [`☀️ Day ${day} begins!`];
    
    if (activePlants.length > 0) {
      parts.push(`${activePlants.length} plant${activePlants.length > 1 ? 's' : ''} grew overnight`);
    }
    
    if (maturePlants.length > 0) {
      parts.push(`${maturePlants.length} ready to harvest! 🌾`);
    } else if (activePlants.length > 0) {
      parts.push('Keep watering to help them grow');
    } else {
      parts.push('Plant some seeds to get started! 🌱');
    }
    
    parts.push('You have 3 actions');
    
    this.showActionMessage(parts.join(' • '));
  }

  private handleTileClick(tile: Tile): void {
    // Handle pest removal
    if (tile.hasPest()) {
      // Get pest at this tile (x=col, y=row in grid coordinates)
      const pest = this.hazardSystem.getPestAt(tile.col, tile.row);
      if (pest) {
        const removed = this.hazardSystem.removePest(pest.id);
        if (removed) {
          // TLDR: Clear pest state from tile
          tile.state = TileState.OCCUPIED;
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

  /** TLDR: Toggle achievement gallery — updates entries from AchievementSystem */
  private toggleAchievementGallery(): void {
    if (this.achievementGallery.isVisible()) {
      this.achievementGallery.hide();
    } else {
      this.achievementGallery.setEntries(this.achievementSystem.getAllStates());
      this.achievementGallery.show();
    }
  }

  private updateInfoText(message: string): void {
    // TLDR: BUG-014 fix — route info messages to HUD hint system
    this.hud.setHint(message);
  }

  // TLDR: Sync HUD discovery counter with encyclopedia stats
  private updateHudDiscoveryCount(): void {
    const stats = this.encyclopediaSystem.getStats();
    this.hud.updateDiscoveryCount(stats.discovered, stats.total);
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
    // TLDR: Update touch controller (animates ripple feedback)
    this.touchController.update(delta);

    // Don't update game logic when paused
    if (this.isPaused) {
      return;
    }
    
    // TLDR: Update rest button enabled state based on actions remaining
    const hasActions = this.player.hasActionsRemaining();
    this.restButton.setEnabled(hasActions);
    
    // Update frame counter for day progress tracking
    this.frameCounter++;
    const framesPerDay = GAME.TARGET_FPS * 30; // 30 seconds per day
    const dayProgress = (this.frameCounter % framesPerDay) / framesPerDay;
    
    // Update player system (handles input and movement)
    this.playerSystem.update(delta);

    // TLDR: BUG-008 — execute pending tool action when player arrives at target tile
    if (this.pendingToolAction && !this.player.isMoving()) {
      const pos = this.player.getGridPosition();
      if (pos.row === this.pendingToolAction.row && pos.col === this.pendingToolAction.col) {
        this.executeToolOnCurrentTile();
      }
      this.pendingToolAction = null;
    }

    // Update plant system (advances growth)
    this.plantSystem.update(delta);
    
    // Update synergy system (recalculate synergies when needed)
    this.synergySystem.update(delta);

    // Update hazard system
    this.hazardSystem.update(delta);

    // TLDR: Update weather system
    this.weatherSystem.update(delta);

    this.weedSystem.update(delta);

    // Update grid system (re-renders if state changed)
    this.gridSystem.update();

    // Update discovery popup animation
    this.discoveryPopup.update(delta * 1000); // Convert to ms
    
    // TLDR: Update tutorial hint animation
    this.tutorialOverlay.update(delta * 1000);
    
    // Update score summary animation
    this.scoreSummary.update(delta * 1000);

    // TLDR: Update achievement notification animation
    this.achievementNotification.update(delta * 1000);

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
    this.hud.update(day, this.maxSeasonDays, dayProgress, actions, maxActions);
    
    // Update score display in HUD
    const scoreBreakdown = this.scoringSystem.getScoreBreakdown();
    const lastActionPoints = this.scoringSystem.getLastActionPoints();
    this.hud.updateScore(scoreBreakdown.total, lastActionPoints);
    
    // Clear last action points after 1 second
    if (lastActionPoints > 0) {
      setTimeout(() => this.scoringSystem.clearLastActionPoints(), 1000);
    }

    // Update selected tile info and plant info panel
    const selectedTile = this.gridSystem.getSelectedTile();
    if (selectedTile && !this.player.isMoving()) {
      const pos = this.player.getGridPosition();
      if (selectedTile.row !== pos.row || selectedTile.col !== pos.col) {
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

    // TLDR: Update HUD with grid info (size + structure count)
    this.hud.updateGridInfo(
      this.grid.config.rows,
      this.grid.config.cols,
      this.gridSystem.getStructures().length,
    );

    // TLDR: Phase tracking and contextual hints (#241)
    const phase = this.determineGamePhase();
    this.hud.setPhase(phase);
    this.hud.setHint(this.getContextualHint(phase, actions));
    this.hud.updatePhaseTransition(delta);

    // TLDR: Check for season end (maxSeasonDays reached)
    if (day >= this.maxSeasonDays && !this.daySummary.isVisible() && !this.scoreSummary.isVisible() && !this.seasonEndBannerActive) {
      if (this.isMultiSeasonRun && this.multiSeasonIndex < SEASON_ORDER.length - 1) {
        // TLDR: Multi-season — transition to next season instead of ending
        this.advanceMultiSeason();
      } else {
        this.showSeasonEndBanner();
      }
    }

    // TLDR: Update season-end banner animation (#308)
    if (this.seasonEndBannerActive) {
      this.updateSeasonEndBanner(delta);
    }
  }

  private setupAudioListeners(): void {
    // TLDR: Start ambient audio when scene initializes
    audioManager.startAmbient();

    // TLDR: Plant lifecycle sounds
    this.listenTo('plant:created', () => {
      audioManager.playSFX('PLANT');
    });

    this.listenTo('plant:watered', () => {
      audioManager.playSFX('WATER');
    });

    this.listenTo('plant:harvested', () => {
      audioManager.playSFX('HARVEST');
    });

    this.listenTo('plant:died', () => {
      audioManager.playSFX('WILT');
    });

    // TLDR: Pest sounds
    this.listenTo('pest:spawned', () => {
      audioManager.playSFX('PEST_APPEAR');
    });

    this.listenTo('pest:removed', () => {
      audioManager.playSFX('PEST_APPEAR');
    });

    // TLDR: Discovery chime
    this.listenTo('discovery:new', () => {
      audioManager.playSFX('HARVEST');
    });

    // TLDR: Day advancement chime
    this.listenTo('day:advanced', () => {
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

  // ─── Structure & Grid Expansion Methods ─────────────────────────────

  /**
   * TLDR: Expand the grid to a new size, preserving placed structures
   */
  private expandGrid(rows: number, cols: number): void {
    const oldStructures = this.gridSystem.getStructures().map((s) => s.toState());

    const newGrid = new GardenGrid({ rows, cols, tileSize: 64, padding: 4 });
    this.gridSystem.resize(newGrid);
    this.grid = newGrid;
    this.gridSystem.centerInViewport(this._ctx.app.screen.width, this._ctx.app.screen.height);
    this.gridSystem.setSeason(this.currentSeason);

    // TLDR: Re-place structures that still fit on the new grid
    for (const state of oldStructures) {
      if (state.row < rows && state.col < cols) {
        const structure = Structure.fromState(state);
        this.gridSystem.placeStructure(structure);
      }
    }

    eventBus.emit('grid:expanded', { rows, cols });
  }

  /**
   * TLDR: Load structures from SaveManager on scene init
   */
  private loadStructuresFromSave(): void {
    const gardenData = this.saveManager.loadGarden();
    if (!gardenData?.structures) return;

    for (const state of gardenData.structures) {
      if (state.row < this.grid.config.rows && state.col < this.grid.config.cols) {
        const structure = Structure.fromState(state);
        this.gridSystem.placeStructure(structure);
      }
    }

    // TLDR: Recalculate season length if Greenhouse is placed
    const baseDays = this.isMultiSeasonRun ? MULTI_SEASON_DAYS : 12;
    this.maxSeasonDays = baseDays + (this.gridSystem.hasStructureType(StructureType.GREENHOUSE) ? GREENHOUSE_BONUS_DAYS : 0);
  }

  /**
   * TLDR: Persist current grid size and structures
   */
  private saveGardenState(): void {
    this.saveManager.saveGarden({
      gridRows: this.grid.config.rows,
      gridCols: this.grid.config.cols,
      structures: this.gridSystem.getStructures().map((s) => s.toState()),
    });
  }

  /**
   * TLDR: Place a structure on the selected tile (click-to-place)
   */
  private tryPlaceStructure(row: number, col: number): boolean {
    if (!this.structurePlacementMode) return false;

    const tile = this.grid.getTile(row, col);
    if (!tile || !tile.isEmpty()) {
      this.updateInfoText('❌ Cannot place here — tile is not empty');
      return false;
    }

    const structureId = `struct_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const structure = new Structure(structureId, this.structurePlacementMode, col, row);
    const placed = this.gridSystem.placeStructure(structure);

    if (placed) {
      this.updateInfoText(`✅ ${STRUCTURE_CONFIGS[this.structurePlacementMode].displayName} placed!`);
      this.structurePlacementMode = null;

      // TLDR: Recalculate season length when Greenhouse placed
      const baseDays = this.isMultiSeasonRun ? MULTI_SEASON_DAYS : 12;
      this.maxSeasonDays = baseDays + (this.gridSystem.hasStructureType(StructureType.GREENHOUSE) ? GREENHOUSE_BONUS_DAYS : 0);

      this.saveGardenState();
      this.gridSystem.update();
      return true;
    }

    return false;
  }

  /**
   * TLDR: Enter structure placement mode (call from UI or keyboard)
   */
  public enterStructurePlacementMode(type: StructureType): void {
    if (!this.unlockSystem.isUnlocked(STRUCTURE_CONFIGS[type].unlockMilestoneId)) {
      this.updateInfoText(`🔒 ${STRUCTURE_CONFIGS[type].displayName} is locked`);
      return;
    }
    this.structurePlacementMode = type;
    this.updateInfoText(`📍 Click an empty tile to place ${STRUCTURE_CONFIGS[type].displayName}`);
  }

  /**
   * TLDR: Rain Barrel effect — auto-water adjacent tiles each day
   */
  private applyRainBarrelEffect(): void {
    const barrels = this.gridSystem.getStructuresByType(StructureType.RAIN_BARREL);
    for (const barrel of barrels) {
      const adjacent = this.getAdjacentPositions(barrel.row, barrel.col);
      let watered = 0;
      for (const pos of adjacent) {
        if (watered >= RAIN_BARREL_WATER_COUNT) break;
        const plant = this.plantSystem.getPlantAt(pos.col, pos.row);
        if (plant) {
          plant.water();
          watered++;
        }
      }
    }
  }

  /**
   * TLDR: Compost Bin effect — boost soil quality of adjacent tiles on plant death
   */
  private applyCompostEffect(plantId: string): void {
    const bins = this.gridSystem.getStructuresByType(StructureType.COMPOST_BIN);
    if (bins.length === 0) return;

    // TLDR: Find the dead plant position and check if a compost bin is adjacent
    const activePlants = this.plantSystem.getActivePlants();
    // Plant already removed — search all structures for adjacency to known death tiles
    for (const bin of bins) {
      const adjacent = this.getAdjacentPositions(bin.row, bin.col);
      for (const pos of adjacent) {
        const tile = this.grid.getTile(pos.row, pos.col);
        if (tile && !tile.hasStructure()) {
          tile.setSoilQuality(tile.soilQuality + COMPOST_SOIL_BOOST);
        }
      }
    }
  }

  /**
   * TLDR: Get orthogonally adjacent positions within grid bounds
   */
  private getAdjacentPositions(row: number, col: number): Array<{ row: number; col: number }> {
    const positions: Array<{ row: number; col: number }> = [];
    const offsets = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of offsets) {
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < this.grid.config.rows && c >= 0 && c < this.grid.config.cols) {
        positions.push({ row: r, col: c });
      }
    }
    return positions;
  }

  // ─── Visual Polish Methods ──────────────────────────────────────────

  /**
   * TLDR: Subscribe to EventBus for visual effects — growth, harvest, water, synergy
   */
  private setupVisualListeners(): void {
    this.listenTo('plant:created', (data) => {
      this.plantRenderer.createPlantVisual(data.plantId, data.x, data.y);
    });

    this.listenTo('plant:grew', (data) => {
      this.plantRenderer.animatePlantGrowth(data.plantId, data.stage);
    });

    this.listenTo('plant:matured', (data) => {
      this.triggerMaturityCelebration(data.plantId, data.plantConfigId);
    });

    this.listenTo('plant:watered', (data) => {
      this.triggerWaterRipple(data.x, data.y);
    });

    this.listenTo('plant:harvested', (data) => {
      this.triggerHarvestBurst(data.plantId, data.seeds);
      this.triggerPlantRemovalAnimation(data.plantId);
      this.triggerScreenShake();
      this.triggerScreenPulse();
    });

    this.listenTo('plant:died', (data) => {
      this.plantRenderer.removePlantVisual(data.plantId);
    });
    
    this.listenTo('score:updated', (data) => {
      this.triggerScoreText(data.lastAction);
    });

    this.listenTo('pest:removed', (data) => {
      this.triggerPestSquish(data.pestId);
    });

    this.listenTo('synergy:activated', (data) => {
      this.triggerSynergyGlow(data.x, data.y, data.synergyId);
    });

    this.listenTo('day:advanced', () => {
      this.triggerDaySkyLerp();
    });
  }

  /**
   * TLDR: Particle burst on harvest — colored by plant base color, with seed drops and floating text
   */
  private triggerHarvestBurst(plantConfigId: string, seeds: number): void {
    const visual = getPlantVisual(plantConfigId);
    const baseColor = visual?.baseColor ?? 0x81c784;
    const accentColor = visual?.accentColor ?? 0xa5d6a7;
    const colors = [baseColor, accentColor];

    // TLDR: Find position from any plant visual that no longer has a backing plant
    let burstX = this._ctx.app.screen.width / 2;
    let burstY = this._ctx.app.screen.height / 2;

    const orphan = this.plantRenderer.findOrphanedPlantPosition();
    if (orphan) {
      const gridPos = this.gridSystem.getContainer().position;
      burstX = gridPos.x + orphan.x;
      burstY = gridPos.y + orphan.y;
      this.plantRenderer.removePlantVisual(orphan.plantId);
    }

    // Main color burst
    this.particleSystem.burst({
      x: burstX,
      y: burstY,
      count: ANIMATION.HARVEST_PARTICLE_COUNT,
      speed: ANIMATION.HARVEST_PARTICLE_SPEED,
      lifetime: ANIMATION.HARVEST_PARTICLE_LIFETIME,
      colors,
      size: ANIMATION.HARVEST_PARTICLE_SIZE,
    });

    // Seed drop particles with oval shape and gravity
    this.particleSystem.burst({
      x: burstX,
      y: burstY - 8,
      count: ANIMATION.HARVEST_SEED_PARTICLE_COUNT,
      speed: 60,
      lifetime: 0.9,
      colors: [0x8d6e63, 0x795548],
      size: 3,
      gravity: 300,
      fadeOut: true,
      shrink: false,
    });

    // Floating "+X Seeds" text above harvest
    this.particleSystem.floatingText({
      x: burstX,
      y: burstY - 20,
      text: `+${seeds} Seeds`,
      color: '#fff9c4',
      fontSize: 14,
      duration: 1.2,
      riseSpeed: 30,
    });
  }

  /**
   * TLDR: Quick shrink-to-nothing animation on plant removal (100ms)
   */
  private triggerPlantRemovalAnimation(_plantConfigId: string): void {
    this.plantRenderer.animateOrphanedRemoval();
  }

  /**
   * TLDR: Floating score text on harvest (+15 pts)
   */
  private triggerScoreText(points: number): void {
    // Find last harvested plant position
    let textX = this._ctx.app.screen.width / 2;
    let textY = this._ctx.app.screen.height / 2;

    const orphanPos = this.plantRenderer.findOrphanedPlantPosition();
    if (orphanPos) {
      const gridPos = this.gridSystem.getContainer().position;
      textX = gridPos.x + orphanPos.x + 20;
      textY = gridPos.y + orphanPos.y - 35;
    }

    this.particleSystem.floatingText({
      x: textX,
      y: textY,
      text: `+${points} pts`,
      color: '#ffd54f',
      fontSize: 16,
      duration: 1.5,
      riseSpeed: 20,
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
   * TLDR: Full-screen white flash on harvest for impact
   */
  private triggerScreenPulse(): void {
    const overlay = new Graphics();
    overlay.rect(0, 0, this._ctx.app.screen.width, this._ctx.app.screen.height);
    overlay.fill({ color: 0xffffff, alpha: ANIMATION.HARVEST_PULSE_OPACITY });
    this.container.addChild(overlay);

    this.animationSystem.tween(
      overlay as unknown as Record<string, unknown>,
      { alpha: 0 },
      ANIMATION.HARVEST_PULSE_DURATION,
      {
        easing: Easing.easeOut,
        onComplete: () => {
          this.container.removeChild(overlay);
          overlay.destroy();
        },
      },
    );
  }

  /**
   * TLDR: Concentric water ripple at tile position with droplets and plant brightness
   */
  private triggerWaterRipple(col: number, row: number): void {
    const tilePos = this.grid.getTilePosition(row, col);
    const tileSize = this.grid.config.tileSize;
    const gridPos = this.gridSystem.getContainer().position;

    const cx = gridPos.x + tilePos.x + tileSize / 2;
    const cy = gridPos.y + tilePos.y + tileSize / 2;

    this.particleSystem.ripple({
      x: cx,
      y: cy,
      rings: ANIMATION.WATER_RIPPLE_RINGS,
      maxRadius: ANIMATION.WATER_RIPPLE_MAX_RADIUS,
      duration: ANIMATION.WATER_RIPPLE_DURATION,
      color: ANIMATION.WATER_RIPPLE_COLOR,
    });

    this.particleSystem.waterDroplets({
      x: cx,
      y: cy,
      count: ANIMATION.WATER_DROPLET_COUNT,
      color: ANIMATION.WATER_RIPPLE_COLOR,
      size: 2,
      spread: tileSize * 0.4,
    });

    // Soil darkening overlay (temporary moisture visual)
    const tile = this.grid.getTile(row, col);
    if (tile) {
      tile.setMoisture(100);
      
      // Create darkening overlay
      const overlay = new Graphics();
      overlay.rect(tilePos.x, tilePos.y, tileSize, tileSize);
      overlay.fill({ color: 0x000000, alpha: 0.25 });
      this.gridSystem.getContainer().addChild(overlay);
      
      // Fade out soil darkening over 2 seconds
      this.animationSystem.tween(
        overlay as unknown as Record<string, unknown>,
        { alpha: 0 },
        2.0,
        {
          easing: Easing.easeOut,
          onComplete: () => {
            this.gridSystem.getContainer().removeChild(overlay);
            overlay.destroy();
            tile.setMoisture(50);
          },
        },
      );
    }

    // Brief brightness pulse on the plant visual
    const plant = this.plantSystem.getPlantAt(col, row);
    if (plant) {
      const pVisual = this.plantRenderer.getPlantVisual(plant.id);
      if (pVisual) {
        const originalScale = pVisual.scale.x;
        
        // Scale pulse (brightness effect via scale)
        this.animationSystem.tween(
          pVisual.scale as unknown as Record<string, unknown>,
          { x: originalScale * 1.15, y: originalScale * 1.15 },
          0.15,
          {
            easing: Easing.easeOut,
            onComplete: () => {
              this.animationSystem.tween(
                pVisual.scale as unknown as Record<string, unknown>,
                { x: originalScale, y: originalScale },
                0.25,
                { easing: Easing.elasticOut },
              );
            },
          },
        );
        
        // Saturation/brightness boost via alpha pulse
        const originalAlpha = pVisual.alpha;
        this.animationSystem.tween(
          pVisual as unknown as Record<string, unknown>,
          { alpha: Math.min(1, originalAlpha * 1.2) },
          0.2,
          {
            easing: Easing.easeOut,
            onComplete: () => {
              this.animationSystem.tween(
                pVisual as unknown as Record<string, unknown>,
                { alpha: originalAlpha },
                0.3,
                { easing: Easing.easeOut },
              );
            },
          },
        );
      }
    }
  }

  /**
   * TLDR: Squish particles and glow when pest is removed
   */
  private triggerPestSquish(pestId: string): void {
    const hazard = this.hazardSystem.getHazard(pestId);
    if (!hazard) return;

    const tilePos = this.grid.getTilePosition(hazard.y, hazard.x);
    const tileSize = this.grid.config.tileSize;
    const gridPos = this.gridSystem.getContainer().position;

    this.particleSystem.burst({
      x: gridPos.x + tilePos.x + tileSize / 2,
      y: gridPos.y + tilePos.y + tileSize / 2,
      count: ANIMATION.PEST_SQUISH_PARTICLE_COUNT,
      speed: 80,
      lifetime: 0.4,
      colors: [ANIMATION.PEST_SQUISH_COLOR],
      size: 3,
      gravity: 200,
      fadeOut: true,
      shrink: true,
    });

    const pestPlant = this.plantSystem.getPlantAt(hazard.x, hazard.y);
    if (pestPlant) {
      this.particleSystem.glow({
        x: gridPos.x + tilePos.x + tileSize / 2,
        y: gridPos.y + tilePos.y + tileSize / 2,
        radius: 18,
        color: 0x66bb6a,
        pulseSpeed: 3.0,
        minAlpha: 0.3,
        maxAlpha: 0.7,
        duration: 0.5,
      });
    }
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
   * TLDR: Full maturity celebration — bounce, particles, glow, floating text
   */
  private triggerMaturityCelebration(plantId: string, plantConfigId: string): void {
    const visual = getPlantVisual(plantConfigId);
    const baseColor = visual?.baseColor ?? 0x81c784;
    const accentColor = visual?.accentColor ?? 0xa5d6a7;

    const pVisual = this.plantRenderer.getPlantVisual(plantId);
    if (!pVisual) return;

    const gridPos = this.gridSystem.getContainer().position;
    const cx = gridPos.x + pVisual.x;
    const cy = gridPos.y + pVisual.y;

    // Pop/bounce animation on sprite (scale 1.3x → 1.0 over 0.3s)
    this.animationSystem.scaleBounce(
      pVisual.scale as unknown as Record<string, unknown>,
      ANIMATION.MATURE_BOUNCE_PEAK_SCALE,
      1.0,
      ANIMATION.MATURE_BOUNCE_DURATION,
    );

    // Sparkle particle burst matching plant colors
    this.particleSystem.burst({
      x: cx,
      y: cy,
      count: ANIMATION.MATURE_PARTICLE_COUNT,
      speed: ANIMATION.MATURE_PARTICLE_SPEED,
      lifetime: ANIMATION.MATURE_PARTICLE_LIFETIME,
      colors: [baseColor, accentColor, 0xffffff],
      size: ANIMATION.MATURE_PARTICLE_SIZE,
      gravity: -20,
      fadeOut: true,
      shrink: true,
    });

    // Persistent pulsing glow (cleared on harvest via removePlantVisual)
    this.plantRenderer.addMaturityGlow(plantId, accentColor);

    // Floating "✨ Ready!" text
    this.particleSystem.floatingText({
      x: cx,
      y: cy - 20,
      text: '✨ Ready!',
      color: '#fff9c4',
      fontSize: ANIMATION.MATURE_FLOATING_TEXT_SIZE,
      duration: ANIMATION.MATURE_FLOATING_TEXT_DURATION,
      riseSpeed: ANIMATION.MATURE_FLOATING_TEXT_RISE_SPEED,
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
    
    // TLDR: Trigger star twinkle during night phase (days 6-12 in cycle)
    const isNight = (day % 12) >= 6;
    if (isNight) {
      this.triggerStarTwinkle();
    }
  }
  
  /**
   * TLDR: Random twinkling stars during night phase
   */
  private triggerStarTwinkle(): void {
    const starCount = 8 + Math.floor(Math.random() * 5);
    const screenW = this._ctx.app.screen.width;
    const screenH = this._ctx.app.screen.height;
    
    for (let i = 0; i < starCount; i++) {
      const x = Math.random() * screenW;
      const y = Math.random() * (screenH * 0.4); // Top 40% of screen
      const delay = Math.random() * 0.5;
      
      setTimeout(() => {
        this.particleSystem.glow({
          x,
          y,
          radius: 2 + Math.random() * 2,
          color: 0xffffff,
          pulseSpeed: 2.0 + Math.random() * 2.0,
          minAlpha: 0.3,
          maxAlpha: 0.9,
          duration: 1.5 + Math.random() * 1.0,
        });
      }, delay * 1000);
    }
  }







  /**
   * TLDR: Per-frame visual updates — idle sway, screen shake, sky lerp, pest crawl
   */
  private updateVisuals(delta: number): void {
    const dt = delta;
    const time = performance.now() / 1000;

    this.animationSystem.update(delta);
    this.particleSystem.update(delta);
    this.plantRenderer.update(delta);
    this.tileRenderer.update(delta);

    // TLDR: Smooth seasonal color transition (2s crossfade)
    if (this.seasonTransitionFrom && this.seasonTransitionTarget) {
      this.seasonTransitionElapsed += dt;
      const t = Math.min(1, this.seasonTransitionElapsed / this.SEASON_TRANSITION_DURATION);
      const eased = t * t * (3 - 2 * t); // smoothstep

      this._ctx.app.renderer.background.color = lerpColor(
        this.seasonTransitionFrom.bg,
        this.seasonTransitionTarget.bg,
        eased,
      );
      this.gridSystem.getContainer().tint = lerpColor(
        this.seasonTransitionFrom.tint,
        this.seasonTransitionTarget.tint,
        eased,
      );

      if (t >= 1) {
        this.seasonTransitionFrom = null;
        this.seasonTransitionTarget = null;
      }
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

  // ── Test hook getters (Playwright integration) ────────────────────────

  /** TLDR: Select a tool by string name for Playwright test hooks (#284) */
  public selectTestTool(tool: string): void {
    this.player.selectTool(tool as ToolType);
  }

  /** TLDR: Execute the selected tool on the player's current tile for Playwright (#299) */
  public performTestAction(): { success: boolean; message: string } {
    const selectedTool = this.player.getSelectedTool();
    if (!selectedTool) return { success: false, message: 'No tool selected' };
    if (!this.player.hasActionsRemaining()) return { success: false, message: 'No actions remaining' };

    if (selectedTool === ToolType.SEED) {
      const pos = this.player.getGridPosition();
      const tile = this.grid.getTile(pos.row, pos.col);
      if (!tile || !tile.isEmpty()) return { success: false, message: 'Tile not empty' };
      this.handleSeedPlanting();
      return { success: true, message: 'Planted seed' };
    }

    // TLDR: Route harvest through PlantSystem so plant:harvested event fires
    if (selectedTool === ToolType.HARVEST) {
      const harvestResult = this.handleHarvestAction();
      return harvestResult;
    }

    const result = this.playerSystem.executeToolAction();
    if (result) {
      this.showActionMessage(result.message);
      this.gridSystem.update();
      return { success: result.success, message: result.message };
    }
    return { success: false, message: 'No result' };
  }

  /** TLDR: Move player to a tile instantly for Playwright (#299) */
  public moveTestPlayer(row: number, col: number): void {
    this.player.setGridPosition(row, col);
  }

  /** TLDR: Trigger rest action for Playwright (#299) */
  public performTestRest(): boolean {
    if (!this.player.hasActionsRemaining()) return false;
    this.handleRestAction();
    return true;
  }

  /** TLDR: Return player state snapshot for Playwright test hooks */
  public getTestPlayerState(): {
    day: number;
    actionsRemaining: number;
    maxActions: number;
    selectedTool: string | null;
    gridPosition: { row: number; col: number };
    row: number;
    col: number;
    isMoving: boolean;
  } {
    const pos = this.player.getGridPosition();
    return {
      day: this.player.getCurrentDay(),
      actionsRemaining: this.player.getActionsRemaining(),
      maxActions: this.player.getMaxActions(),
      selectedTool: this.player.getSelectedTool(),
      gridPosition: pos,
      row: pos.row,
      col: pos.col,
      isMoving: this.player.isMoving(),
    };
  }

  /** TLDR: Return grid state snapshot for Playwright test hooks */
  public getTestGridState(): {
    rows: number;
    cols: number;
    tiles: Array<{ row: number; col: number; state: string; hasPlant: boolean }>;
  } {
    return {
      rows: this.grid.config.rows,
      cols: this.grid.config.cols,
      tiles: this.grid.getAllTiles().map((t) => ({
        row: t.row,
        col: t.col,
        state: t.state,
        hasPlant: t.isOccupied(),
      })),
    };
  }

  /** TLDR: Return active plant count for Playwright test hooks */
  public getTestPlantCount(): number {
    return Array.from(this.plants.values()).filter((p) => p.active).length;
  }

  /** TLDR: Return active plant data for Playwright test hooks */
  public getTestActivePlants(): Array<{
    id: string;
    x: number;
    y: number;
    growthStage: string;
    configId: string;
  }> {
    return Array.from(this.plants.values())
      .filter((p) => p.active)
      .map((p) => ({
        id: p.id,
        x: p.x,
        y: p.y,
        growthStage: p.getGrowthStage(),
        configId: p.getConfig().id,
      }));
  }

  /** TLDR: Return screen coordinates for a tile center — accounts for grid container position and scale */
  public getTestTileScreenPosition(row: number, col: number): { x: number; y: number } {
    const container = this.gridSystem.getContainer();
    const { tileSize } = this.grid.config;

    // TLDR: Tile local position (center of tile) + container world transform
    const localX = col * tileSize + tileSize / 2;
    const localY = row * tileSize + tileSize / 2;

    const worldX = container.x + localX * (container.scale?.x ?? 1);
    const worldY = container.y + localY * (container.scale?.y ?? 1);

    return { x: Math.round(worldX), y: Math.round(worldY) };
  }

  /** TLDR: Return current seed pool config IDs for Playwright test hooks */
  public getTestSeedPool(): string[] {
    const pool = this.seedSelectionSystem.getCurrentPool();
    if (!pool) return [];
    return pool.seeds.map((s) => s.id);
  }

  destroy(): void {
    audioManager.stopAmbient();
    window.removeEventListener('keydown', this.boundOnKeyDown);
    window.removeEventListener('resize', this.boundOnResize);

    // TLDR: Clean up season-end banner if active
    if (this.seasonEndBanner) {
      this.seasonEndBanner.destroy({ children: true });
      this.seasonEndBanner = null;
      this.seasonEndBannerActive = false;
    }

    // TLDR: Remove all EventBus listeners to prevent accumulation across scene re-entries
    this.eventCleanups.forEach(cleanup => cleanup());
    this.eventCleanups = [];

    this.touchController.destroy();
    this.hideOrientationHint();
    this.animationSystem.destroy();
    this.particleSystem.destroy();
    this.plantRenderer.destroy();
    this.tileRenderer.destroy();
    this.gridSystem.destroy();
    this.playerSystem.destroy();
    this.plantSystem.destroy();
    this.hazardSystem.destroy();
    this.weatherSystem.destroy();
    this.weedSystem.destroy();
    this.scoringSystem.destroy();
    this.synergySystem.destroy();
    this.unlockSystem.destroy();
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
    this.achievementSystem.destroy();
    this.achievementNotification.destroy();
    this.achievementGallery.destroy();
    this.plants.clear();
    this.shakeContainer.destroy({ children: true });
    this.container = new Container();
  }
}
