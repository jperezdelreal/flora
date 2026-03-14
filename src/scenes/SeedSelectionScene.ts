import { Container, Graphics, Text } from 'pixi.js';
import type { Scene, SceneContext } from '../core';
import { SeedPacketDisplay } from '../ui/SeedPacketDisplay';
import { ModifierSelector } from '../ui/ModifierSelector';
import { SeedSelectionSystem, SeedPool } from '../systems/SeedSelectionSystem';
import { DailyChallengeSystem } from '../systems/DailyChallengeSystem';
import { EncyclopediaSystem } from '../systems/EncyclopediaSystem';
import { COLORS, SCENES } from '../config';

/**
 * TLDR: Pre-run seed selection scene with daily challenge toggle and modifier cards
 * Displays randomized seed pool for player review before starting garden
 * Provides strategic preview of available plants for run planning
 */
export class SeedSelectionScene implements Scene {
  readonly name = 'seed-selection';
  private container = new Container();
  private seedPackets: SeedPacketDisplay[] = [];
  private seedPool: SeedPool | null = null;
  private seedSelectionSystem: SeedSelectionSystem;
  private encyclopediaSystem: EncyclopediaSystem;
  private dailyChallengeSystem: DailyChallengeSystem;
  private modifierSelector: ModifierSelector | null = null;
  private boundOnKeyDown!: (e: KeyboardEvent) => void;
  private isDailyMode = false;

  constructor(
    seedSelectionSystem: SeedSelectionSystem,
    encyclopediaSystem: EncyclopediaSystem,
    dailyChallengeSystem: DailyChallengeSystem,
  ) {
    this.seedSelectionSystem = seedSelectionSystem;
    this.encyclopediaSystem = encyclopediaSystem;
    this.dailyChallengeSystem = dailyChallengeSystem;
  }

  async init(ctx: SceneContext): Promise<void> {
    const { app } = ctx;
    const sceneManager = app.stage.children[0] as Container;
    sceneManager.addChild(this.container);

    const cx = app.screen.width / 2;

    // Background
    const bg = new Graphics();
    bg.rect(0, 0, app.screen.width, app.screen.height);
    bg.fill({ color: COLORS.DARK_GREEN });
    this.container.addChild(bg);

    // Title
    const title = new Text({
      text: '🌱 Seed Selection',
      style: {
        fontFamily: 'Arial',
        fontSize: 36,
        fill: '#c8e6c9',
        fontWeight: 'bold',
        align: 'center',
      },
    });
    title.anchor.set(0.5);
    title.x = cx;
    title.y = 40;
    this.container.addChild(title);

    // Subtitle
    const subtitle = new Text({
      text: 'These seeds are available for this run',
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: '#88d498',
        align: 'center',
      },
    });
    subtitle.anchor.set(0.5);
    subtitle.x = cx;
    subtitle.y = 80;
    this.container.addChild(subtitle);

    // Generate seed pool
    const unlockedPlantIds = this.encyclopediaSystem.getDiscoveredPlantIds();
    const runSeed = Date.now();
    this.seedPool = this.seedSelectionSystem.generatePool(unlockedPlantIds, {
      minSeeds: 4,
      maxSeeds: 6,
      runSeed,
    });

    // TLDR: Store the current seed for potential daily override
    this.dailyChallengeSystem.setSeed(runSeed, false);
    this.isDailyMode = false;

    // Display seed packets
    const packetSpacing = 180;
    const startX = cx - ((this.seedPool.seeds.length - 1) * packetSpacing) / 2;
    const startY = 130;

    for (let i = 0; i < this.seedPool.seeds.length; i++) {
      const seed = this.seedPool.seeds[i];
      const packet = new SeedPacketDisplay(seed);
      packet.getContainer().x = startX + i * packetSpacing;
      packet.getContainer().y = startY;
      this.container.addChild(packet.getContainer());
      this.seedPackets.push(packet);
    }

    // TLDR: Daily Challenge button
    const dailyButton = new Graphics();
    dailyButton.roundRect(0, 0, 260, 44, 10);
    dailyButton.fill({ color: 0x1a3a1a, alpha: 0.9 });
    dailyButton.stroke({ color: 0xffd700, width: 2 });
    dailyButton.x = cx - 130;
    dailyButton.y = startY + 210;
    dailyButton.eventMode = 'static';
    dailyButton.cursor = 'pointer';
    this.container.addChild(dailyButton);

    const todayStr = DailyChallengeSystem.todayDateString();
    const dailyLabel = new Text({
      text: `📅 Today's Challenge — ${todayStr}`,
      style: {
        fontFamily: 'Arial',
        fontSize: 15,
        fill: '#ffd700',
        fontWeight: 'bold',
        align: 'center',
      },
    });
    dailyLabel.anchor.set(0.5);
    dailyLabel.x = cx;
    dailyLabel.y = startY + 232;
    this.container.addChild(dailyLabel);

    dailyButton.on('pointerdown', () => {
      this.activateDailyMode(ctx, unlockedPlantIds, cx, startY);
    });

    // TLDR: Modifier selector cards
    this.modifierSelector = new ModifierSelector();
    const modContainer = this.modifierSelector.getContainer();
    modContainer.x = cx;
    modContainer.y = startY + 270;
    this.container.addChild(modContainer);

    // TLDR: Modifier heading
    const modLabel = new Text({
      text: 'Run Modifiers (optional)',
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: '#88d498',
        align: 'center',
      },
    });
    modLabel.anchor.set(0.5);
    modLabel.x = cx;
    modLabel.y = startY + 255;
    this.container.addChild(modLabel);

    // Run seed info (for testing/debugging determinism)
    const runSeedText = new Text({
      text: `Run Seed: ${runSeed}`,
      style: {
        fontFamily: 'Courier New, monospace',
        fontSize: 12,
        fill: '#666666',
        align: 'center',
      },
    });
    runSeedText.anchor.set(0.5);
    runSeedText.x = cx;
    runSeedText.y = app.screen.height - 80;
    this.container.addChild(runSeedText);

    // Instructions
    const instructions = new Text({
      text: 'Press SPACE or ENTER to begin your garden',
      style: {
        fontFamily: 'Arial',
        fontSize: 18,
        fill: '#c8e6c9',
        fontWeight: 'bold',
        align: 'center',
      },
    });
    instructions.anchor.set(0.5);
    instructions.x = cx;
    instructions.y = app.screen.height - 40;
    this.container.addChild(instructions);

    // Keyboard listener (following GardenScene pattern for cleanup)
    this.boundOnKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        this.startGarden(ctx);
      }
    };
    window.addEventListener('keydown', this.boundOnKeyDown);
  }

  /**
   * TLDR: Switch to daily challenge mode — regenerate pool with daily seed and lock modifiers
   */
  private activateDailyMode(
    _ctx: SceneContext,
    unlockedPlantIds: string[],
    cx: number,
    startY: number,
  ): void {
    if (this.isDailyMode) return;
    this.isDailyMode = true;

    const challenge = this.dailyChallengeSystem.getDailyChallenge();
    this.dailyChallengeSystem.setSeed(challenge.seed, true);
    this.dailyChallengeSystem.setActiveModifiers(challenge.modifiers);

    // TLDR: Regenerate pool with daily seed
    this.seedPool = this.seedSelectionSystem.generatePool(unlockedPlantIds, {
      minSeeds: 4,
      maxSeeds: 6,
      runSeed: challenge.seed,
    });

    // TLDR: Refresh seed packet visuals
    for (const pkt of this.seedPackets) {
      pkt.destroy();
    }
    this.seedPackets = [];

    if (this.seedPool) {
      const packetSpacing = 180;
      const pStartX = cx - ((this.seedPool.seeds.length - 1) * packetSpacing) / 2;
      for (let i = 0; i < this.seedPool.seeds.length; i++) {
        const seed = this.seedPool.seeds[i];
        const packet = new SeedPacketDisplay(seed);
        packet.getContainer().x = pStartX + i * packetSpacing;
        packet.getContainer().y = startY;
        this.container.addChild(packet.getContainer());
        this.seedPackets.push(packet);
      }
    }

    // TLDR: Set and lock modifiers to daily preset
    if (this.modifierSelector) {
      this.modifierSelector.setActiveIds(challenge.modifiers);
      this.modifierSelector.setLocked(true);
    }
  }

  private startGarden(ctx: SceneContext): void {
    // TLDR: Apply selected modifiers before transitioning
    if (this.modifierSelector && !this.isDailyMode) {
      this.dailyChallengeSystem.setActiveModifiers(
        this.modifierSelector.getActiveIds(),
      );
    }

    // Store seed pool for garden scene to access
    if (this.seedPool) {
      // TLDR: Seeds available via SeedSelectionSystem.getCurrentPool()
    }

    ctx.sceneManager.transitionTo(SCENES.GARDEN, { type: 'fade' }).catch(console.error);
  }

  update(_dt: number, _ctx: SceneContext): void {
    // No per-frame updates needed
  }

  resize?(width: number, height: number): void {
    // Handle resize if needed
  }

  destroy(): void {
    // Cleanup keyboard listener (following GardenScene pattern)
    window.removeEventListener('keydown', this.boundOnKeyDown);

    // Cleanup seed packets
    for (const packet of this.seedPackets) {
      packet.destroy();
    }
    this.seedPackets = [];

    if (this.modifierSelector) {
      this.modifierSelector.destroy();
      this.modifierSelector = null;
    }

    this.container.destroy({ children: true });
  }
}
