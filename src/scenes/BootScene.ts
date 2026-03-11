import { Application, Graphics, Text, Container } from 'pixi.js';
import type { Scene } from '../core';

export class BootScene implements Scene {
  readonly name = 'boot';
  private container = new Container();

  async init(app: Application): Promise<void> {
    const sceneManager = app.stage.children[0] as Container;
    sceneManager.addChild(this.container);

    // Background gradient effect
    const bg = new Graphics();
    bg.rect(0, 0, app.screen.width, app.screen.height);
    bg.fill({ color: 0x2d5a27 });
    this.container.addChild(bg);

    // Title
    const title = new Text({
      text: '🌿 FLORA',
      style: {
        fontFamily: 'Arial',
        fontSize: 48,
        fill: '#88d498',
        align: 'center',
      },
    });
    title.anchor.set(0.5);
    title.x = app.screen.width / 2;
    title.y = app.screen.height / 2 - 40;
    this.container.addChild(title);

    // Subtitle
    const subtitle = new Text({
      text: 'A cozy gardening roguelite',
      style: {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: '#c8e6c9',
        align: 'center',
      },
    });
    subtitle.anchor.set(0.5);
    subtitle.x = app.screen.width / 2;
    subtitle.y = app.screen.height / 2 + 20;
    this.container.addChild(subtitle);

    // Studio credit
    const credit = new Text({
      text: 'First Frame Studios',
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: '#66bb6a',
        align: 'center',
      },
    });
    credit.anchor.set(0.5);
    credit.x = app.screen.width / 2;
    credit.y = app.screen.height - 40;
    this.container.addChild(credit);
  }

  update(_delta: number): void {
    // Boot scene is static — no per-frame updates
  }

  destroy(): void {
    this.container.destroy({ children: true });
    this.container = new Container();
  }
}
