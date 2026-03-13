import { Container, Graphics, Text } from 'pixi.js';
import { MilestoneConfig } from '../config/unlocks';

/**
 * TLDR: Toast-style notification for milestone unlocks
 * Shows for 4 seconds with fade-in/fade-out animation
 * Based on DiscoveryPopup pattern
 */
export class UnlockNotification {
  private container: Container;
  private background: Graphics;
  private titleText: Text;
  private milestoneNameText: Text;
  private descriptionText: Text;
  private iconText: Text;
  private rewardBadge: Graphics;
  private rewardText: Text;
  private timer = 0;
  private readonly duration = 4000; // 4 seconds
  private readonly fadeInTime = 400; // 0.4 seconds
  private readonly fadeOutTime = 600; // 0.6 seconds
  private isActive = false;

  constructor() {
    this.container = new Container();
    this.container.visible = false;

    // Semi-transparent background overlay with golden border
    this.background = new Graphics();
    this.background.roundRect(0, 0, 450, 180, 12);
    this.background.fill({ color: 0x1a1a1a, alpha: 0.95 });
    this.background.stroke({ color: 0xffd700, width: 3 });
    this.container.addChild(this.background);

    // "Milestone Unlocked!" title
    this.titleText = new Text({
      text: '🎉 Milestone Unlocked! 🎉',
      style: {
        fontFamily: 'Arial',
        fontSize: 22,
        fill: '#ffd700',
        fontWeight: 'bold',
        align: 'center',
      },
    });
    this.titleText.anchor.set(0.5, 0);
    this.titleText.x = 225;
    this.titleText.y = 15;
    this.container.addChild(this.titleText);

    // Milestone icon (large)
    this.iconText = new Text({
      text: '🌟',
      style: {
        fontSize: 40,
        align: 'center',
      },
    });
    this.iconText.anchor.set(0.5);
    this.iconText.x = 50;
    this.iconText.y = 90;
    this.container.addChild(this.iconText);

    // Milestone name
    this.milestoneNameText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: '#ffffff',
        fontWeight: 'bold',
        align: 'left',
      },
    });
    this.milestoneNameText.anchor.set(0, 0);
    this.milestoneNameText.x = 90;
    this.milestoneNameText.y = 55;
    this.container.addChild(this.milestoneNameText);

    // Description text
    this.descriptionText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: '#c8c8c8',
        align: 'left',
        wordWrap: true,
        wordWrapWidth: 340,
      },
    });
    this.descriptionText.anchor.set(0, 0);
    this.descriptionText.x = 90;
    this.descriptionText.y = 85;
    this.container.addChild(this.descriptionText);

    // Reward badge background
    this.rewardBadge = new Graphics();
    this.container.addChild(this.rewardBadge);

    // Reward text
    this.rewardText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: '#ffffff',
        fontWeight: 'bold',
        align: 'center',
      },
    });
    this.rewardText.anchor.set(0.5, 0.5);
    this.rewardText.x = 225;
    this.rewardText.y = 145;
    this.container.addChild(this.rewardText);
  }

  /**
   * TLDR: Show unlock notification for a milestone
   */
  show(milestone: MilestoneConfig): void {
    if (this.isActive) {
      return; // Don't show multiple popups simultaneously
    }

    this.isActive = true;
    this.timer = 0;

    // Update content
    this.iconText.text = milestone.icon;
    this.milestoneNameText.text = milestone.displayName;
    this.descriptionText.text = milestone.description;

    // Format reward text
    let rewardLabel = '';
    switch (milestone.rewardType) {
      case 'tool':
        rewardLabel = `Unlocked: ${milestone.rewardValue} tool!`;
        break;
      case 'grid_expansion':
        rewardLabel = `Garden expanded to ${milestone.rewardValue}!`;
        break;
      case 'ability':
        rewardLabel = `New ability unlocked!`;
        break;
    }
    this.rewardText.text = rewardLabel;

    // Draw reward badge
    this.rewardBadge.clear();
    this.rewardBadge.roundRect(90, 130, 270, 30, 8);
    this.rewardBadge.fill({ color: 0x4caf50, alpha: 0.3 });
    this.rewardBadge.stroke({ color: 0x4caf50, width: 2 });

    // Show container
    this.container.visible = true;
    this.container.alpha = 0;
  }

  /**
   * TLDR: Update animation (call each frame with delta in milliseconds)
   */
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

  /**
   * TLDR: Position the popup (top-center of screen)
   */
  setPosition(screenWidth: number, screenHeight: number): void {
    this.container.x = (screenWidth - 450) / 2;
    this.container.y = 80; // Below HUD
  }

  /**
   * TLDR: Get the container for adding to scene
   */
  getContainer(): Container {
    return this.container;
  }

  /**
   * TLDR: Check if popup is currently showing
   */
  isShowing(): boolean {
    return this.isActive;
  }

  /**
   * TLDR: Destroy and cleanup
   */
  destroy(): void {
    this.container.destroy({ children: true });
  }
}
