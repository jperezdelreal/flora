import { Graphics, Text, Container } from 'pixi.js';
import type { Scene, SceneContext } from '../core';
import { GAME, SCENES, COLORS, UI_COLORS } from '../config';

/**
 * Boot scene — shows studio splash + loading bar, then transitions to GardenScene.
 */
export class BootScene implements Scene {
  readonly name = 'boot';
  private container = new Container();
  private progressBar: Graphics | null = null;
  private hintText: Text | null = null;
  private progress = 0;
  private elapsedMs = 0;
  private ready = false;
  private transitioned = false;
  private transitioning = false;
  private boundOnInput: (() => void) | null = null;

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

    // TLDR: "Press any key" hint with pulse animation for better visibility
    this.hintText = new Text({
      text: 'Press any key to continue',
      style: {
        fontFamily: 'Arial',
        fontSize: 22,
        fill: UI_COLORS.TEXT_PRIMARY,
        align: 'center',
        fontWeight: 'bold',
      },
    });
    this.hintText.anchor.set(0.5);
    this.hintText.x = cx;
    this.hintText.y = cy + 80;
    this.hintText.alpha = 0;
    this.container.addChild(this.hintText);

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
    this.transitioning = false;
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

    // TLDR: Pulse animation for hint text once loading is complete
    if (this.progress >= 1 && this.hintText) {
      const pulseTime = (this.elapsedMs - GAME.BOOT_DURATION_MS) / 1000;
      const pulse = Math.sin(pulseTime * 2.5) * 0.3 + 0.7;
      this.hintText.alpha = Math.min(pulseTime / 0.5, 1) * pulse;
    }

    // TLDR: When loading completes, wait for real user input before transitioning
    if (this.progress >= 1 && !this.ready) {
      this.ready = true;
      this.setupInputListeners(ctx);
    }
  }

  // TLDR: Add keyboard/click/touch listeners that gate the boot-to-menu transition
  private setupInputListeners(ctx: SceneContext): void {
    this.boundOnInput = () => this.handleInput(ctx);
    window.addEventListener('keydown', this.boundOnInput);
    window.addEventListener('click', this.boundOnInput);
    window.addEventListener('touchstart', this.boundOnInput);
  }

  private handleInput(ctx: SceneContext): void {
    if (this.transitioning || this.transitioned) return;
    this.transitioning = true;
    this.removeInputListeners();
    ctx.sceneManager
      .transitionTo(SCENES.MENU, { type: 'loading', loadingMessage: 'Preparing the garden...' })
      .then(() => {
        this.transitioned = true;
      })
      .catch((error) => {
        console.error('Boot transition failed:', error);
        this.transitioned = true;
      });
  }

  private removeInputListeners(): void {
    if (this.boundOnInput) {
      window.removeEventListener('keydown', this.boundOnInput);
      window.removeEventListener('click', this.boundOnInput);
      window.removeEventListener('touchstart', this.boundOnInput);
      this.boundOnInput = null;
    }
  }

  destroy(): void {
    this.removeInputListeners();
    this.container.destroy({ children: true });
    this.container = new Container();
    this.progressBar = null;
    this.hintText = null;
  }
}
