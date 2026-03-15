import { Container, Graphics, Text } from 'pixi.js';
import type { Scene, SceneContext } from '../core';
import { eventBus } from '../core/EventBus';
import { SeedPacketDisplay } from '../ui/SeedPacketDisplay';
import { ModifierSelector } from '../ui/ModifierSelector';
import { SeedSelectionSystem, SeedPool } from '../systems/SeedSelectionSystem';
import { DailyChallengeSystem } from '../systems/DailyChallengeSystem';
import { EncyclopediaSystem } from '../systems/EncyclopediaSystem';
import { UnlockSystem } from '../systems/UnlockSystem';
import { audioManager } from '../systems/AudioManager';
import { GAME, UI_COLORS, SCENES } from '../config';
import {
  Season,
  SEASON_CONFIG,
  SEASON_ORDER,
  MULTI_SEASON_UNLOCK_THRESHOLD,
  getRandomSeason,
  loadSeasonPreference,
  saveSeasonPreference,
} from '../config/seasons';
import { getSeedSkin, type SeedSkinConfig } from '../config/cosmetics';

/** TLDR: Y coordinate where seed packets begin */
const PACKET_START_Y = 148;

/** TLDR: Season card dimensions */
const SEASON_CARD_W = 150;
const SEASON_CARD_H = 100;
const SEASON_CARD_GAP = 12;

/** TLDR: Difficulty badge colors */
const DIFFICULTY_COLORS: Record<string, number> = {
  Easy: 0x4caf50,
  Medium: 0xffa726,
  Hard: 0xef5350,
  Expert: 0x7e57c2,
};

/**
 * TLDR: Pre-run seed selection scene with season selector (#201)
 * Shows season cards for player selection, responsive seed packets,
 * daily challenge, modifier cards, multi-season option, and Start button.
 */
export class SeedSelectionScene implements Scene {
  readonly name = 'seed-selection';
  private container = new Container();
  private bgLayer = new Container();
  private contentLayer = new Container();
  private packetContainer = new Container();
  private seasonCardsContainer = new Container();
  private seedPackets: SeedPacketDisplay[] = [];
  private seedPool: SeedPool | null = null;
  private seedSelectionSystem: SeedSelectionSystem;
  private encyclopediaSystem: EncyclopediaSystem;
  private dailyChallengeSystem: DailyChallengeSystem;
  private unlockSystem: UnlockSystem;
  private modifierSelector: ModifierSelector | null = null;
  private boundOnKeyDown!: (e: KeyboardEvent) => void;
  private isDailyMode = false;
  private currentSeason: Season = Season.SPRING;
  private isMultiSeason = false;
  private screenWidth: number = GAME.WIDTH;
  private screenHeight: number = GAME.HEIGHT;
  private startBtnLabel: Text | null = null;
  private seasonCards: Graphics[] = [];
  private multiSeasonCard: Graphics | null = null;
  private seasonCardHighlights: Graphics[] = [];
  // TLDR: Active seed skin cosmetic (loaded from settings)
  private activeSkin: SeedSkinConfig | null = null;

  constructor(
    seedSelectionSystem: SeedSelectionSystem,
    encyclopediaSystem: EncyclopediaSystem,
    dailyChallengeSystem: DailyChallengeSystem,
    activeSeedSkinOrUnlockSystem?: string | null | UnlockSystem,
    unlockSystem?: UnlockSystem,
  ) {
    this.seedSelectionSystem = seedSelectionSystem;
    this.encyclopediaSystem = encyclopediaSystem;
    this.dailyChallengeSystem = dailyChallengeSystem;

    // TLDR: Handle both old and new constructor signatures
    if (activeSeedSkinOrUnlockSystem instanceof UnlockSystem) {
      this.unlockSystem = activeSeedSkinOrUnlockSystem;
      this.activeSkin = null;
    } else {
      this.activeSkin = activeSeedSkinOrUnlockSystem ? getSeedSkin(activeSeedSkinOrUnlockSystem) : null;
      this.unlockSystem = unlockSystem ?? new UnlockSystem();
    }
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

    // TLDR: Load persisted season preference, fall back to random
    const saved = loadSeasonPreference();
    this.currentSeason = saved ?? getRandomSeason();
    this.isMultiSeason = false;

    this.container.addChild(this.bgLayer);
    this.container.addChild(this.contentLayer);
    this.contentLayer.addChild(this.packetContainer);

    // ── Warm background (cozy gradient with soft hills) ──
    this.buildBackground(w, h);

    // ── Title ──
    const title = new Text({
      text: '🌱 Choose Your Season & Seeds',
      style: {
        fontFamily: 'Georgia, serif',
        fontSize: 28,
        fill: UI_COLORS.TEXT_FOREST_GREEN,
        fontWeight: 'bold',
        align: 'center',
      },
    });
    title.anchor.set(0.5);
    title.x = cx;
    title.y = 20;
    this.contentLayer.addChild(title);

    // ── Season selector cards ──
    this.buildSeasonSelector(cx, 44);

    // ── Instructional subtitle ──
    const subtitle = new Text({
      text: 'Select seeds for your garden run — each has unique traits!',
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: UI_COLORS.TEXT_MID_GREEN,
        align: 'center',
      },
    });
    subtitle.anchor.set(0.5);
    subtitle.x = cx;
    subtitle.y = PACKET_START_Y - 8;
    this.contentLayer.addChild(subtitle);

    // ── Generate seed pool (season-filtered) ──
    const unlockedPlantIds = this.encyclopediaSystem.getDiscoveredPlantIds();
    const runSeed = Date.now();
    this.seedPool = this.seedSelectionSystem.generatePool(unlockedPlantIds, {
      minSeeds: 4,
      maxSeeds: 6,
      runSeed,
      season: this.currentSeason,
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

    // ── Start Season button ──
    const seasonCfg = SEASON_CONFIG[this.currentSeason];
    this.buildStartButton(ctx, cx, h - 68, seasonCfg);

    // ── Navigation hint ──
    const navHint = new Text({
      text: '↑↓ Navigate  •  Enter / Space to Start  •  Esc Back',
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: UI_COLORS.TEXT_GRAY_GREEN,
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

  /** TLDR: Build season selector with 4 season cards + multi-season option */
  private buildSeasonSelector(cx: number, y: number): void {
    this.seasonCardsContainer.removeChildren();
    this.seasonCards = [];
    this.seasonCardHighlights = [];
    this.contentLayer.addChild(this.seasonCardsContainer);

    const runsCompleted = this.unlockSystem.getRunsCompleted();
    const multiSeasonUnlocked = runsCompleted >= MULTI_SEASON_UNLOCK_THRESHOLD;

    // TLDR: Calculate total width for centering
    const cardCount = 4;
    const totalCardWidth = cardCount * SEASON_CARD_W + (cardCount - 1) * SEASON_CARD_GAP;
    const startX = cx - totalCardWidth / 2;

    for (let i = 0; i < SEASON_ORDER.length; i++) {
      const season = SEASON_ORDER[i];
      const cfg = SEASON_CONFIG[season];
      const cardX = startX + i * (SEASON_CARD_W + SEASON_CARD_GAP);

      // TLDR: Card background with season palette preview
      const card = new Graphics();
      card.roundRect(0, 0, SEASON_CARD_W, SEASON_CARD_H, 10);
      card.fill({ color: cfg.backgroundColor, alpha: 0.95 });
      card.stroke({
        color: this.currentSeason === season ? UI_COLORS.START_BUTTON_GREEN : 0xaaaaaa,
        width: this.currentSeason === season ? 3 : 1.5,
      });
      card.x = cardX;
      card.y = y;
      card.eventMode = 'static';
      card.cursor = 'pointer';
      this.seasonCardsContainer.addChild(card);
      this.seasonCards.push(card);

      // TLDR: Selection highlight ring
      const highlight = new Graphics();
      highlight.roundRect(-2, -2, SEASON_CARD_W + 4, SEASON_CARD_H + 4, 12);
      highlight.stroke({ color: UI_COLORS.START_BUTTON_GREEN, width: 3 });
      highlight.x = cardX;
      highlight.y = y;
      highlight.visible = this.currentSeason === season && !this.isMultiSeason;
      this.seasonCardsContainer.addChild(highlight);
      this.seasonCardHighlights.push(highlight);

      // TLDR: Season emoji (large, centered)
      const emoji = new Text({
        text: cfg.emoji,
        style: { fontSize: 24, align: 'center' },
      });
      emoji.anchor.set(0.5);
      emoji.x = cardX + SEASON_CARD_W / 2;
      emoji.y = y + 18;
      this.seasonCardsContainer.addChild(emoji);

      // TLDR: Season name
      const nameText = new Text({
        text: cfg.displayName,
        style: {
          fontFamily: 'Georgia, serif',
          fontSize: 14,
          fill: UI_COLORS.TEXT_FOREST_GREEN,
          fontWeight: 'bold',
          align: 'center',
        },
      });
      nameText.anchor.set(0.5);
      nameText.x = cardX + SEASON_CARD_W / 2;
      nameText.y = y + 38;
      this.seasonCardsContainer.addChild(nameText);

      // TLDR: Difficulty badge
      const diffColor = DIFFICULTY_COLORS[cfg.difficulty] ?? 0x888888;
      const diffBadge = new Graphics();
      diffBadge.roundRect(0, 0, 56, 16, 6);
      diffBadge.fill({ color: diffColor, alpha: 0.85 });
      diffBadge.x = cardX + SEASON_CARD_W / 2 - 28;
      diffBadge.y = y + 50;
      this.seasonCardsContainer.addChild(diffBadge);

      const diffLabel = new Text({
        text: cfg.difficulty,
        style: {
          fontFamily: 'Arial',
          fontSize: 10,
          fill: '#ffffff',
          fontWeight: 'bold',
          align: 'center',
        },
      });
      diffLabel.anchor.set(0.5);
      diffLabel.x = cardX + SEASON_CARD_W / 2;
      diffLabel.y = y + 58;
      this.seasonCardsContainer.addChild(diffLabel);

      // TLDR: Hazard warning (first one, truncated)
      if (cfg.hazardWarnings.length > 0) {
        const warnText = new Text({
          text: `⚠ ${cfg.hazardWarnings[0]}`,
          style: {
            fontFamily: 'Arial',
            fontSize: 9,
            fill: '#8a6b3a',
            align: 'center',
          },
        });
        warnText.anchor.set(0.5);
        warnText.x = cardX + SEASON_CARD_W / 2;
        warnText.y = y + 76;
        this.seasonCardsContainer.addChild(warnText);
      }

      // TLDR: Hover + click handlers
      card.on('pointerover', () => { card.alpha = 0.85; });
      card.on('pointerout', () => { card.alpha = 1.0; });
      card.on('pointerdown', () => {
        if (this.isDailyMode) return;
        this.selectSeason(season);
      });

      // TLDR: Color tint preview strip at bottom of card
      const tintStrip = new Graphics();
      tintStrip.roundRect(10, SEASON_CARD_H - 14, SEASON_CARD_W - 20, 8, 4);
      tintStrip.fill({ color: cfg.gridTint });
      tintStrip.x = cardX;
      tintStrip.y = y;
      this.seasonCardsContainer.addChild(tintStrip);
    }

    // TLDR: Multi-season option below season cards
    const multiY = y + SEASON_CARD_H + 6;
    const multiCard = new Graphics();
    const multiW = totalCardWidth;
    multiCard.roundRect(0, 0, multiW, 28, 8);

    if (multiSeasonUnlocked) {
      multiCard.fill({ color: this.isMultiSeason ? 0xd4edda : UI_COLORS.BG_WARM_CREAM, alpha: 0.95 });
      multiCard.stroke({
        color: this.isMultiSeason ? UI_COLORS.START_BUTTON_GREEN : 0xaaaaaa,
        width: this.isMultiSeason ? 2.5 : 1.5,
      });
      multiCard.eventMode = 'static';
      multiCard.cursor = 'pointer';

      multiCard.on('pointerover', () => { multiCard.alpha = 0.85; });
      multiCard.on('pointerout', () => { multiCard.alpha = 1.0; });
      multiCard.on('pointerdown', () => {
        if (this.isDailyMode) return;
        this.toggleMultiSeason();
      });
    } else {
      multiCard.fill({ color: UI_COLORS.BUTTON_LOCKED_BG, alpha: 0.7 });
      multiCard.stroke({ color: UI_COLORS.BUTTON_LOCKED_BORDER, width: 1.5 });
    }

    multiCard.x = startX;
    multiCard.y = multiY;
    this.seasonCardsContainer.addChild(multiCard);
    this.multiSeasonCard = multiCard;

    const multiLabel = new Text({
      text: multiSeasonUnlocked
        ? `🌍 Multi-Season Run (Spring→Summer→Fall→Winter) — 2× Score${this.isMultiSeason ? '  ✓' : ''}`
        : `🔒 Multi-Season Mode — Complete ${MULTI_SEASON_UNLOCK_THRESHOLD} runs to unlock (${runsCompleted}/${MULTI_SEASON_UNLOCK_THRESHOLD})`,
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: multiSeasonUnlocked ? UI_COLORS.TEXT_FOREST_GREEN : UI_COLORS.TEXT_DISABLED,
        fontWeight: multiSeasonUnlocked ? '600' : 'normal',
        align: 'center',
      },
    });
    multiLabel.anchor.set(0.5);
    multiLabel.x = startX + multiW / 2;
    multiLabel.y = multiY + 14;
    this.seasonCardsContainer.addChild(multiLabel);
  }

  /** TLDR: Select a single season and refresh seed pool */
  private selectSeason(season: Season): void {
    this.currentSeason = season;
    this.isMultiSeason = false;

    // TLDR: Persist preference
    saveSeasonPreference(season);

    // TLDR: Emit event
    eventBus.emit('season:selected', { season, isMultiSeason: false });

    // TLDR: Refresh highlights
    for (let i = 0; i < SEASON_ORDER.length; i++) {
      const isSel = SEASON_ORDER[i] === season;
      this.seasonCardHighlights[i].visible = isSel;
      const card = this.seasonCards[i];
      card.clear();
      card.roundRect(0, 0, SEASON_CARD_W, SEASON_CARD_H, 10);
      card.fill({ color: SEASON_CONFIG[SEASON_ORDER[i]].backgroundColor, alpha: 0.95 });
      card.stroke({ color: isSel ? UI_COLORS.START_BUTTON_GREEN : 0xaaaaaa, width: isSel ? 3 : 1.5 });
    }

    // TLDR: Update multi-season card to deselected
    if (this.multiSeasonCard) {
      this.multiSeasonCard.clear();
      const totalW = 4 * SEASON_CARD_W + 3 * SEASON_CARD_GAP;
      this.multiSeasonCard.roundRect(0, 0, totalW, 28, 8);
      this.multiSeasonCard.fill({ color: UI_COLORS.BG_WARM_CREAM, alpha: 0.95 });
      this.multiSeasonCard.stroke({ color: 0xaaaaaa, width: 1.5 });
    }

    // TLDR: Regenerate seed pool with new season filter
    this.regenerateSeedPool();

    // TLDR: Update start button text
    this.updateStartButtonLabel();
  }

  /** TLDR: Toggle multi-season mode on/off */
  private toggleMultiSeason(): void {
    this.isMultiSeason = !this.isMultiSeason;

    if (this.isMultiSeason) {
      // TLDR: Multi-season starts with Spring
      this.currentSeason = Season.SPRING;

      // TLDR: Deselect individual season cards
      for (let i = 0; i < this.seasonCardHighlights.length; i++) {
        this.seasonCardHighlights[i].visible = false;
        const card = this.seasonCards[i];
        card.clear();
        card.roundRect(0, 0, SEASON_CARD_W, SEASON_CARD_H, 10);
        card.fill({ color: SEASON_CONFIG[SEASON_ORDER[i]].backgroundColor, alpha: 0.95 });
        card.stroke({ color: 0xaaaaaa, width: 1.5 });
      }

      // TLDR: Highlight multi-season card
      if (this.multiSeasonCard) {
        this.multiSeasonCard.clear();
        const totalW = 4 * SEASON_CARD_W + 3 * SEASON_CARD_GAP;
        this.multiSeasonCard.roundRect(0, 0, totalW, 28, 8);
        this.multiSeasonCard.fill({ color: 0xd4edda, alpha: 0.95 });
        this.multiSeasonCard.stroke({ color: UI_COLORS.START_BUTTON_GREEN, width: 2.5 });
      }
    } else {
      // TLDR: Fall back to selecting Spring
      this.selectSeason(Season.SPRING);
      return;
    }

    eventBus.emit('season:selected', { season: this.currentSeason, isMultiSeason: this.isMultiSeason });
    this.regenerateSeedPool();
    this.updateStartButtonLabel();
  }

  /** TLDR: Regenerate seed pool after season change */
  private regenerateSeedPool(): void {
    const unlockedPlantIds = this.encyclopediaSystem.getDiscoveredPlantIds();
    const runSeed = Date.now();

    this.seedPool = this.seedSelectionSystem.generatePool(unlockedPlantIds, {
      minSeeds: 4,
      maxSeeds: 6,
      runSeed,
      season: this.currentSeason,
    });
    this.dailyChallengeSystem.setSeed(runSeed, false);

    // TLDR: Clear old packets and re-layout
    for (const pkt of this.seedPackets) {
      pkt.destroy();
    }
    this.seedPackets = [];
    this.packetContainer.removeChildren();

    if (this.seedPool) {
      this.layoutSeedPackets(this.screenWidth / 2, this.screenWidth);
    }
  }

  /** TLDR: Update start button label to match current selection */
  private updateStartButtonLabel(): void {
    if (!this.startBtnLabel) return;
    const seasonCfg = SEASON_CONFIG[this.currentSeason];
    if (this.isMultiSeason) {
      this.startBtnLabel.text = '🌍 Start Multi-Season Run';
    } else {
      this.startBtnLabel.text = `🌿 Start ${seasonCfg.displayName} Run`;
    }
  }

  /** Warm cozy background: soft gradient + rolling hills + flowers */
  private buildBackground(w: number, h: number): void {
    // Soft gradient sky (warm cream to light green)
    const bg = new Graphics();
    bg.rect(0, 0, w, h);
    bg.fill({ color: UI_COLORS.BG_WARM_CREAM });
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
    hills.fill({ color: UI_COLORS.HILLS_SAGE_GREEN, alpha: 0.7 });
    this.bgLayer.addChild(hills);

    // Foreground hills (richer green)
    const fgHills = new Graphics();
    fgHills.moveTo(0, h * 0.78);
    fgHills.quadraticCurveTo(w * 0.25, h * 0.68, w * 0.45, h * 0.74);
    fgHills.quadraticCurveTo(w * 0.7, h * 0.82, w, h * 0.72);
    fgHills.lineTo(w, h);
    fgHills.lineTo(0, h);
    fgHills.closePath();
    fgHills.fill({ color: UI_COLORS.HILLS_FG_SAGE, alpha: 0.8 });
    this.bgLayer.addChild(fgHills);

    // Warm flower accents
    const flowerColors = [
      UI_COLORS.FLOWER_PINK,
      UI_COLORS.FLOWER_GOLD,
      UI_COLORS.FLOWER_RED,
      UI_COLORS.FLOWER_SKY_BLUE,
      UI_COLORS.FLOWER_PLUM,
    ];
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
      }, this.activeSkin);
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
    dailyButton.fill({ color: UI_COLORS.DAILY_BUTTON_CREAM, alpha: 0.95 });
    dailyButton.stroke({ color: UI_COLORS.DAILY_BORDER_ORANGE, width: 3 });
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
        fill: UI_COLORS.TEXT_DAILY_ORANGE,
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
        fill: UI_COLORS.TEXT_DAILY_BROWN,
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
        fill: UI_COLORS.TEXT_MID_GREEN,
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
    btn.fill({ color: UI_COLORS.START_BUTTON_GREEN });
    btn.stroke({ color: UI_COLORS.START_BUTTON_BORDER, width: 4 });
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
        fill: UI_COLORS.TEXT_PRIMARY,
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
    this.startBtnLabel = btnLabel;

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

  /** TLDR: Switch to daily challenge mode — regenerate pool with daily seed, lock modifiers & season */
  private activateDailyMode(unlockedPlantIds: string[]): void {
    if (this.isDailyMode) return;
    this.isDailyMode = true;
    this.isMultiSeason = false;

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

    // TLDR: Disable season selector during daily challenge
    for (const card of this.seasonCards) {
      card.eventMode = 'none';
      card.alpha = 0.5;
    }
    if (this.multiSeasonCard) {
      this.multiSeasonCard.eventMode = 'none';
      this.multiSeasonCard.alpha = 0.5;
    }
  }

  /** TLDR: Store season selection on SeedSelectionSystem and transition to garden */
  private startGarden(ctx: SceneContext): void {
    // TLDR: Pass selected season to SeedSelectionSystem so GardenScene reads it
    this.seedSelectionSystem.setSelectedSeason(this.currentSeason);
    this.seedSelectionSystem.setMultiSeasonMode(this.isMultiSeason);

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
    this.seasonCards = [];
    this.seasonCardHighlights = [];
    this.multiSeasonCard = null;
    this.startBtnLabel = null;

    if (this.modifierSelector) {
      this.modifierSelector.destroy();
      this.modifierSelector = null;
    }

    this.container.destroy({ children: true });
  }
}
