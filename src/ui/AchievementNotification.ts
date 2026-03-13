// TLDR: Toast-style popup for achievement unlocks — follows UnlockNotification pattern

import { Container, Graphics, Text } from 'pixi.js';
import type { AchievementConfig } from '../config/achievements';

/**
 * AchievementNotification displays a toast popup when an achievement
 * is unlocked. Auto-hides after 4.5 seconds with fade animation.
 * Queues multiple unlocks so none are lost.
 */
export class AchievementNotification {
  private container: Container;
  private background: Graphics;
  private titleText: Text;
  private nameText: Text;
  private descriptionText: Text;
  private iconText: Text;
  private rewardBadge: Graphics;
  private rewardText: Text;
  private timer = 0;
  private readonly duration = 4500;
  private readonly fadeInTime = 400;
  private readonly fadeOutTime = 600;
  private isActive = false;
  private queue: AchievementConfig[] = [];

  constructor() {
    this.container = new Container();
    this.container.visible = false;

    // TLDR: Semi-transparent background with purple/gold border
    this.background = new Graphics();
    this.background.roundRect(0, 0, 460, 190, 12);
    this.background.fill({ color: 0x1a1a2e, alpha: 0.95 });
    this.background.stroke({ color: 0xdaa520, width: 3 });
    this.container.addChild(this.background);

    // TLDR: "Achievement Unlocked!" header
    this.titleText = new Text({
      text: '🏆 Achievement Unlocked! 🏆',
      style: {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: '#daa520',
        fontWeight: 'bold',
        align: 'center',
      },
    });
    this.titleText.anchor.set(0.5, 0);
    this.titleText.x = 230;
    this.titleText.y = 12;
    this.container.addChild(this.titleText);

    // TLDR: Achievement icon (large emoji)
    this.iconText = new Text({
      text: '🌟',
      style: { fontSize: 44, align: 'center' },
    });
    this.iconText.anchor.set(0.5);
    this.iconText.x = 50;
    this.iconText.y = 95;
    this.container.addChild(this.iconText);

    // TLDR: Achievement name
    this.nameText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 22,
        fill: '#ffffff',
        fontWeight: 'bold',
        align: 'left',
      },
    });
    this.nameText.anchor.set(0, 0);
    this.nameText.x = 90;
    this.nameText.y = 50;
    this.container.addChild(this.nameText);

    // TLDR: Achievement description
    this.descriptionText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: '#c8c8c8',
        align: 'left',
        wordWrap: true,
        wordWrapWidth: 350,
      },
    });
    this.descriptionText.anchor.set(0, 0);
    this.descriptionText.x = 90;
    this.descriptionText.y = 82;
    this.container.addChild(this.descriptionText);

    // TLDR: Cosmetic reward badge
    this.rewardBadge = new Graphics();
    this.container.addChild(this.rewardBadge);

    this.rewardText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 13,
        fill: '#ffffff',
        fontWeight: 'bold',
        align: 'center',
      },
    });
    this.rewardText.anchor.set(0.5, 0.5);
    this.rewardText.x = 230;
    this.rewardText.y = 155;
    this.container.addChild(this.rewardText);
  }

  /** TLDR: Queue an achievement for display */
  show(config: AchievementConfig): void {
    if (this.isActive) {
      this.queue.push(config);
      return;
    }
    this.displayAchievement(config);
  }

  /** TLDR: Display a specific achievement immediately */
  private displayAchievement(config: AchievementConfig): void {
    this.isActive = true;
    this.timer = 0;

    this.iconText.text = config.icon;
    this.nameText.text = config.displayName;
    this.descriptionText.text = config.description;

    // TLDR: Format reward label based on type
    const reward = config.reward;
    let rewardLabel = '';
    switch (reward.type) {
      case 'seed_skin':
        rewardLabel = `🎨 Unlocked: ${reward.displayName}`;
        break;
      case 'hud_theme':
        rewardLabel = `🖌️ Unlocked: ${reward.displayName}`;
        break;
      case 'badge':
        rewardLabel = `🏅 Earned: ${reward.displayName}`;
        break;
    }
    this.rewardText.text = rewardLabel;

    // TLDR: Draw reward badge background
    this.rewardBadge.clear();
    this.rewardBadge.roundRect(90, 138, 280, 30, 8);
    this.rewardBadge.fill({ color: 0x6a0dad, alpha: 0.3 });
    this.rewardBadge.stroke({ color: 0x6a0dad, width: 2 });

    this.container.visible = true;
    this.container.alpha = 0;
  }

  /** TLDR: Update animation (call each frame with delta in milliseconds) */
  update(deltaMs: number): void {
    if (!this.isActive) return;

    this.timer += deltaMs;

    if (this.timer < this.fadeInTime) {
      this.container.alpha = this.timer / this.fadeInTime;
    } else if (this.timer < this.duration - this.fadeOutTime) {
      this.container.alpha = 1;
    } else if (this.timer < this.duration) {
      const fadeProgress = (this.timer - (this.duration - this.fadeOutTime)) / this.fadeOutTime;
      this.container.alpha = 1 - fadeProgress;
    } else {
      this.container.visible = false;
      this.container.alpha = 0;
      this.isActive = false;

      // TLDR: Show next queued achievement if any
      if (this.queue.length > 0) {
        const next = this.queue.shift()!;
        this.displayAchievement(next);
      }
    }
  }

  /** TLDR: Position the popup (top-center of screen, below HUD) */
  setPosition(screenWidth: number, _screenHeight: number): void {
    this.container.x = (screenWidth - 460) / 2;
    this.container.y = 90;
  }

  /** TLDR: Get the container for adding to scene */
  getContainer(): Container {
    return this.container;
  }

  /** TLDR: Check if popup is currently showing */
  isShowing(): boolean {
    return this.isActive;
  }

  /** TLDR: Destroy and cleanup */
  destroy(): void {
    this.queue = [];
    this.container.destroy({ children: true });
  }
}
