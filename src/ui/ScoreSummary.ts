import { Container, Graphics, Text } from 'pixi.js';
import type { ScoreBreakdown, HighScoreEntry } from '../systems/ScoringSystem';
import type { MilestoneThreshold } from '../config/scoring';

/**
 * TLDR: End-of-run score summary with milestone display and animations
 * Shows score breakdown, milestone achieved, personal best comparison, and high scores
 */
export class ScoreSummary {
  private container: Container;
  private titleText: Text;
  private milestoneText: Text;
  private milestoneBadge: Graphics;
  private scoreBreakdownText: Text;
  private personalBestText: Text;
  private highScoresContainer: Container;
  private continueButton: Graphics;
  private continueButtonText: Text;
  private onContinueCallback?: () => void;
  private animationTime = 0;
  private readonly animationDuration = 2000;

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
    panel.stroke({ color: 0x4caf50, width: 3 });
    this.container.addChild(panel);

    this.titleText = new Text({
      text: '🌸 Run Complete!',
      style: {
        fontFamily: 'Arial',
        fontSize: 36,
        fill: '#c8e6c9',
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
    this.personalBestText.y = 360;
    this.container.addChild(this.personalBestText);

    this.highScoresContainer = new Container();
    this.highScoresContainer.x = 450;
    this.highScoresContainer.y = 200;
    this.container.addChild(this.highScoresContainer);

    this.continueButton = new Graphics();
    this.continueButton.roundRect(0, 0, 200, 50, 8);
    this.continueButton.fill({ color: 0x4caf50 });
    this.continueButton.stroke({ color: 0x66bb6a, width: 2 });
    this.continueButton.x = 300;
    this.continueButton.y = 480;
    this.continueButton.eventMode = 'static';
    this.continueButton.cursor = 'pointer';
    this.continueButton.on('pointerdown', () => this.handleContinueClick());
    this.continueButton.on('pointerover', () => {
      this.continueButton.clear();
      this.continueButton.roundRect(0, 0, 200, 50, 8);
      this.continueButton.fill({ color: 0x66bb6a });
      this.continueButton.stroke({ color: 0x81c784, width: 2 });
    });
    this.continueButton.on('pointerout', () => {
      this.continueButton.clear();
      this.continueButton.roundRect(0, 0, 200, 50, 8);
      this.continueButton.fill({ color: 0x4caf50 });
      this.continueButton.stroke({ color: 0x66bb6a, width: 2 });
    });
    this.container.addChild(this.continueButton);

    this.continueButtonText = new Text({
      text: 'Continue',
      style: {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: '#ffffff',
        fontWeight: 'bold',
      },
    });
    this.continueButtonText.anchor.set(0.5);
    this.continueButtonText.x = 400;
    this.continueButtonText.y = 505;
    this.container.addChild(this.continueButtonText);
  }

  /**
   * TLDR: Show score summary with breakdown, milestone, and high scores
   */
  show(
    breakdown: ScoreBreakdown,
    milestone: MilestoneThreshold | null,
    personalBest: number,
    highScores: readonly HighScoreEntry[],
    isNewRecord: boolean,
  ): void {
    this.animationTime = 0;

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

    const lines: string[] = [];
    lines.push('📊 Score Breakdown:\n');
    lines.push(`  🌾 Harvests: ${breakdown.harvests}`);
    lines.push(`  🌈 Diversity: ${breakdown.diversity}`);
    lines.push(`  ✨ Perfection: ${breakdown.perfection}`);
    lines.push(`  ⚔️ Hazards: ${breakdown.hazards}`);
    lines.push('');
    lines.push(`  🎯 Total Score: ${breakdown.total}`);

    this.scoreBreakdownText.text = lines.join('\n');

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

  /**
   * TLDR: Update animation (call each frame with deltaMs)
   */
  update(deltaMs: number): void {
    if (!this.container.visible) return;

    this.animationTime += deltaMs;

    if (this.animationTime < this.animationDuration) {
      const progress = this.animationTime / this.animationDuration;
      this.container.alpha = Math.min(progress, 1.0);

      if (this.milestoneBadge.visible) {
        const scale = 0.8 + Math.sin(progress * Math.PI * 2) * 0.2;
        this.milestoneBadge.scale.set(scale);
      }
    } else {
      this.container.alpha = 1;
      this.milestoneBadge.scale.set(1);
    }
  }

  hide(): void {
    this.container.visible = false;
  }

  isVisible(): boolean {
    return this.container.visible;
  }

  setOnContinue(callback: () => void): void {
    this.onContinueCallback = callback;
  }

  private handleContinueClick(): void {
    this.hide();
    if (this.onContinueCallback) {
      this.onContinueCallback();
    }
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
