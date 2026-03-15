import { Container, Graphics, Text } from 'pixi.js';
import type { ScoreBreakdown, HighScoreEntry } from '../systems/ScoringSystem';
import type { MilestoneThreshold } from '../config/scoring';
import { ANIMATION } from '../config/animations';
import { UI_COLORS, COLORS } from '../config';

// TLDR: Score category for staggered count-up animation
interface ScoreCategory {
  emoji: string;
  label: string;
  target: number;
  current: number;
}

/**
 * TLDR: End-of-run score summary with animated count-up, milestone display, and paced reveal (#308)
 */
export class ScoreSummary {
  private container: Container;
  private titleText: Text;
  private milestoneText: Text;
  private milestoneBadge: Graphics;
  private scoreBreakdownText: Text;
  private totalScoreText: Text;
  private personalBestText: Text;
  private highScoresContainer: Container;
  private continueButton: Graphics;
  private continueButtonText: Text;
  private onContinueCallback?: () => void;
  private animationTime = 0;
  private readonly fadeInDuration = 600;

  // TLDR: Count-up state
  private categories: ScoreCategory[] = [];
  private totalTarget = 0;
  private totalCurrent = 0;
  private countUpElapsed = 0;
  private countUpActive = false;
  private buttonEnabled = false;
  private sparkleGraphics: Graphics[] = [];

  constructor() {
    this.container = new Container();
    this.container.visible = false;

    const overlay = new Graphics();
    overlay.rect(0, 0, 800, 600);
    overlay.fill({ color: 0x000000, alpha: 0.85 });
    this.container.addChild(overlay);

    const panel = new Graphics();
    panel.roundRect(50, 50, 700, 500, 16);
    panel.fill({ color: 0x1a1a1a, alpha: 0.98 });
    panel.stroke({ color: COLORS.ACCENT_GREEN, width: 3 });
    this.container.addChild(panel);

    this.titleText = new Text({
      text: '🌸 Run Complete!',
      style: {
        fontFamily: 'Arial',
        fontSize: 36,
        fill: UI_COLORS.TEXT_PRIMARY,
        fontWeight: 'bold',
        align: 'center',
      },
    });
    this.titleText.anchor.set(0.5, 0);
    this.titleText.x = 400;
    this.titleText.y = 70;
    this.container.addChild(this.titleText);

    this.milestoneBadge = new Graphics();
    this.container.addChild(this.milestoneBadge);

    this.milestoneText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 28,
        fill: '#ffd700',
        fontWeight: 'bold',
        align: 'center',
      },
    });
    this.milestoneText.anchor.set(0.5);
    this.milestoneText.x = 400;
    this.milestoneText.y = 140;
    this.container.addChild(this.milestoneText);

    this.scoreBreakdownText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 18,
        fill: '#ffffff',
        align: 'left',
        lineHeight: 28,
      },
    });
    this.scoreBreakdownText.x = 100;
    this.scoreBreakdownText.y = 200;
    this.container.addChild(this.scoreBreakdownText);

    this.totalScoreText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 22,
        fill: '#ffd700',
        fontWeight: 'bold',
      },
    });
    this.totalScoreText.x = 100;
    this.totalScoreText.y = 340;
    this.container.addChild(this.totalScoreText);

    this.personalBestText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: '#ffd700',
        fontWeight: 'bold',
      },
    });
    this.personalBestText.x = 100;
    this.personalBestText.y = 370;
    this.container.addChild(this.personalBestText);

    this.highScoresContainer = new Container();
    this.highScoresContainer.x = 450;
    this.highScoresContainer.y = 200;
    this.container.addChild(this.highScoresContainer);

    // TLDR: Continue button starts disabled (greyed out) until count-up finishes
    this.continueButton = new Graphics();
    this.continueButton.x = 300;
    this.continueButton.y = 480;
    this.container.addChild(this.continueButton);

    this.continueButtonText = new Text({
      text: 'Continue',
      style: {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: UI_COLORS.TEXT_DISABLED,
        fontWeight: 'bold',
      },
    });
    this.continueButtonText.anchor.set(0.5);
    this.continueButtonText.x = 400;
    this.continueButtonText.y = 505;
    this.container.addChild(this.continueButtonText);

    this.drawContinueButton(false);
  }

  // TLDR: Draw continue button in enabled or disabled state
  private drawContinueButton(enabled: boolean): void {
    this.continueButton.clear();
    this.continueButton.roundRect(0, 0, 200, 50, 8);
    if (enabled) {
      this.continueButton.fill({ color: COLORS.ACCENT_GREEN });
      this.continueButton.stroke({ color: COLORS.LIGHT_GREEN, width: 2 });
      this.continueButton.eventMode = 'static';
      this.continueButton.cursor = 'pointer';
      this.continueButtonText.style.fill = '#ffffff';
    } else {
      this.continueButton.fill({ color: UI_COLORS.BUTTON_LOCKED_BG });
      this.continueButton.stroke({ color: UI_COLORS.BUTTON_LOCKED_BORDER, width: 2 });
      this.continueButton.eventMode = 'none';
      this.continueButton.cursor = 'default';
      this.continueButtonText.style.fill = UI_COLORS.TEXT_DISABLED;
    }
  }

  private enableButton(): void {
    if (this.buttonEnabled) return;
    this.buttonEnabled = true;
    this.drawContinueButton(true);

    this.continueButton.on('pointerdown', () => this.handleContinueClick());
    this.continueButton.on('pointerover', () => {
      if (!this.buttonEnabled) return;
      this.continueButton.clear();
      this.continueButton.roundRect(0, 0, 200, 50, 8);
      this.continueButton.fill({ color: COLORS.LIGHT_GREEN });
      this.continueButton.stroke({ color: COLORS.PALE_GREEN, width: 2 });
    });
    this.continueButton.on('pointerout', () => {
      if (!this.buttonEnabled) return;
      this.drawContinueButton(true);
    });

    // TLDR: Sparkle flourish when button enables
    this.spawnButtonSparkles();
  }

  private spawnButtonSparkles(): void {
    const cx = 400;
    const cy = 505;
    for (let i = 0; i < 6; i++) {
      const sparkle = new Graphics();
      const angle = (i / 6) * Math.PI * 2;
      const dist = 30 + Math.random() * 20;
      sparkle.circle(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, 2 + Math.random() * 2);
      sparkle.fill({ color: COLORS.ACCENT_GREEN, alpha: 0.8 });
      this.container.addChild(sparkle);
      this.sparkleGraphics.push(sparkle);
    }
  }

  /**
   * TLDR: Show score summary with animated count-up (#308)
   */
  show(
    breakdown: ScoreBreakdown,
    milestone: MilestoneThreshold | null,
    personalBest: number,
    highScores: readonly HighScoreEntry[],
    isNewRecord: boolean,
  ): void {
    this.animationTime = 0;
    this.countUpElapsed = 0;
    this.countUpActive = true;
    this.buttonEnabled = false;
    this.totalTarget = breakdown.total;
    this.totalCurrent = 0;
    this.drawContinueButton(false);

    // TLDR: Set up categories for staggered count-up
    this.categories = [
      { emoji: '🌾', label: 'Harvests', target: breakdown.harvests, current: 0 },
      { emoji: '🌈', label: 'Diversity', target: breakdown.diversity, current: 0 },
      { emoji: '✨', label: 'Perfection', target: breakdown.perfection, current: 0 },
      { emoji: '⚔️', label: 'Hazards', target: breakdown.hazards, current: 0 },
    ];

    if (milestone) {
      this.milestoneText.text = `${milestone.name} Rank Achieved!`;
      this.milestoneText.style.fill = milestone.textColor;

      this.milestoneBadge.clear();
      this.milestoneBadge.circle(400, 140, 50);
      this.milestoneBadge.fill({ color: milestone.color, alpha: 0.2 });
      this.milestoneBadge.stroke({ color: milestone.color, width: 3 });
    } else {
      this.milestoneText.text = 'Keep Growing!';
      this.milestoneText.style.fill = '#88d498';
      this.milestoneBadge.clear();
    }

    // TLDR: Initial text shows zeroes — count-up fills them in
    this.updateBreakdownText();
    this.totalScoreText.text = '  🎯 Total Score: 0';

    if (isNewRecord) {
      this.personalBestText.text = `🏆 NEW PERSONAL BEST! (Previous: ${personalBest})`;
      this.personalBestText.style.fill = '#ffd700';
    } else if (personalBest > 0) {
      this.personalBestText.text = `Personal Best: ${personalBest}`;
      this.personalBestText.style.fill = '#c8c8c8';
    } else {
      this.personalBestText.text = 'First Run Complete!';
      this.personalBestText.style.fill = '#88d498';
    }

    this.renderHighScores(highScores);

    this.container.alpha = 0;
    this.container.visible = true;
  }

  private updateBreakdownText(): void {
    const lines: string[] = [];
    lines.push('📊 Score Breakdown:\n');
    for (const cat of this.categories) {
      lines.push(`  ${cat.emoji} ${cat.label}: ${Math.round(cat.current)}`);
    }
    this.scoreBreakdownText.text = lines.join('\n');
  }

  /**
   * TLDR: Render high scores leaderboard
   */
  private renderHighScores(highScores: readonly HighScoreEntry[]): void {
    this.highScoresContainer.removeChildren();

    const title = new Text({
      text: '🏆 High Scores',
      style: {
        fontFamily: 'Arial',
        fontSize: 18,
        fill: '#ffd700',
        fontWeight: 'bold',
      },
    });
    this.highScoresContainer.addChild(title);

    const topScores = highScores.slice(0, 5);
    topScores.forEach((entry, index) => {
      const date = new Date(entry.date);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
      const milestoneStr = entry.milestone ? ` [${entry.milestone}]` : '';

      const scoreText = new Text({
        text: `${index + 1}. ${entry.score}${milestoneStr}`,
        style: {
          fontFamily: 'Arial',
          fontSize: 14,
          fill: index === 0 ? '#ffd700' : '#ffffff',
        },
      });
      scoreText.y = 30 + index * 24;
      this.highScoresContainer.addChild(scoreText);

      const dateText = new Text({
        text: dateStr,
        style: {
          fontFamily: 'Arial',
          fontSize: 12,
          fill: '#888888',
        },
      });
      dateText.x = 180;
      dateText.y = 30 + index * 24;
      this.highScoresContainer.addChild(dateText);
    });
  }

  // TLDR: Easing for count-up — ease-out cubic for satisfying deceleration
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * TLDR: Update animation — fade-in, then staggered score count-up, then enable button (#308)
   */
  update(deltaMs: number): void {
    if (!this.container.visible) return;

    this.animationTime += deltaMs;

    // TLDR: Phase 1 — Fade in the panel
    if (this.animationTime < this.fadeInDuration) {
      this.container.alpha = Math.min(this.animationTime / this.fadeInDuration, 1.0);
    } else {
      this.container.alpha = 1;
    }

    // TLDR: Phase 2 — Staggered score count-up after fade-in
    if (this.countUpActive && this.animationTime >= this.fadeInDuration) {
      this.countUpElapsed += deltaMs / 1000;
      const countUpDuration = ANIMATION.SCORE_COUNTUP_DURATION;
      const stagger = ANIMATION.SCORE_COUNTUP_CATEGORY_STAGGER;

      let allDone = true;
      for (let i = 0; i < this.categories.length; i++) {
        const cat = this.categories[i];
        const catStart = i * stagger;
        const catElapsed = Math.max(0, this.countUpElapsed - catStart);
        const catProgress = Math.min(catElapsed / countUpDuration, 1);
        cat.current = cat.target * this.easeOutCubic(catProgress);
        if (catProgress < 1) allDone = false;
      }

      // TLDR: Total counts up alongside (uses overall progress)
      const totalStart = this.categories.length * stagger;
      const totalElapsed = Math.max(0, this.countUpElapsed - totalStart * 0.3);
      const totalProgress = Math.min(totalElapsed / countUpDuration, 1);
      this.totalCurrent = this.totalTarget * this.easeOutCubic(totalProgress);
      if (totalProgress < 1) allDone = false;

      this.updateBreakdownText();
      this.totalScoreText.text = `  🎯 Total Score: ${Math.round(this.totalCurrent)}`;

      if (allDone) {
        this.countUpActive = false;
        // TLDR: Snap to exact values
        for (const cat of this.categories) cat.current = cat.target;
        this.totalCurrent = this.totalTarget;
        this.updateBreakdownText();
        this.totalScoreText.text = `  🎯 Total Score: ${this.totalTarget}`;
      }
    }

    // TLDR: Phase 3 — Enable button after count-up + delay
    if (!this.countUpActive && !this.buttonEnabled) {
      const enableDelay = ANIMATION.SCORE_BUTTON_ENABLE_DELAY * 1000;
      const timeSinceCountUpEnd = this.animationTime - this.fadeInDuration -
        (ANIMATION.SCORE_COUNTUP_DURATION + this.categories.length * ANIMATION.SCORE_COUNTUP_CATEGORY_STAGGER) * 1000;
      if (timeSinceCountUpEnd >= enableDelay) {
        this.enableButton();
      }
    }

    // TLDR: Milestone badge pulse
    if (this.milestoneBadge.visible && this.animationTime < 3000) {
      const progress = this.animationTime / 3000;
      const scale = 0.8 + Math.sin(progress * Math.PI * 2) * 0.2;
      this.milestoneBadge.scale.set(scale);
    } else if (this.milestoneBadge.visible) {
      this.milestoneBadge.scale.set(1);
    }

    // TLDR: Fade out sparkles
    for (let i = this.sparkleGraphics.length - 1; i >= 0; i--) {
      const s = this.sparkleGraphics[i];
      s.alpha -= deltaMs / 1000;
      if (s.alpha <= 0) {
        s.destroy();
        this.sparkleGraphics.splice(i, 1);
      }
    }
  }

  hide(): void {
    this.container.visible = false;
    this.countUpActive = false;
    for (const s of this.sparkleGraphics) s.destroy();
    this.sparkleGraphics = [];
  }

  isVisible(): boolean {
    return this.container.visible;
  }

  setOnContinue(callback: () => void): void {
    this.onContinueCallback = callback;
  }

  private handleContinueClick(): void {
    if (!this.buttonEnabled) return;
    this.hide();
    if (this.onContinueCallback) {
      this.onContinueCallback();
    }
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    for (const s of this.sparkleGraphics) s.destroy();
    this.sparkleGraphics = [];
    this.container.destroy({ children: true });
  }
}
