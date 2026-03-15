import { Container, Graphics, Text } from 'pixi.js';
import { UI_COLORS } from '../config';
import { ANIMATION } from '../config/animations';

export class RestButton {
  private container: Container;
  private button: Graphics;
  private buttonText: Text;
  private hintText: Text;
  private enabled = true;
  private onClick?: () => void;

  constructor() {
    this.container = new Container();

    const buttonWidth = 120;
    const buttonHeight = 50;

    // TLDR: Rest button with cozy warm styling
    this.button = new Graphics();
    this.button.roundRect(0, 0, buttonWidth, buttonHeight, 8);
    this.button.fill({ color: UI_COLORS.START_BUTTON_GREEN });
    this.button.stroke({ color: UI_COLORS.START_BUTTON_BORDER, width: 2 });
    this.button.eventMode = 'static';
    this.button.cursor = 'pointer';

    this.button.on('pointerdown', () => {
      if (this.enabled && this.onClick) {
        // TLDR: Click scale feedback
        this.container.scale.set(ANIMATION.BUTTON_CLICK_SCALE);
        setTimeout(() => {
          this.container.scale.set(1);
        }, ANIMATION.BUTTON_BOUNCE_DURATION * 1000);
        this.onClick();
      }
    });

    this.button.on('pointerover', () => {
      if (this.enabled) {
        // TLDR: Hover scale-up feedback
        this.container.scale.set(ANIMATION.BUTTON_HOVER_SCALE);
        this.button.clear();
        this.button.roundRect(0, 0, buttonWidth, buttonHeight, 8);
        this.button.fill({ color: UI_COLORS.START_BUTTON_HOVER_GREEN });
        this.button.stroke({ color: UI_COLORS.START_BUTTON_BORDER, width: 2 });
        
        // TLDR: Show hint on hover
        this.hintText.visible = true;
      }
    });

    this.button.on('pointerout', () => {
      // TLDR: Reset scale
      this.container.scale.set(1);
      this.updateButtonAppearance();
      
      // TLDR: Hide hint
      this.hintText.visible = false;
    });

    this.container.addChild(this.button);

    // TLDR: Button label with icon
    this.buttonText = new Text({
      text: '🌙 Rest',
      style: {
        fontSize: 18,
        fill: '#ffffff',
        align: 'center',
        fontWeight: 'bold',
      },
    });
    this.buttonText.anchor.set(0.5);
    this.buttonText.x = buttonWidth / 2;
    this.buttonText.y = buttonHeight / 2;
    this.container.addChild(this.buttonText);

    // TLDR: Hint text shown on hover
    this.hintText = new Text({
      text: 'Skip remaining actions\nRestore +5 soil quality\nAdvance to next day',
      style: {
        fontSize: 11,
        fill: UI_COLORS.TEXT_HINT,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 200,
      },
    });
    this.hintText.anchor.set(0.5, 1);
    this.hintText.x = buttonWidth / 2;
    this.hintText.y = -8;
    this.hintText.visible = false;
    this.container.addChild(this.hintText);
  }

  private updateButtonAppearance(): void {
    const buttonWidth = 120;
    const buttonHeight = 50;

    this.button.clear();
    this.button.roundRect(0, 0, buttonWidth, buttonHeight, 8);

    if (this.enabled) {
      // TLDR: Enabled state — warm green
      this.button.fill({ color: UI_COLORS.START_BUTTON_GREEN });
      this.button.stroke({ color: UI_COLORS.START_BUTTON_BORDER, width: 2 });
      this.buttonText.style.fill = '#ffffff';
      this.button.cursor = 'pointer';
      this.button.eventMode = 'static';
    } else {
      // TLDR: Disabled state — grayed out
      this.button.fill({ color: UI_COLORS.BUTTON_LOCKED_BG, alpha: 0.5 });
      this.button.stroke({ color: UI_COLORS.BUTTON_LOCKED_BORDER, width: 2 });
      this.buttonText.style.fill = UI_COLORS.TEXT_DISABLED;
      this.button.cursor = 'default';
      this.button.eventMode = 'none';
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.updateButtonAppearance();
  }

  setOnClick(callback: () => void): void {
    this.onClick = callback;
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
  }
}
