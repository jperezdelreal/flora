/**
 * TLDR: Touch gesture controller — tap, long-press, drag, pinch-to-zoom with pointer abstraction
 *
 * Unifies mouse and touch into a single PointerEvent-based system.
 * Uses PixiJS v8 pointer events on a Container, plus raw DOM events for pinch-to-zoom.
 */

import { Container, FederatedPointerEvent, Graphics } from 'pixi.js';
import { clamp } from '../utils';

// ─── Types ─────────────────────────────────────────────────────────────

/** TLDR: Recognized gesture types */
export type GestureType = 'tap' | 'long-press' | 'drag' | 'pinch';

/** TLDR: Pointer position in screen space */
export interface PointerPosition {
  x: number;
  y: number;
}

/** TLDR: Payload emitted for gesture callbacks */
export interface GestureEvent {
  type: GestureType;
  position: PointerPosition;
  /** TLDR: For drag — delta since last move */
  delta?: PointerPosition;
  /** TLDR: For pinch — current cumulative scale factor */
  scale?: number;
  /** TLDR: True if gesture originated from a touch (vs mouse) */
  isTouch: boolean;
}

/** TLDR: Callbacks consumers can register */
export interface TouchCallbacks {
  onTap?: (event: GestureEvent) => void;
  onLongPress?: (event: GestureEvent) => void;
  onDragStart?: (event: GestureEvent) => void;
  onDragMove?: (event: GestureEvent) => void;
  onDragEnd?: (event: GestureEvent) => void;
  onPinch?: (event: GestureEvent) => void;
  onPinchEnd?: (event: GestureEvent) => void;
}

/** TLDR: Configuration knobs for gesture thresholds */
export interface TouchConfig {
  longPressMs: number;
  dragThresholdPx: number;
  pinchMinScale: number;
  pinchMaxScale: number;
  hapticEnabled: boolean;
}

const DEFAULT_CONFIG: TouchConfig = {
  longPressMs: 500,
  dragThresholdPx: 10,
  pinchMinScale: 0.5,
  pinchMaxScale: 2.0,
  hapticEnabled: true,
};

// ─── Ripple Effect ─────────────────────────────────────────────────────

/** TLDR: Visual feedback ripple at touch point */
class TouchRipple {
  private graphics: Graphics;
  private elapsed = 0;
  private readonly duration = 0.35;
  private active = false;

  constructor(parent: Container) {
    this.graphics = new Graphics();
    this.graphics.alpha = 0;
    parent.addChild(this.graphics);
  }

  /** TLDR: Trigger ripple at screen position */
  play(x: number, y: number): void {
    this.graphics.x = x;
    this.graphics.y = y;
    this.elapsed = 0;
    this.active = true;
    this.graphics.alpha = 0.5;
  }

  /** TLDR: Animate ripple expansion and fade per frame */
  update(dt: number): void {
    if (!this.active) return;

    this.elapsed += dt;
    const t = Math.min(this.elapsed / this.duration, 1);

    const radius = 20 + t * 30;
    const alpha = 0.5 * (1 - t);

    this.graphics.clear();
    this.graphics.circle(0, 0, radius);
    this.graphics.stroke({ color: 0x88d498, width: 2, alpha });
    this.graphics.alpha = alpha;

    if (t >= 1) {
      this.active = false;
      this.graphics.alpha = 0;
    }
  }

  destroy(): void {
    this.graphics.destroy();
  }
}

// ─── Controller ────────────────────────────────────────────────────────

export class TouchController {
  private config: TouchConfig;
  private callbacks: TouchCallbacks = {};
  private ripple: TouchRipple;

  // TLDR: Pointer tracking state
  private pointerDown = false;
  private startPosition: PointerPosition = { x: 0, y: 0 };
  private lastPosition: PointerPosition = { x: 0, y: 0 };
  private isDragging = false;
  private isTouch = false;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private longPressFired = false;

  // TLDR: Pinch state (tracked via raw DOM touch events)
  private pinchActive = false;
  private pinchStartDistance = 0;
  private currentPinchScale = 1;
  private basePinchScale = 1;

  // TLDR: DOM event handlers (stored for cleanup)
  private boundTouchStart: (e: TouchEvent) => void;
  private boundTouchMove: (e: TouchEvent) => void;
  private boundTouchEnd: (e: TouchEvent) => void;
  private target: Container;

  constructor(target: Container, config?: Partial<TouchConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.target = target;
    this.ripple = new TouchRipple(target);

    // TLDR: PixiJS pointer events — unified mouse+touch for tap/drag/long-press
    target.eventMode = 'static';
    target.cursor = 'default';

    target.on('pointerdown', this.onPointerDown, this);
    target.on('pointermove', this.onPointerMove, this);
    target.on('pointerup', this.onPointerUp, this);
    target.on('pointerupoutside', this.onPointerUp, this);

    // TLDR: Raw DOM touch events for pinch-to-zoom (needs multi-touch)
    const canvas = document.querySelector('canvas');
    this.boundTouchStart = this.onRawTouchStart.bind(this);
    this.boundTouchMove = this.onRawTouchMove.bind(this);
    this.boundTouchEnd = this.onRawTouchEnd.bind(this);

    if (canvas) {
      canvas.addEventListener('touchstart', this.boundTouchStart, { passive: false });
      canvas.addEventListener('touchmove', this.boundTouchMove, { passive: false });
      canvas.addEventListener('touchend', this.boundTouchEnd, { passive: false });
    }
  }

  // ─── Public API ────────────────────────────────────────────────────

  /** TLDR: Register gesture callbacks */
  setCallbacks(callbacks: TouchCallbacks): void {
    this.callbacks = callbacks;
  }

  /** TLDR: Get the current pinch zoom scale */
  getPinchScale(): number {
    return this.currentPinchScale;
  }

  /** TLDR: Set the base pinch scale (e.g. when resetting zoom) */
  setBasePinchScale(scale: number): void {
    this.basePinchScale = scale;
    this.currentPinchScale = scale;
  }

  /** TLDR: Per-frame update — animates ripple */
  update(dt: number): void {
    this.ripple.update(dt);
  }

  /** TLDR: Trigger haptic feedback if supported and enabled */
  haptic(style: 'light' | 'medium' | 'heavy' = 'light'): void {
    if (!this.config.hapticEnabled) return;

    if ('vibrate' in navigator) {
      const durations: Record<string, number> = {
        light: 10,
        medium: 25,
        heavy: 50,
      };
      navigator.vibrate(durations[style]);
    }
  }

  destroy(): void {
    this.clearLongPressTimer();
    this.ripple.destroy();

    this.target.off('pointerdown', this.onPointerDown, this);
    this.target.off('pointermove', this.onPointerMove, this);
    this.target.off('pointerup', this.onPointerUp, this);
    this.target.off('pointerupoutside', this.onPointerUp, this);

    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.removeEventListener('touchstart', this.boundTouchStart);
      canvas.removeEventListener('touchmove', this.boundTouchMove);
      canvas.removeEventListener('touchend', this.boundTouchEnd);
    }
  }

  // ─── PixiJS Pointer Events (unified mouse+touch) ─────────────────

  private onPointerDown(e: FederatedPointerEvent): void {
    // TLDR: Skip single-pointer logic when pinch is active
    if (this.pinchActive) return;

    this.pointerDown = true;
    this.isDragging = false;
    this.longPressFired = false;
    this.isTouch = e.pointerType === 'touch';

    const pos = { x: e.globalX, y: e.globalY };
    this.startPosition = { ...pos };
    this.lastPosition = { ...pos };

    // TLDR: Start long-press timer
    this.clearLongPressTimer();
    this.longPressTimer = setTimeout(() => {
      if (this.pointerDown && !this.isDragging) {
        this.longPressFired = true;
        this.haptic('medium');
        this.callbacks.onLongPress?.({
          type: 'long-press',
          position: this.lastPosition,
          isTouch: this.isTouch,
        });
      }
    }, this.config.longPressMs);
  }

  private onPointerMove(e: FederatedPointerEvent): void {
    if (!this.pointerDown || this.pinchActive) return;

    const pos = { x: e.globalX, y: e.globalY };
    const dx = pos.x - this.startPosition.x;
    const dy = pos.y - this.startPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (!this.isDragging && distance > this.config.dragThresholdPx) {
      // TLDR: Crossed drag threshold — switch to drag mode, cancel long-press
      this.isDragging = true;
      this.clearLongPressTimer();

      this.callbacks.onDragStart?.({
        type: 'drag',
        position: this.startPosition,
        delta: { x: 0, y: 0 },
        isTouch: this.isTouch,
      });
    }

    if (this.isDragging) {
      const delta = {
        x: pos.x - this.lastPosition.x,
        y: pos.y - this.lastPosition.y,
      };
      this.callbacks.onDragMove?.({
        type: 'drag',
        position: pos,
        delta,
        isTouch: this.isTouch,
      });
    }

    this.lastPosition = { ...pos };
  }

  private onPointerUp(e: FederatedPointerEvent): void {
    if (this.pinchActive) return;

    this.clearLongPressTimer();

    if (this.isDragging) {
      this.callbacks.onDragEnd?.({
        type: 'drag',
        position: { x: e.globalX, y: e.globalY },
        isTouch: this.isTouch,
      });
    } else if (!this.longPressFired) {
      // TLDR: Short tap — emit tap gesture + visual ripple + haptic
      const pos = { x: e.globalX, y: e.globalY };
      this.ripple.play(pos.x, pos.y);
      this.haptic('light');
      this.callbacks.onTap?.({
        type: 'tap',
        position: pos,
        isTouch: this.isTouch,
      });
    }

    this.pointerDown = false;
    this.isDragging = false;
    this.longPressFired = false;
  }

  // ─── Raw DOM Touch Events (pinch-to-zoom) ─────────────────────────

  private onRawTouchStart(e: TouchEvent): void {
    if (e.touches.length === 2) {
      e.preventDefault();
      this.pinchActive = true;
      this.clearLongPressTimer();
      this.isDragging = false;
      this.pointerDown = false;
      this.pinchStartDistance = this.getTouchDistance(e.touches[0], e.touches[1]);
      this.basePinchScale = this.currentPinchScale;
    }
  }

  private onRawTouchMove(e: TouchEvent): void {
    if (!this.pinchActive || e.touches.length < 2) return;
    e.preventDefault();

    const dist = this.getTouchDistance(e.touches[0], e.touches[1]);
    const rawScale = (dist / this.pinchStartDistance) * this.basePinchScale;
    this.currentPinchScale = clamp(rawScale, this.config.pinchMinScale, this.config.pinchMaxScale);

    const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

    this.callbacks.onPinch?.({
      type: 'pinch',
      position: { x: midX, y: midY },
      scale: this.currentPinchScale,
      isTouch: true,
    });
  }

  private onRawTouchEnd(e: TouchEvent): void {
    if (this.pinchActive && e.touches.length < 2) {
      this.pinchActive = false;

      this.callbacks.onPinchEnd?.({
        type: 'pinch',
        position: this.lastPosition,
        scale: this.currentPinchScale,
        isTouch: true,
      });
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────

  private getTouchDistance(a: Touch, b: Touch): number {
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private clearLongPressTimer(): void {
    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }
}
