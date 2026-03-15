import { Container, Graphics, Text } from 'pixi.js';
import { UI_COLORS } from '../config';
import { ANIMATION } from '../config/animations';
import { TIER_STARS, ToolTier } from '../config/tools';

// TLDR: Data for a tool upgrade notification
export interface ToolUpgradeData {
  toolName: string;
  toolIcon: string;
  newTier: ToolTier;
  tierName: string;
  description: string;
}

/**
 * TLDR: Toast-style notification for tool tier upgrades (#317)
 * Shows celebration when a tool upgrades, with stars + before/after description
 */
export class ToolUpgradeNotification {
  private container: Container;
  private background: Graphics;
  private titleText: Text;
  private toolNameText: Text;
  private iconText: Text;
  private starsText: Text;
  private descriptionText: Text;
  private timer = 0;
  private readonly duration = ANIMATION.TOOL_UPGRADE_TOAST_DURATION;
  private readonly fadeInTime = ANIMATION.TOOL_UPGRADE_TOAST_FADE_IN;
  private readonly fadeOutTime = ANIMATION.TOOL_UPGRADE_TOAST_FADE_OUT;
  private isActive = false;
  private queue: ToolUpgradeData[] = [];

  constructor() {
    this.container = new Container();
    this.container.visible = false;

    // TLDR: Semi-transparent bg with golden upgrade border
    this.background = new Graphics();
    this.background.roundRect(0, 0, 400, 140, 12);
    this.background.fill({ color: UI_COLORS.OVERLAY_DARK, alpha: 0.95 });
    this.background.stroke({ color: UI_COLORS.BUTTON_UPGRADE_HIGHLIGHT, width: 3 });
    this.container.addChild(this.background);

    this.titleText = new Text({
      text: '✨ Tool Upgraded! ✨',
      style: {
        fontFamily: 'Arial',
        fontSize: 18,
        fill: UI_COLORS.TEXT_TIER_STAR,
        fontWeight: 'bold',
        align: 'center',
      },
    });
    this.titleText.anchor.set(0.5, 0);
    this.titleText.x = 200;
    this.titleText.y = 12;
    this.container.addChild(this.titleText);

    this.iconText = new Text({
      text: '',
      style: { fontSize: 36, align: 'center' },
    });
    this.iconText.anchor.set(0.5);
    this.iconText.x = 45;
    this.iconText.y = 78;
    this.container.addChild(this.iconText);

    this.toolNameText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: UI_COLORS.TEXT_PRIMARY,
        fontWeight: 'bold',
        align: 'left',
      },
    });
    this.toolNameText.anchor.set(0, 0);
    this.toolNameText.x = 80;
    this.toolNameText.y = 42;
    this.container.addChild(this.toolNameText);

    this.starsText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 18,
        fill: UI_COLORS.TEXT_TIER_STAR,
        align: 'left',
      },
    });
    this.starsText.anchor.set(0, 0);
    this.starsText.x = 80;
    this.starsText.y = 68;
    this.container.addChild(this.starsText);

    this.descriptionText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 13,
        fill: UI_COLORS.TEXT_HINT,
        align: 'left',
        wordWrap: true,
        wordWrapWidth: 290,
      },
    });
    this.descriptionText.anchor.set(0, 0);
    this.descriptionText.x = 80;
    this.descriptionText.y = 95;
    this.container.addChild(this.descriptionText);
  }

  // TLDR: Show or queue an upgrade notification
  show(data: ToolUpgradeData): void {
    if (this.isActive) {
      this.queue.push(data);
      return;
    }
    this.displayNotification(data);
  }

  private displayNotification(data: ToolUpgradeData): void {
    this.isActive = true;
    this.timer = 0;

    this.iconText.text = data.toolIcon;
    this.toolNameText.text = `${data.tierName} ${data.toolName}`;
    this.starsText.text = TIER_STARS[data.newTier];
    this.descriptionText.text = data.description;

    this.container.visible = true;
    this.container.alpha = 0;
    this.container.scale.set(ANIMATION.TOOL_UPGRADE_TOAST_SCALE_START);
  }

  // TLDR: Update animation (call each frame with delta in milliseconds)
  update(deltaMs: number): void {
    if (!this.isActive) return;

    this.timer += deltaMs;

    if (this.timer < this.fadeInTime) {
      // TLDR: Scale-up + fade-in entrance
      const t = this.timer / this.fadeInTime;
      this.container.alpha = t;
      const scale = ANIMATION.TOOL_UPGRADE_TOAST_SCALE_START +
        (1 - ANIMATION.TOOL_UPGRADE_TOAST_SCALE_START) * this.easeOutBack(t);
      this.container.scale.set(scale);
    } else if (this.timer < this.duration - this.fadeOutTime) {
      this.container.alpha = 1;
      this.container.scale.set(1);
    } else if (this.timer < this.duration) {
      const fadeProgress = (this.timer - (this.duration - this.fadeOutTime)) / this.fadeOutTime;
      this.container.alpha = 1 - fadeProgress;
    } else {
      this.container.visible = false;
      this.container.alpha = 0;
      this.isActive = false;

      // TLDR: Process queue if more upgrades pending
      if (this.queue.length > 0) {
        this.displayNotification(this.queue.shift()!);
      }
    }
  }

  // TLDR: Elastic ease-out for bouncy entrance
  private easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  // TLDR: Position the toast (top-center below HUD)
  setPosition(screenWidth: number, _screenHeight: number): void {
    this.container.x = (screenWidth - 400) / 2;
    this.container.y = 60;
  }

  getContainer(): Container {
    return this.container;
  }

  isShowing(): boolean {
    return this.isActive;
  }

  destroy(): void {
    this.container.destroy({ children: true });
    this.queue = [];
  }
}
