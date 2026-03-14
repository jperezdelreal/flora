import { Application, Container, Graphics, Text } from 'pixi.js';
import type { InputManager } from './InputManager';
import type { AssetLoader } from './AssetLoader';

export interface SceneContext {
  app: Application;
  sceneManager: SceneManager;
  input: InputManager;
  assets: AssetLoader;
}

export interface Scene {
  readonly name: string;
  init(ctx: SceneContext): Promise<void>;
  update(dt: number, ctx: SceneContext): void;
  resize?(width: number, height: number): void;
  destroy(): void;
}

export type TransitionType = 'fade' | 'crossfade' | 'slide' | 'loading';

export interface TransitionOptions {
  type?: TransitionType;
  duration?: number; // seconds
  color?: number; // fade/loading overlay color (default 0x000000)
  holdDuration?: number; // seconds to hold between out/in (loading screen)
  loadingMessage?: string; // text shown during loading transition
}

type EasingFn = (t: number) => number;

const DEFAULT_DURATIONS: Record<TransitionType, number> = {
  fade: 0.4,
  crossfade: 0.6,
  slide: 0.5,
  loading: 0.8,
};

const DEFAULT_COLOR = 0x000000;
const DEFAULT_HOLD = 0.4;

export class SceneManager {
  private scenes = new Map<string, Scene>();
  private current: Scene | null = null;
  private transitioning = false;
  readonly stage = new Container();
  private overlay: Graphics;
  private loadingContainer: Container | null = null;
  private ctx!: SceneContext;

  constructor(
    private app: Application,
    input: InputManager,
    assets: AssetLoader,
  ) {
    app.stage.addChild(this.stage);

    // Full-screen overlay for transitions
    this.overlay = new Graphics();
    this.overlay.alpha = 0;
    app.stage.addChild(this.overlay);

    this.ctx = { app, sceneManager: this, input, assets };
  }

  register(...scenes: Scene[]): void {
    for (const scene of scenes) {
      this.scenes.set(scene.name, scene);
    }
  }

  /** TLDR: Retrieve a registered scene by name (for cross-scene communication) */
  getScene(name: string): Scene | undefined {
    return this.scenes.get(name);
  }

  /** Switch scene without transition */
  async switchTo(name: string): Promise<void> {
    if (this.current) {
      this.current.destroy();
      this.stage.removeChildren();
    }

    const next = this.scenes.get(name);
    if (!next) throw new Error(`Scene "${name}" not registered`);

    this.current = next;
    await next.init(this.ctx);
  }

  /** Switch scene with a visual transition */
  async transitionTo(
    name: string,
    options?: TransitionOptions,
  ): Promise<void> {
    if (this.transitioning) return;
    this.transitioning = true;

    const type = options?.type ?? 'fade';
    const duration = options?.duration ?? DEFAULT_DURATIONS[type];
    const color = options?.color ?? DEFAULT_COLOR;

    try {
      switch (type) {
        case 'fade':
          await this.fadeTransition(name, duration, color);
          break;
        case 'crossfade':
          await this.crossfadeTransition(name, duration);
          break;
        case 'slide':
          await this.slideTransition(name, duration);
          break;
        case 'loading':
          await this.loadingTransition(
            name,
            duration,
            color,
            options?.holdDuration ?? DEFAULT_HOLD,
            options?.loadingMessage ?? 'Loading...',
          );
          break;
      }
    } finally {
      this.transitioning = false;
    }
  }

  update(dt: number): void {
    if (!this.transitioning) {
      this.current?.update(dt, this.ctx);
    }
  }

  get activeScene(): Scene | null {
    return this.current;
  }

  get isTransitioning(): boolean {
    return this.transitioning;
  }

  // ── Transition implementations ──────────────────────────────────────

  /** Classic fade-through-black (or color) */
  private async fadeTransition(
    name: string,
    duration: number,
    color: number,
  ): Promise<void> {
    const half = duration / 2;
    this.drawOverlay(color);
    await this.animateAlpha(this.overlay, 0, 1, half, this.easeInOutCubic);
    await this.swapScenes(name);
    await this.animateAlpha(this.overlay, 1, 0, half, this.easeInOutCubic);
  }

  /** Old scene fades out while new scene fades in simultaneously */
  private async crossfadeTransition(
    name: string,
    duration: number,
  ): Promise<void> {
    // Snapshot current stage container
    const oldContainer = this.stage;

    // Create a temporary container for the new scene
    const newStage = new Container();
    newStage.alpha = 0;
    this.app.stage.addChildAt(newStage, this.app.stage.getChildIndex(oldContainer));

    // Swap internal stage reference so the new scene renders into newStage
    const next = this.scenes.get(name);
    if (!next) throw new Error(`Scene "${name}" not registered`);

    // Temporarily point the stage reference for init
    const origAddChild = this.stage.addChild.bind(this.stage);
    const proxyAddChild = (...args: Parameters<typeof origAddChild>) => newStage.addChild(...args);
    this.stage.addChild = proxyAddChild as typeof origAddChild;

    await next.init(this.ctx);

    // Restore addChild
    this.stage.addChild = origAddChild;

    // Crossfade: old out, new in
    await Promise.all([
      this.animateAlpha(oldContainer, 1, 0, duration, this.easeInOutCubic),
      this.animateAlpha(newStage, 0, 1, duration, this.easeInOutCubic),
    ]);

    // Teardown old scene
    if (this.current) {
      this.current.destroy();
      this.stage.removeChildren();
    }

    // Move new scene children from temp container into stage
    while (newStage.children.length > 0) {
      this.stage.addChild(newStage.children[0]);
    }
    newStage.destroy();
    oldContainer.alpha = 1;

    this.current = next;
  }

  /** Current scene slides out left, new scene slides in from right */
  private async slideTransition(
    name: string,
    duration: number,
  ): Promise<void> {
    const width = this.app.screen.width;

    // Create temp container for new scene off-screen right
    const newContainer = new Container();
    newContainer.x = width;
    this.app.stage.addChildAt(newContainer, this.app.stage.getChildIndex(this.stage));

    const next = this.scenes.get(name);
    if (!next) throw new Error(`Scene "${name}" not registered`);

    // Init new scene into the temp container
    const origAddChild = this.stage.addChild.bind(this.stage);
    const proxyAddChild = (...args: Parameters<typeof origAddChild>) => newContainer.addChild(...args);
    this.stage.addChild = proxyAddChild as typeof origAddChild;

    await next.init(this.ctx);
    this.stage.addChild = origAddChild;

    // Slide both containers simultaneously
    await Promise.all([
      this.animatePosition(this.stage, 'x', 0, -width, duration, this.easeInOutCubic),
      this.animatePosition(newContainer, 'x', width, 0, duration, this.easeInOutCubic),
    ]);

    // Teardown
    if (this.current) {
      this.current.destroy();
      this.stage.removeChildren();
    }

    while (newContainer.children.length > 0) {
      this.stage.addChild(newContainer.children[0]);
    }
    newContainer.destroy();
    this.stage.x = 0;
    this.current = next;
  }

  /** Fade to overlay with a loading message, swap, then fade back */
  private async loadingTransition(
    name: string,
    duration: number,
    color: number,
    holdDuration: number,
    message: string,
  ): Promise<void> {
    const half = duration / 2;
    this.drawOverlay(color);

    // Build loading UI
    this.loadingContainer = new Container();
    this.loadingContainer.alpha = 0;
    const cx = this.app.screen.width / 2;
    const cy = this.app.screen.height / 2;

    const loadingText = new Text({
      text: message,
      style: {
        fontFamily: 'Arial',
        fontSize: 22,
        fill: '#c8e6c9',
        align: 'center',
      },
    });
    loadingText.anchor.set(0.5);
    loadingText.x = cx;
    loadingText.y = cy;
    this.loadingContainer.addChild(loadingText);
    this.app.stage.addChild(this.loadingContainer);

    // Fade out current scene + show loading
    await Promise.all([
      this.animateAlpha(this.overlay, 0, 1, half, this.easeIn),
      this.animateAlpha(this.loadingContainer, 0, 1, half, this.easeIn),
    ]);

    // Swap scenes while overlay is opaque
    await this.swapScenes(name);

    // Hold for a beat so the message is visible
    await this.wait(holdDuration);

    // Fade in new scene + hide loading
    await Promise.all([
      this.animateAlpha(this.overlay, 1, 0, half, this.easeOut),
      this.animateAlpha(this.loadingContainer, 1, 0, half, this.easeOut),
    ]);

    // Cleanup loading UI
    this.loadingContainer.destroy({ children: true });
    this.loadingContainer = null;
  }

  // ── Helpers ─────────────────────────────────────────────────────────

  /** Destroy current scene and init the next one */
  private async swapScenes(name: string): Promise<void> {
    if (this.current) {
      this.current.destroy();
      this.stage.removeChildren();
    }
    const next = this.scenes.get(name);
    if (!next) throw new Error(`Scene "${name}" not registered`);
    this.current = next;
    await next.init(this.ctx);
  }

  /** Promise that resolves after `seconds` using the app ticker */
  private wait(seconds: number): Promise<void> {
    return new Promise((resolve) => {
      let elapsed = 0;
      const step = (ticker: { deltaMS: number }) => {
        elapsed += ticker.deltaMS / 1000;
        if (elapsed >= seconds) {
          this.app.ticker.remove(step);
          resolve();
        }
      };
      this.app.ticker.add(step);
    });
  }

  /** Animate a position property (x or y) over time */
  private animatePosition(
    target: Container,
    prop: 'x' | 'y',
    from: number,
    to: number,
    duration: number,
    easing: EasingFn,
  ): Promise<void> {
    return new Promise((resolve) => {
      let elapsed = 0;
      target[prop] = from;

      const step = (ticker: { deltaMS: number }) => {
        elapsed += ticker.deltaMS / 1000;
        const t = Math.min(elapsed / duration, 1);
        target[prop] = from + (to - from) * easing(t);

        if (t >= 1) {
          target[prop] = to;
          this.app.ticker.remove(step);
          resolve();
        }
      };
      this.app.ticker.add(step);
    });
  }

  /** Drive a progress callback from 0→1 over duration */
  private animateProgress(
    callback: (progress: number) => void,
    duration: number,
    easing: EasingFn,
  ): Promise<void> {
    return new Promise((resolve) => {
      let elapsed = 0;

      const step = (ticker: { deltaMS: number }) => {
        elapsed += ticker.deltaMS / 1000;
        const t = Math.min(elapsed / duration, 1);
        callback(easing(t));

        if (t >= 1) {
          callback(1);
          this.app.ticker.remove(step);
          resolve();
        }
      };
      this.app.ticker.add(step);
    });
  }

  private drawOverlay(color: number): void {
    this.overlay.clear();
    this.overlay.rect(0, 0, this.app.screen.width, this.app.screen.height);
    this.overlay.fill({ color });
    this.app.stage.setChildIndex(
      this.overlay,
      this.app.stage.children.length - 1,
    );
  }

  private animateAlpha(
    target: Container | Graphics,
    from: number,
    to: number,
    duration: number,
    easing: EasingFn = this.easeInOutCubic,
  ): Promise<void> {
    return new Promise((resolve) => {
      let elapsed = 0;
      target.alpha = from;

      const step = (ticker: { deltaMS: number }) => {
        elapsed += ticker.deltaMS / 1000;
        const t = Math.min(elapsed / duration, 1);
        target.alpha = from + (to - from) * easing(t);

        if (t >= 1) {
          target.alpha = to;
          this.app.ticker.remove(step);
          resolve();
        }
      };
      this.app.ticker.add(step);
    });
  }

  // ── Easing functions ────────────────────────────────────────────────

  private easeLinear(t: number): number {
    return t;
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private easeIn(t: number): number {
    return t * t * t;
  }
}

