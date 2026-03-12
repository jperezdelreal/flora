import { Container, Graphics, Text } from 'pixi.js';

/**
 * HUD displays game status information at the top of the screen:
 * - Day counter (Day X / 12) with circular progress
 * - Season indicator
 * - Day progress bar (time within current day)
 * - Actions remaining
 */
export class HUD {
  private container: Container;
  private dayText: Text;
  private seasonText: Text;
  private actionsText: Text;
  private dayProgressBar: Graphics;
  private dayProgressBarBg: Graphics;
  private dayCircle: Graphics;

  constructor() {
    this.container = new Container();

    // Semi-transparent background panel
    const bg = new Graphics();
    bg.roundRect(0, 0, 600, 60, 8);
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

  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
