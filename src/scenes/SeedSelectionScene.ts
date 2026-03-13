import { Container, Graphics, Text } from 'pixi.js';
import type { Scene, SceneContext } from '../core';
import { SeedPacketDisplay } from '../ui/SeedPacketDisplay';
import { SeedSelectionSystem, SeedPool } from '../systems/SeedSelectionSystem';
import { EncyclopediaSystem } from '../systems/EncyclopediaSystem';
import { COLORS, SCENES } from '../config';
import { PlantConfig } from '../entities/Plant';

/**
 * TLDR: Pre-run seed selection scene
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
  private boundOnKeyDown!: (e: KeyboardEvent) => void;

  constructor(
    seedSelectionSystem: SeedSelectionSystem,
    encyclopediaSystem: EncyclopediaSystem
  ) {
    this.seedSelectionSystem = seedSelectionSystem;
    this.encyclopediaSystem = encyclopediaSystem;
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

  private startGarden(ctx: SceneContext): void {
    // Store seed pool for garden scene to access
    if (this.seedPool) {
      // TODO: Pass seed pool to GardenScene via shared state or event
      // For now, seeds are available via SeedSelectionSystem.getCurrentPool()
    }

    ctx.sceneManager.transitionTo(SCENES.GARDEN, { duration: 0.6 }).catch(console.error);
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

    this.container.destroy({ children: true });
  }
}
