import { Container, Graphics, Text } from 'pixi.js';
import { COLORS } from '../config';

export interface HUDState {
  currentDay: number;
  totalDays: number;
  season: string;
}

/**
 * Main HUD — displays day counter, season, and day progress indicator
 * Positioned at top of screen
 */
export class HUD extends Container {
  private dayText: Text;
  private seasonText: Text;
  private progressBar: Graphics;
  private progressFill: Graphics;
  private state: HUDState;

  constructor() {
    super();
    this.state = { currentDay: 1, totalDays: 12, season: 'Spring' };

    // Background panel
    const panel = new Graphics();
    panel.rect(0, 0, 300, 80);
    panel.fill({ color: COLORS.DARK_GREEN, alpha: 0.85 });
    panel.stroke({ color: COLORS.ACCENT_GREEN, width: 2 });
    this.addChild(panel);

    // Season display
    this.seasonText = new Text({
      text: this.state.season,
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: COLORS.PALE_GREEN,
        fontWeight: 'bold',
      },
    });
    this.seasonText.anchor.set(0.5, 0);
    this.seasonText.x = 150;
    this.seasonText.y = 8;
    this.addChild(this.seasonText);

    // Day counter
    this.dayText = new Text({
      text: `Day ${this.state.currentDay} / ${this.state.totalDays}`,
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: COLORS.WHITE,
      },
    });
    this.dayText.anchor.set(0.5, 0);
    this.dayText.x = 150;
    this.dayText.y = 36;
    this.addChild(this.dayText);

    // Progress bar background
    this.progressBar = new Graphics();
    this.progressBar.rect(0, 0, 260, 12);
    this.progressBar.fill({ color: COLORS.SOIL_BROWN, alpha: 0.6 });
    this.progressBar.x = 20;
    this.progressBar.y = 60;
    this.addChild(this.progressBar);

    // Progress bar fill
    this.progressFill = new Graphics();
    this.progressFill.x = 20;
    this.progressFill.y = 60;
    this.addChild(this.progressFill);

    this.updateProgressBar();
  }

  updateState(newState: Partial<HUDState>): void {
    this.state = { ...this.state, ...newState };
    this.dayText.text = `Day ${this.state.currentDay} / ${this.state.totalDays}`;
    this.seasonText.text = this.state.season;
    this.updateProgressBar();
  }

  private updateProgressBar(): void {
    const progress = this.state.currentDay / this.state.totalDays;
    const barWidth = 260 * Math.min(progress, 1);

    this.progressFill.clear();
    this.progressFill.rect(0, 0, barWidth, 12);
    this.progressFill.fill({ color: COLORS.ACCENT_GREEN });
  }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  destroy(): void {
    this.dayText.destroy();
    this.seasonText.destroy();
    this.progressBar.destroy();
    this.progressFill.destroy();
    this.removeChildren();
    super.destroy();
  }
}
