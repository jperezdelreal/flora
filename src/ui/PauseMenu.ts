import { Container, Graphics, Text } from 'pixi.js';
import { COLORS } from '../config';

export type MenuAction = 'resume' | 'main-menu' | 'restart' | 'encyclopedia';

/**
 * Pause menu overlay — provides navigation options
 * Pause → Main Menu, Restart Run, View Encyclopedia
 */
export class PauseMenu extends Container {
  private overlay: Graphics;
  private onAction?: (action: MenuAction) => void;

  constructor(screenWidth: number, screenHeight: number) {
    super();
    this.visible = false;

    // Semi-transparent overlay
    this.overlay = new Graphics();
    this.overlay.rect(0, 0, screenWidth, screenHeight);
    this.overlay.fill({ color: COLORS.BLACK, alpha: 0.7 });
    this.addChild(this.overlay);

    // Main panel
    const panel = new Graphics();
    const panelWidth = 400;
    const panelHeight = 350;
    const panelX = (screenWidth - panelWidth) / 2;
    const panelY = (screenHeight - panelHeight) / 2;
    panel.rect(panelX, panelY, panelWidth, panelHeight);
    panel.fill({ color: COLORS.DARK_GREEN, alpha: 0.98 });
    panel.stroke({ color: COLORS.ACCENT_GREEN, width: 3 });
    this.addChild(panel);

    // Title
    const title = new Text({
      text: '⏸️ Paused',
      style: {
        fontFamily: 'Arial',
        fontSize: 32,
        fill: COLORS.PALE_GREEN,
        fontWeight: 'bold',
        align: 'center',
      },
    });
    title.anchor.set(0.5, 0);
    title.x = screenWidth / 2;
    title.y = panelY + 30;
    this.addChild(title);

    // Menu buttons
    const buttonY = panelY + 100;
    const buttonSpacing = 70;

    this.addChild(this.createMenuButton('Resume', 'resume', screenWidth / 2 - 150, buttonY));
    this.addChild(
      this.createMenuButton('View Encyclopedia', 'encyclopedia', screenWidth / 2 - 150, buttonY + buttonSpacing)
    );
    this.addChild(
      this.createMenuButton('Restart Run', 'restart', screenWidth / 2 - 150, buttonY + buttonSpacing * 2)
    );
    this.addChild(
      this.createMenuButton('Main Menu', 'main-menu', screenWidth / 2 - 150, buttonY + buttonSpacing * 3)
    );
  }

  private createMenuButton(label: string, action: MenuAction, x: number, y: number): Container {
    const button = new Container();
    button.x = x;
    button.y = y;
    button.eventMode = 'static';
    button.cursor = 'pointer';

    const bg = new Graphics();
    bg.rect(0, 0, 300, 50);
    bg.fill({ color: COLORS.MID_GREEN, alpha: 0.9 });
    bg.stroke({ color: COLORS.PALE_GREEN, width: 2 });
    button.addChild(bg);
    (button as any).background = bg;

    const text = new Text({
      text: label,
      style: {
        fontFamily: 'Arial',
        fontSize: 18,
        fill: COLORS.WHITE,
        fontWeight: 'bold',
      },
    });
    text.anchor.set(0.5);
    text.x = 150;
    text.y = 25;
    button.addChild(text);

    // Hover effects
    button.on('pointerover', () => {
      bg.clear();
      bg.rect(0, 0, 300, 50);
      bg.fill({ color: COLORS.ACCENT_GREEN, alpha: 1 });
      bg.stroke({ color: COLORS.LIGHT_GREEN, width: 3 });
    });

    button.on('pointerout', () => {
      bg.clear();
      bg.rect(0, 0, 300, 50);
      bg.fill({ color: COLORS.MID_GREEN, alpha: 0.9 });
      bg.stroke({ color: COLORS.PALE_GREEN, width: 2 });
    });

    button.on('pointerdown', () => {
      if (this.onAction) {
        this.onAction(action);
      }
    });

    return button;
  }

  show(): void {
    this.visible = true;
  }

  hide(): void {
    this.visible = false;
  }

  setActionCallback(callback: (action: MenuAction) => void): void {
    this.onAction = callback;
  }
}
