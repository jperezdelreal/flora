import { Container, Graphics, Text } from 'pixi.js';
import { Season, SEASON_CONFIG } from '../config/seasons';

/** Game phase for the phase indicator */
export type GamePhase = 'planting' | 'tending' | 'harvest' | 'day_end';

const PHASE_CONFIG: Record<GamePhase, { emoji: string; label: string; color: string }> = {
  planting:  { emoji: '🌱', label: 'Planting',  color: '#66bb6a' },
  tending:   { emoji: '💧', label: 'Tending',   color: '#42a5f5' },
  harvest:   { emoji: '🌾', label: 'Harvest',   color: '#ffd700' },
  day_end:   { emoji: '🌙', label: 'Day End',   color: '#b39ddb' },
};

const PHASE_ORDER: GamePhase[] = ['planting', 'tending', 'harvest', 'day_end'];

/**
 * HUD displays game status information at the top of the screen:
 * - Day counter (Day X / 12) with circular progress
 * - Season indicator
 * - Day progress bar (time within current day)
 * - Actions remaining
 * - Next unlock progress indicator
 * - Phase indicator (Planting → Tending → Harvest → Day End)
 * - Contextual "what to do" hints
 */
export class HUD {
  private container: Container;
  private dayText: Text;
  private seasonText: Text;
  private actionsText: Text;
  private dayProgressBar: Graphics;
  private dayProgressBarBg: Graphics;
  private dayCircle: Graphics;
  private unlockProgressText: Text;
  private unlockProgressBar: Graphics;
  private unlockProgressBarBg: Graphics;
  private scoreText: Text;
  private lastActionPointsText: Text;
  private weatherWarningText: Text;
  private gridInfoText: Text;
  private phaseContainer!: Container;
  private phaseLabels: Text[] = [];
  private phaseArrows: Text[] = [];
  private phaseBg!: Graphics;
  private currentPhase: GamePhase = 'planting';
  private hintText!: Text;
  private hintBg!: Graphics;
  private phaseTransitionAlpha = 0;

  constructor() {
    this.container = new Container();

    // Semi-transparent background panel (expanded height for unlock progress + score + weather warning)
    const bg = new Graphics();
    bg.roundRect(0, 0, 600, 135, 8);
    bg.fill({ color: 0x1a1a1a, alpha: 0.9 });
    bg.stroke({ color: 0x4caf50, width: 2 });
    this.container.addChild(bg);

    // Day counter with circular progress indicator
    this.dayCircle = new Graphics();
    this.dayCircle.x = 30;
    this.dayCircle.y = 30;
    this.container.addChild(this.dayCircle);

    this.dayText = new Text({
      text: 'Day 1 / 12',
      style: {
        fontFamily: 'Arial',
        fontSize: 18,
        fill: '#c8e6c9',
        fontWeight: 'bold',
      },
    });
    this.dayText.x = 60;
    this.dayText.y = 12;
    this.container.addChild(this.dayText);

    // Season indicator
    this.seasonText = new Text({
      text: '🌸 Spring',
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: '#ffffff',
      },
    });
    this.seasonText.x = 60;
    this.seasonText.y = 35;
    this.container.addChild(this.seasonText);

    // Day progress bar (visual indicator of time within current day)
    const progressBarX = 220;
    const progressBarY = 20;
    const progressBarWidth = 200;
    const progressBarHeight = 20;

    this.dayProgressBarBg = new Graphics();
    this.dayProgressBarBg.roundRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight, 4);
    this.dayProgressBarBg.fill({ color: 0x2a2a2a });
    this.container.addChild(this.dayProgressBarBg);

    this.dayProgressBar = new Graphics();
    this.container.addChild(this.dayProgressBar);

    // Progress bar label
    const progressLabel = new Text({
      text: 'Day Progress',
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: '#aaaaaa',
      },
    });
    progressLabel.x = progressBarX + progressBarWidth / 2 - 40;
    progressLabel.y = progressBarY + 3;
    this.container.addChild(progressLabel);

    // Actions remaining indicator
    this.actionsText = new Text({
      text: 'Actions: 3/3',
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: '#66bb6a',
        fontWeight: 'bold',
      },
    });
    this.actionsText.x = 460;
    this.actionsText.y = 22;
    this.container.addChild(this.actionsText);

    // Unlock progress indicator (bottom section)
    const unlockProgressX = 20;
    const unlockProgressY = 65;
    const unlockProgressWidth = 560;
    const unlockProgressHeight = 16;

    this.unlockProgressBarBg = new Graphics();
    this.unlockProgressBarBg.roundRect(unlockProgressX, unlockProgressY, unlockProgressWidth, unlockProgressHeight, 4);
    this.unlockProgressBarBg.fill({ color: 0x2a2a2a });
    this.container.addChild(this.unlockProgressBarBg);

    this.unlockProgressBar = new Graphics();
    this.container.addChild(this.unlockProgressBar);

    this.unlockProgressText = new Text({
      text: 'Next unlock: Loading...',
      style: {
        fontFamily: 'Arial',
        fontSize: 11,
        fill: '#ffd700',
        fontWeight: 'bold',
      },
    });
    this.unlockProgressText.x = unlockProgressX + 5;
    this.unlockProgressText.y = unlockProgressY + 2;
    this.container.addChild(this.unlockProgressText);

    // Score display (bottom-right section)
    this.scoreText = new Text({
      text: 'Score: 0',
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: '#ffd700',
        fontWeight: 'bold',
      },
    });
    this.scoreText.x = 20;
    this.scoreText.y = 87;
    this.container.addChild(this.scoreText);

    this.lastActionPointsText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: '#66bb6a',
        fontWeight: 'bold',
      },
    });
    this.lastActionPointsText.x = 150;
    this.lastActionPointsText.y = 89;
    this.container.addChild(this.lastActionPointsText);

    // TLDR: Weather warning indicator (bottom section)
    this.weatherWarningText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 13,
        fill: '#ff9800',
        fontWeight: 'bold',
      },
    });
    this.weatherWarningText.x = 20;
    this.weatherWarningText.y = 112;
    this.weatherWarningText.visible = false;
    this.container.addChild(this.weatherWarningText);

    // TLDR: Grid size & structures indicator (right side of weather row)
    this.gridInfoText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 13,
        fill: '#a5d6a7',
        fontWeight: 'bold',
      },
    });
    this.gridInfoText.x = 400;
    this.gridInfoText.y = 112;
    this.gridInfoText.visible = false;
    this.container.addChild(this.gridInfoText);

    // Phase indicator bar (below main HUD panel)
    this.phaseContainer = new Container();
    this.phaseContainer.y = 140;

    this.phaseBg = new Graphics();
    this.phaseBg.roundRect(0, 0, 600, 32, 6);
    this.phaseBg.fill({ color: 0x1a1a1a, alpha: 0.85 });
    this.phaseBg.stroke({ color: 0x3a3a3a, width: 1 });
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
          fill: '#666666',
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
    this.hintBg.roundRect(0, 0, 360, 28, 6);
    this.hintBg.fill({ color: 0x2e7d32, alpha: 0.85 });
    this.hintBg.x = 120;
    this.hintBg.y = 176;
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
    this.hintText.x = 130;
    this.hintText.y = 182;
    this.hintText.visible = false;
    this.container.addChild(this.hintText);

    this.highlightPhase('planting');
  }

  /**
   * Update HUD display
   * @param day Current day (1-12)
   * @param maxDays Maximum days in season (default 12)
   * @param dayProgress Progress within current day (0.0 - 1.0)
   * @param actionsRemaining Actions left for the day
   * @param maxActions Maximum actions per day
   */
  update(
    day: number,
    maxDays: number = 12,
    dayProgress: number = 0,
    actionsRemaining: number = 0,
    maxActions: number = 0,
  ): void {
    // Update day text
    this.dayText.text = `Day ${day} / ${maxDays}`;

    // Update day circular progress indicator
    this.dayCircle.clear();
    // Background circle (grey)
    this.dayCircle.circle(0, 0, 18);
    this.dayCircle.fill({ color: 0x3a3a3a });
    // Progress arc (green)
    const progress = day / maxDays;
    if (progress > 0) {
      this.dayCircle.moveTo(0, 0);
      this.dayCircle.arc(0, 0, 18, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
      this.dayCircle.fill({ color: 0x4caf50 });
    }
    // Inner circle (dark)
    this.dayCircle.circle(0, 0, 12);
    this.dayCircle.fill({ color: 0x1a1a1a });

    // Update day progress bar
    const progressBarX = 220;
    const progressBarY = 20;
    const progressBarWidth = 200;
    const progressBarHeight = 20;
    
    this.dayProgressBar.clear();
    if (dayProgress > 0) {
      this.dayProgressBar.roundRect(
        progressBarX,
        progressBarY,
        progressBarWidth * Math.min(dayProgress, 1.0),
        progressBarHeight,
        4
      );
      this.dayProgressBar.fill({ color: 0x66bb6a });
    }

    // Update actions text with color coding
    this.actionsText.text = `Actions: ${actionsRemaining}/${maxActions}`;
    if (actionsRemaining === 0) {
      this.actionsText.style.fill = '#ff5252'; // Red when depleted
    } else if (actionsRemaining === maxActions) {
      this.actionsText.style.fill = '#66bb6a'; // Green when full
    } else {
      this.actionsText.style.fill = '#ffeb3b'; // Yellow when partial
    }
  }

  /**
   * TLDR: Update score display
   * @param totalScore Current total score
   * @param lastActionPoints Points from last action (0 to hide)
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
   * TLDR: Update unlock progress indicator
   * @param milestoneText Display text for next milestone
   * @param current Current progress value
   * @param target Target value to unlock
   */
  updateUnlockProgress(milestoneText: string, current: number, target: number): void {
    const unlockProgressX = 20;
    const unlockProgressY = 65;
    const unlockProgressWidth = 560;
    const unlockProgressHeight = 16;

    // Update text
    this.unlockProgressText.text = `${milestoneText}: ${current}/${target}`;

    // Update progress bar
    const progress = Math.min(current / target, 1.0);
    this.unlockProgressBar.clear();
    if (progress > 0) {
      this.unlockProgressBar.roundRect(
        unlockProgressX,
        unlockProgressY,
        unlockProgressWidth * progress,
        unlockProgressHeight,
        4
      );
      this.unlockProgressBar.fill({ color: 0xffd700, alpha: 0.8 });
    }
  }

  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  /**
   * Update the season indicator in the HUD.
   * Adjusts the text and text color to match the active season's palette.
   */
  setSeason(season: Season): void {
    const cfg = SEASON_CONFIG[season];
    this.seasonText.text = `${cfg.emoji} ${cfg.displayName}`;

    // Map season to a pleasing text color
    const seasonColors: Record<Season, string> = {
      [Season.SPRING]: '#a8e6cf',  // soft mint green
      [Season.SUMMER]: '#ffe082',  // warm yellow
      [Season.FALL]: '#ffcc80',    // warm orange
      [Season.WINTER]: '#b3d9ff',  // cool blue
    };
    this.seasonText.style.fill = seasonColors[season];
  }

  /**
   * TLDR: Update weather warning display
   * @param warningText Warning text to display (empty to hide)
   */
  updateWeatherWarning(warningText: string): void {
    if (warningText) {
      this.weatherWarningText.text = `⚠️ ${warningText}`;
      this.weatherWarningText.visible = true;
    } else {
      this.weatherWarningText.visible = false;
    }
  }

  /**
   * TLDR: Update grid info display (grid size + structure count)
   * @param rows Current grid rows
   * @param cols Current grid cols
   * @param structureCount Number of placed structures
   */
  updateGridInfo(rows: number, cols: number, structureCount: number): void {
    const parts: string[] = [`🌿 ${cols}×${rows}`];
    if (structureCount > 0) {
      parts.push(`🏗️ ${structureCount}`);
    }
    this.gridInfoText.text = parts.join('  ');
    this.gridInfoText.visible = true;
  }

  /** Highlight the current game phase; others are dimmed */
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

  /** Show a contextual hint. Pass empty string to hide. */
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

  /** Animate phase transition flash (call each frame) */
  updatePhaseTransition(delta: number): void {
    if (this.phaseTransitionAlpha > 0) {
      this.phaseTransitionAlpha -= delta * 2;
      if (this.phaseTransitionAlpha <= 0) {
        this.phaseTransitionAlpha = 0;
      }
      this.phaseBg.clear();
      this.phaseBg.roundRect(0, 0, 600, 32, 6);
      this.phaseBg.fill({ color: 0x1a1a1a, alpha: 0.85 });
      if (this.phaseTransitionAlpha > 0) {
        const cfg = PHASE_CONFIG[this.currentPhase];
        const flashColor = parseInt(cfg.color.replace('#', ''), 16);
        this.phaseBg.stroke({ color: flashColor, width: 2, alpha: this.phaseTransitionAlpha });
      } else {
        this.phaseBg.stroke({ color: 0x3a3a3a, width: 1 });
      }
    }
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
