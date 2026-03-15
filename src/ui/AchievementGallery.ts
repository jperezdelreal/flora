// TLDR: Achievement gallery — grid display of locked/unlocked badges, follows Encyclopedia pattern

import { Container, Graphics, Text, FederatedPointerEvent, Ticker } from 'pixi.js';
import type { AchievementConfig, AchievementCategory } from '../config/achievements';
import { ACHIEVEMENT_CATEGORIES, CATEGORY_LABELS } from '../config/achievements';
import type { AchievementState } from '../systems/AchievementSystem';
import { UI_COLORS } from '../config';

const CARD_WIDTH = 180;
const CARD_HEIGHT = 160;
const GRID_COLS = 4;
const GRID_PADDING = 14;
const SCROLL_SPEED = 40;
const VIEWPORT_HEIGHT = 460;
const PANEL_WIDTH = 800;

/** TLDR: Entry combining config + unlock state for rendering */
interface GalleryEntry {
  config: AchievementConfig;
  state: AchievementState;
}

/**
 * AchievementGallery renders a scrollable grid of achievement badges.
 * Unlocked achievements show icon + name + reward.
 * Locked achievements show silhouette with "???" name.
 * Based on Encyclopedia grid pattern.
 */
export class AchievementGallery {
  private container: Container;
  private entriesContainer: Container;
  private headerText: Text;
  private statsText: Text;
  private entries: GalleryEntry[] = [];
  private scrollOffset = 0;
  private maxScroll = 0;
  private isDragging = false;
  private dragLastY = 0;
  private scrollUpIndicator!: Container;
  private scrollDownIndicator!: Container;
  private boundOnKeyDown: (e: KeyboardEvent) => void;
  private lockedTooltip: Container | null = null;
  private tooltipTimer: ReturnType<typeof setTimeout> | null = null;
  private shakeTarget: Container | null = null;
  private shakeStartTime = 0;
  private shakeDuration = 0.3;
  private boundTickerUpdate: () => void;

  constructor() {
    this.container = new Container();

    // TLDR: Header background
    const headerBg = new Graphics();
    headerBg.rect(0, 0, PANEL_WIDTH, 80);
    headerBg.fill({ color: 0x1a1a2e, alpha: 0.95 });
    this.container.addChild(headerBg);

    // TLDR: Header title
    this.headerText = new Text({
      text: '🏆 Achievement Gallery',
      style: {
        fontFamily: 'Arial',
        fontSize: 30,
        fill: '#daa520',
        fontWeight: 'bold',
      },
    });
    this.headerText.x = 20;
    this.headerText.y = 15;
    this.container.addChild(this.headerText);

    // TLDR: Progress stats
    this.statsText = new Text({
      text: 'Unlocked: 0 / 12 (0%)',
      style: {
        fontFamily: 'Arial',
        fontSize: 15,
        fill: '#aaaaaa',
      },
    });
    this.statsText.x = 20;
    this.statsText.y = 55;
    this.container.addChild(this.statsText);

    // TLDR: Close button
    const closeBtn = new Graphics();
    closeBtn.roundRect(0, 0, 36, 36, 8);
    closeBtn.fill({ color: 0x444444, alpha: 0.8 });
    closeBtn.stroke({ color: 0x888888, width: 1 });
    closeBtn.x = PANEL_WIDTH - 50;
    closeBtn.y = 22;
    closeBtn.eventMode = 'static';
    closeBtn.cursor = 'pointer';
    closeBtn.on('pointerdown', () => this.hide());
    this.container.addChild(closeBtn);

    const closeLbl = new Text({
      text: '✕',
      style: { fontFamily: 'Arial', fontSize: 20, fill: '#ffffff', fontWeight: 'bold' },
    });
    closeLbl.anchor.set(0.5, 0.5);
    closeLbl.x = closeBtn.x + 18;
    closeLbl.y = closeBtn.y + 18;
    this.container.addChild(closeLbl);

    // TLDR: Scrollable entries container
    this.entriesContainer = new Container();
    this.entriesContainer.y = 100;
    this.container.addChild(this.entriesContainer);

    // TLDR: Scroll indicators
    this.scrollUpIndicator = this.createScrollIndicator('▲', 100);
    this.scrollDownIndicator = this.createScrollIndicator('▼', 100 + VIEWPORT_HEIGHT - 24);
    this.container.addChild(this.scrollUpIndicator);
    this.container.addChild(this.scrollDownIndicator);
    this.scrollUpIndicator.visible = false;
    this.scrollDownIndicator.visible = false;

    // TLDR: Scroll area hit region
    const scrollArea = new Graphics();
    scrollArea.rect(0, 100, PANEL_WIDTH, VIEWPORT_HEIGHT);
    scrollArea.fill({ color: 0x000000, alpha: 0.001 });
    scrollArea.eventMode = 'static';
    scrollArea.cursor = 'default';
    this.container.addChildAt(scrollArea, this.container.getChildIndex(this.entriesContainer));

    scrollArea.on('wheel', (e: WheelEvent) => {
      this.scroll(e.deltaY > 0 ? SCROLL_SPEED : -SCROLL_SPEED);
    });

    scrollArea.on('pointerdown', (e: FederatedPointerEvent) => {
      this.isDragging = true;
      this.dragLastY = e.globalY;
    });
    scrollArea.on('pointermove', (e: FederatedPointerEvent) => {
      if (!this.isDragging) return;
      const dy = this.dragLastY - e.globalY;
      this.dragLastY = e.globalY;
      this.scroll(dy);
    });
    scrollArea.on('pointerup', () => { this.isDragging = false; });
    scrollArea.on('pointerupoutside', () => { this.isDragging = false; });

    // TLDR: Arrow key navigation (bound reference for cleanup)
    this.boundOnKeyDown = (e: KeyboardEvent) => {
      if (!this.container.visible) return;
      if (e.key === 'ArrowDown') { this.scroll(SCROLL_SPEED); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { this.scroll(-SCROLL_SPEED); e.preventDefault(); }
      else if (e.key === 'Escape') { this.hide(); e.preventDefault(); }
    };
    window.addEventListener('keydown', this.boundOnKeyDown);

    // TLDR: Ticker for shake animation
    this.boundTickerUpdate = () => this.updateShakeAnimation();
    Ticker.shared.add(this.boundTickerUpdate);
  }

  /** TLDR: Set entries and rebuild grid */
  setEntries(entries: GalleryEntry[]): void {
    this.entries = entries;
    this.rebuildGrid();
    this.updateStats();
  }

  /** TLDR: Rebuild grid cards grouped by category */
  private rebuildGrid(): void {
    this.entriesContainer.removeChildren();

    let yOffset = GRID_PADDING;

    for (const category of ACHIEVEMENT_CATEGORIES) {
      const categoryEntries = this.entries.filter((e) => e.config.category === category);
      if (categoryEntries.length === 0) continue;

      // TLDR: Category header
      const catLabel = new Text({
        text: CATEGORY_LABELS[category as AchievementCategory],
        style: {
          fontFamily: 'Arial',
          fontSize: 18,
          fill: '#daa520',
          fontWeight: 'bold',
        },
      });
      catLabel.x = GRID_PADDING;
      catLabel.y = yOffset;
      this.entriesContainer.addChild(catLabel);
      yOffset += 32;

      // TLDR: Render cards in rows
      const sorted = [...categoryEntries].sort((a, b) => {
        if (a.state.unlocked !== b.state.unlocked) return a.state.unlocked ? -1 : 1;
        return 0;
      });

      sorted.forEach((entry, index) => {
        const col = index % GRID_COLS;
        const row = Math.floor(index / GRID_COLS);
        const x = col * (CARD_WIDTH + GRID_PADDING) + GRID_PADDING;
        const y = yOffset + row * (CARD_HEIGHT + GRID_PADDING);

        const card = this.createCard(entry, x, y);
        this.entriesContainer.addChild(card);
      });

      const rowCount = Math.ceil(sorted.length / GRID_COLS);
      yOffset += rowCount * (CARD_HEIGHT + GRID_PADDING) + GRID_PADDING;
    }

    const contentHeight = yOffset;
    this.maxScroll = Math.max(0, contentHeight - VIEWPORT_HEIGHT);
    this.scrollOffset = 0;
    this.entriesContainer.y = 100;
    this.updateScrollIndicators();
  }

  /** TLDR: Create a single achievement card */
  private createCard(entry: GalleryEntry, x: number, y: number): Container {
    const card = new Container();
    card.x = x;
    card.y = y;

    const unlocked = entry.state.unlocked;
    const borderColor = unlocked ? 0xdaa520 : 0x333333;

    // TLDR: Card background
    const bg = new Graphics();
    bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 8);
    bg.fill({ color: unlocked ? 0x2a2a3e : 0x1e1e1e, alpha: 0.9 });
    bg.stroke({ color: borderColor, width: 2 });
    card.addChild(bg);

    if (unlocked) {
      // TLDR: Icon circle
      const iconCircle = new Graphics();
      iconCircle.circle(CARD_WIDTH / 2, 40, 28);
      iconCircle.fill({ color: 0xdaa520, alpha: 0.2 });
      iconCircle.stroke({ color: 0xdaa520, width: 2 });
      card.addChild(iconCircle);

      const icon = new Text({
        text: entry.config.icon,
        style: { fontSize: 30, align: 'center' },
      });
      icon.anchor.set(0.5, 0.5);
      icon.x = CARD_WIDTH / 2;
      icon.y = 40;
      card.addChild(icon);

      // TLDR: Achievement name
      const nameLabel = new Text({
        text: entry.config.displayName,
        style: {
          fontFamily: 'Arial',
          fontSize: 14,
          fill: '#ffffff',
          fontWeight: 'bold',
          align: 'center',
          wordWrap: true,
          wordWrapWidth: CARD_WIDTH - 16,
        },
      });
      nameLabel.anchor.set(0.5, 0);
      nameLabel.x = CARD_WIDTH / 2;
      nameLabel.y = 78;
      card.addChild(nameLabel);

      // TLDR: Reward tag
      const rewardLabel = new Text({
        text: entry.config.reward.displayName,
        style: {
          fontFamily: 'Arial',
          fontSize: 11,
          fill: '#bb86fc',
          align: 'center',
        },
      });
      rewardLabel.anchor.set(0.5, 0);
      rewardLabel.x = CARD_WIDTH / 2;
      rewardLabel.y = 130;
      card.addChild(rewardLabel);

    } else {
      // TLDR: Locked silhouette
      const silhouette = new Graphics();
      silhouette.circle(CARD_WIDTH / 2, 40, 28);
      silhouette.fill({ color: 0x333333, alpha: 0.5 });
      card.addChild(silhouette);

      const lockIcon = new Text({
        text: '🔒',
        style: { fontSize: 24, align: 'center' },
      });
      lockIcon.anchor.set(0.5, 0.5);
      lockIcon.x = CARD_WIDTH / 2;
      lockIcon.y = 40;
      card.addChild(lockIcon);

      // TLDR: Locked name
      const lockedName = new Text({
        text: '???',
        style: {
          fontFamily: 'Arial',
          fontSize: 14,
          fill: '#555555',
          fontWeight: 'bold',
          wordWrap: true,
          wordWrapWidth: CARD_WIDTH - 16,
        },
      });
      lockedName.anchor.set(0.5, 0);
      lockedName.x = CARD_WIDTH / 2;
      lockedName.y = 78;
      card.addChild(lockedName);

      // TLDR: Category hint
      const catHint = new Text({
        text: entry.config.category.toUpperCase(),
        style: {
          fontFamily: 'Arial',
          fontSize: 11,
          fill: '#444444',
        },
      });
      catHint.anchor.set(0.5, 0);
      catHint.x = CARD_WIDTH / 2;
      catHint.y = 100;
      card.addChild(catHint);

      // TLDR: Dimmed reward preview for locked achievements
      const rewardPreview = new Text({
        text: entry.config.reward.displayName,
        style: {
          fontFamily: 'Arial',
          fontSize: 10,
          fill: '#333333',
          fontStyle: 'italic',
          align: 'center',
          wordWrap: true,
          wordWrapWidth: CARD_WIDTH - 16,
        },
      });
      rewardPreview.anchor.set(0.5, 0);
      rewardPreview.x = CARD_WIDTH / 2;
      rewardPreview.y = 120;
      rewardPreview.alpha = 0.5;
      card.addChild(rewardPreview);

      // TLDR: Add click feedback for locked achievements (shake + tooltip)
      bg.eventMode = 'static';
      bg.cursor = 'pointer';
      bg.on('pointerdown', () => {
        this.triggerLockedFeedback(card, entry, x, y);
      });
    }

    return card;
  }

  /** TLDR: Trigger shake animation and tooltip when clicking locked achievement */
  private triggerLockedFeedback(card: Container, entry: GalleryEntry, cardX: number, cardY: number): void {
    // TLDR: Start shake animation
    this.shakeTarget = card;
    this.shakeStartTime = Date.now();

    // TLDR: Clear existing tooltip timer
    if (this.tooltipTimer) {
      clearTimeout(this.tooltipTimer);
      this.tooltipTimer = null;
    }

    // TLDR: Remove existing tooltip
    if (this.lockedTooltip) {
      this.entriesContainer.removeChild(this.lockedTooltip);
      this.lockedTooltip = null;
    }

    // TLDR: Create tooltip with hint text
    const tooltip = new Container();
    const tooltipBg = new Graphics();
    const hintText = `Complete ${this.getUnlockHint(entry.config)} to unlock`;
    
    const tooltipLabel = new Text({
      text: hintText,
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: UI_COLORS.TEXT_PRIMARY,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 160,
      },
    });
    tooltipLabel.anchor.set(0.5, 0);
    
    const padding = 8;
    const bgWidth = Math.max(tooltipLabel.width + padding * 2, 160);
    const bgHeight = tooltipLabel.height + padding * 2;
    
    tooltipBg.roundRect(0, 0, bgWidth, bgHeight, 6);
    tooltipBg.fill({ color: UI_COLORS.PANEL_BG, alpha: 0.95 });
    tooltipBg.stroke({ color: UI_COLORS.BUTTON_LOCKED_BORDER, width: 2 });
    
    tooltip.addChild(tooltipBg);
    tooltipLabel.x = bgWidth / 2;
    tooltipLabel.y = padding;
    tooltip.addChild(tooltipLabel);
    
    // TLDR: Position tooltip above card
    tooltip.x = cardX + CARD_WIDTH / 2 - bgWidth / 2;
    tooltip.y = cardY - bgHeight - 10;
    
    this.entriesContainer.addChild(tooltip);
    this.lockedTooltip = tooltip;

    // TLDR: Auto-hide tooltip after 3 seconds
    this.tooltipTimer = setTimeout(() => {
      if (this.lockedTooltip === tooltip) {
        this.entriesContainer.removeChild(tooltip);
        this.lockedTooltip = null;
      }
      this.tooltipTimer = null;
    }, 3000);
  }

  /** TLDR: Get unlock hint text based on achievement config */
  private getUnlockHint(config: AchievementConfig): string {
    const cat = config.category;
    if (cat === 'harvest') return 'harvest goals';
    if (cat === 'exploration') return 'exploration goals';
    if (cat === 'mastery') return 'mastery goals';
    if (cat === 'survival') return 'survival goals';
    if (cat === 'synergy') return 'synergy goals';
    return 'special requirements';
  }

  /** TLDR: Update shake animation each frame */
  private updateShakeAnimation(): void {
    if (!this.shakeTarget) return;

    const elapsed = (Date.now() - this.shakeStartTime) / 1000;
    if (elapsed > this.shakeDuration) {
      // TLDR: Animation complete, reset
      this.shakeTarget.x = Math.round(this.shakeTarget.x);
      this.shakeTarget.y = Math.round(this.shakeTarget.y);
      this.shakeTarget = null;
      return;
    }

    // TLDR: Bounce shake with decay
    const progress = elapsed / this.shakeDuration;
    const intensity = 6 * (1 - progress);
    const frequency = 12;
    const offsetX = Math.sin(elapsed * frequency * Math.PI * 2) * intensity;
    const offsetY = Math.cos(elapsed * frequency * 1.5 * Math.PI * 2) * intensity * 0.5;

    const originalX = Math.round(this.shakeTarget.x);
    const originalY = Math.round(this.shakeTarget.y);
    
    this.shakeTarget.x = originalX + offsetX;
    this.shakeTarget.y = originalY + offsetY;
  }

  /** TLDR: Update stats display */
  private updateStats(): void {
    const unlocked = this.entries.filter((e) => e.state.unlocked).length;
    const total = this.entries.length;
    const pct = total > 0 ? Math.round((unlocked / total) * 100) : 0;
    this.statsText.text = `Unlocked: ${unlocked} / ${total} (${pct}%)`;
  }

  /** TLDR: Scroll entries (positive = down, negative = up) */
  scroll(delta: number): void {
    this.scrollOffset = Math.max(0, Math.min(this.maxScroll, this.scrollOffset + delta));
    this.entriesContainer.y = 100 - this.scrollOffset;
    this.updateScrollIndicators();
  }

  private createScrollIndicator(symbol: string, y: number): Container {
    const indicator = new Container();
    const bg = new Graphics();
    bg.rect(0, 0, PANEL_WIDTH, 24);
    bg.fill({ color: 0x1a1a2e, alpha: 0.85 });
    indicator.addChild(bg);

    const label = new Text({
      text: symbol,
      style: { fontFamily: 'Arial', fontSize: 14, fill: '#aaaaaa' },
    });
    label.anchor.set(0.5, 0);
    label.x = PANEL_WIDTH / 2;
    label.y = 3;
    indicator.addChild(label);

    indicator.y = y;
    return indicator;
  }

  private updateScrollIndicators(): void {
    this.scrollUpIndicator.visible = this.scrollOffset > 0;
    this.scrollDownIndicator.visible = this.scrollOffset < this.maxScroll;
  }

  /** TLDR: Position the gallery on screen */
  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  show(): void {
    this.container.visible = true;
  }

  hide(): void {
    this.container.visible = false;
  }

  isVisible(): boolean {
    return this.container.visible;
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    if (this.tooltipTimer) {
      clearTimeout(this.tooltipTimer);
      this.tooltipTimer = null;
    }
    Ticker.shared.remove(this.boundTickerUpdate);
    window.removeEventListener('keydown', this.boundOnKeyDown);
    this.container.destroy({ children: true });
  }
}
