import { Container, Text, Graphics } from 'pixi.js';
import { WeatherEventType } from '../systems/WeatherSystem';

export interface HazardWarningData {
  type: WeatherEventType;
  daysUntil: number;
  startDay: number;
  description: string;
  mitigation: string;
}

/**
 * TLDR: HazardWarning displays 2-day advance warnings for weather events
 * Shows visual warning banner with threat details and mitigation advice
 */
export class HazardWarning {
  private container: Container;
  private activeWarnings: Map<WeatherEventType, Container> = new Map();

  constructor() {
    this.container = new Container();
  }

  /**
   * TLDR: Show warning for upcoming weather event
   */
  showWarning(data: HazardWarningData): void {
    this.hideWarning(data.type);

    const warningContainer = new Container();

    const width = 500;
    const height = 90;

    const bg = new Graphics();
    bg.roundRect(0, 0, width, height, 8);
    bg.fill({ color: 0x2a1a0a, alpha: 0.95 });
    bg.stroke({ color: this.getWarningColor(data.type), width: 3 });
    warningContainer.addChild(bg);

    const icon = this.getWarningIcon(data.type);
    const titleText = new Text({
      text: `${icon} WARNING: ${this.getWarningTitle(data.type)} in ${data.daysUntil} day${data.daysUntil > 1 ? 's' : ''}`,
      style: {
        fontFamily: 'Arial',
        fontSize: 18,
        fill: this.getWarningColor(data.type),
        fontWeight: 'bold',
      },
    });
    titleText.x = 10;
    titleText.y = 8;
    warningContainer.addChild(titleText);

    const descText = new Text({
      text: data.description,
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: '#ffffff',
        wordWrap: true,
        wordWrapWidth: width - 20,
      },
    });
    descText.x = 10;
    descText.y = 32;
    warningContainer.addChild(descText);

    const mitigationText = new Text({
      text: `💡 ${data.mitigation}`,
      style: {
        fontFamily: 'Arial',
        fontSize: 13,
        fill: '#ffd700',
        wordWrap: true,
        wordWrapWidth: width - 20,
      },
    });
    mitigationText.x = 10;
    mitigationText.y = 58;
    warningContainer.addChild(mitigationText);

    this.activeWarnings.set(data.type, warningContainer);
    this.container.addChild(warningContainer);
    this.layoutWarnings();
  }

  /**
   * TLDR: Hide warning for specific weather event type
   */
  hideWarning(type: WeatherEventType): void {
    const warning = this.activeWarnings.get(type);
    if (warning) {
      warning.destroy({ children: true });
      this.activeWarnings.delete(type);
      this.layoutWarnings();
    }
  }

  /**
   * TLDR: Layout warnings vertically
   */
  private layoutWarnings(): void {
    let y = 0;
    for (const warning of this.activeWarnings.values()) {
      warning.y = y;
      y += 100;
    }
  }

  /**
   * TLDR: Get warning icon for event type
   */
  private getWarningIcon(type: WeatherEventType): string {
    switch (type) {
      case WeatherEventType.DROUGHT:
        return '☀️';
      case WeatherEventType.FROST:
        return '❄️';
      case WeatherEventType.HEAVY_RAIN:
        return '🌧️';
      default:
        return '⚠️';
    }
  }

  /**
   * TLDR: Get warning title for event type
   */
  private getWarningTitle(type: WeatherEventType): string {
    switch (type) {
      case WeatherEventType.DROUGHT:
        return 'DROUGHT';
      case WeatherEventType.FROST:
        return 'FROST';
      case WeatherEventType.HEAVY_RAIN:
        return 'HEAVY RAIN';
      default:
        return 'WEATHER EVENT';
    }
  }

  /**
   * TLDR: Get warning color for event type
   */
  private getWarningColor(type: WeatherEventType): number {
    switch (type) {
      case WeatherEventType.DROUGHT:
        return 0xff6f00;
      case WeatherEventType.FROST:
        return 0x64b5f6;
      case WeatherEventType.HEAVY_RAIN:
        return 0x4fc3f7;
      default:
        return 0xffeb3b;
    }
  }

  /**
   * TLDR: Position the warning UI
   */
  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  /**
   * TLDR: Clear all warnings
   */
  clearAll(): void {
    for (const warning of this.activeWarnings.values()) {
      warning.destroy({ children: true });
    }
    this.activeWarnings.clear();
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.clearAll();
    this.container.destroy({ children: true });
  }
}
