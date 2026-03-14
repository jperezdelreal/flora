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

    // ── Warm background (MenuScene-style hills + flowers) ──
    this.buildBackground(w, h);

    // ── Season indicator bar ──
    const seasonBar = new Graphics();
    seasonBar.roundRect(cx - 140, 8, 280, 34, 12);
    seasonBar.fill({ color: 0x1a3a1a, alpha: 0.85 });
    seasonBar.stroke({ color: seasonCfg.backgroundColor, width: 2 });
    this.contentLayer.addChild(seasonBar);

    const seasonLabel = new Text({
      text: `${seasonCfg.emoji}  ${seasonCfg.displayName} Season`,
      style: {
        fontFamily: 'Georgia, serif',
        fontSize: 18,
        fill: '#c8e6c9',
        fontWeight: 'bold',
        align: 'center',
      },
    });
    seasonLabel.anchor.set(0.5);
    seasonLabel.x = cx;
    seasonLabel.y = 25;
    this.contentLayer.addChild(seasonLabel);

    // ── Title ──
    const title = new Text({
      text: '🌱 Seed Selection',
      style: {
        fontFamily: 'Georgia, serif',
        fontSize: 26,
        fill: '#c8e6c9',
        fontWeight: 'bold',
        align: 'center',
      },
    });
    title.anchor.set(0.5);
    title.x = cx;
    title.y = 56;
    this.contentLayer.addChild(title);

    // ── Instructional subtitle ──
    const subtitle = new Text({
      text: 'These seeds are available for this run — tap a packet to learn more!',
      style: {
        fontFamily: 'Arial',
        fontSize: 13,
        fill: '#88d498',
        align: 'center',
      },
    });
    subtitle.anchor.set(0.5);
    subtitle.x = cx;
    subtitle.y = 80;
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
        fontSize: 11,
        fill: '#4a7a4a',
        align: 'center',
      },
    });
    navHint.anchor.set(0.5);
    navHint.x = cx;
    navHint.y = h - 10;
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

  /** Warm background matching MenuScene: dark green + rolling hills + flower dots */
  private buildBackground(w: number, h: number): void {
    const bg = new Graphics();
    bg.rect(0, 0, w, h);
    bg.fill({ color: COLORS.DARK_GREEN });
    this.bgLayer.addChild(bg);

    const hills = new Graphics();
    hills.moveTo(0, h * 0.7);
    hills.quadraticCurveTo(w * 0.15, h * 0.55, w * 0.3, h * 0.65);
    hills.quadraticCurveTo(w * 0.5, h * 0.75, w * 0.65, h * 0.6);
    hills.quadraticCurveTo(w * 0.85, h * 0.5, w, h * 0.62);
    hills.lineTo(w, h);
    hills.lineTo(0, h);
    hills.closePath();
    hills.fill({ color: 0x1e4d1a, alpha: 0.6 });
    this.bgLayer.addChild(hills);

    const fgHills = new Graphics();
    fgHills.moveTo(0, h * 0.82);
    fgHills.quadraticCurveTo(w * 0.25, h * 0.72, w * 0.45, h * 0.78);
    fgHills.quadraticCurveTo(w * 0.7, h * 0.85, w, h * 0.76);
    fgHills.lineTo(w, h);
    fgHills.lineTo(0, h);
    fgHills.closePath();
    fgHills.fill({ color: 0x163d13, alpha: 0.5 });
    this.bgLayer.addChild(fgHills);

    const flowerColors = [0xffb7c5, 0xffd700, 0xff6b6b, 0x87ceeb, 0xdda0dd];
    for (let i = 0; i < 18; i++) {
      const flower = new Graphics();
      const fx = Math.random() * w;
      const fy = h * 0.7 + Math.random() * h * 0.25;
      const color = flowerColors[Math.floor(Math.random() * flowerColors.length)];
      flower.circle(fx, fy, 2 + Math.random() * 2);
      flower.fill({ color, alpha: 0.4 + Math.random() * 0.3 });
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

  /** Daily Challenge button with explanatory subtitle */
  private buildDailyChallenge(
    cx: number,
    y: number,
    unlockedPlantIds: string[],
  ): void {
    const dailyButton = new Graphics();
    dailyButton.roundRect(0, 0, 280, 36, 10);
    dailyButton.fill({ color: 0x1a3a1a, alpha: 0.9 });
    dailyButton.stroke({ color: 0xffd700, width: 2 });
    dailyButton.x = cx - 140;
    dailyButton.y = y;
    dailyButton.eventMode = 'static';
    dailyButton.cursor = 'pointer';
    this.contentLayer.addChild(dailyButton);

    const todayStr = DailyChallengeSystem.todayDateString();
    const dailyLabel = new Text({
      text: `📅 Daily Challenge — ${todayStr}`,
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: '#ffd700',
        fontWeight: 'bold',
        align: 'center',
      },
    });
    dailyLabel.anchor.set(0.5);
    dailyLabel.x = cx;
    dailyLabel.y = y + 18;
    this.contentLayer.addChild(dailyLabel);

    const dailyExplain = new Text({
      text: 'Same seeds & modifiers for everyone today — compete for high scores!',
      style: {
        fontFamily: 'Arial',
        fontSize: 11,
        fill: '#b8a840',
        align: 'center',
      },
    });
    dailyExplain.anchor.set(0.5);
    dailyExplain.x = cx;
    dailyExplain.y = y + 40;
    this.contentLayer.addChild(dailyExplain);

    dailyButton.on('pointerdown', () => {
      this.activateDailyMode(unlockedPlantIds);
    });
  }

  /** Modifier selector cards with explanatory heading */
  private buildModifiers(cx: number, y: number, screenWidth: number): void {
    const modLabel = new Text({
      text: '⚡ Run Modifiers — optional tweaks that change difficulty & scoring',
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: '#88d498',
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

  /** Large green Start Season button with hover effect */
  private buildStartButton(
    ctx: SceneContext,
    cx: number,
    y: number,
    seasonCfg: (typeof SEASON_CONFIG)[Season],
  ): void {
    const btnW = 280;
    const btnH = 50;

    const btn = new Graphics();
    btn.roundRect(0, 0, btnW, btnH, 14);
    btn.fill({ color: 0x2e7d32, alpha: 0.95 });
    btn.stroke({ color: 0x66bb6a, width: 3 });
    btn.x = cx - btnW / 2;
    btn.y = y;
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    this.contentLayer.addChild(btn);

    const btnLabel = new Text({
      text: `🌿 Start ${seasonCfg.displayName}`,
      style: {
        fontFamily: 'Georgia, serif',
        fontSize: 22,
        fill: '#ffffff',
        fontWeight: 'bold',
        align: 'center',
      },
    });
    btnLabel.anchor.set(0.5);
    btnLabel.x = cx;
    btnLabel.y = y + btnH / 2;
    this.contentLayer.addChild(btnLabel);

    btn.on('pointerover', () => {
      btn.alpha = 0.85;
    });
    btn.on('pointerout', () => {
      btn.alpha = 1;
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
