import { Container, Graphics, Text } from 'pixi.js';
import { UI_COLORS } from '../config';

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

    // TLDR: Full-screen semi-transparent overlay with warm tone
    const overlay = new Graphics();
    overlay.rect(0, 0, 800, 600);
    overlay.fill({ color: UI_COLORS.OVERLAY_DARK, alpha: 0.8 });
    this.container.addChild(overlay);

    // TLDR: Summary panel with warm cozy palette
    const panel = new Graphics();
    panel.roundRect(150, 100, 500, 400, 16);
    panel.fill({ color: UI_COLORS.MENU_PANEL_BG, alpha: 0.98 });
    panel.stroke({ color: UI_COLORS.MENU_PANEL_BORDER, width: 3 });
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
        fill: UI_COLORS.TEXT_PRIMARY,
        align: 'left',
        lineHeight: 24,
      },
    });
    this.summaryText.x = 200;
    this.summaryText.y = 200;
    this.container.addChild(this.summaryText);

    // TLDR: Next Season button with warm cozy palette
    this.nextButton = new Graphics();
    this.nextButton.roundRect(0, 0, 200, 50, 8);
    this.nextButton.fill({ color: UI_COLORS.MENU_ITEM_HOVER_BG });
    this.nextButton.stroke({ color: UI_COLORS.MENU_ITEM_HOVER_BORDER, width: 2 });
    this.nextButton.x = 300;
    this.nextButton.y = 420;
    this.nextButton.eventMode = 'static';
    this.nextButton.cursor = 'pointer';
    this.nextButton.on('pointerdown', () => this.handleNextClick());
    this.nextButton.on('pointerover', () => {
      this.nextButton.clear();
      this.nextButton.roundRect(0, 0, 200, 50, 8);
      this.nextButton.fill({ color: UI_COLORS.BUTTON_SELECTED_BG });
      this.nextButton.stroke({ color: UI_COLORS.BUTTON_SELECTED_BORDER, width: 2 });
    });
    this.nextButton.on('pointerout', () => {
      this.nextButton.clear();
      this.nextButton.roundRect(0, 0, 200, 50, 8);
      this.nextButton.fill({ color: UI_COLORS.MENU_ITEM_HOVER_BG });
      this.nextButton.stroke({ color: UI_COLORS.MENU_ITEM_HOVER_BORDER, width: 2 });
    });
    this.container.addChild(this.nextButton);

    this.nextButtonText = new Text({
      text: 'Next Season',
      style: {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: UI_COLORS.TEXT_PRIMARY,
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
