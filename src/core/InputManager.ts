/**
 * TLDR: Unified input manager — keyboard + pointer (mouse/touch) with per-frame edge detection
 */

export type Action =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'confirm'
  | 'cancel'
  | 'pause'
  | 'interact';

export type KeyBindings = Record<Action, string[]>;

/** TLDR: Pointer state snapshot for consumers that need cursor/touch position */
export interface PointerState {
  /** TLDR: True while any pointer (mouse or touch) is held down */
  isDown: boolean;
  /** TLDR: True on the frame a pointer went down */
  justPressed: boolean;
  /** TLDR: True on the frame a pointer was released */
  justReleased: boolean;
  /** TLDR: Last known pointer position (screen coords) */
  x: number;
  y: number;
  /** TLDR: True when the current pointer is touch (vs mouse) */
  isTouch: boolean;
}

const DEFAULT_BINDINGS: KeyBindings = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  confirm: ['Enter', 'Space'],
  cancel: ['Escape', 'Backspace'],
  pause: ['KeyP', 'Escape'],
  interact: ['KeyE', 'Space'],
};

export class InputManager {
  private keysDown = new Set<string>();
  private keysPressed = new Set<string>();
  private keysReleased = new Set<string>();
  private bindings: KeyBindings;
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;

  // TLDR: Unified pointer state — mouse and touch produce the same data
  private _pointer: PointerState = {
    isDown: false,
    justPressed: false,
    justReleased: false,
    x: 0,
    y: 0,
    isTouch: false,
  };
  private boundPointerDown: (e: PointerEvent) => void;
  private boundPointerMove: (e: PointerEvent) => void;
  private boundPointerUp: (e: PointerEvent) => void;

  constructor(bindings?: Partial<KeyBindings>) {
    this.bindings = { ...DEFAULT_BINDINGS, ...bindings };

    // TLDR: Keyboard listeners
    this.boundKeyDown = (e: KeyboardEvent) => {
      if (!this.keysDown.has(e.code)) {
        this.keysPressed.add(e.code);
      }
      this.keysDown.add(e.code);
      e.preventDefault();
    };

    this.boundKeyUp = (e: KeyboardEvent) => {
      this.keysDown.delete(e.code);
      this.keysReleased.add(e.code);
      e.preventDefault();
    };

    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);

    // TLDR: Unified pointer listeners (PointerEvent covers both mouse and touch)
    this.boundPointerDown = (e: PointerEvent) => {
      this._pointer.isDown = true;
      this._pointer.justPressed = true;
      this._pointer.x = e.clientX;
      this._pointer.y = e.clientY;
      this._pointer.isTouch = e.pointerType === 'touch';
    };

    this.boundPointerMove = (e: PointerEvent) => {
      this._pointer.x = e.clientX;
      this._pointer.y = e.clientY;
    };

    this.boundPointerUp = (e: PointerEvent) => {
      this._pointer.isDown = false;
      this._pointer.justReleased = true;
      this._pointer.x = e.clientX;
      this._pointer.y = e.clientY;
    };

    window.addEventListener('pointerdown', this.boundPointerDown);
    window.addEventListener('pointermove', this.boundPointerMove);
    window.addEventListener('pointerup', this.boundPointerUp);
  }

  /** TLDR: Call once per fixed-step frame after processing input */
  endFrame(): void {
    this.keysPressed.clear();
    this.keysReleased.clear();
    this._pointer.justPressed = false;
    this._pointer.justReleased = false;
  }

  /** TLDR: Read-only pointer state for this frame */
  get pointer(): Readonly<PointerState> {
    return this._pointer;
  }

  /** True while any bound key for this action is held */
  isDown(action: Action): boolean {
    return this.bindings[action].some((key) => this.keysDown.has(key));
  }

  /** True only on the frame the key was first pressed */
  isPressed(action: Action): boolean {
    return this.bindings[action].some((key) => this.keysPressed.has(key));
  }

  /** True only on the frame the key was released */
  isReleased(action: Action): boolean {
    return this.bindings[action].some((key) => this.keysReleased.has(key));
  }

  /** Check a raw key code directly */
  isKeyDown(code: string): boolean {
    return this.keysDown.has(code);
  }

  /** Update bindings at runtime */
  setBindings(bindings: Partial<KeyBindings>): void {
    Object.assign(this.bindings, bindings);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    window.removeEventListener('pointerdown', this.boundPointerDown);
    window.removeEventListener('pointermove', this.boundPointerMove);
    window.removeEventListener('pointerup', this.boundPointerUp);
    this.keysDown.clear();
    this.keysPressed.clear();
    this.keysReleased.clear();
  }
}
