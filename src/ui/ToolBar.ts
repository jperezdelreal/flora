import { Container, Graphics, Text } from 'pixi.js';
import { COLORS } from '../config';

export type ToolType = 'water' | 'harvest' | 'remove-pest';

export interface Tool {
  type: ToolType;
  label: string;
  icon: string;
}

/**
 * Bottom toolbar — displays available tools with icon + label
 * Highlights selected tool; emits tool selection events
 */
export class ToolBar extends Container {
  private tools: Tool[] = [
    { type: 'water', label: 'Water', icon: '💧' },
    { type: 'harvest', label: 'Harvest', icon: '🌾' },
    { type: 'remove-pest', label: 'Remove Pest', icon: '🐛' },
  ];
  private selectedTool: ToolType = 'water';
  private toolButtons: Map<ToolType, Container> = new Map();
  private onToolSelect?: (tool: ToolType) => void;

  constructor(width: number) {
    super();

    // Background panel
    const panel = new Graphics();
    panel.rect(0, 0, width, 80);
    panel.fill({ color: COLORS.DARK_GREEN, alpha: 0.9 });
    panel.stroke({ color: COLORS.ACCENT_GREEN, width: 2 });
    this.addChild(panel);

    // Layout tools horizontally
    const toolWidth = 140;
    const spacing = 20;
    const totalWidth = this.tools.length * toolWidth + (this.tools.length - 1) * spacing;
    const startX = (width - totalWidth) / 2;

    this.tools.forEach((tool, index) => {
      const button = this.createToolButton(tool);
      button.x = startX + index * (toolWidth + spacing);
      button.y = 10;
      this.addChild(button);
      this.toolButtons.set(tool.type, button);
    });

    this.updateSelection();
  }

  private createToolButton(tool: Tool): Container {
    const button = new Container();
    button.eventMode = 'static';
    button.cursor = 'pointer';

    // Button background
    const bg = new Graphics();
    bg.rect(0, 0, 140, 60);
    bg.fill({ color: COLORS.MID_GREEN, alpha: 0.8 });
    bg.stroke({ color: COLORS.PALE_GREEN, width: 2 });
    button.addChild(bg);
    (button as any).background = bg;

    // Icon
    const icon = new Text({
      text: tool.icon,
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
      },
    });
    icon.anchor.set(0.5, 0);
    icon.x = 70;
    icon.y = 8;
    button.addChild(icon);

    // Label
    const label = new Text({
      text: tool.label,
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: COLORS.WHITE,
        align: 'center',
      },
    });
    label.anchor.set(0.5, 0);
    label.x = 70;
    label.y = 38;
    button.addChild(label);

    // Interaction
    button.on('pointerdown', () => {
      this.selectTool(tool.type);
    });

    return button;
  }

  selectTool(type: ToolType): void {
    this.selectedTool = type;
    this.updateSelection();
    if (this.onToolSelect) {
      this.onToolSelect(type);
    }
  }

  private updateSelection(): void {
    this.toolButtons.forEach((button, type) => {
      const bg = (button as any).background as Graphics;
      bg.clear();
      bg.rect(0, 0, 140, 60);

      if (type === this.selectedTool) {
        // Highlighted selection
        bg.fill({ color: COLORS.ACCENT_GREEN, alpha: 1 });
        bg.stroke({ color: COLORS.LIGHT_GREEN, width: 3 });
      } else {
        // Normal state
        bg.fill({ color: COLORS.MID_GREEN, alpha: 0.8 });
        bg.stroke({ color: COLORS.PALE_GREEN, width: 2 });
      }
    });
  }

  setToolSelectCallback(callback: (tool: ToolType) => void): void {
    this.onToolSelect = callback;
  }

  getSelectedTool(): ToolType {
    return this.selectedTool;
  }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  destroy(): void {
    this.toolButtons.forEach((button) => {
      button.removeAllListeners();
      button.destroy({ children: true });
    });
    this.toolButtons.clear();
    this.removeChildren();
    super.destroy();
  }
}
