import { Application, Container, Graphics } from 'pixi.js';
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

export interface TransitionOptions {
  duration?: number; // seconds (default 0.4)
  color?: number; // fade color (default 0x000000)
}

const DEFAULT_TRANSITION: Required<TransitionOptions> = {
  duration: 0.4,
  color: 0x000000,
};

export class SceneManager {
  private scenes = new Map<string, Scene>();
  private current: Scene | null = null;
  private transitioning = false;
  readonly stage = new Container();
  private overlay: Graphics;
  private ctx!: SceneContext;

  constructor(
    private app: Application,
    input: InputManager,
    assets: AssetLoader,
  ) {
    app.stage.addChild(this.stage);

    // Full-screen overlay for fade transitions
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

  /** Switch scene with a fade transition */
  async transitionTo(
    name: string,
    options?: TransitionOptions,
  ): Promise<void> {
    if (this.transitioning) return;
    this.transitioning = true;

    const { duration, color } = { ...DEFAULT_TRANSITION, ...options };
    const halfDuration = duration / 2;

    // Draw overlay to match screen
    this.drawOverlay(color);

    // Fade out (current scene disappears)
    await this.animateAlpha(this.overlay, 0, 1, halfDuration);

    // Swap scenes
    if (this.current) {
      this.current.destroy();
      this.stage.removeChildren();
    }

    const next = this.scenes.get(name);
    if (!next) throw new Error(`Scene "${name}" not registered`);

    this.current = next;
    await next.init(this.ctx);

    // Fade in (new scene appears)
    await this.animateAlpha(this.overlay, 1, 0, halfDuration);

    this.transitioning = false;
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

  private drawOverlay(color: number): void {
    this.overlay.clear();
    this.overlay.rect(0, 0, this.app.screen.width, this.app.screen.height);
    this.overlay.fill({ color });
    // Ensure overlay is on top
    this.app.stage.setChildIndex(
      this.overlay,
      this.app.stage.children.length - 1,
    );
  }

  private animateAlpha(
    target: Graphics,
    from: number,
    to: number,
    duration: number,
  ): Promise<void> {
    return new Promise((resolve) => {
      let elapsed = 0;
      target.alpha = from;

      const step = (ticker: { deltaMS: number }) => {
        elapsed += ticker.deltaMS / 1000;
        const t = Math.min(elapsed / duration, 1);
        // Smooth ease-in-out
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        target.alpha = from + (to - from) * ease;

        if (t >= 1) {
          target.alpha = to;
          this.app.ticker.remove(step);
          resolve();
        }
      };
      this.app.ticker.add(step);
    });
  }
}
