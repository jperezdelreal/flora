// TLDR: Daily challenge hub scene — preview today's challenge, show leaderboard, start daily run

import { Container, Graphics, Text } from 'pixi.js';
import type { Scene, SceneContext } from '../core';
import { COLORS, UI_COLORS, SCENES } from '../config';
import { audioManager } from '../systems';
import { DailyChallengeSystem } from '../systems/DailyChallengeSystem';
import type { SeedSelectionSystem } from '../systems/SeedSelectionSystem';
import type { EncyclopediaSystem } from '../systems/EncyclopediaSystem';
import { MODIFIERS, type ModifierId } from '../config/modifiers';
import { Season } from '../config/seasons';
import { Leaderboard } from '../ui/Leaderboard';
import { eventBus } from '../core/EventBus';

export class DailyChallengeScene implements Scene {
  readonly name = 'daily-challenge';
  private container = new Container();
  private bgLayer = new Container();
  private contentLayer = new Container();
  private dailyChallengeSystem: DailyChallengeSystem;
  private seedSelectionSystem: SeedSelectionSystem;
  private encyclopediaSystem: EncyclopediaSystem;
  private leaderboard: Leaderboard | null = null;
  private boundOnKeyDown!: (e: KeyboardEvent) => void;
  private ctx: SceneContext | null = null;

  constructor(
    dailyChallengeSystem: DailyChallengeSystem,
    seedSelectionSystem: SeedSelectionSystem,
    encyclopediaSystem: EncyclopediaSystem,
  ) {
    this.dailyChallengeSystem = dailyChallengeSystem;
    this.seedSelectionSystem = seedSelectionSystem;
    this.encyclopediaSystem = encyclopediaSystem;
  }

  async init(ctx: SceneContext): Promise<void> {
    this.ctx = ctx;
    const stage = ctx.app.stage.children[0] as Container;
    stage.addChild(this.container);
    const w = ctx.app.screen.width;
    const h = ctx.app.screen.height;
    this.container.addChild(this.bgLayer);
    this.container.addChild(this.contentLayer);
    this.buildBackground(w, h);
    this.buildContent(ctx, w, h);
    this.boundOnKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        ctx.sceneManager.transitionTo(SCENES.MENU, { type: 'fade' }).catch(console.error);
      }
    };
    window.addEventListener('keydown', this.boundOnKeyDown);
    audioManager.startAmbient();
  }

  private buildBackground(w: number, h: number): void {
    const bg = new Graphics();
    bg.rect(0, 0, w, h);
    bg.fill({ color: COLORS.DARK_GREEN });
    this.bgLayer.addChild(bg);
    const hillFar = new Graphics();
    hillFar.moveTo(0, h);
    hillFar.quadraticCurveTo(w * 0.3, h * 0.6, w * 0.55, h * 0.75);
    hillFar.quadraticCurveTo(w * 0.8, h * 0.88, w, h * 0.7);
    hillFar.lineTo(w, h);
    hillFar.closePath();
    hillFar.fill({ color: COLORS.MID_GREEN, alpha: 0.25 });
    this.bgLayer.addChild(hillFar);
  }

  private buildContent(ctx: SceneContext, w: number, h: number): void {
    const cx = w / 2;
    const panelW = Math.min(560, w - 40);
    const panelX = cx - panelW / 2;
    const panelY = 30;
    const panelH = h - 60;

    const panel = new Graphics();
    panel.roundRect(panelX, panelY, panelW, panelH, 16);
    panel.fill({ color: UI_COLORS.PANEL_BG, alpha: 0.96 });
    panel.stroke({ color: UI_COLORS.DAILY_BORDER_ORANGE, width: 2 });
    this.contentLayer.addChild(panel);

    let y = panelY + 24;

    const title = new Text({
      text: '📅 Daily Challenge',
      style: { fontFamily: 'Georgia, serif', fontSize: 32, fill: UI_COLORS.TEXT_DAILY_ORANGE, fontWeight: 'bold', align: 'center', dropShadow: { color: '#2d5a27', blur: 6, distance: 0 } },
    });
    title.anchor.set(0.5, 0);
    title.x = cx;
    title.y = y;
    this.contentLayer.addChild(title);
    y += 48;

    const challenge = this.dailyChallengeSystem.getDailyChallenge();

    const dateText = new Text({
      text: `🗓️ ${challenge.dateString}`,
      style: { fontFamily: 'Arial', fontSize: 20, fill: UI_COLORS.TEXT_PRIMARY, fontWeight: 'bold', align: 'center' },
    });
    dateText.anchor.set(0.5, 0);
    dateText.x = cx;
    dateText.y = y;
    this.contentLayer.addChild(dateText);
    y += 32;

    const hintText = new Text({
      text: 'Unique seed, daily leaderboard',
      style: { fontFamily: 'Arial', fontSize: 13, fill: UI_COLORS.TEXT_HINT, align: 'center' },
    });
    hintText.anchor.set(0.5, 0);
    hintText.x = cx;
    hintText.y = y;
    this.contentLayer.addChild(hintText);
    y += 28;

    if (challenge.modifiers.length > 0) {
      const modHeader = new Text({
        text: "Today's Modifiers",
        style: { fontFamily: 'Arial', fontSize: 18, fill: UI_COLORS.TEXT_PRIMARY, fontWeight: 'bold' },
      });
      modHeader.anchor.set(0.5, 0);
      modHeader.x = cx;
      modHeader.y = y;
      this.contentLayer.addChild(modHeader);
      y += 28;

      for (const modId of challenge.modifiers) {
        const modConfig = MODIFIERS[modId];
        if (!modConfig) continue;
        const cardW = Math.min(360, panelW - 60);
        const cardX = cx - cardW / 2;
        const card = new Graphics();
        card.roundRect(cardX, y, cardW, 44, 8);
        card.fill({ color: UI_COLORS.BUTTON_BG, alpha: 0.9 });
        card.stroke({ color: UI_COLORS.BUTTON_BORDER, width: 1 });
        this.contentLayer.addChild(card);

        const modLabel = new Text({
          text: `${modConfig.emoji} ${modConfig.name}`,
          style: { fontFamily: 'Arial', fontSize: 16, fill: '#ffffff', fontWeight: 'bold' },
        });
        modLabel.x = cardX + 14;
        modLabel.y = y + 6;
        this.contentLayer.addChild(modLabel);

        const modTooltip = new Text({
          text: modConfig.tooltip,
          style: { fontFamily: 'Arial', fontSize: 12, fill: UI_COLORS.TEXT_HINT },
        });
        modTooltip.x = cardX + 14;
        modTooltip.y = y + 26;
        this.contentLayer.addChild(modTooltip);

        const diffBadge = new Text({
          text: `${modConfig.difficulty} ×${modConfig.scoreMultiplier}`,
          style: { fontFamily: 'Arial', fontSize: 11, fill: modConfig.difficulty === 'hard' ? '#ff6b6b' : modConfig.difficulty === 'easy' ? '#a8e6cf' : '#ffd700' },
        });
        diffBadge.anchor.set(1, 0);
        diffBadge.x = cardX + cardW - 12;
        diffBadge.y = y + 14;
        this.contentLayer.addChild(diffBadge);
        y += 52;
      }
    }

    y += 8;

    const leaderboardEntries = this.dailyChallengeSystem.getLeaderboard(challenge.seed);
    this.leaderboard = new Leaderboard();
    this.leaderboard.setTitle(`🏆 Today's Leaderboard`);
    this.leaderboard.show(leaderboardEntries.slice(0, 5));
    const lbContainer = this.leaderboard.getContainer();
    lbContainer.x = cx - 160;
    lbContainer.y = y;
    const availableH = panelY + panelH - y - 100;
    if (availableH < 380) {
      const scale = Math.max(0.6, availableH / 380);
      lbContainer.scale.set(scale);
    }
    this.contentLayer.addChild(lbContainer);

    const btnY = panelY + panelH - 70;
    const btnW = 200;
    const btnH = 48;
    const btnGap = 24;

    this.buildButton(cx - btnW - btnGap / 2, btnY, btnW, btnH, '📅 Start Daily', UI_COLORS.START_BUTTON_GREEN, UI_COLORS.START_BUTTON_BORDER,
      () => this.startDailyRun(ctx, challenge.seed, challenge.modifiers));

    this.buildButton(cx + btnGap / 2, btnY, btnW, btnH, '🏠 Back', UI_COLORS.BUTTON_BG, UI_COLORS.BUTTON_BORDER,
      () => ctx.sceneManager.transitionTo(SCENES.MENU, { type: 'fade' }).catch(console.error));
  }

  private startDailyRun(ctx: SceneContext, seed: number, modifiers: ModifierId[]): void {
    this.dailyChallengeSystem.setSeed(seed, true);
    this.dailyChallengeSystem.setActiveModifiers(modifiers);
    this.seedSelectionSystem.setSelectedSeason(Season.SPRING);
    this.seedSelectionSystem.setMultiSeasonMode(false);
    const unlockedPlantIds = this.encyclopediaSystem.getDiscoveredPlantIds();
    this.seedSelectionSystem.generatePool(unlockedPlantIds, { minSeeds: 4, maxSeeds: 6, runSeed: seed });
    eventBus.emit('daily:started', { seed, dateString: DailyChallengeSystem.todayDateString(), modifiers: modifiers as string[] });
    ctx.sceneManager.transitionTo(SCENES.GARDEN, { type: 'fade' }).catch(console.error);
  }

  private buildButton(x: number, y: number, w: number, h: number, label: string, bgColor: number, borderColor: number, onClick: () => void): void {
    const btn = new Graphics();
    btn.roundRect(0, 0, w, h, 12);
    btn.fill({ color: bgColor });
    btn.stroke({ color: borderColor, width: 3 });
    btn.x = x;
    btn.y = y;
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    this.contentLayer.addChild(btn);
    const text = new Text({
      text: label,
      style: { fontFamily: 'Georgia, serif', fontSize: 20, fill: UI_COLORS.TEXT_PRIMARY, fontWeight: 'bold', align: 'center' },
    });
    text.anchor.set(0.5);
    text.x = x + w / 2;
    text.y = y + h / 2;
    this.contentLayer.addChild(text);
    btn.on('pointerover', () => { btn.scale.set(1.03); btn.alpha = 0.9; });
    btn.on('pointerout', () => { btn.scale.set(1.0); btn.alpha = 1.0; });
    btn.on('pointerdown', onClick);
  }

  update(_dt: number): void {}

  destroy(): void {
    window.removeEventListener('keydown', this.boundOnKeyDown);
    if (this.leaderboard) { this.leaderboard.destroy(); this.leaderboard = null; }
    this.ctx = null;
    audioManager.stopAmbient();
    this.container.destroy({ children: true });
    this.container = new Container();
    this.bgLayer = new Container();
    this.contentLayer = new Container();
  }
}
