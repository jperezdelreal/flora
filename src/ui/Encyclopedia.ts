import { Container, Graphics, Text, Rectangle, FederatedPointerEvent } from 'pixi.js';
import { EncyclopediaEntry } from '../systems/EncyclopediaSystem';

const RARITY_COLORS = {
  common: '#4caf50',    // Green
  uncommon: '#2196f3',  // Blue
  rare: '#9c27b0',      // Purple
  heirloom: '#ffd700',  // Gold
};

const ENTRY_WIDTH = 180;
const ENTRY_HEIGHT = 140;
const GRID_COLS = 4;
const GRID_PADDING = 16;

const SCROLL_SPEED = 40;
const VIEWPORT_HEIGHT = 500;

/**
 * Encyclopedia displays all plant entries in a grid layout.
 * Shows discovered plants with details, undiscovered as '??' silhouettes.
 */
export class Encyclopedia {
  private container: Container;
  private entriesContainer: Container;
  private headerText: Text;
  private statsText: Text;
  private entries: EncyclopediaEntry[] = [];
  private scrollOffset = 0;
  private maxScroll = 0;
  private isDragging = false;
  private dragLastY = 0;
  private scrollUpIndicator!: Container;
  private scrollDownIndicator!: Container;
  private boundOnKeyDown: (e: KeyboardEvent) => void;

  constructor() {
    this.container = new Container();

    // Header background
    const headerBg = new Graphics();
    headerBg.rect(0, 0, 800, 80);
    headerBg.fill({ color: 0x1a1a1a, alpha: 0.9 });
    this.container.addChild(headerBg);

    // Header text
    this.headerText = new Text({
      text: '🌱 Seed Encyclopedia',
      style: {
        fontFamily: 'Arial',
        fontSize: 32,
        fill: '#c8e6c9',
        fontWeight: 'bold',
      },
    });
    this.headerText.x = 20;
    this.headerText.y = 15;
    this.container.addChild(this.headerText);

    // Stats text
    this.statsText = new Text({
      text: 'Discovered: 0 / 12 (0%)',
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: '#aaaaaa',
      },
    });
    this.statsText.x = 20;
    this.statsText.y = 55;
    this.container.addChild(this.statsText);

    // Entries container (scrollable)
    this.entriesContainer = new Container();
    this.entriesContainer.y = 100;
    this.container.addChild(this.entriesContainer);

    // Scroll indicators
    this.scrollUpIndicator = this.createScrollIndicator('▲', 100);
    this.scrollDownIndicator = this.createScrollIndicator('▼', 100 + VIEWPORT_HEIGHT - 24);
    this.container.addChild(this.scrollUpIndicator);
    this.container.addChild(this.scrollDownIndicator);
    this.scrollUpIndicator.visible = false;
    this.scrollDownIndicator.visible = false;

    // Scrollable area hit region for mouse events
    const scrollArea = new Graphics();
    scrollArea.rect(0, 100, 800, VIEWPORT_HEIGHT);
    scrollArea.fill({ color: 0x000000, alpha: 0.001 });
    scrollArea.eventMode = 'static';
    scrollArea.cursor = 'default';
    this.container.addChildAt(scrollArea, this.container.getChildIndex(this.entriesContainer));

    // Mouse wheel scrolling
    scrollArea.on('wheel', (e: WheelEvent) => {
      this.scroll(e.deltaY > 0 ? SCROLL_SPEED : -SCROLL_SPEED);
    });

    // Click-and-drag scrolling
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

    // Arrow key navigation
    this.boundOnKeyDown = (e: KeyboardEvent) => {
      if (!this.container.visible) return;
      if (e.key === 'ArrowDown') {
        this.scroll(SCROLL_SPEED);
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        this.scroll(-SCROLL_SPEED);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', this.boundOnKeyDown);
  }

  /** Update encyclopedia with current entries */
  setEntries(entries: EncyclopediaEntry[]): void {
    this.entries = entries;
    this.rebuildGrid();
    this.updateStats();
  }

  /** Rebuild the grid of entry cards */
  private rebuildGrid(): void {
    // Clear existing entries
    this.entriesContainer.removeChildren();

    // Sort entries: discovered first, then by rarity, then by name
    const rarityOrder: Record<string, number> = { 
      common: 0, 
      uncommon: 1, 
      rare: 2, 
      heirloom: 3 
    };
    
    const sortedEntries = [...this.entries].sort((a, b) => {
      if (a.discovered !== b.discovered) {
        return a.discovered ? -1 : 1;
      }
      const aRarityOrder = rarityOrder[a.config.rarity] ?? 0;
      const bRarityOrder = rarityOrder[b.config.rarity] ?? 0;
      if (aRarityOrder !== bRarityOrder) {
        return aRarityOrder - bRarityOrder;
      }
      return a.config.displayName.localeCompare(b.config.displayName);
    });

    // Create entry cards
    sortedEntries.forEach((entry, index) => {
      const row = Math.floor(index / GRID_COLS);
      const col = index % GRID_COLS;
      const x = col * (ENTRY_WIDTH + GRID_PADDING) + GRID_PADDING;
      const y = row * (ENTRY_HEIGHT + GRID_PADDING) + GRID_PADDING;

      const card = this.createEntryCard(entry, x, y);
      this.entriesContainer.addChild(card);
    });

    // Calculate max scroll
    const totalRows = Math.ceil(sortedEntries.length / GRID_COLS);
    const contentHeight = totalRows * (ENTRY_HEIGHT + GRID_PADDING) + GRID_PADDING;
    this.maxScroll = Math.max(0, contentHeight - VIEWPORT_HEIGHT);
    this.updateScrollIndicators();
  }

  /** Create a single entry card */
  private createEntryCard(entry: EncyclopediaEntry, x: number, y: number): Container {
    const card = new Container();
    card.x = x;
    card.y = y;

    const rarityColor = entry.discovered ? this.getRarityColorHex(entry.config.rarity) : 0x333333;

    // Card background
    const bg = new Graphics();
    bg.roundRect(0, 0, ENTRY_WIDTH, ENTRY_HEIGHT, 8);
    bg.fill({ color: 0x2a2a2a, alpha: 0.9 });
    bg.stroke({ color: rarityColor, width: 2 });
    card.addChild(bg);

    if (entry.discovered) {
      // Discovered: show full details
      
      // Thumbnail placeholder (simple colored circle)
      const thumbnail = new Graphics();
      thumbnail.circle(ENTRY_WIDTH / 2, 40, 30);
      thumbnail.fill({ color: rarityColor, alpha: 0.4 });
      thumbnail.stroke({ color: rarityColor, width: 2 });
      card.addChild(thumbnail);

      // Plant name
      const nameText = new Text({
        text: entry.config.displayName,
        style: {
          fontFamily: 'Arial',
          fontSize: 16,
          fill: '#ffffff',
          fontWeight: 'bold',
          align: 'center',
          wordWrap: true,
          wordWrapWidth: ENTRY_WIDTH - 20,
        },
      });
      nameText.anchor.set(0.5, 0);
      nameText.x = ENTRY_WIDTH / 2;
      nameText.y = 80;
      card.addChild(nameText);

      // Rarity badge
      const rarityColorText = RARITY_COLORS[entry.config.rarity] ?? '#4caf50';
      const rarityText = new Text({
        text: entry.config.rarity.toUpperCase(),
        style: {
          fontFamily: 'Arial',
          fontSize: 12,
          fill: rarityColorText,
          fontWeight: 'bold',
        },
      });
      rarityText.anchor.set(0.5, 0);
      rarityText.x = ENTRY_WIDTH / 2;
      rarityText.y = 105;
      card.addChild(rarityText);

      // Growth time info
      const infoText = new Text({
        text: `Growth: ${entry.config.growthTime} days`,
        style: {
          fontFamily: 'Arial',
          fontSize: 11,
          fill: '#aaaaaa',
          align: 'center',
        },
      });
      infoText.anchor.set(0.5, 0);
      infoText.x = ENTRY_WIDTH / 2;
      infoText.y = 122;
      card.addChild(infoText);

    } else {
      // Undiscovered: show silhouette
      
      // Question mark silhouette
      const silhouette = new Graphics();
      silhouette.circle(ENTRY_WIDTH / 2, 40, 30);
      silhouette.fill({ color: 0x333333, alpha: 0.5 });
      card.addChild(silhouette);

      const questionMark = new Text({
        text: '?',
        style: {
          fontFamily: 'Arial',
          fontSize: 32,
          fill: '#555555',
          fontWeight: 'bold',
        },
      });
      questionMark.anchor.set(0.5, 0.5);
      questionMark.x = ENTRY_WIDTH / 2;
      questionMark.y = 40;
      card.addChild(questionMark);

      // "Undiscovered" text
      const unknownText = new Text({
        text: '???',
        style: {
          fontFamily: 'Arial',
          fontSize: 16,
          fill: '#555555',
          fontWeight: 'bold',
          wordWrap: true,
          wordWrapWidth: ENTRY_WIDTH - 20,
        },
      });
      unknownText.anchor.set(0.5, 0);
      unknownText.x = ENTRY_WIDTH / 2;
      unknownText.y = 80;
      card.addChild(unknownText);

      // Rarity hint
      const rarityHint = new Text({
        text: entry.config.rarity.toUpperCase(),
        style: {
          fontFamily: 'Arial',
          fontSize: 11,
          fill: '#555555',
        },
      });
      rarityHint.anchor.set(0.5, 0);
      rarityHint.x = ENTRY_WIDTH / 2;
      rarityHint.y = 105;
      card.addChild(rarityHint);
    }

    return card;
  }

  /** Update stats display */
  private updateStats(): void {
    const discovered = this.entries.filter(e => e.discovered).length;
    const total = this.entries.length;
    const percent = total > 0 ? Math.round((discovered / total) * 100) : 0;
    this.statsText.text = `Discovered: ${discovered} / ${total} (${percent}%)`;
  }

  /** Get rarity color as hex number */
  private getRarityColorHex(rarity: 'common' | 'uncommon' | 'rare' | 'heirloom'): number {
    const colorMap = {
      common: 0x4caf50,
      uncommon: 0x2196f3,
      rare: 0x9c27b0,
      heirloom: 0xffd700,
    };
    return colorMap[rarity];
  }

  /** Scroll the encyclopedia (positive = down, negative = up) */
  scroll(delta: number): void {
    this.scrollOffset = Math.max(0, Math.min(this.maxScroll, this.scrollOffset + delta));
    this.entriesContainer.y = 100 - this.scrollOffset;
    this.updateScrollIndicators();
  }

  /** Create a scroll direction indicator arrow */
  private createScrollIndicator(symbol: string, y: number): Container {
    const indicator = new Container();
    const bg = new Graphics();
    bg.rect(0, 0, 800, 24);
    bg.fill({ color: 0x1a1a1a, alpha: 0.85 });
    indicator.addChild(bg);

    const label = new Text({
      text: symbol,
      style: { fontFamily: 'Arial', fontSize: 14, fill: '#aaaaaa' },
    });
    label.anchor.set(0.5, 0);
    label.x = 400;
    label.y = 3;
    indicator.addChild(label);

    indicator.y = y;
    return indicator;
  }

  /** Update visibility of scroll indicators based on scroll position */
  private updateScrollIndicators(): void {
    this.scrollUpIndicator.visible = this.scrollOffset > 0;
    this.scrollDownIndicator.visible = this.scrollOffset < this.maxScroll;
  }

  /** Position the encyclopedia on screen */
  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  /** Show the encyclopedia */
  show(): void {
    this.container.visible = true;
  }

  /** Hide the encyclopedia */
  hide(): void {
    this.container.visible = false;
  }

  /** Get the container for adding to scene */
  getContainer(): Container {
    return this.container;
  }

  /** Destroy and cleanup */
  destroy(): void {
    window.removeEventListener('keydown', this.boundOnKeyDown);
    this.container.destroy({ children: true });
  }
}
