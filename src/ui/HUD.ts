import { Container, Graphics, Text } from 'pixi.js';
import { Season, SEASON_CONFIG } from '../config/seasons';

/**
 * HUD displays game status information at the top of the screen:
 * - Day counter (Day X / 12) with circular progress
 * - Season indicator
 * - Day progress bar (time within current day)
 * - Actions remaining
 * - Next unlock progress indicator
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

  constructor() {
    this.container = new Container();

    // Semi-transparent background panel (expanded height for unlock progress + score)
    const bg = new Graphics();
    bg.roundRect(0, 0, 600, 110, 8);
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

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
