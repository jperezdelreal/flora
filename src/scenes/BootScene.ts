import { Graphics, Text, Container } from 'pixi.js';
import type { Scene, SceneContext } from '../core';
import { GAME, SCENES, COLORS } from '../config';

/**
 * Boot scene — shows studio splash + loading bar, then transitions to GardenScene.
 */
export class BootScene implements Scene {
  readonly name = 'boot';
  private container = new Container();
  private progressBar: Graphics | null = null;
  private progress = 0;
  private elapsedMs = 0;
  private ready = false;
  private transitioned = false;

  async init(ctx: SceneContext): Promise<void> {
    const { app } = ctx;
    const sceneManager = app.stage.children[0] as Container;
    sceneManager.addChild(this.container);

    const cx = app.screen.width / 2;
    const cy = app.screen.height / 2;

    // Background
    const bg = new Graphics();
    bg.rect(0, 0, app.screen.width, app.screen.height);
    bg.fill({ color: COLORS.DARK_GREEN });
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
    title.x = cx;
    title.y = cy - 60;
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
    subtitle.x = cx;
    subtitle.y = cy - 10;
    this.container.addChild(subtitle);

    // Progress bar background
    const barWidth = 240;
    const barHeight = 12;
    const barBg = new Graphics();
    barBg.roundRect(cx - barWidth / 2, cy + 40, barWidth, barHeight, 6);
    barBg.fill({ color: 0x1a3a18 });
    this.container.addChild(barBg);

    // Progress bar fill
    this.progressBar = new Graphics();
    this.progressBar.x = cx - barWidth / 2;
    this.progressBar.y = cy + 40;
    this.container.addChild(this.progressBar);

    // Loading text
    const loadingText = new Text({
      text: 'Loading...',
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: '#66bb6a',
        align: 'center',
      },
    });
    loadingText.anchor.set(0.5);
    loadingText.x = cx;
    loadingText.y = cy + 70;
    this.container.addChild(loadingText);

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
    credit.x = cx;
    credit.y = app.screen.height - 40;
    this.container.addChild(credit);

    this.elapsedMs = 0;
    this.ready = false;
    this.transitioned = false;
  }

  update(dt: number, ctx: SceneContext): void {
    if (this.transitioned) return;

    // Simulate loading progress over BOOT_DURATION_MS
    this.elapsedMs += dt * 1000;
    this.progress = Math.min(this.elapsedMs / GAME.BOOT_DURATION_MS, 1);

    // Draw progress bar
    if (this.progressBar) {
      const barWidth = 240;
      const barHeight = 12;
      const fillWidth = barWidth * this.progress;
      this.progressBar.clear();
      if (fillWidth > 0) {
        this.progressBar.roundRect(0, 0, fillWidth, barHeight, 6);
        this.progressBar.fill({ color: COLORS.LIGHT_GREEN });
      }
    }

    if (this.progress >= 1 && !this.ready) {
      this.ready = true;
      this.transitioned = true;
      ctx.sceneManager
        .transitionTo(SCENES.MENU, { duration: 0.6 })
        .catch(console.error);
    }
  }

  destroy(): void {
    this.container.destroy({ children: true });
    this.container = new Container();
    this.progressBar = null;
  }
}
