import { Container, Graphics, Text } from 'pixi.js';
import { COLORS } from '../config';

export interface SummaryData {
  harvestedSeeds: string[];
  encyclopediaUpdates: string[];
  unlocksEarned: string[];
}

/**
 * Day summary overlay — displays at season end
 * Shows harvested seeds, encyclopedia updates, and unlocks
 */
export class DaySummary extends Container {
  private overlay: Graphics;
  private titleText: Text;
  private contentContainer: Container;
  private continueButton: Container;
  private onContinue?: () => void;

  constructor(screenWidth: number, screenHeight: number) {
    super();
    this.visible = false;

    // Semi-transparent overlay
    this.overlay = new Graphics();
    this.overlay.rect(0, 0, screenWidth, screenHeight);
    this.overlay.fill({ color: COLORS.BLACK, alpha: 0.7 });
    this.addChild(this.overlay);

    // Main panel
    const panel = new Graphics();
    const panelWidth = 500;
    const panelHeight = 400;
    const panelX = (screenWidth - panelWidth) / 2;
    const panelY = (screenHeight - panelHeight) / 2;
    panel.rect(panelX, panelY, panelWidth, panelHeight);
    panel.fill({ color: COLORS.DARK_GREEN, alpha: 0.98 });
    panel.stroke({ color: COLORS.ACCENT_GREEN, width: 3 });
    this.addChild(panel);

    // Title
    this.titleText = new Text({
      text: '🌿 Season Complete 🌿',
      style: {
        fontFamily: 'Arial',
        fontSize: 28,
        fill: COLORS.PALE_GREEN,
        fontWeight: 'bold',
        align: 'center',
      },
    });
    this.titleText.anchor.set(0.5, 0);
    this.titleText.x = screenWidth / 2;
    this.titleText.y = panelY + 20;
    this.addChild(this.titleText);

    // Content container (scrollable area)
    this.contentContainer = new Container();
    this.contentContainer.x = panelX + 20;
    this.contentContainer.y = panelY + 70;
    this.addChild(this.contentContainer);

    // Continue button
    this.continueButton = this.createContinueButton();
    this.continueButton.x = screenWidth / 2 - 100;
    this.continueButton.y = panelY + panelHeight - 70;
    this.addChild(this.continueButton);
  }

  private createContinueButton(): Container {
    const button = new Container();
    button.eventMode = 'static';
    button.cursor = 'pointer';

    const bg = new Graphics();
    bg.rect(0, 0, 200, 50);
    bg.fill({ color: COLORS.ACCENT_GREEN });
    bg.stroke({ color: COLORS.LIGHT_GREEN, width: 2 });
    button.addChild(bg);

    const label = new Text({
      text: 'Continue',
      style: {
        fontFamily: 'Arial',
        fontSize: 18,
        fill: COLORS.WHITE,
        fontWeight: 'bold',
      },
    });
    label.anchor.set(0.5);
    label.x = 100;
    label.y = 25;
    button.addChild(label);

    button.on('pointerdown', () => {
      if (this.onContinue) {
        this.onContinue();
      }
    });

    return button;
  }

  show(data: SummaryData): void {
    this.contentContainer.removeChildren();
    let yOffset = 0;

    // Harvested seeds section
    if (data.harvestedSeeds.length > 0) {
      const harvestTitle = new Text({
        text: '🌾 Harvested Seeds:',
        style: {
          fontFamily: 'Arial',
          fontSize: 18,
          fill: COLORS.PALE_GREEN,
          fontWeight: 'bold',
        },
      });
      harvestTitle.y = yOffset;
      this.contentContainer.addChild(harvestTitle);
      yOffset += 25;

      data.harvestedSeeds.forEach((seed) => {
        const seedText = new Text({
          text: `  • ${seed}`,
          style: {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: COLORS.WHITE,
          },
        });
        seedText.y = yOffset;
        this.contentContainer.addChild(seedText);
        yOffset += 20;
      });
      yOffset += 10;
    }

    // Encyclopedia updates section
    if (data.encyclopediaUpdates.length > 0) {
      const encyclopediaTitle = new Text({
        text: '📚 Encyclopedia Updates:',
        style: {
          fontFamily: 'Arial',
          fontSize: 18,
          fill: COLORS.PALE_GREEN,
          fontWeight: 'bold',
        },
      });
      encyclopediaTitle.y = yOffset;
      this.contentContainer.addChild(encyclopediaTitle);
      yOffset += 25;

      data.encyclopediaUpdates.forEach((update) => {
        const updateText = new Text({
          text: `  • ${update}`,
          style: {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: COLORS.WHITE,
          },
        });
        updateText.y = yOffset;
        this.contentContainer.addChild(updateText);
        yOffset += 20;
      });
      yOffset += 10;
    }

    // Unlocks section
    if (data.unlocksEarned.length > 0) {
      const unlocksTitle = new Text({
        text: '✨ New Unlocks:',
        style: {
          fontFamily: 'Arial',
          fontSize: 18,
          fill: COLORS.PALE_GREEN,
          fontWeight: 'bold',
        },
      });
      unlocksTitle.y = yOffset;
      this.contentContainer.addChild(unlocksTitle);
      yOffset += 25;

      data.unlocksEarned.forEach((unlock) => {
        const unlockText = new Text({
          text: `  • ${unlock}`,
          style: {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: COLORS.ACCENT_GREEN,
          },
        });
        unlockText.y = yOffset;
        this.contentContainer.addChild(unlockText);
        yOffset += 20;
      });
    }

    this.visible = true;
  }

  hide(): void {
    this.visible = false;
  }

  setContinueCallback(callback: () => void): void {
    this.onContinue = callback;
  }

  destroy(): void {
    this.overlay.destroy();
    this.titleText.destroy();
    this.contentContainer.destroy({ children: true });
    this.continueButton.removeAllListeners();
    this.continueButton.destroy({ children: true });
    this.removeChildren();
    super.destroy();
  }
}
