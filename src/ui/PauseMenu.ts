import { Container, Graphics, Text } from 'pixi.js';
import { audioManager } from '../systems';
import {
  cycleColorVisionMode,
  getAccessibilityPrefs,
  getColorVisionLabel,
} from '../utils/accessibility';
import { eventBus } from '../core/EventBus';

export interface PauseMenuCallbacks {
  onResume?: () => void;
  onRestart?: () => void;
  onEncyclopedia?: () => void;
  onAchievements?: () => void;
  onHowToPlay?: () => void;
  onMainMenu?: () => void;
}

/**
 * PauseMenu displays when player presses Escape:
 * - Resume
 * - Restart Run
 * - View Encyclopedia
 * - Main Menu
 * Semi-transparent dark overlay with keyboard navigation support.
 */
export class PauseMenu {
  private container: Container;
  private callbacks: PauseMenuCallbacks;
  private menuItems: { text: Text; button: Graphics; action: string }[] = [];
  private muteButton!: Graphics;
  private muteText!: Text;
  private colorblindButton!: Graphics;
  private colorblindText!: Text;
  private focusIndex: number = 0;
  private focusRing: Graphics;
  private boundKeyHandler: (e: KeyboardEvent) => void;

  constructor(callbacks: PauseMenuCallbacks = {}) {
    this.container = new Container();
    this.container.visible = false;
    this.callbacks = callbacks;

    // TLDR: Focus ring for keyboard navigation
    this.focusRing = new Graphics();
    this.focusRing.visible = false;

    // Full-screen semi-transparent overlay
    const overlay = new Graphics();
    overlay.rect(0, 0, 800, 600);
    overlay.fill({ color: 0x000000, alpha: 0.8 });
    this.container.addChild(overlay);

    // Menu panel (expanded for new options)
    const panel = new Graphics();
    panel.roundRect(250, 100, 300, 520, 16);
    panel.fill({ color: 0x1a1a1a, alpha: 0.98 });
    panel.stroke({ color: 0x4caf50, width: 3 });
    this.container.addChild(panel);

    // Title
    const title = new Text({
      text: 'PAUSED',
      style: {
        fontFamily: 'Arial',
        fontSize: 36,
        fill: '#c8e6c9',
        fontWeight: 'bold',
        align: 'center',
      },
    });
    title.anchor.set(0.5, 0);
    title.x = 400;
    title.y = 110;
    this.container.addChild(title);

    // Menu items
    const menuOptions = [
      { label: 'Resume', action: 'resume' },
      { label: 'Restart Run', action: 'restart' },
      { label: 'Encyclopedia', action: 'encyclopedia' },
      { label: 'Achievements', action: 'achievements' },
      { label: 'How to Play', action: 'howToPlay' },
      { label: 'Main Menu', action: 'mainMenu' },
    ];

    menuOptions.forEach((option, index) => {
      const y = 160 + index * 50;
      const item = this.createMenuItem(option.label, option.action, y);
      this.menuItems.push(item);
    });

    this.createMuteToggle();
    this.createColorblindToggle();

    // TLDR: Add focus ring on top of everything
    this.container.addChild(this.focusRing);

    // TLDR: Keyboard navigation handler
    this.boundKeyHandler = (e: KeyboardEvent) => {
      if (!this.container.visible) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          this.moveFocus(-1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          this.moveFocus(1);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          this.activateFocused();
          break;
        case 'Tab':
          e.preventDefault();
          this.moveFocus(e.shiftKey ? -1 : 1);
          break;
      }
    };
    window.addEventListener('keydown', this.boundKeyHandler);
  }

  /** TLDR: Total focusable items = menu items + mute + colorblind */
  private get totalFocusable(): number {
    return this.menuItems.length + 2;
  }

  /** TLDR: Move keyboard focus up or down the menu */
  private moveFocus(direction: number): void {
    this.focusIndex = (this.focusIndex + direction + this.totalFocusable) % this.totalFocusable;
    this.updateFocusRing();
  }

  /** TLDR: Activate the currently focused menu item */
  private activateFocused(): void {
    if (this.focusIndex < this.menuItems.length) {
      this.handleAction(this.menuItems[this.focusIndex].action);
    } else if (this.focusIndex === this.menuItems.length) {
      this.toggleMute();
    } else {
      this.toggleColorblind();
    }
  }

  /** TLDR: Draw visible focus ring around the focused button */
  private updateFocusRing(): void {
    this.focusRing.clear();
    this.focusRing.visible = true;

    let targetButton: Graphics;
    if (this.focusIndex < this.menuItems.length) {
      targetButton = this.menuItems[this.focusIndex].button;
    } else if (this.focusIndex === this.menuItems.length) {
      targetButton = this.muteButton;
    } else {
      targetButton = this.colorblindButton;
    }

    this.focusRing.roundRect(
      targetButton.x - 3,
      targetButton.y - 3,
      266,
      51,
      10,
    );
    this.focusRing.stroke({ color: 0xffff00, width: 3 });
  }

  private createMenuItem(label: string, action: string, y: number): { text: Text; button: Graphics; action: string } {
    const button = new Graphics();
    button.roundRect(0, 0, 260, 45, 8);
    button.fill({ color: 0x2a2a2a });
    button.stroke({ color: 0x4a4a4a, width: 2 });
    button.x = 270;
    button.y = y;
    button.eventMode = 'static';
    button.cursor = 'pointer';
    this.container.addChild(button);

    const text = new Text({
      text: label,
      style: {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: '#ffffff',
        fontWeight: 'bold',
        align: 'center',
      },
    });
    text.anchor.set(0.5);
    text.x = 400;
    text.y = y + 22;
    this.container.addChild(text);

    // Hover effects
    button.on('pointerover', () => {
      button.clear();
      button.roundRect(0, 0, 260, 45, 8);
      button.fill({ color: 0x4caf50 });
      button.stroke({ color: 0x66bb6a, width: 2 });
    });

    button.on('pointerout', () => {
      button.clear();
      button.roundRect(0, 0, 260, 45, 8);
      button.fill({ color: 0x2a2a2a });
      button.stroke({ color: 0x4a4a4a, width: 2 });
    });

    button.on('pointerdown', () => {
      this.handleAction(action);
    });

    return { text, button, action };
  }

  private handleAction(action: string): void {
    switch (action) {
      case 'resume':
        this.hide();
        if (this.callbacks.onResume) {
          this.callbacks.onResume();
        }
        break;
      case 'restart':
        this.hide();
        if (this.callbacks.onRestart) {
          this.callbacks.onRestart();
        }
        break;
      case 'encyclopedia':
        // Don't hide menu when viewing encyclopedia
        if (this.callbacks.onEncyclopedia) {
          this.callbacks.onEncyclopedia();
        }
        break;
      case 'achievements':
        if (this.callbacks.onAchievements) {
          this.callbacks.onAchievements();
        }
        break;
      case 'howToPlay':
        if (this.callbacks.onHowToPlay) {
          this.callbacks.onHowToPlay();
        }
        break;
      case 'mainMenu':
        this.hide();
        if (this.callbacks.onMainMenu) {
          this.callbacks.onMainMenu();
        }
        break;
    }
  }

  private createMuteToggle(): void {
    const y = 470;
    
    this.muteButton = new Graphics();
    this.muteButton.roundRect(0, 0, 260, 45, 8);
    this.muteButton.fill({ color: 0x2a2a2a });
    this.muteButton.stroke({ color: 0x4a4a4a, width: 2 });
    this.muteButton.x = 270;
    this.muteButton.y = y;
    this.muteButton.eventMode = 'static';
    this.muteButton.cursor = 'pointer';
    this.container.addChild(this.muteButton);

    this.muteText = new Text({
      text: this.getMuteLabel(),
      style: {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: '#ffffff',
        fontWeight: 'bold',
        align: 'center',
      },
    });
    this.muteText.anchor.set(0.5);
    this.muteText.x = 400;
    this.muteText.y = y + 22;
    this.container.addChild(this.muteText);

    this.muteButton.on('pointerover', () => {
      this.muteButton.clear();
      this.muteButton.roundRect(0, 0, 260, 45, 8);
      this.muteButton.fill({ color: 0x4caf50 });
      this.muteButton.stroke({ color: 0x66bb6a, width: 2 });
    });

    this.muteButton.on('pointerout', () => {
      this.muteButton.clear();
      this.muteButton.roundRect(0, 0, 260, 45, 8);
      this.muteButton.fill({ color: 0x2a2a2a });
      this.muteButton.stroke({ color: 0x4a4a4a, width: 2 });
    });

    this.muteButton.on('pointerdown', () => {
      this.toggleMute();
    });
  }

  /** TLDR: Colorblind mode toggle — cycles through vision modes */
  private createColorblindToggle(): void {
    const y = 525;

    this.colorblindButton = new Graphics();
    this.colorblindButton.roundRect(0, 0, 260, 45, 8);
    this.colorblindButton.fill({ color: 0x2a2a2a });
    this.colorblindButton.stroke({ color: 0x4a4a4a, width: 2 });
    this.colorblindButton.x = 270;
    this.colorblindButton.y = y;
    this.colorblindButton.eventMode = 'static';
    this.colorblindButton.cursor = 'pointer';
    this.container.addChild(this.colorblindButton);

    this.colorblindText = new Text({
      text: this.getColorblindLabel(),
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: '#ffffff',
        fontWeight: 'bold',
        align: 'center',
      },
    });
    this.colorblindText.anchor.set(0.5);
    this.colorblindText.x = 400;
    this.colorblindText.y = y + 22;
    this.container.addChild(this.colorblindText);

    this.colorblindButton.on('pointerover', () => {
      this.colorblindButton.clear();
      this.colorblindButton.roundRect(0, 0, 260, 45, 8);
      this.colorblindButton.fill({ color: 0x4caf50 });
      this.colorblindButton.stroke({ color: 0x66bb6a, width: 2 });
    });

    this.colorblindButton.on('pointerout', () => {
      this.colorblindButton.clear();
      this.colorblindButton.roundRect(0, 0, 260, 45, 8);
      this.colorblindButton.fill({ color: 0x2a2a2a });
      this.colorblindButton.stroke({ color: 0x4a4a4a, width: 2 });
    });

    this.colorblindButton.on('pointerdown', () => {
      this.toggleColorblind();
    });
  }

  private getColorblindLabel(): string {
    const prefs = getAccessibilityPrefs();
    const label = getColorVisionLabel(prefs.colorVisionMode);
    return `👁 ${label}`;
  }

  private toggleColorblind(): void {
    const newMode = cycleColorVisionMode();
    const label = getColorVisionLabel(newMode);
    this.colorblindText.text = `👁 ${label}`;
    eventBus.emit('accessibility:colorVisionChanged', { mode: newMode, label });
  }

  private getMuteLabel(): string {
    const muteState = audioManager.getMuteState();
    return muteState.master ? '🔇 Unmute Audio' : '🔊 Mute Audio';
  }

  private toggleMute(): void {
    const muteState = audioManager.getMuteState();
    const newMuteState = !muteState.master;
    audioManager.setMasterMute(newMuteState);
    this.muteText.text = this.getMuteLabel();
  }

  show(): void {
    this.container.visible = true;
    this.focusIndex = 0;
    this.updateFocusRing();
  }

  hide(): void {
    this.container.visible = false;
    this.focusRing.visible = false;
  }

  toggle(): void {
    this.container.visible = !this.container.visible;
  }

  isVisible(): boolean {
    return this.container.visible;
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    window.removeEventListener('keydown', this.boundKeyHandler);
    this.container.destroy({ children: true });
  }
}
