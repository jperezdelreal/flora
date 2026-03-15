// TLDR: Hover tooltip for placed structures — shows name, icon, description, and effect details

import { Container, Text, Graphics } from 'pixi.js';
import { StructureType, STRUCTURE_CONFIGS } from '../config/structures';

/** TLDR: Data needed to display a structure tooltip */
export interface StructureTooltipData {
  type: StructureType;
  row: number;
  col: number;
}

/**
 * TLDR: StructureTooltip renders a floating panel when the player hovers
 * over a placed structure tile, showing its name, icon, description, and
 * mechanical effect. Follows the same pattern as HazardTooltip.
 */
export class StructureTooltip {
  private container: Container;
  private tooltipContainer: Container | null = null;
  private isVisible = false;
  private currentKey = '';

  constructor() {
    this.container = new Container();
  }

  /** TLDR: Show tooltip at the given screen position for a structure type */
  show(data: StructureTooltipData, screenX: number, screenY: number, viewportWidth: number, viewportHeight: number): void {
    const key = `${data.type}_${data.row}_${data.col}`;
    if (this.isVisible && this.currentKey === key) return;

    this.hide();
    this.currentKey = key;

    const config = STRUCTURE_CONFIGS[data.type];
    if (!config) return;

    this.tooltipContainer = new Container();

    const width = 260;
    const height = 90;

    // TLDR: Position tooltip so it stays within the viewport
    let tx = screenX + 12;
    let ty = screenY - height - 8;

    if (tx + width > viewportWidth - 10) {
      tx = screenX - width - 12;
    }
    if (tx < 10) tx = 10;
    if (ty < 10) {
      ty = screenY + 24;
    }
    if (ty + height > viewportHeight - 10) {
      ty = viewportHeight - height - 10;
    }

    this.tooltipContainer.x = tx;
    this.tooltipContainer.y = ty;

    // Background panel
    const bg = new Graphics();
    bg.roundRect(0, 0, width, height, 8);
    bg.fill({ color: 0x1a1a1a, alpha: 0.95 });
    bg.stroke({ color: config.color, width: 2 });
    this.tooltipContainer.addChild(bg);

    // Title row: icon + name
    const titleText = new Text({
      text: `${config.icon} ${config.displayName}`,
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: '#ffffff',
        fontWeight: 'bold',
      },
    });
    titleText.x = 10;
    titleText.y = 10;
    this.tooltipContainer.addChild(titleText);

    // Description / effect
    const descText = new Text({
      text: config.description,
      style: {
        fontFamily: 'Arial',
        fontSize: 13,
        fill: '#c8e6c9',
        wordWrap: true,
        wordWrapWidth: width - 20,
      },
    });
    descText.x = 10;
    descText.y = 34;
    this.tooltipContainer.addChild(descText);

    // Effect detail line
    const effectLine = this.getEffectLine(data.type);
    if (effectLine) {
      const effectText = new Text({
        text: effectLine,
        style: {
          fontFamily: 'Arial',
          fontSize: 12,
          fill: '#ffd700',
          fontWeight: 'bold',
        },
      });
      effectText.x = 10;
      effectText.y = 66;
      this.tooltipContainer.addChild(effectText);
    }

    this.container.addChild(this.tooltipContainer);
    this.isVisible = true;
  }

  /** TLDR: Hide the tooltip */
  hide(): void {
    if (this.tooltipContainer) {
      this.tooltipContainer.destroy({ children: true });
      this.tooltipContainer = null;
      this.isVisible = false;
      this.currentKey = '';
    }
  }

  /** TLDR: Check if tooltip is currently visible */
  getIsVisible(): boolean {
    return this.isVisible;
  }

  /** TLDR: Get the PixiJS container for adding to scene graph */
  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.hide();
    this.container.destroy({ children: true });
  }

  /** TLDR: Return a concise mechanical effect string for each structure type */
  private getEffectLine(type: StructureType): string {
    switch (type) {
      case StructureType.GREENHOUSE:
        return '🌡️ +2 extra days per season';
      case StructureType.COMPOST_BIN:
        return '♻️ +15 soil quality when a plant dies nearby';
      case StructureType.RAIN_BARREL:
        return '💧 Auto-waters 2 adjacent tiles each day';
      case StructureType.TRELLIS:
        return '🌱 +25% yield for climbing plants';
      default:
        return '';
    }
  }
}
