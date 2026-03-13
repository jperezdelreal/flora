// TLDR: Brief "Saving…" toast shown in corner, subscribes to SaveManager events

import { Container, Text, Graphics } from 'pixi.js';
import type { SaveManager, SaveStateCallback } from '../systems/SaveManager';

/**
 * SaveIndicator — brief "Saving…" toast shown in a corner.
 * Subscribes to SaveManager save-state events and auto-hides.
 */
export class SaveIndicator {
  private container = new Container();
  private bg: Graphics;
  private label: Text;
  private fadeTimer: number | null = null;
  private boundOnSaveState: SaveStateCallback;
  private saveManager: SaveManager;

  constructor(saveManager: SaveManager) {
    this.saveManager = saveManager;

    // TLDR: Background pill
    this.bg = new Graphics();
    this.bg.roundRect(0, 0, 100, 28, 6);
    this.bg.fill({ color: 0x1a1a1a, alpha: 0.8 });
    this.container.addChild(this.bg);

    // TLDR: Label text
    this.label = new Text({
      text: '💾 Saving…',
      style: {
        fontFamily: 'Arial',
        fontSize: 13,
        fill: '#88d498',
        align: 'center',
      },
    });
    this.label.x = 10;
    this.label.y = 5;
    this.container.addChild(this.label);

    this.container.visible = false;

    // TLDR: Subscribe to save-state changes
    this.boundOnSaveState = (saving: boolean) => {
      if (saving) {
        this.show();
      } else {
        this.scheduleHide();
      }
    };
    this.saveManager.onSaveStateChange(this.boundOnSaveState);
  }

  /** TLDR: Position the indicator (typically top-right corner) */
  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  /** TLDR: Get the PixiJS container for scene attachment */
  getContainer(): Container {
    return this.container;
  }

  /** TLDR: Show the indicator immediately */
  private show(): void {
    if (this.fadeTimer !== null) {
      clearTimeout(this.fadeTimer);
      this.fadeTimer = null;
    }
    this.container.visible = true;
    this.container.alpha = 1;
  }

  /** TLDR: Hide after a short delay so the user can see it */
  private scheduleHide(): void {
    this.fadeTimer = window.setTimeout(() => {
      this.container.visible = false;
      this.fadeTimer = null;
    }, 600);
  }

  /** TLDR: Clean up resources and unsubscribe */
  destroy(): void {
    if (this.fadeTimer !== null) {
      clearTimeout(this.fadeTimer);
    }
    this.saveManager.offSaveStateChange(this.boundOnSaveState);
    this.container.destroy({ children: true });
  }
}
