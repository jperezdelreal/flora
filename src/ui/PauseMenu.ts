import { Container, Graphics, Text } from 'pixi.js';
import { audioManager } from '../systems';

export interface PauseMenuCallbacks {
  onResume?: () => void;
  onRestart?: () => void;
  onEncyclopedia?: () => void;
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

  constructor(callbacks: PauseMenuCallbacks = {}) {
    this.container = new Container();
    this.container.visible = false;
    this.callbacks = callbacks;

    // Full-screen semi-transparent overlay
    const overlay = new Graphics();
    overlay.rect(0, 0, 800, 600);
    overlay.fill({ color: 0x000000, alpha: 0.8 });
    this.container.addChild(overlay);

    // Menu panel
    const panel = new Graphics();
    panel.roundRect(250, 130, 300, 340, 16);
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
    title.y = 180;
    this.container.addChild(title);

    // Menu items
    const menuOptions = [
      { label: 'Resume', action: 'resume' },
      { label: 'Restart Run', action: 'restart' },
      { label: 'Encyclopedia', action: 'encyclopedia' },
      { label: 'Main Menu', action: 'mainMenu' },
    ];

    menuOptions.forEach((option, index) => {
      const y = 230 + index * 60;
      const item = this.createMenuItem(option.label, option.action, y);
      this.menuItems.push(item);
    });

    this.createMuteToggle();
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
      case 'mainMenu':
        this.hide();
        if (this.callbacks.onMainMenu) {
          this.callbacks.onMainMenu();
        }
        break;
    }
  }

  private createMuteToggle(): void {
    const y = 440;
    
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
  }

  hide(): void {
    this.container.visible = false;
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
    this.container.destroy({ children: true });
  }
}
