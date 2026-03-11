import { Container, Graphics, Text } from 'pixi.js';
import { ToolType } from '../entities/Player';
import { ALL_TOOLS, ToolConfig } from '../config/tools';

export class ToolBar {
  private container: Container;
  private toolButtons: Map<ToolType, Graphics>;
  private toolTexts: Map<ToolType, Text>;
  private selectedTool: ToolType | null = null;
  private onToolSelect?: (tool: ToolType | null) => void;

  constructor() {
    this.container = new Container();
    this.toolButtons = new Map();
    this.toolTexts = new Map();
    this.initializeToolBar();
  }

  private initializeToolBar(): void {
    const buttonWidth = 80;
    const buttonHeight = 80;
    const padding = 10;

    ALL_TOOLS.forEach((tool, index) => {
      const buttonContainer = new Container();
      const x = index * (buttonWidth + padding);

      // Button background
      const button = new Graphics();
      button.rect(0, 0, buttonWidth, buttonHeight);
      button.fill({ color: 0x2c2c2c });
      button.stroke({ color: 0x4a4a4a, width: 2 });
      button.eventMode = 'static';
      button.cursor = 'pointer';

      button.on('pointerdown', () => {
        this.selectTool(tool.type);
      });

      button.on('pointerover', () => {
        button.clear();
        button.rect(0, 0, buttonWidth, buttonHeight);
        button.fill({ color: 0x3c3c3c });
        button.stroke({ color: 0x6a6a6a, width: 2 });
      });

      button.on('pointerout', () => {
        if (this.selectedTool !== tool.type) {
          button.clear();
          button.rect(0, 0, buttonWidth, buttonHeight);
          button.fill({ color: 0x2c2c2c });
          button.stroke({ color: 0x4a4a4a, width: 2 });
        }
      });

      buttonContainer.addChild(button);
      this.toolButtons.set(tool.type, button);

      // Tool icon
      const iconText = new Text({
        text: tool.icon,
        style: {
          fontSize: 32,
          align: 'center',
        },
      });
      iconText.anchor.set(0.5);
      iconText.x = buttonWidth / 2;
      iconText.y = buttonHeight / 2 - 10;
      buttonContainer.addChild(iconText);

      // Tool name
      const nameText = new Text({
        text: tool.displayName,
        style: {
          fontSize: 12,
          fill: '#ffffff',
          align: 'center',
        },
      });
      nameText.anchor.set(0.5);
      nameText.x = buttonWidth / 2;
      nameText.y = buttonHeight - 15;
      buttonContainer.addChild(nameText);
      this.toolTexts.set(tool.type, nameText);

      buttonContainer.x = x;
      this.container.addChild(buttonContainer);
    });
  }

  private selectTool(tool: ToolType): void {
    // Deselect previous tool
    if (this.selectedTool) {
      const prevButton = this.toolButtons.get(this.selectedTool);
      if (prevButton) {
        prevButton.clear();
        prevButton.rect(0, 0, 80, 80);
        prevButton.fill({ color: 0x2c2c2c });
        prevButton.stroke({ color: 0x4a4a4a, width: 2 });
      }
    }

    // Select new tool (or deselect if clicking same tool)
    if (this.selectedTool === tool) {
      this.selectedTool = null;
    } else {
      this.selectedTool = tool;
      const button = this.toolButtons.get(tool);
      if (button) {
        button.clear();
        button.rect(0, 0, 80, 80);
        button.fill({ color: 0x4a9eff });
        button.stroke({ color: 0x2d7acc, width: 3 });
      }
    }

    if (this.onToolSelect && this.selectedTool !== null) {
      this.onToolSelect(this.selectedTool);
    }
  }

  setSelectedTool(tool: ToolType | null): void {
    if (tool && tool !== this.selectedTool) {
      this.selectTool(tool);
    } else if (!tool && this.selectedTool) {
      this.selectTool(this.selectedTool); // Toggle off
    }
  }

  getSelectedTool(): ToolType | null {
    return this.selectedTool;
  }

  setOnToolSelect(callback: (tool: ToolType | null) => void): void {
    this.onToolSelect = callback;
  }

  position(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.container.destroy({ children: true });
    this.toolButtons.clear();
    this.toolTexts.clear();
  }
}
