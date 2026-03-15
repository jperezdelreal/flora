import { Container, Graphics, Text } from 'pixi.js';
import { PlantConfig } from '../entities/Plant';

const RARITY_COLORS = {
  common: 0x4caf50,    // Green
  uncommon: 0x2196f3,  // Blue
  rare: 0x9c27b0,      // Purple
  heirloom: 0xffd700,  // Gold
};

const RARITY_TEXT_COLORS = {
  common: '#4caf50',
  uncommon: '#2196f3',
  rare: '#9c27b0',
  heirloom: '#ffd700',
};

/**
 * DiscoveryPopup displays an animated notification when a new plant is discovered.
 * Shows for 3 seconds with fade-in/fade-out animation.
 */
export class DiscoveryPopup {
  private container: Container;
  private background: Graphics;
  private titleText: Text;
  private plantNameText: Text;
  private rarityBadge: Graphics;
  private rarityText: Text;
  private descriptionText: Text;
  private timer = 0;
  private readonly duration = 3000; // 3 seconds
  private readonly fadeInTime = 300; // 0.3 seconds
  private readonly fadeOutTime = 500; // 0.5 seconds
  private isActive = false;
  private lastRarity: string = 'common';

  constructor() {
    this.container = new Container();
    this.container.visible = false;

    // Semi-transparent background overlay
    this.background = new Graphics();
    this.background.rect(0, 0, 400, 200);
    this.background.fill({ color: 0x1a1a1a, alpha: 0.95 });
    this.background.stroke({ color: 0x4caf50, width: 3 });
    this.container.addChild(this.background);

    // "New Discovery!" title
    this.titleText = new Text({
      text: '✨ New Discovery! ✨',
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: '#f0f0f0',
        fontWeight: 'bold',
        align: 'center',
      },
    });
    this.titleText.anchor.set(0.5, 0);
    this.titleText.x = 200;
    this.titleText.y = 20;
    this.container.addChild(this.titleText);

    // Plant name
    this.plantNameText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 28,
        fill: '#ffffff',
        fontWeight: 'bold',
        align: 'center',
      },
    });
    this.plantNameText.anchor.set(0.5, 0);
    this.plantNameText.x = 200;
    this.plantNameText.y = 60;
    this.container.addChild(this.plantNameText);

    // Rarity badge background
    this.rarityBadge = new Graphics();
    this.container.addChild(this.rarityBadge);

    // Rarity text
    this.rarityText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: '#ffffff',
        fontWeight: 'bold',
        align: 'center',
      },
    });
    this.rarityText.anchor.set(0.5, 0.5);
    this.rarityText.x = 200;
    this.rarityText.y = 110;
    this.container.addChild(this.rarityText);

    // Description text
    this.descriptionText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: '#c8c8c8',
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 360,
      },
    });
    this.descriptionText.anchor.set(0.5, 0);
    this.descriptionText.x = 200;
    this.descriptionText.y = 140;
    this.container.addChild(this.descriptionText);
  }

  /** Show discovery popup for a plant */
  show(config: PlantConfig): void {
    if (this.isActive) {
      return; // Don't show multiple popups simultaneously
    }

    this.isActive = true;
    this.timer = 0;

    // Update content
    this.plantNameText.text = config.displayName;
    this.rarityText.text = config.rarity.toUpperCase();
    this.descriptionText.text = config.description;
    this.lastRarity = config.rarity;

    // Update rarity badge color
    const rarityColor = RARITY_COLORS[config.rarity];
    this.rarityBadge.clear();
    this.rarityBadge.roundRect(140, 95, 120, 30, 8);
    this.rarityBadge.fill({ color: rarityColor, alpha: 0.3 });
    this.rarityBadge.stroke({ color: rarityColor, width: 2 });

    // Update border color
    this.background.clear();
    this.background.rect(0, 0, 400, 200);
    this.background.fill({ color: 0x1a1a1a, alpha: 0.95 });
    this.background.stroke({ color: rarityColor, width: 3 });

    // Show container
    this.container.visible = true;
    this.container.alpha = 0;
  }

  /** Update animation (call each frame with delta in milliseconds) */
  update(deltaMs: number): void {
    if (!this.isActive) {
      return;
    }

    this.timer += deltaMs;

    // Fade in
    if (this.timer < this.fadeInTime) {
      this.container.alpha = this.timer / this.fadeInTime;
    }
    // Hold
    else if (this.timer < this.duration - this.fadeOutTime) {
      this.container.alpha = 1;
    }
    // Fade out
    else if (this.timer < this.duration) {
      const fadeProgress = (this.timer - (this.duration - this.fadeOutTime)) / this.fadeOutTime;
      this.container.alpha = 1 - fadeProgress;
    }
    // Hide
    else {
      this.container.visible = false;
      this.container.alpha = 0;
      this.isActive = false;
    }
  }

  /** Position the popup (center on screen) */
  setPosition(screenWidth: number, screenHeight: number): void {
    this.container.x = (screenWidth - 400) / 2;
    this.container.y = (screenHeight - 200) / 2;
  }

  /** Get the container for adding to scene */
  getContainer(): Container {
    return this.container;
  }

  /** Check if popup is currently showing */
  isShowing(): boolean {
    return this.isActive;
  }

  /** Check if the last shown plant was rare or higher */
  isRarePlus(): boolean {
    return this.lastRarity === 'rare' || this.lastRarity === 'heirloom';
  }

  /** Destroy and cleanup */
  destroy(): void {
    this.container.destroy({ children: true });
  }
}
