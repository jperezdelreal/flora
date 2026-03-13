import { Container, Text, Graphics, FederatedPointerEvent } from 'pixi.js';
import { HazardType } from '../entities/Hazard';
import { WeatherEventType } from '../systems/WeatherSystem';

export interface HazardTooltipData {
  type: HazardType | WeatherEventType;
  threat: string;
  mitigation: string[];
  severity: 'low' | 'medium' | 'high';
}

/**
 * TLDR: HazardTooltip shows hover tooltips for hazards with threat and mitigation details
 * Appears on hover over hazard icons or warnings
 */
export class HazardTooltip {
  private container: Container;
  private tooltipContainer: Container | null = null;
  private isVisible = false;

  constructor() {
    this.container = new Container();
  }

  /**
   * TLDR: Show tooltip with hazard details
   */
  show(data: HazardTooltipData, x: number, y: number): void {
    this.hide();

    this.tooltipContainer = new Container();
    this.tooltipContainer.x = x;
    this.tooltipContainer.y = y;

    const width = 320;
    const baseHeight = 60;
    const mitigationLineHeight = 20;
    const height = baseHeight + data.mitigation.length * mitigationLineHeight;

    const bg = new Graphics();
    bg.roundRect(0, 0, width, height, 6);
    bg.fill({ color: 0x1a1a1a, alpha: 0.95 });
    bg.stroke({ color: this.getSeverityColor(data.severity), width: 2 });
    this.tooltipContainer.addChild(bg);

    const titleText = new Text({
      text: `${this.getHazardIcon(data.type)} ${this.getHazardTitle(data.type)}`,
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: this.getSeverityColor(data.severity),
        fontWeight: 'bold',
      },
    });
    titleText.x = 10;
    titleText.y = 8;
    this.tooltipContainer.addChild(titleText);

    const threatText = new Text({
      text: `Threat: ${data.threat}`,
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: '#ffffff',
        wordWrap: true,
        wordWrapWidth: width - 20,
      },
    });
    threatText.x = 10;
    threatText.y = 32;
    this.tooltipContainer.addChild(threatText);

    const mitigationLabel = new Text({
      text: 'Mitigation:',
      style: {
        fontFamily: 'Arial',
        fontSize: 13,
        fill: '#ffd700',
        fontWeight: 'bold',
      },
    });
    mitigationLabel.x = 10;
    mitigationLabel.y = baseHeight;
    this.tooltipContainer.addChild(mitigationLabel);

    let mitigationY = baseHeight + 20;
    for (const tip of data.mitigation) {
      const tipText = new Text({
        text: `• ${tip}`,
        style: {
          fontFamily: 'Arial',
          fontSize: 12,
          fill: '#ffffff',
          wordWrap: true,
          wordWrapWidth: width - 30,
        },
      });
      tipText.x = 20;
      tipText.y = mitigationY;
      this.tooltipContainer.addChild(tipText);
      mitigationY += mitigationLineHeight;
    }

    this.container.addChild(this.tooltipContainer);
    this.isVisible = true;
  }

  /**
   * TLDR: Hide tooltip
   */
  hide(): void {
    if (this.tooltipContainer) {
      this.tooltipContainer.destroy({ children: true });
      this.tooltipContainer = null;
      this.isVisible = false;
    }
  }

  /**
   * TLDR: Check if tooltip is visible
   */
  getIsVisible(): boolean {
    return this.isVisible;
  }

  /**
   * TLDR: Get hazard icon
   */
  private getHazardIcon(type: HazardType | WeatherEventType): string {
    switch (type) {
      case HazardType.PEST:
        return '🐛';
      case HazardType.DROUGHT:
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
   * TLDR: Get hazard title
   */
  private getHazardTitle(type: HazardType | WeatherEventType): string {
    switch (type) {
      case HazardType.PEST:
        return 'Pest Infestation';
      case HazardType.DROUGHT:
      case WeatherEventType.DROUGHT:
        return 'Drought';
      case WeatherEventType.FROST:
        return 'Frost';
      case WeatherEventType.HEAVY_RAIN:
        return 'Heavy Rain';
      default:
        return 'Hazard';
    }
  }

  /**
   * TLDR: Get severity color
   */
  private getSeverityColor(severity: 'low' | 'medium' | 'high'): number {
    switch (severity) {
      case 'low':
        return 0xffeb3b;
      case 'medium':
        return 0xff9800;
      case 'high':
        return 0xf44336;
      default:
        return 0xffffff;
    }
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.hide();
    this.container.destroy({ children: true });
  }
}
