import { Container, Graphics, Text } from 'pixi.js';
import { SYNERGY_BONUSES, NEGATIVE_SYNERGY_EFFECTS } from '../config/synergies';

/**
 * TLDR: SynergyTooltip displays synergy tutorial, hover info, and negative synergy warnings
 */
export class SynergyTooltip {
  private container: Container;
  private background: Graphics;
  private titleText: Text;
  private descriptionText: Text;
  private warningContainer: Container;
  private warningBackground: Graphics;
  private warningTitleText: Text;
  private warningDescText: Text;
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

    // TLDR: Warning tooltip for negative synergies (separate container)
    this.warningContainer = new Container();
    this.warningContainer.visible = false;

    this.warningBackground = new Graphics();
    this.warningContainer.addChild(this.warningBackground);

    this.warningTitleText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: '#ff6b6b',
        fontWeight: 'bold',
      },
    });
    this.warningTitleText.x = 10;
    this.warningTitleText.y = 10;
    this.warningContainer.addChild(this.warningTitleText);

    this.warningDescText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 13,
        fill: '#ffaaaa',
        wordWrap: true,
        wordWrapWidth: 280,
      },
    });
    this.warningDescText.x = 10;
    this.warningDescText.y = 35;
    this.warningContainer.addChild(this.warningDescText);
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
   * TLDR: Show synergy info for plant (positive + negative)
   */
  showSynergyInfo(synergies: Set<string>, negativeSynergies?: Set<string>): void {
    if (synergies.size === 0 && (!negativeSynergies || negativeSynergies.size === 0)) {
      this.hide();
      return;
    }

    const positiveSynergyList = Array.from(synergies)
      .map((id) => {
        const bonus = SYNERGY_BONUSES[id];
        return bonus ? `🌟 ${bonus.name}` : '';
      })
      .filter((s) => s)
      .join('\n');

    const negativeSynergyList = negativeSynergies
      ? Array.from(negativeSynergies)
          .map((id) => {
            const effect = NEGATIVE_SYNERGY_EFFECTS[id];
            return effect ? `⚠️ ${effect.name}` : '';
          })
          .filter((s) => s)
          .join('\n')
      : '';

    const combined = [positiveSynergyList, negativeSynergyList].filter((s) => s).join('\n');

    this.titleText.text = 'Active Synergies';
    this.descriptionText.text = combined;

    this.updateBackground();
    this.container.visible = true;
    this.visible = true;
  }

  /**
   * TLDR: Show pre-planting warnings for negative synergies
   * Displayed before placing a plant to inform player of consequences
   */
  showPlantingWarnings(warnings: string[]): void {
    if (warnings.length === 0) {
      this.hideWarning();
      return;
    }

    this.warningTitleText.text = '⚠️ Planting Warnings';
    this.warningDescText.text = warnings.join('\n\n');

    this.updateWarningBackground();
    this.warningContainer.visible = true;
  }

  /**
   * TLDR: Hide warning tooltip
   */
  hideWarning(): void {
    this.warningContainer.visible = false;
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
   * TLDR: Update warning background with red accent
   */
  private updateWarningBackground(): void {
    const width = 300;
    const height = Math.max(60, this.warningDescText.height + 50);

    this.warningBackground.clear();
    this.warningBackground.roundRect(0, 0, width, height, 8);
    this.warningBackground.fill({ color: 0x1a1a1a, alpha: 0.95 });
    this.warningBackground.stroke({ color: 0xff4444, width: 2 });
  }

  /**
   * TLDR: Position tooltip on screen
   */
  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  /**
   * TLDR: Position warning tooltip
   */
  setWarningPosition(x: number, y: number): void {
    this.warningContainer.x = x;
    this.warningContainer.y = y;
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

  /**
   * TLDR: Get warning container for adding to scene
   */
  getWarningContainer(): Container {
    return this.warningContainer;
  }

  destroy(): void {
    this.container.destroy({ children: true });
    this.warningContainer.destroy({ children: true });
  }
}
