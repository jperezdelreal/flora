import { Container, Graphics, Text } from 'pixi.js';
import { SYNERGY_BONUSES } from '../config/synergies';

/**
 * TLDR: SynergyTooltip displays synergy tutorial and hover info
 */
export class SynergyTooltip {
  private container: Container;
  private background: Graphics;
  private titleText: Text;
  private descriptionText: Text;
  private visible = false;

  constructor() {
    this.container = new Container();
    this.container.visible = false;

    // Semi-transparent background
    this.background = new Graphics();
    this.container.addChild(this.background);

    // Title text
    this.titleText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: '#ffd700',
        fontWeight: 'bold',
      },
    });
    this.titleText.x = 10;
    this.titleText.y = 10;
    this.container.addChild(this.titleText);

    // Description text
    this.descriptionText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 13,
        fill: '#ffffff',
        wordWrap: true,
        wordWrapWidth: 280,
      },
    });
    this.descriptionText.x = 10;
    this.descriptionText.y = 35;
    this.container.addChild(this.descriptionText);
  }

  /**
   * TLDR: Show tutorial for first synergy activation
   */
  showTutorial(synergyId: string): void {
    const bonus = SYNERGY_BONUSES[synergyId];
    if (!bonus) return;

    this.titleText.text = `🌟 ${bonus.name}!`;
    this.descriptionText.text = `${bonus.description}\n\nPlant strategically to unlock more synergies!`;

    this.updateBackground();
    this.container.visible = true;
    this.visible = true;

    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.hide();
    }, 5000);
  }

  /**
   * TLDR: Show synergy info for plant
   */
  showSynergyInfo(synergies: Set<string>): void {
    if (synergies.size === 0) {
      this.hide();
      return;
    }

    const synergyList = Array.from(synergies)
      .map((id) => {
        const bonus = SYNERGY_BONUSES[id];
        return bonus ? `• ${bonus.name}` : '';
      })
      .filter((s) => s)
      .join('\n');

    this.titleText.text = 'Active Synergies';
    this.descriptionText.text = synergyList;

    this.updateBackground();
    this.container.visible = true;
    this.visible = true;
  }

  /**
   * TLDR: Hide tooltip
   */
  hide(): void {
    this.container.visible = false;
    this.visible = false;
  }

  /**
   * TLDR: Update background size to fit text
   */
  private updateBackground(): void {
    const width = 300;
    const height = Math.max(60, this.descriptionText.height + 50);

    this.background.clear();
    this.background.roundRect(0, 0, width, height, 8);
    this.background.fill({ color: 0x1a1a1a, alpha: 0.95 });
    this.background.stroke({ color: 0xffd700, width: 2 });
  }

  /**
   * TLDR: Position tooltip on screen
   */
  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  /**
   * TLDR: Center tooltip horizontally on screen
   */
  centerHorizontally(screenWidth: number): void {
    this.container.x = (screenWidth - 300) / 2;
    this.container.y = 150;
  }

  isVisible(): boolean {
    return this.visible;
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
