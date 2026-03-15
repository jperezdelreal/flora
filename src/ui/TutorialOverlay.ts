// TLDR: Semi-transparent overlay for guided tutorial steps and contextual hints

import { Container, Graphics, Text } from 'pixi.js';
import type { TutorialStep, TutorialHint, HowToPlaySection } from '../config/tutorial';
import { HOW_TO_PLAY } from '../config/tutorial';
import { GAME } from '../config';

/** TLDR: Callback when overlay is clicked/dismissed */
export type OverlayDismissCallback = () => void;
/** TLDR: Callback when skip tutorial is clicked */
export type OverlaySkipCallback = () => void;

/**
 * TLDR: TutorialOverlay renders guided steps and contextual hints.
 * Steps: full-screen dimmed overlay with centered card, click-to-advance or event-driven.
 * Hints: small toast at bottom of screen, auto-fades after duration.
 * How to Play: scrollable reference panel from PauseMenu.
 */
export class TutorialOverlay {
  private container: Container;

  // TLDR: Step overlay elements
  private stepOverlay: Container;
  private stepDimmer: Graphics;
  private stepCard: Graphics;
  private stepIcon: Text;
  private stepTitle: Text;
  private stepMessage: Text;
  private stepProgress: Text;
  private stepPrompt: Text;
  private skipButton: Graphics;
  private skipText: Text;

  // TLDR: Hint toast elements
  private hintContainer: Container;
  private hintBackground: Graphics;
  private hintIcon: Text;
  private hintMessage: Text;
  private hintTimer = 0;
  private hintDuration = 5000;
  private hintActive = false;
  private readonly hintFadeIn = 300;
  private readonly hintFadeOut = 500;

  // TLDR: How to Play panel
  private howToPlayContainer: Container;

  // TLDR: Callbacks
  private dismissCallback: OverlayDismissCallback | null = null;
  private skipCallback: OverlaySkipCallback | null = null;

  // TLDR: Screen dimensions for positioning
  private screenWidth: number = GAME.WIDTH;
  private screenHeight: number = GAME.HEIGHT;

  constructor() {
    this.container = new Container();

    // ----- Step overlay (guided tutorial) -----
    this.stepOverlay = new Container();
    this.stepOverlay.visible = false;

    // TLDR: Full-screen semi-transparent dimmer
    this.stepDimmer = new Graphics();
    this.stepDimmer.rect(0, 0, GAME.WIDTH, GAME.HEIGHT);
    this.stepDimmer.fill({ color: 0x000000, alpha: 0.6 });
    this.stepDimmer.eventMode = 'static';
    this.stepDimmer.cursor = 'pointer';
    this.stepDimmer.on('pointerdown', () => this.onStepClick());
    this.stepOverlay.addChild(this.stepDimmer);

    // TLDR: Centered card panel
    const cardWidth = GAME.WIDTH * 0.6;
    const cardHeight = GAME.HEIGHT * 0.467;
    this.stepCard = new Graphics();
    this.stepCard.roundRect(0, 0, cardWidth, cardHeight, 16);
    this.stepCard.fill({ color: 0x1a2a1a, alpha: 0.97 });
    this.stepCard.stroke({ color: 0x88d498, width: 3 });
    this.stepCard.x = (GAME.WIDTH - cardWidth) / 2;
    this.stepCard.y = (GAME.HEIGHT - cardHeight) / 2;
    this.stepOverlay.addChild(this.stepCard);

    // TLDR: Step icon
    this.stepIcon = new Text({
      text: '🌱',
      style: { fontSize: 48, align: 'center' },
    });
    this.stepIcon.anchor.set(0.5);
    this.stepIcon.x = GAME.WIDTH / 2;
    this.stepIcon.y = this.stepCard.y + 45;
    this.stepOverlay.addChild(this.stepIcon);

    // TLDR: Step title
    this.stepTitle = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 26,
        fill: '#88d498',
        fontWeight: 'bold',
        align: 'center',
      },
    });
    this.stepTitle.anchor.set(0.5, 0);
    this.stepTitle.x = GAME.WIDTH / 2;
    this.stepTitle.y = this.stepCard.y + 80;
    this.stepOverlay.addChild(this.stepTitle);

    // TLDR: Step message
    this.stepMessage = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: '#e0e0e0',
        align: 'center',
        wordWrap: true,
        wordWrapWidth: cardWidth * 0.875,
        lineHeight: 24,
      },
    });
    this.stepMessage.anchor.set(0.5, 0);
    this.stepMessage.x = GAME.WIDTH / 2;
    this.stepMessage.y = this.stepCard.y + 120;
    this.stepOverlay.addChild(this.stepMessage);

    // TLDR: Progress indicator (e.g., "Step 1 of 7")
    this.stepProgress = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 13,
        fill: '#888888',
        align: 'center',
      },
    });
    this.stepProgress.anchor.set(0.5, 0);
    this.stepProgress.x = GAME.WIDTH / 2;
    this.stepProgress.y = this.stepCard.y + 240;
    this.stepOverlay.addChild(this.stepProgress);

    // TLDR: "Click to continue" prompt
    this.stepPrompt = new Text({
      text: 'Click anywhere to continue',
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: '#88d498',
        fontStyle: 'italic',
        align: 'center',
      },
    });
    this.stepPrompt.anchor.set(0.5, 0);
    this.stepPrompt.x = GAME.WIDTH / 2;
    this.stepPrompt.y = this.stepCard.y + 260;
    this.stepOverlay.addChild(this.stepPrompt);

    // TLDR: Skip tutorial button (bottom-right of card)
    const skipBtnWidth = 120;
    const skipBtnHeight = 32;
    this.skipButton = new Graphics();
    this.skipButton.roundRect(0, 0, skipBtnWidth, skipBtnHeight, 6);
    this.skipButton.fill({ color: 0x333333, alpha: 0.8 });
    this.skipButton.stroke({ color: 0x666666, width: 1 });
    this.skipButton.x = this.stepCard.x + cardWidth - skipBtnWidth - 10;
    this.skipButton.y = this.stepCard.y + cardHeight - skipBtnHeight - 8;
    this.skipButton.eventMode = 'static';
    this.skipButton.cursor = 'pointer';
    this.skipButton.on('pointerdown', (e) => {
      e.stopPropagation();
      this.onSkipClick();
    });
    this.skipButton.on('pointerover', () => {
      this.skipButton.clear();
      this.skipButton.roundRect(0, 0, skipBtnWidth, skipBtnHeight, 6);
      this.skipButton.fill({ color: 0x555555 });
      this.skipButton.stroke({ color: 0x888888, width: 1 });
    });
    this.skipButton.on('pointerout', () => {
      this.skipButton.clear();
      this.skipButton.roundRect(0, 0, skipBtnWidth, skipBtnHeight, 6);
      this.skipButton.fill({ color: 0x333333, alpha: 0.8 });
      this.skipButton.stroke({ color: 0x666666, width: 1 });
    });
    this.stepOverlay.addChild(this.skipButton);

    this.skipText = new Text({
      text: 'Skip Tutorial',
      style: {
        fontFamily: 'Arial',
        fontSize: 13,
        fill: '#aaaaaa',
        align: 'center',
      },
    });
    this.skipText.anchor.set(0.5, 0.5);
    this.skipText.x = this.skipButton.x + skipBtnWidth / 2;
    this.skipText.y = this.skipButton.y + skipBtnHeight / 2;
    this.stepOverlay.addChild(this.skipText);

    this.container.addChild(this.stepOverlay);

    // ----- Hint toast (contextual hints) -----
    this.hintContainer = new Container();
    this.hintContainer.visible = false;

    this.hintBackground = new Graphics();
    this.hintBackground.roundRect(0, 0, 460, 50, 10);
    this.hintBackground.fill({ color: 0x1a2a1a, alpha: 0.93 });
    this.hintBackground.stroke({ color: 0x88d498, width: 2 });
    this.hintBackground.eventMode = 'static';
    this.hintBackground.cursor = 'pointer';
    this.hintBackground.on('pointerdown', () => this.dismissHint());
    this.hintContainer.addChild(this.hintBackground);

    this.hintIcon = new Text({
      text: '',
      style: { fontSize: 22, align: 'center' },
    });
    this.hintIcon.anchor.set(0.5, 0.5);
    this.hintIcon.x = 30;
    this.hintIcon.y = 25;
    this.hintContainer.addChild(this.hintIcon);

    this.hintMessage = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: '#e0e0e0',
        wordWrap: true,
        wordWrapWidth: 390,
      },
    });
    this.hintMessage.x = 55;
    this.hintMessage.y = 8;
    this.hintContainer.addChild(this.hintMessage);

    this.container.addChild(this.hintContainer);

    // ----- How to Play panel -----
    this.howToPlayContainer = new Container();
    this.howToPlayContainer.visible = false;
    this.buildHowToPlayPanel();
    this.container.addChild(this.howToPlayContainer);
  }

  /** TLDR: Set screen dimensions for layout */
  setScreenSize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;

    // TLDR: Resize dimmer
    this.stepDimmer.clear();
    this.stepDimmer.rect(0, 0, width, height);
    this.stepDimmer.fill({ color: 0x000000, alpha: 0.6 });

    // TLDR: Center card
    this.stepCard.x = (width - 480) / 2;
    this.stepCard.y = (height - 280) / 2;
    const cx = width / 2;
    const cy = this.stepCard.y;
    this.stepIcon.x = cx;
    this.stepIcon.y = cy + 45;
    this.stepTitle.x = cx;
    this.stepTitle.y = cy + 80;
    this.stepMessage.x = cx;
    this.stepMessage.y = cy + 120;
    this.stepProgress.x = cx;
    this.stepProgress.y = cy + 240;
    this.stepPrompt.x = cx;
    this.stepPrompt.y = cy + 260;
    this.skipButton.x = this.stepCard.x + 350;
    this.skipButton.y = cy + 248;
    this.skipText.x = this.skipButton.x + 60;
    this.skipText.y = this.skipButton.y + 16;

    // TLDR: Position hint toast at bottom center
    this.hintContainer.x = (width - 460) / 2;
    this.hintContainer.y = height - 80;

    // TLDR: Center How to Play panel
    this.howToPlayContainer.x = (width - width * 0.625) / 2;
    this.howToPlayContainer.y = (height - height * 0.75) / 2;
  }

  /** TLDR: Register dismiss callback (advance step) */
  onDismiss(callback: OverlayDismissCallback): void {
    this.dismissCallback = callback;
  }

  /** TLDR: Register skip callback */
  onSkip(callback: OverlaySkipCallback): void {
    this.skipCallback = callback;
  }

  /** TLDR: Show a guided tutorial step */
  showStep(step: TutorialStep, stepIndex: number, totalSteps: number): void {
    this.stepIcon.text = step.icon;
    this.stepTitle.text = step.title;
    this.stepMessage.text = step.message;
    this.stepProgress.text = `Step ${stepIndex + 1} of ${totalSteps}`;

    // TLDR: Update prompt based on whether step waits for event or click
    if (step.completionEvent) {
      this.stepPrompt.text = 'Complete the action to continue...';
    } else {
      this.stepPrompt.text = 'Click anywhere to continue';
    }

    this.stepOverlay.visible = true;
    this.stepOverlay.alpha = 1;
  }

  /** TLDR: Hide the step overlay */
  hideStep(): void {
    this.stepOverlay.visible = false;
  }

  /** TLDR: Show a contextual hint toast */
  showHint(hint: TutorialHint): void {
    if (this.hintActive) return;

    this.hintIcon.text = hint.icon;
    this.hintMessage.text = hint.message;
    this.hintDuration = hint.durationMs;
    this.hintTimer = 0;
    this.hintActive = true;
    this.hintContainer.visible = true;
    this.hintContainer.alpha = 0;
  }

  /** TLDR: Show the How to Play reference panel */
  showHowToPlay(): void {
    this.howToPlayContainer.visible = true;
  }

  /** TLDR: Hide the How to Play reference panel */
  hideHowToPlay(): void {
    this.howToPlayContainer.visible = false;
  }

  /** TLDR: Check if How to Play panel is visible */
  isHowToPlayVisible(): boolean {
    return this.howToPlayContainer.visible;
  }

  /** TLDR: Update hint animation (call each frame with delta in ms) */
  update(deltaMs: number): void {
    if (!this.hintActive) return;

    this.hintTimer += deltaMs;

    // TLDR: Fade in
    if (this.hintTimer < this.hintFadeIn) {
      this.hintContainer.alpha = this.hintTimer / this.hintFadeIn;
    }
    // TLDR: Hold
    else if (this.hintTimer < this.hintDuration - this.hintFadeOut) {
      this.hintContainer.alpha = 1;
    }
    // TLDR: Fade out
    else if (this.hintTimer < this.hintDuration) {
      const progress = (this.hintTimer - (this.hintDuration - this.hintFadeOut)) / this.hintFadeOut;
      this.hintContainer.alpha = 1 - progress;
    }
    // TLDR: Hide
    else {
      this.dismissHint();
    }
  }

  /** TLDR: Get the container for adding to scene */
  getContainer(): Container {
    return this.container;
  }

  /** TLDR: Destroy and cleanup */
  destroy(): void {
    this.dismissCallback = null;
    this.skipCallback = null;
    this.container.destroy({ children: true });
  }

  // ------ Private ------

  private onStepClick(): void {
    if (this.dismissCallback) {
      this.dismissCallback();
    }
  }

  private onSkipClick(): void {
    this.hideStep();
    if (this.skipCallback) {
      this.skipCallback();
    }
  }

  private dismissHint(): void {
    this.hintActive = false;
    this.hintContainer.visible = false;
    this.hintContainer.alpha = 0;
  }

  /** TLDR: Build the How to Play reference panel from config */
  private buildHowToPlayPanel(): void {
    // TLDR: Full-screen dimmer
    const panelWidth = GAME.WIDTH * 0.625;
    const panelHeight = GAME.HEIGHT * 0.75;
    const dimmer = new Graphics();
    dimmer.rect(0, 0, GAME.WIDTH, GAME.HEIGHT);
    dimmer.fill({ color: 0x000000, alpha: 0.7 });
    dimmer.eventMode = 'static';
    // TLDR: Position relative to howToPlayContainer (will be offset)
    dimmer.x = -(GAME.WIDTH - panelWidth) / 2;
    dimmer.y = -(GAME.HEIGHT - panelHeight) / 2;
    dimmer.on('pointerdown', () => this.hideHowToPlay());
    this.howToPlayContainer.addChild(dimmer);

    // TLDR: Panel background
    const panel = new Graphics();
    panel.roundRect(0, 0, panelWidth, panelHeight, 16);
    panel.fill({ color: 0x1a1a1a, alpha: 0.98 });
    panel.stroke({ color: 0x88d498, width: 3 });
    this.howToPlayContainer.addChild(panel);

    // TLDR: Title
    const title = new Text({
      text: '📖 How to Play',
      style: {
        fontFamily: 'Arial',
        fontSize: 28,
        fill: '#88d498',
        fontWeight: 'bold',
        align: 'center',
      },
    });
    title.anchor.set(0.5, 0);
    title.x = panelWidth / 2;
    title.y = 15;
    this.howToPlayContainer.addChild(title);

    // TLDR: Render each section
    let yOffset = 60;
    for (const section of HOW_TO_PLAY) {
      const sectionTitle = new Text({
        text: `${section.icon} ${section.title}`,
        style: {
          fontFamily: 'Arial',
          fontSize: 16,
          fill: '#c8e6c9',
          fontWeight: 'bold',
        },
      });
      sectionTitle.x = 25;
      sectionTitle.y = yOffset;
      this.howToPlayContainer.addChild(sectionTitle);
      yOffset += 22;

      for (const line of section.lines) {
        const lineText = new Text({
          text: `  • ${line}`,
          style: {
            fontFamily: 'Arial',
            fontSize: 13,
            fill: '#cccccc',
          },
        });
        lineText.x = 30;
        lineText.y = yOffset;
        this.howToPlayContainer.addChild(lineText);
        yOffset += 18;
      }
      yOffset += 8;
    }

    // TLDR: Close button
    const closeBtnWidth = 140;
    const closeBtnHeight = 36;
    const closeBtn = new Graphics();
    closeBtn.roundRect(0, 0, closeBtnWidth, closeBtnHeight, 8);
    closeBtn.fill({ color: 0x2a2a2a });
    closeBtn.stroke({ color: 0x88d498, width: 2 });
    closeBtn.x = (panelWidth - closeBtnWidth) / 2;
    closeBtn.y = panelHeight - closeBtnHeight - 10;
    closeBtn.eventMode = 'static';
    closeBtn.cursor = 'pointer';
    closeBtn.on('pointerdown', () => this.hideHowToPlay());
    closeBtn.on('pointerover', () => {
      closeBtn.clear();
      closeBtn.roundRect(0, 0, closeBtnWidth, closeBtnHeight, 8);
      closeBtn.fill({ color: 0x4caf50 });
      closeBtn.stroke({ color: 0x66bb6a, width: 2 });
    });
    closeBtn.on('pointerout', () => {
      closeBtn.clear();
      closeBtn.roundRect(0, 0, closeBtnWidth, closeBtnHeight, 8);
      closeBtn.fill({ color: 0x2a2a2a });
      closeBtn.stroke({ color: 0x88d498, width: 2 });
    });
    this.howToPlayContainer.addChild(closeBtn);

    const closeText = new Text({
      text: 'Got it!',
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: '#ffffff',
        fontWeight: 'bold',
        align: 'center',
      },
    });
    closeText.anchor.set(0.5, 0.5);
    closeText.x = closeBtn.x + closeBtnWidth / 2;
    closeText.y = closeBtn.y + closeBtnHeight / 2;
    this.howToPlayContainer.addChild(closeText);
  }
}
