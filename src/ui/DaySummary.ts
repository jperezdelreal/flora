import { Container, Graphics, Text } from 'pixi.js';

export interface DaySummaryData {
  day: number;
  seedsHarvested: { name: string; count: number }[];
  newDiscoveries: string[];
  encyclopediaProgress: { discovered: number; total: number };
}

/**
 * DaySummary displays an end-of-season summary overlay:
 * - Seeds harvested (count + types)
 * - Encyclopedia progress
 * - New discoveries
 * - "Next Season" button
 * Full-screen semi-transparent overlay with animated entrance.
 */
export class DaySummary {
  private container: Container;
  private titleText: Text;
  private summaryText: Text;
  private nextButton: Graphics;
  private nextButtonText: Text;
  private onNextCallback?: () => void;

  constructor() {
    this.container = new Container();
    this.container.visible = false;

    // Full-screen semi-transparent overlay
    const overlay = new Graphics();
    overlay.rect(0, 0, 800, 600);
    overlay.fill({ color: 0x000000, alpha: 0.7 });
    this.container.addChild(overlay);

    // Summary panel
    const panel = new Graphics();
    panel.roundRect(150, 100, 500, 400, 16);
    panel.fill({ color: 0x1a1a1a, alpha: 0.98 });
    panel.stroke({ color: 0x4caf50, width: 3 });
    this.container.addChild(panel);

    // Title
    this.titleText = new Text({
      text: '🌸 Season Complete!',
      style: {
        fontFamily: 'Arial',
        fontSize: 32,
        fill: '#c8e6c9',
        fontWeight: 'bold',
        align: 'center',
      },
    });
    this.titleText.anchor.set(0.5, 0);
    this.titleText.x = 400;
    this.titleText.y = 130;
    this.container.addChild(this.titleText);

    // Summary content
    this.summaryText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: '#ffffff',
        align: 'left',
        lineHeight: 24,
      },
    });
    this.summaryText.x = 200;
    this.summaryText.y = 200;
    this.container.addChild(this.summaryText);

    // Next Season button
    this.nextButton = new Graphics();
    this.nextButton.roundRect(0, 0, 200, 50, 8);
    this.nextButton.fill({ color: 0x4caf50 });
    this.nextButton.stroke({ color: 0x66bb6a, width: 2 });
    this.nextButton.x = 300;
    this.nextButton.y = 420;
    this.nextButton.eventMode = 'static';
    this.nextButton.cursor = 'pointer';
    this.nextButton.on('pointerdown', () => this.handleNextClick());
    this.nextButton.on('pointerover', () => {
      this.nextButton.clear();
      this.nextButton.roundRect(0, 0, 200, 50, 8);
      this.nextButton.fill({ color: 0x66bb6a });
      this.nextButton.stroke({ color: 0x81c784, width: 2 });
    });
    this.nextButton.on('pointerout', () => {
      this.nextButton.clear();
      this.nextButton.roundRect(0, 0, 200, 50, 8);
      this.nextButton.fill({ color: 0x4caf50 });
      this.nextButton.stroke({ color: 0x66bb6a, width: 2 });
    });
    this.container.addChild(this.nextButton);

    this.nextButtonText = new Text({
      text: 'Next Season',
      style: {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: '#ffffff',
        fontWeight: 'bold',
      },
    });
    this.nextButtonText.anchor.set(0.5);
    this.nextButtonText.x = 400;
    this.nextButtonText.y = 445;
    this.container.addChild(this.nextButtonText);
  }

  /**
   * Show summary with data
   */
  show(data: DaySummaryData): void {
    // Build summary text
    let summaryLines: string[] = [];

    summaryLines.push(`Day ${data.day} Complete!\n`);

    // Seeds harvested
    if (data.seedsHarvested.length > 0) {
      summaryLines.push('🌾 Seeds Harvested:');
      data.seedsHarvested.forEach(seed => {
        summaryLines.push(`  • ${seed.name}: ${seed.count}`);
      });
      summaryLines.push('');
    } else {
      summaryLines.push('🌾 No seeds harvested this season.\n');
    }

    // New discoveries
    if (data.newDiscoveries.length > 0) {
      summaryLines.push('✨ New Discoveries:');
      data.newDiscoveries.forEach(discovery => {
        summaryLines.push(`  • ${discovery}`);
      });
      summaryLines.push('');
    }

    // Encyclopedia progress
    const percent = Math.round((data.encyclopediaProgress.discovered / data.encyclopediaProgress.total) * 100);
    summaryLines.push(`📖 Encyclopedia: ${data.encyclopediaProgress.discovered}/${data.encyclopediaProgress.total} (${percent}%)`);

    this.summaryText.text = summaryLines.join('\n');

    // Show with fade-in animation
    this.container.alpha = 0;
    this.container.visible = true;
    this.fadeIn();
  }

  private fadeIn(): void {
    // Simple fade-in animation
    const fadeStep = () => {
      this.container.alpha += 0.05;
      if (this.container.alpha < 1) {
        requestAnimationFrame(fadeStep);
      }
    };
    fadeStep();
  }

  hide(): void {
    this.container.visible = false;
  }

  isVisible(): boolean {
    return this.container.visible;
  }

  setOnNext(callback: () => void): void {
    this.onNextCallback = callback;
  }

  private handleNextClick(): void {
    this.hide();
    if (this.onNextCallback) {
      this.onNextCallback();
    }
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
