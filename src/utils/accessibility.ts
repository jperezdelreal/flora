// TLDR: Accessibility runtime — ARIA live region, focus management, colorblind palette

import { Graphics, Container } from 'pixi.js';
import {
  COLOR_PALETTES,
  FOCUS_STYLE,
  DEFAULT_ACCESSIBILITY,
} from '../config/accessibility';
import type {
  ColorVisionMode,
  ColorPalette,
  AccessibilityPreferences,
} from '../config/accessibility';
import { loadJSON, saveJSON } from './storage';

const A11Y_STORAGE_KEY = 'flora_accessibility';

// TLDR: Singleton accessibility manager

let ariaLiveElement: HTMLElement | null = null;
let currentPrefs: AccessibilityPreferences = { ...DEFAULT_ACCESSIBILITY };

/** TLDR: Initialize the ARIA live region in the DOM for screen reader announcements */
export function initAriaLiveRegion(): void {
  if (ariaLiveElement) return;

  ariaLiveElement = document.createElement('div');
  ariaLiveElement.id = 'flora-aria-live';
  ariaLiveElement.setAttribute('role', 'status');
  ariaLiveElement.setAttribute('aria-live', 'polite');
  ariaLiveElement.setAttribute('aria-atomic', 'true');

  // TLDR: Visually hidden but available to screen readers
  Object.assign(ariaLiveElement.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0',
  });

  document.body.appendChild(ariaLiveElement);
}

/** TLDR: Announce a message to screen readers via the ARIA live region */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  if (!ariaLiveElement) initAriaLiveRegion();
  if (!ariaLiveElement) return;

  ariaLiveElement.setAttribute('aria-live', priority);

  // TLDR: Clear then set text to force re-announcement
  ariaLiveElement.textContent = '';
  requestAnimationFrame(() => {
    if (ariaLiveElement) {
      ariaLiveElement.textContent = message;
    }
  });
}

/** TLDR: Load persisted accessibility preferences from localStorage */
export function loadAccessibilityPrefs(): AccessibilityPreferences {
  const saved = loadJSON<AccessibilityPreferences>(A11Y_STORAGE_KEY);
  if (saved) {
    currentPrefs = { ...DEFAULT_ACCESSIBILITY, ...saved };
  } else {
    currentPrefs = { ...DEFAULT_ACCESSIBILITY };
  }
  return currentPrefs;
}

/** TLDR: Persist accessibility preferences to localStorage */
export function saveAccessibilityPrefs(prefs: AccessibilityPreferences): void {
  currentPrefs = { ...prefs };
  saveJSON(A11Y_STORAGE_KEY, currentPrefs);
}

/** TLDR: Get current accessibility preferences */
export function getAccessibilityPrefs(): AccessibilityPreferences {
  return { ...currentPrefs };
}

/** TLDR: Get the active color palette based on current vision mode */
export function getActivePalette(): ColorPalette {
  return COLOR_PALETTES[currentPrefs.colorVisionMode];
}

/** TLDR: Set color vision mode and persist */
export function setColorVisionMode(mode: ColorVisionMode): void {
  currentPrefs.colorVisionMode = mode;
  saveAccessibilityPrefs(currentPrefs);
}

/** TLDR: Cycle to next color vision mode (for toggle button) */
export function cycleColorVisionMode(): ColorVisionMode {
  const modes: ColorVisionMode[] = ['normal', 'deuteranopia', 'protanopia', 'tritanopia', 'monochromacy'];
  const currentIdx = modes.indexOf(currentPrefs.colorVisionMode);
  const nextIdx = (currentIdx + 1) % modes.length;
  const nextMode = modes[nextIdx];
  setColorVisionMode(nextMode);
  return nextMode;
}

/** TLDR: Human-readable label for each vision mode */
export function getColorVisionLabel(mode: ColorVisionMode): string {
  const labels: Record<ColorVisionMode, string> = {
    normal: 'Normal Vision',
    deuteranopia: 'Deuteranopia (Red-Green)',
    protanopia: 'Protanopia (Red)',
    tritanopia: 'Tritanopia (Blue-Yellow)',
    monochromacy: 'Monochromacy (Grayscale)',
  };
  return labels[mode];
}

/** TLDR: Draw a visible focus indicator around a PixiJS container */
export function drawFocusRing(target: Container): Graphics {
  const bounds = target.getLocalBounds();
  const ring = new Graphics();
  ring.roundRect(
    bounds.x - FOCUS_STYLE.PADDING,
    bounds.y - FOCUS_STYLE.PADDING,
    bounds.width + FOCUS_STYLE.PADDING * 2,
    bounds.height + FOCUS_STYLE.PADDING * 2,
    FOCUS_STYLE.BORDER_RADIUS,
  );
  ring.stroke({ color: FOCUS_STYLE.COLOR, width: FOCUS_STYLE.WIDTH });
  return ring;
}

/** TLDR: Check OS-level reduced motion preference */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** TLDR: Check if motion should be reduced (user pref OR OS pref) */
export function shouldReduceMotion(): boolean {
  return currentPrefs.reducedMotion || prefersReducedMotion();
}

/** TLDR: Set reduced motion preference and persist */
export function setReducedMotion(enabled: boolean): void {
  currentPrefs.reducedMotion = enabled;
  saveAccessibilityPrefs(currentPrefs);
}
