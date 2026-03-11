/**
 * Keyboard input manager with configurable key bindings.
 * Tracks per-frame pressed/released edges plus held state.
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

  constructor(bindings?: Partial<KeyBindings>) {
    this.bindings = { ...DEFAULT_BINDINGS, ...bindings };

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
  }

  /** Call once per fixed-step frame after processing input */
  endFrame(): void {
    this.keysPressed.clear();
    this.keysReleased.clear();
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
    this.keysDown.clear();
    this.keysPressed.clear();
    this.keysReleased.clear();
  }
}
