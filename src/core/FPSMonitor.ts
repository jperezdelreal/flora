// TLDR: Dev-mode FPS counter with auto quality reduction below threshold

import { Container, Text, Graphics } from 'pixi.js';

/** TLDR: Quality tier for auto-downgrade when FPS drops */
export type QualityTier = 'high' | 'medium' | 'low';

/** TLDR: Callback fired when quality tier changes */
export type QualityChangeCallback = (tier: QualityTier) => void;

/**
 * TLDR: Measures real FPS, displays a counter in dev builds, and signals
 * quality tier changes when sustained drops are detected.
 */
export class FPSMonitor {
  private container: Container;
  private fpsText: Text;
  private bgPanel: Graphics;
  private frameTimes: number[] = [];
  private lastTime: number = 0;
  private currentFps: number = 60;
  private qualityTier: QualityTier = 'high';
  private lowFpsFrames: number = 0;
  private onQualityChange: QualityChangeCallback | null = null;
  private readonly enabled: boolean;
  private readonly sampleWindow: number = 60;
  private readonly lowFpsThreshold: number = 50;
  private readonly criticalFpsThreshold: number = 30;
  private readonly sustainedFramesForDowngrade: number = 180;

  constructor(enabled: boolean = false) {
    this.enabled = enabled;
    this.container = new Container();
    this.container.visible = enabled;

    // TLDR: Semi-transparent background
    this.bgPanel = new Graphics();
    this.bgPanel.roundRect(0, 0, 90, 30, 4);
    this.bgPanel.fill({ color: 0x000000, alpha: 0.7 });
    this.container.addChild(this.bgPanel);

    this.fpsText = new Text({
      text: 'FPS: --',
      style: {
        fontFamily: 'monospace',
        fontSize: 14,
        fill: '#00ff00',
        fontWeight: 'bold',
      },
    });
    this.fpsText.x = 8;
    this.fpsText.y = 6;
    this.container.addChild(this.fpsText);

    this.lastTime = performance.now();
  }

  /** TLDR: Register callback for quality tier transitions */
  setQualityChangeCallback(fn: QualityChangeCallback): void {
    this.onQualityChange = fn;
  }

  /** TLDR: Call once per rendered frame to sample timing */
  sample(): void {
    if (!this.enabled) return;

    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;

    if (delta <= 0) return;

    this.frameTimes.push(delta);
    if (this.frameTimes.length > this.sampleWindow) {
      this.frameTimes.shift();
    }

    // TLDR: Average FPS over the sample window
    const avgDelta =
      this.frameTimes.reduce((sum, d) => sum + d, 0) / this.frameTimes.length;
    this.currentFps = Math.round(1000 / avgDelta);

    this.updateDisplay();
    this.checkQualityTier();
  }

  private updateDisplay(): void {
    this.fpsText.text = `FPS: ${this.currentFps}`;

    // TLDR: Color-code by performance zone
    if (this.currentFps >= 55) {
      this.fpsText.style.fill = '#00ff00'; // Green — good
    } else if (this.currentFps >= this.lowFpsThreshold) {
      this.fpsText.style.fill = '#ffff00'; // Yellow — borderline
    } else {
      this.fpsText.style.fill = '#ff4444'; // Red — bad
    }
  }

  private checkQualityTier(): void {
    if (this.currentFps < this.lowFpsThreshold) {
      this.lowFpsFrames++;
    } else {
      // TLDR: Decay counter gradually so brief dips don't trigger downgrades
      this.lowFpsFrames = Math.max(0, this.lowFpsFrames - 2);
    }

    let newTier: QualityTier = 'high';

    if (this.currentFps < this.criticalFpsThreshold && this.lowFpsFrames > this.sustainedFramesForDowngrade / 2) {
      newTier = 'low';
    } else if (this.lowFpsFrames > this.sustainedFramesForDowngrade) {
      newTier = 'medium';
    }

    if (newTier !== this.qualityTier) {
      this.qualityTier = newTier;
      this.onQualityChange?.(newTier);
    }
  }

  /** TLDR: Position the overlay (top-right by default) */
  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  get fps(): number {
    return this.currentFps;
  }

  get quality(): QualityTier {
    return this.qualityTier;
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
