import { Container, Graphics, Text } from 'pixi.js';
import type { Scene, SceneContext } from '../core';
import { COLORS, UI_COLORS, SCENES } from '../config';
import { audioManager } from '../systems';
import type { ScoreBreakdown, HighScoreEntry } from '../systems/ScoringSystem';
import type { MilestoneThreshold } from '../config/scoring';
import type { DailyChallengeSystem } from '../systems/DailyChallengeSystem';
import { Leaderboard } from '../ui/Leaderboard';

/**
 * TLDR: Data passed from GardenScene to ResultsScene at season end
 */
export interface ResultsData {
  breakdown: ScoreBreakdown;
  milestone: MilestoneThreshold | null;
  personalBest: number;
  highScores: readonly HighScoreEntry[];
  isNewRecord: boolean;
  harvestedPlants: { name: string; count: number }[];
  newDiscoveries: string[];
  isMultiSeasonRun: boolean;
  isDaily?: boolean;
  dailySeed?: number;
  dailyDateString?: string;
}

// TLDR: Module-level staging area — GardenScene sets this before transitioning
let pendingResultsData: ResultsData | null = null;

export function setResultsData(data: ResultsData): void {
  pendingResultsData = data;
}

/**
 * TLDR: Dedicated season-end results scene with animated score breakdown,
 * harvested plants summary, discoveries list, and navigation buttons.
 */
export class ResultsScene implements Scene {
  readonly name = 'results';
  private container = new Container();
  private bgLayer = new Container();
  private contentLayer = new Container();

  // TLDR: Count-up animation state
  private animElapsed = 0;
  private readonly countUpDuration = 1.5; // seconds
  private targetScores = { harvests: 0, diversity: 0, perfection: 0, hazards: 0, total: 0 };
  private scoreTexts: { harvests: Text; diversity: Text; perfection: Text; hazards: Text; total: Text } | null = null;
  private panelAlpha = 0;
  private panel: Graphics | null = null;

  // TLDR: Milestone badge pulse
  private milestoneBadge: Graphics | null = null;
  private milestoneText: Text | null = null;

  private screenWidth = 0;
  private screenHeight = 0;

  private dailyChallengeSystem: DailyChallengeSystem | null;
  private leaderboard: Leaderboard | null = null;

  constructor(dailyChallengeSystem?: DailyChallengeSystem) {
    this.dailyChallengeSystem = dailyChallengeSystem ?? null;
  }

  async init(ctx: SceneContext): Promise<void> {
    const stage = ctx.app.stage.children[0] as Container;
    stage.addChild(this.container);

    this.screenWidth = ctx.app.screen.width;
    this.screenHeight = ctx.app.screen.height;
    const w = this.screenWidth;
    const h = this.screenHeight;

    this.container.addChild(this.bgLayer);
    this.container.addChild(this.contentLayer);

    this.buildBackground(w, h);

    const data = pendingResultsData;
    if (data) {
      this.buildResultsPanel(ctx, w, h, data);
      pendingResultsData = null;
    } else {
      // TLDR: Fallback — no data, just show a return button
      this.buildFallback(ctx, w, h);
    }

    audioManager.startAmbient();
  }

  // TLDR: Cozy dark background with layered hills
  private buildBackground(w: number, h: number): void {
    const bg = new Graphics();
    bg.rect(0, 0, w, h);
    bg.fill({ color: COLORS.DARK_GREEN });
    this.bgLayer.addChild(bg);

    // TLDR: Decorative hills
    const hillFar = new Graphics();
    hillFar.moveTo(0, h);
    hillFar.quadraticCurveTo(w * 0.25, h * 0.65, w * 0.5, h * 0.78);
    hillFar.quadraticCurveTo(w * 0.75, h * 0.9, w, h * 0.72);
    hillFar.lineTo(w, h);
    hillFar.closePath();
    hillFar.fill({ color: COLORS.MID_GREEN, alpha: 0.25 });
    this.bgLayer.addChild(hillFar);

    const hillNear = new Graphics();
    hillNear.moveTo(0, h);
    hillNear.quadraticCurveTo(w * 0.35, h * 0.78, w * 0.6, h * 0.88);
    hillNear.quadraticCurveTo(w * 0.85, h * 0.82, w, h * 0.9);
    hillNear.lineTo(w, h);
    hillNear.closePath();
    hillNear.fill({ color: COLORS.MID_GREEN, alpha: 0.15 });
    this.bgLayer.addChild(hillNear);
  }

  private buildResultsPanel(ctx: SceneContext, w: number, h: number, data: ResultsData): void {
    const cx = w / 2;
    const panelW = Math.min(660, w - 40);
    const panelX = cx - panelW / 2;
    const panelY = 30;
    const panelH = h - 60;

    // TLDR: Main panel background
    this.panel = new Graphics();
    this.panel.roundRect(panelX, panelY, panelW, panelH, 16);
    this.panel.fill({ color: UI_COLORS.PANEL_BG, alpha: 0.96 });
    this.panel.stroke({ color: UI_COLORS.PANEL_BORDER, width: 2 });
    this.panel.alpha = 0;
    this.contentLayer.addChild(this.panel);

    let y = panelY + 24;

    // TLDR: Title
    const title = new Text({
      text: '✨ Season Complete!',
      style: {
        fontFamily: 'Georgia, serif',
        fontSize: 36,
        fill: '#c8e6c9',
        fontWeight: 'bold',
        align: 'center',
        dropShadow: { color: '#2d5a27', blur: 6, distance: 0 },
      },
    });
    title.anchor.set(0.5, 0);
    title.x = cx;
    title.y = y;
    this.contentLayer.addChild(title);
    y += 52;

    // TLDR: Milestone badge
    if (data.milestone) {
      this.milestoneBadge = new Graphics();
      this.milestoneBadge.circle(cx, y + 20, 30);
      this.milestoneBadge.fill({ color: data.milestone.color, alpha: 0.2 });
      this.milestoneBadge.stroke({ color: data.milestone.color, width: 3 });
      this.contentLayer.addChild(this.milestoneBadge);

      this.milestoneText = new Text({
        text: `${data.milestone.name} Rank`,
        style: {
          fontFamily: 'Arial',
          fontSize: 22,
          fill: data.milestone.textColor,
          fontWeight: 'bold',
          align: 'center',
        },
      });
      this.milestoneText.anchor.set(0.5, 0);
      this.milestoneText.x = cx;
      this.milestoneText.y = y + 46;
      this.contentLayer.addChild(this.milestoneText);
      y += 80;
    }

    // TLDR: New record banner
    if (data.isNewRecord) {
      const recordText = new Text({
        text: '🏆 NEW PERSONAL BEST!',
        style: {
          fontFamily: 'Arial',
          fontSize: 18,
          fill: UI_COLORS.TEXT_TIER_STAR,
          fontWeight: 'bold',
          align: 'center',
        },
      });
      recordText.anchor.set(0.5, 0);
      recordText.x = cx;
      recordText.y = y;
      this.contentLayer.addChild(recordText);
      y += 30;
    }

    // TLDR: Score breakdown with count-up targets
    y += 8;
    const scoreHeaderText = new Text({
      text: '📊 Score Breakdown',
      style: {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: UI_COLORS.TEXT_PRIMARY,
        fontWeight: 'bold',
      },
    });
    scoreHeaderText.x = panelX + 30;
    scoreHeaderText.y = y;
    this.contentLayer.addChild(scoreHeaderText);
    y += 30;

    this.targetScores = {
      harvests: data.breakdown.harvests,
      diversity: data.breakdown.diversity,
      perfection: data.breakdown.perfection,
      hazards: data.breakdown.hazards,
      total: data.breakdown.total,
    };

    const makeScoreLine = (label: string, yPos: number): Text => {
      const t = new Text({
        text: `  ${label}  0`,
        style: {
          fontFamily: 'Arial',
          fontSize: 17,
          fill: '#ffffff',
          lineHeight: 26,
        },
      });
      t.x = panelX + 36;
      t.y = yPos;
      this.contentLayer.addChild(t);
      return t;
    };

    const harvestsText = makeScoreLine('🌾 Harvests:', y);
    y += 26;
    const diversityText = makeScoreLine('🌈 Diversity:', y);
    y += 26;
    const perfectionText = makeScoreLine('✨ Perfection:', y);
    y += 26;
    const hazardsText = makeScoreLine('⚔️ Hazards:', y);
    y += 32;

    const totalText = new Text({
      text: '  🎯 Total:  0',
      style: {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: UI_COLORS.TEXT_TIER_STAR,
        fontWeight: 'bold',
      },
    });
    totalText.x = panelX + 36;
    totalText.y = y;
    this.contentLayer.addChild(totalText);
    y += 36;

    this.scoreTexts = {
      harvests: harvestsText,
      diversity: diversityText,
      perfection: perfectionText,
      hazards: hazardsText,
      total: totalText,
    };

    // TLDR: Right column — harvested plants + discoveries
    const rightX = cx + 20;
    let rightY = panelY + (data.milestone ? 160 : 110);

    if (data.harvestedPlants.length > 0) {
      const harvestHeader = new Text({
        text: '🌿 Harvested Plants',
        style: {
          fontFamily: 'Arial',
          fontSize: 18,
          fill: UI_COLORS.TEXT_PRIMARY,
          fontWeight: 'bold',
        },
      });
      harvestHeader.x = rightX;
      harvestHeader.y = rightY;
      this.contentLayer.addChild(harvestHeader);
      rightY += 26;

      const maxPlants = Math.min(data.harvestedPlants.length, 6);
      for (let i = 0; i < maxPlants; i++) {
        const p = data.harvestedPlants[i];
        const pText = new Text({
          text: `  ${p.name} ×${p.count}`,
          style: {
            fontFamily: 'Arial',
            fontSize: 15,
            fill: '#d4c4b0',
          },
        });
        pText.x = rightX;
        pText.y = rightY;
        this.contentLayer.addChild(pText);
        rightY += 22;
      }
      if (data.harvestedPlants.length > 6) {
        const moreText = new Text({
          text: `  …and ${data.harvestedPlants.length - 6} more`,
          style: { fontFamily: 'Arial', fontSize: 14, fill: UI_COLORS.TEXT_HINT },
        });
        moreText.x = rightX;
        moreText.y = rightY;
        this.contentLayer.addChild(moreText);
        rightY += 22;
      }
      rightY += 12;
    }

    // TLDR: Discoveries this season
    if (data.newDiscoveries.length > 0) {
      const discHeader = new Text({
        text: '🔬 New Discoveries',
        style: {
          fontFamily: 'Arial',
          fontSize: 18,
          fill: UI_COLORS.TEXT_PRIMARY,
          fontWeight: 'bold',
        },
      });
      discHeader.x = rightX;
      discHeader.y = rightY;
      this.contentLayer.addChild(discHeader);
      rightY += 26;

      const maxDisc = Math.min(data.newDiscoveries.length, 5);
      for (let i = 0; i < maxDisc; i++) {
        const dText = new Text({
          text: `  ✦ ${data.newDiscoveries[i]}`,
          style: {
            fontFamily: 'Arial',
            fontSize: 15,
            fill: '#a8e6cf',
          },
        });
        dText.x = rightX;
        dText.y = rightY;
        this.contentLayer.addChild(dText);
        rightY += 22;
      }
    }

    if (data.isDaily && data.dailySeed && this.dailyChallengeSystem) {
      const modifiers = this.dailyChallengeSystem.getActiveModifiers();
      this.dailyChallengeSystem.submitLeaderboardScore(data.dailySeed, data.breakdown.total, [...modifiers]);
      this.dailyChallengeSystem.recordRun(data.breakdown.total, 'spring');
      const dailyBanner = new Text({
        text: `📅 Daily Challenge — ${data.dailyDateString ?? 'Today'}`,
        style: { fontFamily: 'Arial', fontSize: 18, fill: '#d68910', fontWeight: 'bold', align: 'center' },
      });
      dailyBanner.anchor.set(0.5, 0);
      dailyBanner.x = cx;
      dailyBanner.y = rightY + 10;
      this.contentLayer.addChild(dailyBanner);
      const entries = this.dailyChallengeSystem.getLeaderboard(data.dailySeed);
      this.leaderboard = new Leaderboard();
      this.leaderboard.setTitle('🏆 Daily Leaderboard');
      this.leaderboard.show(entries.slice(0, 5), data.breakdown.total);
      const lbContainer = this.leaderboard.getContainer();
      lbContainer.x = rightX - 20;
      lbContainer.y = rightY + 38;
      const lbAvail = panelY + panelH - (rightY + 38) - 90;
      if (lbAvail < 380) { const scale = Math.max(0.5, lbAvail / 380); lbContainer.scale.set(scale); }
      this.contentLayer.addChild(lbContainer);
    }

    // TLDR: Buttons at panel bottom
    const btnY = panelY + panelH - 80;
    const btnW = 200;
    const btnH = 48;
    const btnGap = 24;

    // TLDR: "New Run" goes to seed-selection
    this.buildButton(
      ctx,
      cx - btnW - btnGap / 2,
      btnY,
      btnW,
      btnH,
      '🌱 New Run',
      UI_COLORS.START_BUTTON_GREEN,
      UI_COLORS.START_BUTTON_BORDER,
      () => ctx.sceneManager.transitionTo(SCENES.SEED_SELECTION, { type: 'crossfade' }),
    );
    // TLDR: "Main Menu" goes back to menu
    this.buildButton(
      ctx,
      cx + btnGap / 2,
      btnY,
      btnW,
      btnH,
      '🏠 Main Menu',
      UI_COLORS.BUTTON_BG,
      UI_COLORS.BUTTON_BORDER,
      () => ctx.sceneManager.transitionTo(SCENES.MENU, { type: 'fade' }),
    );
  }

  private buildButton(
    _ctx: SceneContext,
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    bgColor: number,
    borderColor: number,
    onClick: () => void,
  ): void {
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
      style: {
        fontFamily: 'Georgia, serif',
        fontSize: 20,
        fill: UI_COLORS.TEXT_PRIMARY,
        fontWeight: 'bold',
        align: 'center',
      },
    });
    text.anchor.set(0.5);
    text.x = x + w / 2;
    text.y = y + h / 2;
    this.contentLayer.addChild(text);

    btn.on('pointerover', () => {
      btn.scale.set(1.03);
      btn.alpha = 0.9;
    });
    btn.on('pointerout', () => {
      btn.scale.set(1.0);
      btn.alpha = 1.0;
    });
    btn.on('pointerdown', onClick);
  }

  // TLDR: Fallback when no data available
  private buildFallback(ctx: SceneContext, w: number, h: number): void {
    const cx = w / 2;
    const cy = h / 2;

    const text = new Text({
      text: 'No results data available.',
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: UI_COLORS.TEXT_PRIMARY,
        align: 'center',
      },
    });
    text.anchor.set(0.5);
    text.x = cx;
    text.y = cy - 40;
    this.contentLayer.addChild(text);

    this.buildButton(
      ctx,
      cx - 100,
      cy + 20,
      200,
      48,
      '🏠 Main Menu',
      UI_COLORS.BUTTON_BG,
      UI_COLORS.BUTTON_BORDER,
      () => ctx.sceneManager.transitionTo(SCENES.MENU, { type: 'fade' }),
    );
  }

  update(dt: number): void {
    // TLDR: Panel fade-in
    if (this.panel && this.panelAlpha < 1) {
      this.panelAlpha = Math.min(this.panelAlpha + dt * 2.5, 1);
      this.panel.alpha = this.panelAlpha;
    }

    // TLDR: Score count-up animation
    if (this.scoreTexts && this.animElapsed < this.countUpDuration) {
      this.animElapsed += dt;
      const t = Math.min(this.animElapsed / this.countUpDuration, 1);
      // TLDR: Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - t, 3);

      const cur = (target: number) => Math.round(target * eased);

      this.scoreTexts.harvests.text = `  🌾 Harvests:  ${cur(this.targetScores.harvests)}`;
      this.scoreTexts.diversity.text = `  🌈 Diversity:  ${cur(this.targetScores.diversity)}`;
      this.scoreTexts.perfection.text = `  ✨ Perfection:  ${cur(this.targetScores.perfection)}`;
      this.scoreTexts.hazards.text = `  ⚔️ Hazards:  ${cur(this.targetScores.hazards)}`;
      this.scoreTexts.total.text = `  🎯 Total:  ${cur(this.targetScores.total)}`;
    }

    // TLDR: Milestone badge gentle pulse
    if (this.milestoneBadge) {
      const pulse = 1 + Math.sin(this.animElapsed * 3) * 0.06;
      this.milestoneBadge.scale.set(pulse);
    }
  }

  resize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  destroy(): void {
    audioManager.stopAmbient();
    this.scoreTexts = null;
    this.panel = null;
    this.milestoneBadge = null;
    this.milestoneText = null;
    this.animElapsed = 0;
    this.panelAlpha = 0;
    if (this.leaderboard) { this.leaderboard.destroy(); this.leaderboard = null; }
    this.container.destroy({ children: true });
    this.container = new Container();
    this.bgLayer = new Container();
    this.contentLayer = new Container();
  }
}
