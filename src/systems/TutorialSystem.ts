// TLDR: Manages first-run detection, guided tutorial steps, and contextual hint tracking

import { eventBus } from '../core/EventBus';
import {
  TUTORIAL_STEPS,
  TUTORIAL_HINTS,
  TUTORIAL_STORAGE_KEY,
  type TutorialStep,
  type TutorialHint,
} from '../config/tutorial';
import type { System } from './index';

/** TLDR: Persisted tutorial state — which steps/hints the player has seen */
export interface TutorialSaveData {
  tutorialCompleted: boolean;
  tutorialSkipped: boolean;
  seenHints: string[];
  completedSteps: string[];
}

/** TLDR: Callback for UI layer when a tutorial step should be shown/advanced */
export type TutorialStepCallback = (step: TutorialStep, stepIndex: number, totalSteps: number) => void;
/** TLDR: Callback for UI layer when a contextual hint should be shown */
export type TutorialHintCallback = (hint: TutorialHint) => void;
/** TLDR: Callback for UI layer when tutorial completes or is skipped */
export type TutorialCompleteCallback = () => void;

/**
 * TLDR: TutorialSystem orchestrates the first-run guided tutorial and contextual hints.
 * First-run = no save data in localStorage. Guided steps advance on player actions or clicks.
 * Contextual hints fire once per mechanic encounter and persist across sessions.
 */
export class TutorialSystem implements System {
  readonly name = 'TutorialSystem';
  private state: TutorialSaveData;
  private currentStepIndex = 0;
  private isTutorialActive = false;
  private stepCallback: TutorialStepCallback | null = null;
  private hintCallback: TutorialHintCallback | null = null;
  private completeCallback: TutorialCompleteCallback | null = null;

  // TLDR: Bound event listeners for cleanup
  private boundEventHandlers: Map<string, (data: unknown) => void> = new Map();

  constructor() {
    this.state = this.loadState();
  }

  /** TLDR: Check if this is the player's first run (no tutorial data and no save data) */
  isFirstRun(): boolean {
    return !this.state.tutorialCompleted && !this.state.tutorialSkipped;
  }

  /** TLDR: Register callback for tutorial step display */
  onStep(callback: TutorialStepCallback): void {
    this.stepCallback = callback;
  }

  /** TLDR: Register callback for contextual hint display */
  onHint(callback: TutorialHintCallback): void {
    this.hintCallback = callback;
  }

  /** TLDR: Register callback for tutorial completion */
  onComplete(callback: TutorialCompleteCallback): void {
    this.completeCallback = callback;
  }

  /** TLDR: Start the guided tutorial sequence */
  startTutorial(): void {
    if (this.state.tutorialCompleted || this.state.tutorialSkipped) {
      return;
    }
    this.isTutorialActive = true;
    this.currentStepIndex = 0;
    this.showCurrentStep();
    this.bindStepEvents();
  }

  /** TLDR: Skip the entire tutorial and persist that choice */
  skipTutorial(): void {
    this.isTutorialActive = false;
    this.state.tutorialSkipped = true;
    this.unbindStepEvents();
    this.saveState();
    if (this.completeCallback) {
      this.completeCallback();
    }
  }

  /** TLDR: Advance to the next tutorial step (called by UI on click or by event completion) */
  advanceStep(): void {
    if (!this.isTutorialActive) return;

    // TLDR: Mark current step as completed
    const current = TUTORIAL_STEPS[this.currentStepIndex];
    if (current && !this.state.completedSteps.includes(current.id)) {
      this.state.completedSteps.push(current.id);
    }

    this.currentStepIndex++;

    if (this.currentStepIndex >= TUTORIAL_STEPS.length) {
      // TLDR: Tutorial finished
      this.completeTutorial();
      return;
    }

    this.showCurrentStep();
  }

  /** TLDR: Check if tutorial is currently running */
  isActive(): boolean {
    return this.isTutorialActive;
  }

  /** TLDR: Get current step index for UI progress display */
  getCurrentStepIndex(): number {
    return this.currentStepIndex;
  }

  /** TLDR: Get total number of tutorial steps */
  getTotalSteps(): number {
    return TUTORIAL_STEPS.length;
  }

  /** TLDR: Start listening for contextual hint triggers (after tutorial or if skipped) */
  enableContextualHints(): void {
    for (const hint of TUTORIAL_HINTS) {
      if (this.state.seenHints.includes(hint.id)) continue;

      const handler = () => {
        this.triggerHint(hint);
      };

      // TLDR: Use EventBus event matching
      const eventName = hint.triggerEvent as keyof typeof eventBus extends never ? string : string;
      this.boundEventHandlers.set(`hint_${hint.id}`, handler);
      eventBus.on(eventName as 'day:advanced', handler);
    }
  }

  /** TLDR: Reset tutorial state entirely (for testing or new game+) */
  reset(): void {
    this.state = {
      tutorialCompleted: false,
      tutorialSkipped: false,
      seenHints: [],
      completedSteps: [],
    };
    this.isTutorialActive = false;
    this.currentStepIndex = 0;
    this.unbindStepEvents();
    this.saveState();
  }

  // ------ Private helpers ------

  private showCurrentStep(): void {
    const step = TUTORIAL_STEPS[this.currentStepIndex];
    if (step && this.stepCallback) {
      this.stepCallback(step, this.currentStepIndex, TUTORIAL_STEPS.length);
    }
  }

  /** TLDR: Bind EventBus listeners for step completion events */
  private bindStepEvents(): void {
    for (const step of TUTORIAL_STEPS) {
      if (!step.completionEvent) continue;

      const handler = () => {
        // TLDR: Only advance if this is the current step
        const current = TUTORIAL_STEPS[this.currentStepIndex];
        if (current && current.id === step.id) {
          this.advanceStep();
        }
      };

      const key = `step_${step.id}`;
      this.boundEventHandlers.set(key, handler);
      eventBus.on(step.completionEvent as 'plant:created', handler);
    }
  }

  /** TLDR: Unbind all step completion event listeners */
  private unbindStepEvents(): void {
    for (const step of TUTORIAL_STEPS) {
      if (!step.completionEvent) continue;
      const key = `step_${step.id}`;
      const handler = this.boundEventHandlers.get(key);
      if (handler) {
        eventBus.off(step.completionEvent as 'plant:created', handler);
        this.boundEventHandlers.delete(key);
      }
    }
  }

  /** TLDR: Trigger a contextual hint and persist that it was seen */
  private triggerHint(hint: TutorialHint): void {
    if (this.state.seenHints.includes(hint.id)) return;
    // TLDR: Don't show hints during guided tutorial
    if (this.isTutorialActive) return;

    this.state.seenHints.push(hint.id);
    this.saveState();

    if (this.hintCallback) {
      this.hintCallback(hint);
    }

    // TLDR: Unbind the listener so it doesn't fire again
    const key = `hint_${hint.id}`;
    const handler = this.boundEventHandlers.get(key);
    if (handler) {
      eventBus.off(hint.triggerEvent as 'day:advanced', handler);
      this.boundEventHandlers.delete(key);
    }
  }

  /** TLDR: Mark tutorial as completed and persist */
  private completeTutorial(): void {
    this.isTutorialActive = false;
    this.state.tutorialCompleted = true;
    this.unbindStepEvents();
    this.saveState();

    if (this.completeCallback) {
      this.completeCallback();
    }

    // TLDR: Enable contextual hints now that tutorial is done
    this.enableContextualHints();
  }

  /** TLDR: Load tutorial state from localStorage */
  private loadState(): TutorialSaveData {
    try {
      const raw = localStorage.getItem(TUTORIAL_STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as Partial<TutorialSaveData>;
        return {
          tutorialCompleted: data.tutorialCompleted ?? false,
          tutorialSkipped: data.tutorialSkipped ?? false,
          seenHints: data.seenHints ?? [],
          completedSteps: data.completedSteps ?? [],
        };
      }
    } catch (error) {
      console.warn('TutorialSystem: Failed to load state', error);
    }
    return {
      tutorialCompleted: false,
      tutorialSkipped: false,
      seenHints: [],
      completedSteps: [],
    };
  }

  /** TLDR: Persist tutorial state to localStorage */
  private saveState(): void {
    try {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.warn('TutorialSystem: Failed to save state', error);
    }
  }

  update(_delta: number): void {
    // TLDR: No per-frame update needed — tutorial is event-driven
  }

  destroy(): void {
    this.unbindStepEvents();
    // TLDR: Unbind all hint listeners
    for (const hint of TUTORIAL_HINTS) {
      const key = `hint_${hint.id}`;
      const handler = this.boundEventHandlers.get(key);
      if (handler) {
        eventBus.off(hint.triggerEvent as 'day:advanced', handler);
      }
    }
    this.boundEventHandlers.clear();
    this.stepCallback = null;
    this.hintCallback = null;
    this.completeCallback = null;
  }
}
