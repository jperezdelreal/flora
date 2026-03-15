import { Container, Graphics, Text } from 'pixi.js';
import type { Scene, SceneContext } from '../core';
import { SeedPacketDisplay } from '../ui/SeedPacketDisplay';
import { ModifierSelector } from '../ui/ModifierSelector';
import { SeedSelectionSystem, SeedPool } from '../systems/SeedSelectionSystem';
import { DailyChallengeSystem } from '../systems/DailyChallengeSystem';
import { EncyclopediaSystem } from '../systems/EncyclopediaSystem';
import { audioManager } from '../systems/AudioManager';
import { COLORS, SCENES } from '../config';
import { SEASON_CONFIG, getRandomSeason } from '../config/seasons';
import type { Season } from '../config/seasons';

/** Y coordinate where seed packets begin */
const PACKET_START_Y = 98;

/**
 * TLDR: Redesigned pre-run seed selection scene
 * Shows season indicator, responsive seed packets, daily challenge with explanation,
 * modifier cards, and a prominent clickable Start Season button.
 */
export class SeedSelectionScene implements Scene {
  readonly name = 'seed-selection';
  private container = new Container();
  private bgLayer = new Container();
  private contentLayer = new Container();
  private packetContainer = new Container();
  private seedPackets: SeedPacketDisplay[] = [];
  private seedPool: SeedPool | null = null;
  private seedSelectionSystem: SeedSelectionSystem;
  private encyclopediaSystem: EncyclopediaSystem;
  private dailyChallengeSystem: DailyChallengeSystem;
  private modifierSelector: ModifierSelector | null = null;
  private boundOnKeyDown!: (e: KeyboardEvent) => void;
  private isDailyMode = false;
  private currentSeason: Season = 'spring' as Season;
  private screenWidth = 800;
  private screenHeight = 600;

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

    this.screenWidth = app.screen.width;
    this.screenHeight = app.screen.height;
    const w = this.screenWidth;
    const h = this.screenHeight;
    const cx = w / 2;

    this.currentSeason = getRandomSeason();
    const seasonCfg = SEASON_CONFIG[this.currentSeason];

    this.container.addChild(this.bgLayer);
    this.container.addChild(this.contentLayer);
    this.contentLayer.addChild(this.packetContainer);

    // ── Warm background (cozy gradient with soft hills) ──
    this.buildBackground(w, h);

    // ── Season indicator bar (warm, inviting) ──
    const seasonBar = new Graphics();
    seasonBar.roundRect(cx - 160, 12, 320, 42, 16);
    seasonBar.fill({ color: 0xfff8e7, alpha: 0.95 }); // Warm cream
    seasonBar.stroke({ color: seasonCfg.backgroundColor, width: 3 });
    this.contentLayer.addChild(seasonBar);

    const seasonLabel = new Text({
      text: `${seasonCfg.emoji}  ${seasonCfg.displayName} Season`,
      style: {
        fontFamily: 'Georgia, serif',
        fontSize: 20,
        fill: '#4a7a4a',
        fontWeight: 'bold',
        align: 'center',
      },
    });
    seasonLabel.anchor.set(0.5);
    seasonLabel.x = cx;
    seasonLabel.y = 33;
    this.contentLayer.addChild(seasonLabel);

    // ── Title (larger, clearer) ──
    const title = new Text({
      text: '🌱 Choose Your Seeds',
      style: {
        fontFamily: 'Georgia, serif',
        fontSize: 32,
        fill: '#3d5a3d',
        fontWeight: 'bold',
        align: 'center',
      },
    });
    title.anchor.set(0.5);
    title.x = cx;
    title.y = 70;
    this.contentLayer.addChild(title);

    // ── Instructional subtitle (warmer, clearer) ──
    const subtitle = new Text({
      text: 'Select seeds for your garden run — each has unique traits!',
      style: {
        fontFamily: 'Arial',
        fontSize: 15,
        fill: '#5a8a5a',
        align: 'center',
      },
    });
    subtitle.anchor.set(0.5);
    subtitle.x = cx;
    subtitle.y = 94;
    this.contentLayer.addChild(subtitle);

    // ── Generate seed pool ──
    const unlockedPlantIds = this.encyclopediaSystem.getDiscoveredPlantIds();
    const runSeed = Date.now();
    this.seedPool = this.seedSelectionSystem.generatePool(unlockedPlantIds, {
      minSeeds: 4,
      maxSeeds: 6,
      runSeed,
    });
    this.dailyChallengeSystem.setSeed(runSeed, false);
    this.isDailyMode = false;

    // ── Seed packets (responsive layout) ──
    this.layoutSeedPackets(cx, w);

    // ── Daily Challenge button + explanation ──
    const dailyY = h - 168;
    this.buildDailyChallenge(cx, dailyY, unlockedPlantIds);

    // ── Modifier section with explanation ──
    const modY = dailyY + 56;
    this.buildModifiers(cx, modY, w);

    // ── Start Season button (large, green, prominent) ──
    this.buildStartButton(ctx, cx, h - 68, seasonCfg);

    // ── Navigation hint ──
    const navHint = new Text({
      text: '↑↓ Navigate  •  Enter / Space to Start  •  Esc Back',
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: '#7a9a7a',
        align: 'center',
      },
    });
    navHint.anchor.set(0.5);
    navHint.x = cx;
    navHint.y = h - 12;
    this.contentLayer.addChild(navHint);

    // ── Keyboard handler ──
    this.boundOnKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        this.startGarden(ctx);
      }
    };
    window.addEventListener('keydown', this.boundOnKeyDown);

    audioManager.startAmbient();
  }

  /** Warm cozy background: soft gradient + rolling hills + flowers */
  private buildBackground(w: number, h: number): void {
    // Soft gradient sky (warm cream to light green)
    const bg = new Graphics();
    bg.rect(0, 0, w, h);
    bg.fill({ color: 0xfff8e7 }); // Warm cream
    this.bgLayer.addChild(bg);

    // Sky gradient overlay (subtle)
    const skyGradient = new Graphics();
    skyGradient.rect(0, 0, w, h * 0.6);
    skyGradient.fill({ color: 0xe8f5e9, alpha: 0.3 }); // Pale green tint
    this.bgLayer.addChild(skyGradient);

    // Soft rolling hills (warm earth tones)
    const hills = new Graphics();
    hills.moveTo(0, h * 0.65);
    hills.quadraticCurveTo(w * 0.15, h * 0.52, w * 0.3, h * 0.6);
    hills.quadraticCurveTo(w * 0.5, h * 0.72, w * 0.65, h * 0.55);
    hills.quadraticCurveTo(w * 0.85, h * 0.48, w, h * 0.58);
    hills.lineTo(w, h);
    hills.lineTo(0, h);
    hills.closePath();
    hills.fill({ color: 0xc8d9ac, alpha: 0.7 }); // Warm sage
    this.bgLayer.addChild(hills);

    // Foreground hills (richer green)
    const fgHills = new Graphics();
    fgHills.moveTo(0, h * 0.78);
    fgHills.quadraticCurveTo(w * 0.25, h * 0.68, w * 0.45, h * 0.74);
    fgHills.quadraticCurveTo(w * 0.7, h * 0.82, w, h * 0.72);
    fgHills.lineTo(w, h);
    fgHills.lineTo(0, h);
    fgHills.closePath();
    fgHills.fill({ color: 0xa5c882, alpha: 0.8 }); // Soft green
    this.bgLayer.addChild(fgHills);

    // Warm flower accents
    const flowerColors = [0xffb7c5, 0xffd54f, 0xff8a65, 0x90caf9, 0xce93d8];
    for (let i = 0; i < 20; i++) {
      const flower = new Graphics();
      const fx = Math.random() * w;
      const fy = h * 0.65 + Math.random() * h * 0.3;
      const color = flowerColors[Math.floor(Math.random() * flowerColors.length)];
      const size = 2.5 + Math.random() * 2.5;
      flower.circle(fx, fy, size);
      flower.fill({ color, alpha: 0.5 + Math.random() * 0.3 });
      this.bgLayer.addChild(flower);
    }
  }

  /** Arrange seed packets in a single responsive row, auto-scaled to fit screen width */
  private layoutSeedPackets(cx: number, screenWidth: number): void {
    if (!this.seedPool) return;

    const count = this.seedPool.seeds.length;
    const PACKET_W = 160;
    const gap = 14;
    const margin = 40;
    const usableWidth = screenWidth - margin * 2;
    const totalNeeded = count * PACKET_W + (count - 1) * gap;
    const scale = Math.min(0.85, usableWidth / totalNeeded);

    const scaledW = PACKET_W * scale;
    const totalWidth = count * scaledW + (count - 1) * gap;
    const startX = cx - totalWidth / 2;

    for (let i = 0; i < count; i++) {
      const seed = this.seedPool.seeds[i];
      const idx = i;
      const packet = new SeedPacketDisplay(seed, () => {
        this.onPacketTapped(idx);
      });
      const pc = packet.getContainer();
      pc.scale.set(scale);
      pc.x = startX + i * (scaledW + gap);
      pc.y = PACKET_START_Y;
      this.packetContainer.addChild(pc);
      this.seedPackets.push(packet);
    }
  }

  private onPacketTapped(index: number): void {
    for (let i = 0; i < this.seedPackets.length; i++) {
      this.seedPackets[i].setSelected(i === index);
    }
  }

  /** Daily Challenge button with explanatory subtitle (warm gold styling) */
  private buildDailyChallenge(
    cx: number,
    y: number,
    unlockedPlantIds: string[],
  ): void {
    const dailyButton = new Graphics();
    dailyButton.roundRect(0, 0, 300, 40, 12);
    dailyButton.fill({ color: 0xfff9e6, alpha: 0.95 }); // Warm cream
    dailyButton.stroke({ color: 0xffa726, width: 3 }); // Warm orange
    dailyButton.x = cx - 150;
    dailyButton.y = y;
    dailyButton.eventMode = 'static';
    dailyButton.cursor = 'pointer';
    this.contentLayer.addChild(dailyButton);

    const todayStr = DailyChallengeSystem.todayDateString();
    const dailyLabel = new Text({
      text: `📅 Daily Challenge — ${todayStr}`,
      style: {
        fontFamily: 'Arial',
        fontSize: 15,
        fill: '#e65100',
        fontWeight: 'bold',
        align: 'center',
      },
    });
    dailyLabel.anchor.set(0.5);
    dailyLabel.x = cx;
    dailyLabel.y = y + 20;
    this.contentLayer.addChild(dailyLabel);

    const dailyExplain = new Text({
      text: 'Same seeds & modifiers for everyone today — compete for high scores!',
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: '#7a5a3a',
        align: 'center',
      },
    });
    dailyExplain.anchor.set(0.5);
    dailyExplain.x = cx;
    dailyExplain.y = y + 44;
    this.contentLayer.addChild(dailyExplain);

    dailyButton.on('pointerover', () => {
      dailyButton.alpha = 0.85;
    });
    dailyButton.on('pointerout', () => {
      dailyButton.alpha = 1.0;
    });
    dailyButton.on('pointerdown', () => {
      this.activateDailyMode(unlockedPlantIds);
    });
  }

  /** Modifier selector cards with explanatory heading (warm styling) */
  private buildModifiers(cx: number, y: number, screenWidth: number): void {
    const modLabel = new Text({
      text: '⚡ Run Modifiers — optional tweaks that change difficulty & scoring',
      style: {
        fontFamily: 'Arial',
        fontSize: 13,
        fill: '#5a8a5a',
        fontWeight: '600',
        align: 'center',
      },
    });
    modLabel.anchor.set(0.5);
    modLabel.x = cx;
    modLabel.y = y;
    this.contentLayer.addChild(modLabel);

    this.modifierSelector = new ModifierSelector();
    const modContainer = this.modifierSelector.getContainer();
    const modScale = Math.min(0.5, (screenWidth - 60) / 700);
    modContainer.scale.set(modScale);
    modContainer.x = cx;
    modContainer.y = y + 16;
    this.contentLayer.addChild(modContainer);
  }

  /** Large warm Start Season button with hover effect */
  private buildStartButton(
    ctx: SceneContext,
    cx: number,
    y: number,
    seasonCfg: (typeof SEASON_CONFIG)[Season],
  ): void {
    const btnW = 320;
    const btnH = 56;

    const btn = new Graphics();
    btn.roundRect(0, 0, btnW, btnH, 18);
    btn.fill({ color: 0x4caf50 }); // Warm vibrant green
    btn.stroke({ color: 0x81c784, width: 4 });
    btn.x = cx - btnW / 2;
    btn.y = y;
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    this.contentLayer.addChild(btn);

    const btnLabel = new Text({
      text: `🌿 Start ${seasonCfg.displayName} Run`,
      style: {
        fontFamily: 'Georgia, serif',
        fontSize: 24,
        fill: '#ffffff',
        fontWeight: 'bold',
        align: 'center',
        dropShadow: {
          alpha: 0.3,
          angle: 45,
          blur: 2,
          distance: 2,
        },
      },
    });
    btnLabel.anchor.set(0.5);
    btnLabel.x = cx;
    btnLabel.y = y + btnH / 2;
    this.contentLayer.addChild(btnLabel);

    btn.on('pointerover', () => {
      btn.scale.set(1.03);
      btn.alpha = 0.9;
    });
    btn.on('pointerout', () => {
      btn.scale.set(1.0);
      btn.alpha = 1.0;
    });
    btn.on('pointerdown', () => {
      this.startGarden(ctx);
    });
  }

  /** Switch to daily challenge mode — regenerate pool with daily seed and lock modifiers */
  private activateDailyMode(unlockedPlantIds: string[]): void {
    if (this.isDailyMode) return;
    this.isDailyMode = true;

    const challenge = this.dailyChallengeSystem.getDailyChallenge();
    this.dailyChallengeSystem.setSeed(challenge.seed, true);
    this.dailyChallengeSystem.setActiveModifiers(challenge.modifiers);

    this.seedPool = this.seedSelectionSystem.generatePool(unlockedPlantIds, {
      minSeeds: 4,
      maxSeeds: 6,
      runSeed: challenge.seed,
    });

    for (const pkt of this.seedPackets) {
      pkt.destroy();
    }
    this.seedPackets = [];

    if (this.seedPool) {
      const cx = this.screenWidth / 2;
      this.layoutSeedPackets(cx, this.screenWidth);
    }

    if (this.modifierSelector) {
      this.modifierSelector.setActiveIds(challenge.modifiers);
      this.modifierSelector.setLocked(true);
    }
  }

  private startGarden(ctx: SceneContext): void {
    if (this.modifierSelector && !this.isDailyMode) {
      this.dailyChallengeSystem.setActiveModifiers(
        this.modifierSelector.getActiveIds(),
      );
    }

    ctx.sceneManager.transitionTo(SCENES.GARDEN, { type: 'fade' }).catch(console.error);
  }

  update(_dt: number, _ctx: SceneContext): void {
    // No per-frame updates needed
  }

  resize?(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  destroy(): void {
    audioManager.stopAmbient();
    window.removeEventListener('keydown', this.boundOnKeyDown);

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
