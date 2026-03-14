import { Ticker } from 'pixi.js';
import type { FPSMonitor } from './FPSMonitor';

/**
 * Fixed-timestep game loop built on PixiJS v8 Ticker.
 * Accumulates real time and steps in fixed increments for deterministic updates.
 */
export class GameLoop {
  private accumulator = 0;
  private readonly fixedDt: number;
  private onFixedUpdate: ((dt: number) => void) | null = null;
  private onRender: ((alpha: number) => void) | null = null;
  private _frameCount = 0;
  private fpsMonitor: FPSMonitor | null = null;

  constructor(
    private ticker: Ticker,
    public readonly targetFps: number = 60,
  ) {
    this.fixedDt = 1 / targetFps;
  }

  /** Register the fixed-step update callback */
  setUpdateCallback(fn: (dt: number) => void): void {
    this.onFixedUpdate = fn;
  }

  /** Register the render interpolation callback */
  setRenderCallback(fn: (alpha: number) => void): void {
    this.onRender = fn;
  }

  /** TLDR: Attach an FPS monitor to sample every rendered frame */
  setFPSMonitor(monitor: FPSMonitor): void {
    this.fpsMonitor = monitor;
  }

  /** Total fixed-step frames elapsed since start */
  get frameCount(): number {
    return this._frameCount;
  }

  start(): void {
    this.ticker.maxFPS = this.targetFps;
    this.ticker.add(this.tick, this);
    this.ticker.start();
  }

  stop(): void {
    this.ticker.remove(this.tick, this);
  }

  private tick(ticker: Ticker): void {
    // ticker.deltaMS is milliseconds since last frame
    const dtSeconds = ticker.deltaMS / 1000;

    // Cap accumulator to prevent spiral of death (max 4 fixed steps per frame)
    this.accumulator += Math.min(dtSeconds, this.fixedDt * 4);

    while (this.accumulator >= this.fixedDt) {
      this.onFixedUpdate?.(this.fixedDt);
      this.accumulator -= this.fixedDt;
      this._frameCount++;
    }

    // Alpha for interpolation (0..1 between fixed steps)
    const alpha = this.accumulator / this.fixedDt;
    this.onRender?.(alpha);

    // TLDR: Sample FPS after each rendered frame
    this.fpsMonitor?.sample();
  }
}
