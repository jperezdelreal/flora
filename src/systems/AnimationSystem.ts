import type { System } from './index';

/**
 * TLDR: Lightweight tweening engine — drives scale, alpha, position, rotation on any target
 * Every animation is a tiny promise: your plants are okay.
 */

export type EasingFn = (t: number) => number;

export const Easing = {
  linear: (t: number): number => t,
  easeInOut: (t: number): number =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  easeOut: (t: number): number => 1 - Math.pow(1 - t, 3),
  easeIn: (t: number): number => t * t * t,
  backOut: (t: number): number => {
    // TLDR: Slight overshoot then settle — juicy growth pop
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  elasticOut: (t: number): number => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  },
} as const;

interface Tween {
  id: string;
  target: Record<string, unknown>;
  properties: Record<string, { from: number; to: number }>;
  duration: number;
  elapsed: number;
  easing: EasingFn;
  onComplete?: () => void;
  onUpdate?: () => void;
}

export interface TweenOptions {
  easing?: EasingFn;
  onComplete?: () => void;
  onUpdate?: () => void;
  id?: string;
}

export class AnimationSystem implements System {
  readonly name = 'AnimationSystem';
  private tweens: Map<string, Tween> = new Map();
  private tweenCounter = 0;

  /**
   * TLDR: Tween numeric properties on any object over duration (seconds)
   * Returns tween ID for cancellation.
   */
  tween(
    target: Record<string, unknown>,
    properties: Record<string, number>,
    duration: number,
    options?: TweenOptions,
  ): string {
    const id = options?.id ?? `tween_${this.tweenCounter++}`;

    const props: Record<string, { from: number; to: number }> = {};
    for (const [key, to] of Object.entries(properties)) {
      props[key] = { from: target[key] as number, to };
    }

    this.tweens.set(id, {
      id,
      target,
      properties: props,
      duration,
      elapsed: 0,
      easing: options?.easing ?? Easing.easeInOut,
      onComplete: options?.onComplete,
      onUpdate: options?.onUpdate,
    });

    return id;
  }

  /**
   * TLDR: Chain two tweens — scale up then back down (bounce effect)
   */
  scaleBounce(
    target: Record<string, unknown>,
    peakScale: number,
    restScale: number,
    duration: number,
  ): void {
    const halfDur = duration / 2;
    this.tween(target, { scaleX: peakScale, scaleY: peakScale }, halfDur, {
      easing: Easing.easeOut,
      onComplete: () => {
        this.tween(target, { scaleX: restScale, scaleY: restScale }, halfDur, {
          easing: Easing.easeIn,
        });
      },
    });
  }

  cancel(id: string): void {
    this.tweens.delete(id);
  }

  update(delta: number): void {
    // TLDR: delta is frame-based (1.0 = one frame at 60fps)
    const dt = delta / 60;
    const completed: string[] = [];

    for (const [id, tween] of this.tweens) {
      tween.elapsed += dt;
      const t = Math.min(tween.elapsed / tween.duration, 1);
      const easedT = tween.easing(t);

      for (const [key, { from, to }] of Object.entries(tween.properties)) {
        (tween.target as Record<string, number>)[key] = from + (to - from) * easedT;
      }

      tween.onUpdate?.();

      if (t >= 1) {
        completed.push(id);
        tween.onComplete?.();
      }
    }

    for (const id of completed) {
      this.tweens.delete(id);
    }
  }

  get activeTweenCount(): number {
    return this.tweens.size;
  }

  destroy(): void {
    this.tweens.clear();
  }
}
