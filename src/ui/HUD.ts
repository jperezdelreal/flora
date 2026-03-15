import { Container, Graphics, Text } from 'pixi.js';
import { Season, SEASON_CONFIG } from '../config/seasons';
import { type HudThemeConfig, DEFAULT_HUD_THEME, getHudTheme } from '../config/cosmetics';

export type GamePhase = 'planting' | 'tending' | 'harvest' | 'day_end';

const PHASE_CONFIG: Record<GamePhase, { emoji: string; label: string; color: string }> = {
  planting:  { emoji: '🌱', label: 'Planting',  color: '#66bb6a' },
  tending:   { emoji: '💧', label: 'Tending',   color: '#42a5f5' },
  harvest:   { emoji: '🌾', label: 'Harvest',   color: '#ffd700' },
  day_end:   { emoji: '🌙', label: 'Day End',   color: '#b39ddb' },
};

const PHASE_ORDER: GamePhase[] = ['planting', 'tending', 'harvest', 'day_end'];

// TLDR: Duration tertiary elements stay visible after event trigger
const TERTIARY_DISPLAY_MS = 4000;

/**
 * HUD with 3-tier information hierarchy:
 * - Primary (always visible): Day counter, Season, Actions remaining
 * - Secondary (smaller, present): Score, Day progress bar
 * - Tertiary (event-driven): Weather warning, Unlock progress, Grid info
 */
export class HUD {
  private container: Container;
  private bg: Graphics;
  private panelWidth: number = 400;

  // TLDR: Primary tier - always visible, large text
  private dayText: Text;
  private seasonText: Text;
  private actionsText: Text;

  // TLDR: Secondary tier - present but not dominant
  private scoreText: Text;
  private lastActionPointsText: Text;
  private dayProgressBarBg: Graphics;
  private dayProgressBar: Graphics;
  private dayProgressLabel: Text;

  // TLDR: Tertiary tier - shown on event only, auto-hides
  private tertiaryContainer: Container;
  private tertiaryBg: Graphics;
  private weatherWarningText: Text;
  private unlockProgressText: Text;
  private unlockProgressBarBg: Graphics;
  private unlockProgressBar: Graphics;
  private gridInfoText: Text;
  private tertiaryHideTimer: ReturnType<typeof setTimeout> | null = null;

  // TLDR: Phase indicator bar
  private phaseContainer!: Container;
  private phaseLabels: Text[] = [];
  private phaseArrows: Text[] = [];
  private phaseBg!: Graphics;
  private currentPhase: GamePhase = 'planting';
  private hintText!: Text;
  private hintBg!: Graphics;
  private phaseTransitionAlpha = 0;
  
  // TLDR: Action flash for visual feedback when actions are consumed (#250)
  private actionFlashAlpha = 0;
  private actionFlashBg!: Graphics;

  // TLDR: Active HUD theme (cosmetic reward)
  private activeTheme: HudThemeConfig = DEFAULT_HUD_THEME;

  constructor() {
    this.container = new Container();

    // TLDR: Background panel - redrawn on resize
    this.bg = new Graphics();
    this.container.addChild(this.bg);

    // --- PRIMARY TIER (20px, warm cozy colors) ---
    this.dayText = new Text({
      text: 'Day 1 / 12',
      style: {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: this.activeTheme.primaryTextColor,
        fontWeight: 'bold',
      },
    });
    this.dayText.x = 16;
    this.dayText.y = 10;
    this.container.addChild(this.dayText);

    this.seasonText = new Text({
      text: '\uD83C\uDF38 Spring',
      style: {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: this.activeTheme.primaryTextColor,
        fontWeight: 'bold',
      },
    });
    this.container.addChild(this.seasonText);

    this.actionsText = new Text({
      text: 'Actions: 3/3',
      style: {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: this.activeTheme.primaryTextColor,
        fontWeight: 'bold',
      },
    });
    this.container.addChild(this.actionsText);

    // --- SECONDARY TIER (14px, present but subdued) ---
    this.scoreText = new Text({
      text: 'Score: 0',
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: this.activeTheme.secondaryTextColor,
      },
    });
    this.scoreText.x = 16;
    this.scoreText.y = 38;
    this.container.addChild(this.scoreText);

    this.lastActionPointsText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: '#a8e6cf',
        fontWeight: 'bold',
      },
    });
    this.lastActionPointsText.visible = false;
    this.container.addChild(this.lastActionPointsText);

    this.dayProgressBarBg = new Graphics();
    this.container.addChild(this.dayProgressBarBg);

    this.dayProgressBar = new Graphics();
    this.container.addChild(this.dayProgressBar);

    this.dayProgressLabel = new Text({
      text: 'Day Progress',
      style: {
        fontFamily: 'Arial',
        fontSize: 11,
        fill: '#8a7a6a',
      },
    });
    this.container.addChild(this.dayProgressLabel);

    // --- TERTIARY TIER (12px, hidden by default) ---
    this.tertiaryContainer = new Container();
    this.tertiaryContainer.visible = false;
    this.container.addChild(this.tertiaryContainer);

    this.tertiaryBg = new Graphics();
    this.tertiaryContainer.addChild(this.tertiaryBg);

    this.weatherWarningText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: '#ff9800',
        fontWeight: 'bold',
      },
    });
    this.weatherWarningText.visible = false;
    this.tertiaryContainer.addChild(this.weatherWarningText);

    this.unlockProgressText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: this.activeTheme.secondaryTextColor,
      },
    });
    this.unlockProgressText.visible = false;
    this.tertiaryContainer.addChild(this.unlockProgressText);

    this.unlockProgressBarBg = new Graphics();
    this.unlockProgressBarBg.visible = false;
    this.tertiaryContainer.addChild(this.unlockProgressBarBg);

    this.unlockProgressBar = new Graphics();
    this.unlockProgressBar.visible = false;
    this.tertiaryContainer.addChild(this.unlockProgressBar);

    this.gridInfoText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: this.activeTheme.tertiaryTextColor,
      },
    });
    this.gridInfoText.visible = false;
    this.tertiaryContainer.addChild(this.gridInfoText);

    // TLDR: Phase indicator bar (below main panel and tertiary)
    this.phaseContainer = new Container();
    this.phaseBg = new Graphics();
    this.phaseContainer.addChild(this.phaseBg);

    let phaseX = 16;
    for (let i = 0; i < PHASE_ORDER.length; i++) {
      const phase = PHASE_ORDER[i];
      const cfg = PHASE_CONFIG[phase];
      const label = new Text({
        text: `${cfg.emoji} ${cfg.label}`,
        style: {
          fontFamily: 'Arial',
          fontSize: 13,
          fill: '#555555',
          fontWeight: 'normal',
        },
      });
      label.x = phaseX;
      label.y = 7;
      this.phaseContainer.addChild(label);
      this.phaseLabels.push(label);
      phaseX += label.width + 8;

      if (i < PHASE_ORDER.length - 1) {
        const arrow = new Text({
          text: '→',
          style: {
            fontFamily: 'Arial',
            fontSize: 13,
            fill: '#444444',
          },
        });
        arrow.x = phaseX;
        arrow.y = 7;
        this.phaseContainer.addChild(arrow);
        this.phaseArrows.push(arrow);
        phaseX += arrow.width + 8;
      }
    }
    this.container.addChild(this.phaseContainer);

    // Contextual hint (below phase bar)
    this.hintBg = new Graphics();
    this.hintBg.visible = false;
    this.container.addChild(this.hintBg);

    this.hintText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: '#e8f5e9',
        fontWeight: 'bold',
        align: 'center',
      },
    });
    this.hintText.visible = false;
    this.container.addChild(this.hintText);

    this.highlightPhase('planting');

    // TLDR: Initial layout at default width
    this.layoutPanel(400);
  }

  /**
   * TLDR: Redraws background and repositions elements for a given panel width.
   */
  private layoutPanel(width: number): void {
    this.panelWidth = width;
    const primaryHeight = 60;
    const theme = this.activeTheme;

    // Redraw main background
    this.bg.clear();
    this.bg.roundRect(0, 0, width, primaryHeight, 10);
    this.bg.fill({ color: theme.panelBg, alpha: theme.panelBgAlpha });
    this.bg.stroke({ color: theme.panelBorder, width: 1.5 });

    // Primary: Season centered
    this.seasonText.x = width / 2 - 50;
    this.seasonText.y = 10;

    // Primary: Actions right-aligned
    this.actionsText.x = width - 16;
    this.actionsText.y = 10;
    this.actionsText.anchor.set(1, 0);
    
    // TLDR: Action flash background (same position as actions text)
    this.actionFlashBg = new Graphics();
    this.actionFlashBg.visible = false;
    this.container.addChild(this.actionFlashBg);

    // Secondary: Score left
    this.scoreText.x = 16;
    this.scoreText.y = 38;

    // Secondary: Last action points next to score
    this.lastActionPointsText.x = 110;
    this.lastActionPointsText.y = 38;

    // Secondary: Day progress bar right side
    const barWidth = Math.min(160, width * 0.35);
    const barX = width - barWidth - 16;
    const barY = 40;
    const barHeight = 12;

    this.dayProgressBarBg.clear();
    this.dayProgressBarBg.roundRect(barX, barY, barWidth, barHeight, 3);
    this.dayProgressBarBg.fill({ color: 0x3d342c });

    this.dayProgressLabel.x = barX;
    this.dayProgressLabel.y = barY - 13;

    // Tertiary container sits below the main panel
    this.tertiaryContainer.y = primaryHeight + 4;

    // Tertiary background
    this.tertiaryBg.clear();
    this.tertiaryBg.roundRect(0, 0, width, 28, 6);
    this.tertiaryBg.fill({ color: theme.panelBg, alpha: 0.85 });
    this.tertiaryBg.stroke({ color: theme.panelBorder, width: 1 });

    this.weatherWarningText.x = 12;
    this.weatherWarningText.y = 6;

    this.gridInfoText.x = width - 12;
    this.gridInfoText.y = 6;
    this.gridInfoText.anchor.set(1, 0);

    // Unlock progress bar in tertiary
    this.unlockProgressBarBg.clear();
    this.unlockProgressBarBg.roundRect(12, 20, width - 24, 6, 3);
    this.unlockProgressBarBg.fill({ color: 0x3d342c });

    this.unlockProgressText.x = 12;
    this.unlockProgressText.y = 6;

    // Phase bar positioning (below tertiary)
    const phaseY = primaryHeight + 36;
    this.phaseContainer.y = phaseY;
    this.phaseBg.clear();
    this.phaseBg.roundRect(0, 0, width, 32, 6);
    this.phaseBg.fill({ color: theme.phaseBarBg, alpha: 0.85 });
    this.phaseBg.stroke({ color: 0x3d342c, width: 1 });

    // Hint positioning
    this.hintBg.clear();
    this.hintBg.roundRect(0, 0, Math.min(360, width - 40), 28, 6);
    this.hintBg.fill({ color: theme.hintBgColor, alpha: 0.85 });
    this.hintBg.x = 20;
    this.hintBg.y = phaseY + 36;

    this.hintText.x = 30;
    this.hintText.y = phaseY + 42;
  }

  /**
   * TLDR: Resize the HUD panel to fit viewport width.
   */
  resize(viewportWidth: number): void {
    const width = Math.min(Math.max(viewportWidth - 40, 280), 700);
    this.layoutPanel(width);
  }

  /**
   * TLDR: Returns the current panel width so GardenScene can center it.
   */
  getPanelWidth(): number {
    return this.panelWidth;
  }

  /**
   * Update HUD display (primary + secondary tiers)
   */
  update(
    day: number,
    maxDays: number = 12,
    dayProgress: number = 0,
    actionsRemaining: number = 0,
    maxActions: number = 0,
  ): void {
    // Primary: Day counter
    this.dayText.text = `Day ${day} / ${maxDays}`;

    // Secondary: Day progress bar
    const barWidth = Math.min(160, this.panelWidth * 0.35);
    const barX = this.panelWidth - barWidth - 16;
    const barY = 40;
    const barHeight = 12;

    this.dayProgressBar.clear();
    if (dayProgress > 0) {
      this.dayProgressBar.roundRect(
        barX,
        barY,
        barWidth * Math.min(dayProgress, 1.0),
        barHeight,
        3,
      );
      this.dayProgressBar.fill({ color: this.activeTheme.progressBarColor });
    }

    // Primary: Actions with color coding
    this.actionsText.text = `Actions: ${actionsRemaining}/${maxActions}`;
    if (actionsRemaining === 0) {
      this.actionsText.style.fill = '#e57373';
    } else if (actionsRemaining === maxActions) {
      this.actionsText.style.fill = '#a8e6cf';
    } else {
      this.actionsText.style.fill = '#ffe082';
    }
  }
  
  /**
   * TLDR: Trigger action flash animation when action is consumed (#250)
   */
  flashActionConsumed(): void {
    this.actionFlashAlpha = 1.0;
  }

  /**
   * TLDR: Update score display (secondary tier)
   */
  updateScore(totalScore: number, lastActionPoints: number = 0): void {
    this.scoreText.text = `Score: ${totalScore}`;

    if (lastActionPoints > 0) {
      this.lastActionPointsText.text = `+${lastActionPoints}`;
      this.lastActionPointsText.visible = true;
    } else {
      this.lastActionPointsText.visible = false;
    }
  }

  /**
   * TLDR: Update unlock progress indicator (tertiary tier - shows on event)
   */
  updateUnlockProgress(milestoneText: string, current: number, target: number): void {
    this.unlockProgressText.text = `${milestoneText}: ${current}/${target}`;
    this.unlockProgressText.visible = true;
    this.unlockProgressBarBg.visible = true;
    this.unlockProgressBar.visible = true;

    const unlockBarWidth = this.panelWidth - 24;
    const progress = Math.min(current / target, 1.0);
    this.unlockProgressBar.clear();
    if (progress > 0) {
      this.unlockProgressBar.roundRect(12, 20, unlockBarWidth * progress, 6, 3);
      this.unlockProgressBar.fill({ color: 0xd4a574, alpha: 0.9 });
    }

    this.showTertiary();
  }

  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  /**
   * TLDR: Update the season indicator (primary tier).
   */
  setSeason(season: Season): void {
    const cfg = SEASON_CONFIG[season];
    this.seasonText.text = `${cfg.emoji} ${cfg.displayName}`;

    const seasonColors: Record<Season, string> = {
      [Season.SPRING]: '#a8e6cf',
      [Season.SUMMER]: '#ffe082',
      [Season.FALL]: '#ffcc80',
      [Season.WINTER]: '#b3d9ff',
    };
    this.seasonText.style.fill = seasonColors[season];
  }

  /**
   * TLDR: Update weather warning (tertiary tier - shows on event, auto-hides)
   */
  updateWeatherWarning(warningText: string): void {
    if (warningText) {
      this.weatherWarningText.text = `\u26a0\ufe0f ${warningText}`;
      this.weatherWarningText.visible = true;
      this.showTertiary();
    } else {
      this.weatherWarningText.visible = false;
      this.hideTertiaryIfEmpty();
    }
  }

  /**
   * TLDR: Update grid info display (tertiary tier - shows on event, auto-hides)
   */
  updateGridInfo(rows: number, cols: number, structureCount: number): void {
    const parts: string[] = [`\uD83C\uDF3F ${cols}\u00d7${rows}`];
    if (structureCount > 0) {
      parts.push(`\uD83C\uDFD7\ufe0f ${structureCount}`);
    }
    this.gridInfoText.text = parts.join('  ');
    this.gridInfoText.visible = true;
    this.showTertiary();
  }

  /**
   * TLDR: Show tertiary container and schedule auto-hide
   */
  private showTertiary(): void {
    this.tertiaryContainer.visible = true;

    if (this.tertiaryHideTimer !== null) {
      clearTimeout(this.tertiaryHideTimer);
    }
    this.tertiaryHideTimer = setTimeout(() => {
      this.tertiaryContainer.visible = false;
      this.tertiaryHideTimer = null;
    }, TERTIARY_DISPLAY_MS);
  }

  /**
   * TLDR: Hide tertiary container only if no child elements are visible
   */
  private hideTertiaryIfEmpty(): void {
    const hasContent =
      this.weatherWarningText.visible ||
      this.unlockProgressText.visible ||
      this.gridInfoText.visible;

    if (!hasContent) {
      this.tertiaryContainer.visible = false;
      if (this.tertiaryHideTimer !== null) {
        clearTimeout(this.tertiaryHideTimer);
        this.tertiaryHideTimer = null;
      }
    }
  }

  /**
   * TLDR: Highlight the current game phase; others are dimmed
   */
  setPhase(phase: GamePhase): void {
    if (phase === this.currentPhase) return;
    this.currentPhase = phase;
    this.highlightPhase(phase);
    this.phaseTransitionAlpha = 1.0;
  }

  private highlightPhase(phase: GamePhase): void {
    const activeIndex = PHASE_ORDER.indexOf(phase);
    for (let i = 0; i < this.phaseLabels.length; i++) {
      const cfg = PHASE_CONFIG[PHASE_ORDER[i]];
      const isActive = i === activeIndex;
      this.phaseLabels[i].style.fill = isActive ? cfg.color : '#555555';
      this.phaseLabels[i].style.fontWeight = isActive ? 'bold' : 'normal';
      this.phaseLabels[i].style.fontSize = isActive ? 14 : 13;
    }
    for (let i = 0; i < this.phaseArrows.length; i++) {
      this.phaseArrows[i].style.fill = i < activeIndex ? '#888888' : '#444444';
    }
  }

  getPhase(): GamePhase {
    return this.currentPhase;
  }

  /**
   * TLDR: Show a contextual hint. Pass empty string to hide.
   */
  setHint(hint: string): void {
    if (hint) {
      this.hintText.text = `💡 ${hint}`;
      this.hintText.visible = true;
      this.hintBg.visible = true;
    } else {
      this.hintText.visible = false;
      this.hintBg.visible = false;
    }
  }

  /**
   * TLDR: Animate phase transition flash (call each frame)
   */
  updatePhaseTransition(delta: number): void {
    // TLDR: Phase transition flash
    if (this.phaseTransitionAlpha > 0) {
      this.phaseTransitionAlpha -= delta * 2;
      if (this.phaseTransitionAlpha <= 0) {
        this.phaseTransitionAlpha = 0;
      }
      this.phaseBg.clear();
      this.phaseBg.roundRect(0, 0, this.panelWidth, 32, 6);
      this.phaseBg.fill({ color: this.activeTheme.phaseBarBg, alpha: 0.85 });
      if (this.phaseTransitionAlpha > 0) {
        const cfg = PHASE_CONFIG[this.currentPhase];
        const flashColor = parseInt(cfg.color.replace('#', ''), 16);
        this.phaseBg.stroke({ color: flashColor, width: 2, alpha: this.phaseTransitionAlpha });
      } else {
        this.phaseBg.stroke({ color: 0x3d342c, width: 1 });
      }
    }
    
    // TLDR: Action consumed flash animation (#250)
    if (this.actionFlashAlpha > 0) {
      this.actionFlashAlpha -= delta * 3; // Fade faster than phase
      if (this.actionFlashAlpha <= 0) {
        this.actionFlashAlpha = 0;
        this.actionFlashBg.visible = false;
      } else {
        this.actionFlashBg.visible = true;
        this.actionFlashBg.clear();
        // TLDR: Draw a highlight behind the actions text
        const flashWidth = 140;
        const flashHeight = 28;
        const flashX = this.panelWidth - flashWidth - 8;
        const flashY = 7;
        this.actionFlashBg.roundRect(flashX, flashY, flashWidth, flashHeight, 6);
        this.actionFlashBg.fill({ color: 0xffe082, alpha: this.actionFlashAlpha * 0.4 });
        this.actionFlashBg.stroke({ color: 0xffd54f, width: 2, alpha: this.actionFlashAlpha });
      }
    }
  }

  /**
   * TLDR: Apply a HUD theme by ID. Pass null to revert to default.
   */
  applyTheme(themeId: string | null): void {
    this.activeTheme = getHudTheme(themeId);

    // TLDR: Refresh all text colors to match the new theme
    this.dayText.style.fill = this.activeTheme.primaryTextColor;
    this.scoreText.style.fill = this.activeTheme.secondaryTextColor;
    this.unlockProgressText.style.fill = this.activeTheme.secondaryTextColor;
    this.gridInfoText.style.fill = this.activeTheme.tertiaryTextColor;
    this.dayProgressLabel.style.fill = this.activeTheme.tertiaryTextColor;

    // TLDR: Re-layout with the new theme colors
    this.layoutPanel(this.panelWidth);
  }

  /**
   * TLDR: Get the currently active theme ID (or null for default)
   */
  getActiveThemeId(): string | null {
    return this.activeTheme.id === 'default' ? null : this.activeTheme.id;
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    if (this.tertiaryHideTimer !== null) {
      clearTimeout(this.tertiaryHideTimer);
    }
    this.container.destroy({ children: true });
  }
}
