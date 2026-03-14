import { Container, Graphics, Text, FederatedPointerEvent } from 'pixi.js';
import type { Scene, SceneContext } from '../core';
import { SCENES, COLORS } from '../config';
import { EncyclopediaSystem, EncyclopediaEntry } from '../systems/EncyclopediaSystem';
import { ParticleSystem } from '../systems';
import { announce } from '../utils/accessibility';
import type { PlantConfig } from '../entities/Plant';
import { MenuScene } from './MenuScene';

type RarityFilter = 'all' | 'common' | 'uncommon' | 'rare' | 'heirloom';
type SortMode = 'name' | 'rarity' | 'growth';

const RARITY_COLORS: Record<string, number> = {
  common: 0x4caf50,
  uncommon: 0x2196f3,
  rare: 0x9c27b0,
  heirloom: 0xffd700,
};

const RARITY_ORDER: Record<string, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  heirloom: 3,
};

const CARD_WIDTH = 150;
const CARD_HEIGHT = 130;
const GRID_COLS = 4;
const GRID_GAP = 14;
const SCROLL_SPEED = 40;
const HEADER_HEIGHT = 60;
const FILTER_HEIGHT = 50;
const CONTENT_TOP = HEADER_HEIGHT + FILTER_HEIGHT;

/**
 * TLDR: Standalone encyclopedia scene — browse all plants from the main menu
 */
export class EncyclopediaScene implements Scene {
  readonly name = 'encyclopedia';

  private container = new Container();
  private bgLayer = new Container();
  private particleLayer = new Container();
  private contentLayer = new Container();
  private cardsContainer = new Container();
  private cardsMask!: Graphics;
  private detailOverlay = new Container();

  private particleSystem: ParticleSystem;
  private encyclopediaSystem: EncyclopediaSystem;

  private ctx: SceneContext | null = null;
  private screenWidth = 800;
  private screenHeight = 600;
  private elapsed = 0;
  private fireflyCooldown = 0;

  // Filter state
  private rarityFilter: RarityFilter = 'all';
  private sortMode: SortMode = 'rarity';
  private filterButtons: { bg: Graphics; text: Text; value: string }[] = [];

  // Card grid
  private filteredEntries: EncyclopediaEntry[] = [];
  private cardGraphics: { container: Container; entry: EncyclopediaEntry; bg: Graphics }[] = [];
  private selectedCardIndex = 0;
  private focusRing: Graphics | null = null;

  // Scroll
  private scrollOffset = 0;
  private maxScroll = 0;

  // Detail view
  private detailVisible = false;

  // Event listeners
  private boundOnKeyDown!: (e: KeyboardEvent) => void;
  private boundOnWheel!: (e: WheelEvent) => void;
  private boundOnResize!: () => void;

  constructor(encyclopediaSystem: EncyclopediaSystem) {
    this.encyclopediaSystem = encyclopediaSystem;
    this.particleSystem = new ParticleSystem();
  }

  async init(ctx: SceneContext): Promise<void> {
    this.ctx = ctx;
    const { app } = ctx;
    const stage = app.stage.children[0] as Container;
    stage.addChild(this.container);

    this.screenWidth = app.screen.width;
    this.screenHeight = app.screen.height;
    this.elapsed = 0;
    this.fireflyCooldown = 0;
    this.scrollOffset = 0;
    this.selectedCardIndex = 0;
    this.detailVisible = false;

    // TLDR: Layer hierarchy — bg, particles, content, detail overlay
    this.container.addChild(this.bgLayer);
    this.container.addChild(this.particleLayer);
    this.particleLayer.addChild(this.particleSystem.getContainer());
    this.container.addChild(this.contentLayer);
    this.container.addChild(this.detailOverlay);
    this.detailOverlay.visible = false;

    this.buildBackground();
    this.buildHeader();
    this.buildFilterBar();
    this.buildCardGrid();
    this.buildBackButton();

    // TLDR: Keyboard and scroll listeners
    this.boundOnKeyDown = (e: KeyboardEvent) => this.handleKeyDown(e);
    window.addEventListener('keydown', this.boundOnKeyDown);

    this.boundOnWheel = (e: WheelEvent) => {
      if (!this.detailVisible) {
        this.scroll(e.deltaY > 0 ? SCROLL_SPEED : -SCROLL_SPEED);
        e.preventDefault();
      }
    };
    window.addEventListener('wheel', this.boundOnWheel, { passive: false });

    this.boundOnResize = () => {
      if (this.ctx) {
        this.screenWidth = this.ctx.app.screen.width;
        this.screenHeight = this.ctx.app.screen.height;
      }
    };
    window.addEventListener('resize', this.boundOnResize);

    announce('Encyclopedia opened. Browse discovered plants. Use arrow keys to navigate, Enter to view details, Escape to go back.');
  }

  // ── Background (matches MenuScene aesthetic) ───────────────────────

  private buildBackground(): void {
    const w = this.screenWidth;
    const h = this.screenHeight;

    const bg = new Graphics();
    bg.rect(0, 0, w, h);
    bg.fill({ color: COLORS.DARK_GREEN });
    this.bgLayer.addChild(bg);

    // TLDR: Rolling hills silhouette
    const hills = new Graphics();
    hills.moveTo(0, h * 0.75);
    hills.quadraticCurveTo(w * 0.2, h * 0.6, w * 0.35, h * 0.7);
    hills.quadraticCurveTo(w * 0.55, h * 0.8, w * 0.7, h * 0.65);
    hills.quadraticCurveTo(w * 0.9, h * 0.55, w, h * 0.68);
    hills.lineTo(w, h);
    hills.lineTo(0, h);
    hills.closePath();
    hills.fill({ color: 0x1e4d1a, alpha: 0.6 });
    this.bgLayer.addChild(hills);

    const fgHills = new Graphics();
    fgHills.moveTo(0, h * 0.85);
    fgHills.quadraticCurveTo(w * 0.3, h * 0.75, w * 0.5, h * 0.82);
    fgHills.quadraticCurveTo(w * 0.75, h * 0.88, w, h * 0.8);
    fgHills.lineTo(w, h);
    fgHills.lineTo(0, h);
    fgHills.closePath();
    fgHills.fill({ color: 0x163d13, alpha: 0.5 });
    this.bgLayer.addChild(fgHills);

    // TLDR: Decorative flower dots
    for (let i = 0; i < 14; i++) {
      const flower = new Graphics();
      const fx = Math.random() * w;
      const fy = h * 0.75 + Math.random() * h * 0.2;
      const flowerColors = [0xffb7c5, 0xffd700, 0xff6b6b, 0x87ceeb, 0xdda0dd];
      const color = flowerColors[Math.floor(Math.random() * flowerColors.length)];
      flower.circle(fx, fy, 2 + Math.random() * 2);
      flower.fill({ color, alpha: 0.3 + Math.random() * 0.3 });
      this.bgLayer.addChild(flower);
    }
  }

  // ── Header ─────────────────────────────────────────────────────────

  private buildHeader(): void {
    const cx = this.screenWidth / 2;

    const headerBg = new Graphics();
    headerBg.rect(0, 0, this.screenWidth, HEADER_HEIGHT);
    headerBg.fill({ color: 0x1a1a1a, alpha: 0.85 });
    this.contentLayer.addChild(headerBg);

    const title = new Text({
      text: '📖 Seed Encyclopedia',
      style: {
        fontFamily: 'Arial',
        fontSize: 26,
        fill: '#c8e6c9',
        fontWeight: 'bold',
      },
    });
    title.anchor.set(0.5, 0.5);
    title.x = cx;
    title.y = HEADER_HEIGHT / 2;
    this.contentLayer.addChild(title);

    // TLDR: Discovery stats
    const stats = this.encyclopediaSystem.getStats();
    const statsText = new Text({
      text: `Discovered: ${stats.discovered} / ${stats.total} (${stats.percentComplete}%)`,
      style: {
        fontFamily: 'Arial',
        fontSize: 13,
        fill: '#aaaaaa',
      },
    });
    statsText.anchor.set(1, 0.5);
    statsText.x = this.screenWidth - 16;
    statsText.y = HEADER_HEIGHT / 2;
    this.contentLayer.addChild(statsText);
  }

  // ── Filter bar ─────────────────────────────────────────────────────

  private buildFilterBar(): void {
    const filterBg = new Graphics();
    filterBg.rect(0, HEADER_HEIGHT, this.screenWidth, FILTER_HEIGHT);
    filterBg.fill({ color: 0x1a1a1a, alpha: 0.7 });
    this.contentLayer.addChild(filterBg);

    const filters: { label: string; value: RarityFilter }[] = [
      { label: 'All', value: 'all' },
      { label: 'Common', value: 'common' },
      { label: 'Uncommon', value: 'uncommon' },
      { label: 'Rare', value: 'rare' },
      { label: 'Heirloom', value: 'heirloom' },
    ];

    const btnWidth = 90;
    const btnHeight = 30;
    const startX = 16;
    const y = HEADER_HEIGHT + (FILTER_HEIGHT - btnHeight) / 2;

    filters.forEach((f, i) => {
      const x = startX + i * (btnWidth + 8);
      const bg = new Graphics();
      const isActive = this.rarityFilter === f.value;
      bg.roundRect(x, y, btnWidth, btnHeight, 6);
      if (isActive) {
        bg.fill({ color: 0x3e7a38 });
        bg.stroke({ color: 0x88d498, width: 2 });
      } else {
        bg.fill({ color: 0x2a2a2a, alpha: 0.9 });
        bg.stroke({ color: 0x4a4a4a, width: 1 });
      }
      bg.eventMode = 'static';
      bg.cursor = 'pointer';
      bg.accessible = true;
      bg.accessibleTitle = `Filter: ${f.label}`;

      const text = new Text({
        text: f.label,
        style: {
          fontFamily: 'Arial',
          fontSize: 13,
          fill: isActive ? '#ffffff' : '#aaaaaa',
          fontWeight: isActive ? 'bold' : 'normal',
        },
      });
      text.anchor.set(0.5, 0.5);
      text.x = x + btnWidth / 2;
      text.y = y + btnHeight / 2;

      bg.on('pointerdown', () => {
        this.rarityFilter = f.value;
        this.rebuildFilterBar();
        this.rebuildCards();
        announce(`Filter: ${f.label}`);
      });

      this.contentLayer.addChild(bg);
      this.contentLayer.addChild(text);
      this.filterButtons.push({ bg, text, value: f.value });
    });
  }

  private rebuildFilterBar(): void {
    // TLDR: Update visual state of filter buttons
    this.filterButtons.forEach(({ bg, text, value }) => {
      const isActive = this.rarityFilter === value;
      const bounds = bg.getBounds();
      bg.clear();
      bg.roundRect(bounds.x, bounds.y, bounds.width, bounds.height, 6);
      if (isActive) {
        bg.fill({ color: 0x3e7a38 });
        bg.stroke({ color: 0x88d498, width: 2 });
      } else {
        bg.fill({ color: 0x2a2a2a, alpha: 0.9 });
        bg.stroke({ color: 0x4a4a4a, width: 1 });
      }
      text.style.fill = isActive ? '#ffffff' : '#aaaaaa';
      text.style.fontWeight = isActive ? 'bold' : 'normal';
    });
  }

  // ── Card grid ──────────────────────────────────────────────────────

  private buildCardGrid(): void {
    const viewportHeight = this.screenHeight - CONTENT_TOP - 50;

    // TLDR: Clip mask for scrollable card area
    this.cardsMask = new Graphics();
    this.cardsMask.rect(0, CONTENT_TOP, this.screenWidth, viewportHeight);
    this.cardsMask.fill({ color: 0xffffff });
    this.contentLayer.addChild(this.cardsMask);

    this.cardsContainer = new Container();
    this.cardsContainer.y = CONTENT_TOP;
    this.cardsContainer.mask = this.cardsMask;
    this.contentLayer.addChild(this.cardsContainer);

    // TLDR: Focus ring for keyboard navigation
    this.focusRing = new Graphics();
    this.cardsContainer.addChild(this.focusRing);

    this.rebuildCards();
  }

  private rebuildCards(): void {
    // TLDR: Clear existing cards
    this.cardsContainer.removeChildren();
    this.cardGraphics = [];
    this.scrollOffset = 0;

    // Re-add focus ring
    this.focusRing = new Graphics();
    this.cardsContainer.addChild(this.focusRing);

    // TLDR: Filter entries by rarity
    const allEntries = this.encyclopediaSystem.getEntries();
    this.filteredEntries = allEntries.filter(entry => {
      if (this.rarityFilter !== 'all' && entry.config.rarity !== this.rarityFilter) return false;
      return true;
    });

    // TLDR: Sort — discovered first, then by rarity, then name
    this.filteredEntries.sort((a, b) => {
      if (a.discovered !== b.discovered) return a.discovered ? -1 : 1;
      const aRarity = RARITY_ORDER[a.config.rarity] ?? 0;
      const bRarity = RARITY_ORDER[b.config.rarity] ?? 0;
      if (aRarity !== bRarity) return aRarity - bRarity;
      return a.config.displayName.localeCompare(b.config.displayName);
    });

    // TLDR: Layout cards in grid
    const gridWidth = GRID_COLS * (CARD_WIDTH + GRID_GAP) - GRID_GAP;
    const startX = (this.screenWidth - gridWidth) / 2;

    this.filteredEntries.forEach((entry, index) => {
      const row = Math.floor(index / GRID_COLS);
      const col = index % GRID_COLS;
      const x = startX + col * (CARD_WIDTH + GRID_GAP);
      const y = GRID_GAP + row * (CARD_HEIGHT + GRID_GAP);

      const card = this.createCard(entry, x, y);
      this.cardsContainer.addChild(card.container);
      this.cardGraphics.push(card);
    });

    // TLDR: Calculate scroll bounds
    const totalRows = Math.ceil(this.filteredEntries.length / GRID_COLS);
    const contentHeight = totalRows * (CARD_HEIGHT + GRID_GAP) + GRID_GAP;
    const viewportHeight = this.screenHeight - CONTENT_TOP - 50;
    this.maxScroll = Math.max(0, contentHeight - viewportHeight);

    // Reset selection
    this.selectedCardIndex = 0;
    this.updateFocusRing();
  }

  private createCard(entry: EncyclopediaEntry, x: number, y: number): { container: Container; entry: EncyclopediaEntry; bg: Graphics } {
    const card = new Container();
    card.x = x;
    card.y = y;

    const rarityColor = entry.discovered
      ? (RARITY_COLORS[entry.config.rarity] ?? 0x4caf50)
      : 0x333333;

    // TLDR: Card background with rarity-colored border
    const bg = new Graphics();
    bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 8);
    bg.fill({ color: 0x2a2520, alpha: 0.92 });
    bg.stroke({ color: rarityColor, width: 2 });
    bg.eventMode = 'static';
    bg.cursor = entry.discovered ? 'pointer' : 'default';
    bg.accessible = true;
    bg.accessibleTitle = entry.discovered
      ? `${entry.config.displayName} - ${entry.config.rarity}`
      : `Undiscovered ${entry.config.rarity} plant`;
    card.addChild(bg);

    if (entry.discovered) {
      // TLDR: Thumbnail circle in rarity color
      const thumb = new Graphics();
      thumb.circle(CARD_WIDTH / 2, 35, 22);
      thumb.fill({ color: rarityColor, alpha: 0.35 });
      thumb.stroke({ color: rarityColor, width: 2 });
      card.addChild(thumb);

      const nameText = new Text({
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
      nameText.anchor.set(0.5, 0);
      nameText.x = CARD_WIDTH / 2;
      nameText.y = 65;
      card.addChild(nameText);

      // TLDR: Rarity stars
      const stars = '★'.repeat(RARITY_ORDER[entry.config.rarity] + 1);
      const starsText = new Text({
        text: stars,
        style: {
          fontFamily: 'Arial',
          fontSize: 12,
          fill: entry.config.rarity === 'heirloom' ? '#ffd700' : '#aaaaaa',
        },
      });
      starsText.anchor.set(0.5, 0);
      starsText.x = CARD_WIDTH / 2;
      starsText.y = 88;
      card.addChild(starsText);

      // TLDR: Growth time
      const infoText = new Text({
        text: `${entry.config.growthTime}d growth`,
        style: {
          fontFamily: 'Arial',
          fontSize: 11,
          fill: '#888888',
        },
      });
      infoText.anchor.set(0.5, 0);
      infoText.x = CARD_WIDTH / 2;
      infoText.y = 108;
      card.addChild(infoText);

      // TLDR: Hover glow effect
      bg.on('pointerover', () => {
        bg.clear();
        bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 8);
        bg.fill({ color: 0x3a3530, alpha: 0.95 });
        bg.stroke({ color: rarityColor, width: 3 });
      });
      bg.on('pointerout', () => {
        bg.clear();
        bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 8);
        bg.fill({ color: 0x2a2520, alpha: 0.92 });
        bg.stroke({ color: rarityColor, width: 2 });
      });
      bg.on('pointerdown', () => {
        this.openDetail(entry);
      });

    } else {
      // TLDR: Undiscovered — silhouette with question mark
      const silhouette = new Graphics();
      silhouette.circle(CARD_WIDTH / 2, 35, 22);
      silhouette.fill({ color: 0x333333, alpha: 0.5 });
      card.addChild(silhouette);

      const questionMark = new Text({
        text: '?',
        style: {
          fontFamily: 'Arial',
          fontSize: 28,
          fill: '#555555',
          fontWeight: 'bold',
        },
      });
      questionMark.anchor.set(0.5, 0.5);
      questionMark.x = CARD_WIDTH / 2;
      questionMark.y = 35;
      card.addChild(questionMark);

      const unknownText = new Text({
        text: '???',
        style: {
          fontFamily: 'Arial',
          fontSize: 14,
          fill: '#555555',
          fontWeight: 'bold',
        },
      });
      unknownText.anchor.set(0.5, 0);
      unknownText.x = CARD_WIDTH / 2;
      unknownText.y = 65;
      card.addChild(unknownText);

      // TLDR: Rarity hint stars
      const stars = '★'.repeat(RARITY_ORDER[entry.config.rarity] + 1);
      const starsText = new Text({
        text: stars,
        style: { fontFamily: 'Arial', fontSize: 12, fill: '#444444' },
      });
      starsText.anchor.set(0.5, 0);
      starsText.x = CARD_WIDTH / 2;
      starsText.y = 88;
      card.addChild(starsText);
    }

    return { container: card, entry, bg };
  }

  // ── Detail popup ───────────────────────────────────────────────────

  private openDetail(entry: EncyclopediaEntry): void {
    if (!entry.discovered) return;
    this.detailVisible = true;
    this.detailOverlay.removeChildren();
    this.detailOverlay.visible = true;

    const w = this.screenWidth;
    const h = this.screenHeight;

    // TLDR: Semi-transparent backdrop
    const backdrop = new Graphics();
    backdrop.rect(0, 0, w, h);
    backdrop.fill({ color: 0x000000, alpha: 0.65 });
    backdrop.eventMode = 'static';
    backdrop.on('pointerdown', () => this.closeDetail());
    this.detailOverlay.addChild(backdrop);

    // TLDR: Detail card
    const panelW = 360;
    const panelH = 340;
    const px = (w - panelW) / 2;
    const py = (h - panelH) / 2;

    const panel = new Graphics();
    panel.roundRect(px, py, panelW, panelH, 12);
    panel.fill({ color: 0x2a2520, alpha: 0.97 });
    const rarityColor = RARITY_COLORS[entry.config.rarity] ?? 0x4caf50;
    panel.stroke({ color: rarityColor, width: 3 });
    panel.eventMode = 'static'; // TLDR: Prevent backdrop click-through
    this.detailOverlay.addChild(panel);

    // TLDR: Plant thumbnail
    const thumb = new Graphics();
    thumb.circle(w / 2, py + 55, 35);
    thumb.fill({ color: rarityColor, alpha: 0.3 });
    thumb.stroke({ color: rarityColor, width: 2 });
    this.detailOverlay.addChild(thumb);

    // TLDR: Plant name
    const nameText = new Text({
      text: entry.config.displayName,
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: '#ffffff',
        fontWeight: 'bold',
      },
    });
    nameText.anchor.set(0.5, 0);
    nameText.x = w / 2;
    nameText.y = py + 100;
    this.detailOverlay.addChild(nameText);

    // TLDR: Rarity badge
    const rarityText = new Text({
      text: entry.config.rarity.toUpperCase(),
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: this.getRarityTextColor(entry.config.rarity),
        fontWeight: 'bold',
      },
    });
    rarityText.anchor.set(0.5, 0);
    rarityText.x = w / 2;
    rarityText.y = py + 130;
    this.detailOverlay.addChild(rarityText);

    // TLDR: Stats
    const statsLines = [
      `Growth Time: ${entry.config.growthTime} days`,
      `Water Need: ${Math.round(entry.config.waterNeedPerDay * 100)}%/day`,
      `Seed Yield: ${entry.config.yieldSeeds}`,
      `Seasons: ${entry.config.availableSeasons.join(', ')}`,
    ];
    const statsText = new Text({
      text: statsLines.join('\n'),
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: '#cccccc',
        lineHeight: 24,
      },
    });
    statsText.anchor.set(0.5, 0);
    statsText.x = w / 2;
    statsText.y = py + 160;
    this.detailOverlay.addChild(statsText);

    // TLDR: Close button
    const closeBtn = new Graphics();
    closeBtn.roundRect(w / 2 - 50, py + panelH - 50, 100, 36, 8);
    closeBtn.fill({ color: 0x3e7a38 });
    closeBtn.stroke({ color: 0x88d498, width: 2 });
    closeBtn.eventMode = 'static';
    closeBtn.cursor = 'pointer';
    closeBtn.accessible = true;
    closeBtn.accessibleTitle = 'Close detail view';
    closeBtn.on('pointerdown', () => this.closeDetail());
    closeBtn.on('pointerover', () => {
      closeBtn.clear();
      closeBtn.roundRect(w / 2 - 50, py + panelH - 50, 100, 36, 8);
      closeBtn.fill({ color: 0x4caf50 });
      closeBtn.stroke({ color: 0x88d498, width: 2 });
    });
    closeBtn.on('pointerout', () => {
      closeBtn.clear();
      closeBtn.roundRect(w / 2 - 50, py + panelH - 50, 100, 36, 8);
      closeBtn.fill({ color: 0x3e7a38 });
      closeBtn.stroke({ color: 0x88d498, width: 2 });
    });
    this.detailOverlay.addChild(closeBtn);

    const closeText = new Text({
      text: 'Close',
      style: { fontFamily: 'Arial', fontSize: 15, fill: '#ffffff', fontWeight: 'bold' },
    });
    closeText.anchor.set(0.5, 0.5);
    closeText.x = w / 2;
    closeText.y = py + panelH - 32;
    this.detailOverlay.addChild(closeText);

    announce(`Viewing ${entry.config.displayName}. ${entry.config.rarity} plant. Growth time: ${entry.config.growthTime} days. Press Escape to close.`);
  }

  private closeDetail(): void {
    this.detailVisible = false;
    this.detailOverlay.removeChildren();
    this.detailOverlay.visible = false;
    announce('Detail view closed.');
  }

  private getRarityTextColor(rarity: string): string {
    const map: Record<string, string> = {
      common: '#4caf50',
      uncommon: '#2196f3',
      rare: '#9c27b0',
      heirloom: '#ffd700',
    };
    return map[rarity] ?? '#4caf50';
  }

  // ── Back button ────────────────────────────────────────────────────

  private buildBackButton(): void {
    const btnWidth = 130;
    const btnHeight = 36;
    const btnX = 14;
    const btnY = this.screenHeight - btnHeight - 10;

    const backBg = new Graphics();
    backBg.roundRect(btnX, btnY, btnWidth, btnHeight, 8);
    backBg.fill({ color: 0x2a2a2a, alpha: 0.9 });
    backBg.stroke({ color: 0x4a4a4a, width: 2 });
    backBg.eventMode = 'static';
    backBg.cursor = 'pointer';
    backBg.accessible = true;
    backBg.accessibleTitle = 'Back to main menu';

    const backText = new Text({
      text: '← Back',
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: '#c8e6c9',
        fontWeight: 'bold',
      },
    });
    backText.anchor.set(0.5, 0.5);
    backText.x = btnX + btnWidth / 2;
    backText.y = btnY + btnHeight / 2;

    backBg.on('pointerover', () => {
      backBg.clear();
      backBg.roundRect(btnX, btnY, btnWidth, btnHeight, 8);
      backBg.fill({ color: 0x4caf50 });
      backBg.stroke({ color: 0x66bb6a, width: 2 });
    });
    backBg.on('pointerout', () => {
      backBg.clear();
      backBg.roundRect(btnX, btnY, btnWidth, btnHeight, 8);
      backBg.fill({ color: 0x2a2a2a, alpha: 0.9 });
      backBg.stroke({ color: 0x4a4a4a, width: 2 });
    });
    backBg.on('pointerdown', () => this.goBack());

    this.contentLayer.addChild(backBg);
    this.contentLayer.addChild(backText);

    // TLDR: Keyboard hint
    const hint = new Text({
      text: 'Esc to go back · Arrow keys to navigate · Enter for details',
      style: { fontFamily: 'Arial', fontSize: 11, fill: '#666666' },
    });
    hint.anchor.set(0.5, 0.5);
    hint.x = this.screenWidth / 2;
    hint.y = this.screenHeight - 14;
    this.contentLayer.addChild(hint);
  }

  // ── Navigation ─────────────────────────────────────────────────────

  private goBack(): void {
    if (!this.ctx) return;
    announce('Returning to menu.');
    // TLDR: Tell MenuScene to skip title and show main menu directly
    const menuScene = this.ctx.sceneManager.getScene(SCENES.MENU);
    if (menuScene && menuScene instanceof MenuScene) {
      menuScene.setReturnToMain();
    }
    this.ctx.sceneManager.transitionTo(SCENES.MENU, { type: 'fade' }).catch(console.error);
  }

  // ── Keyboard handling ──────────────────────────────────────────────

  private handleKeyDown(e: KeyboardEvent): void {
    // TLDR: Detail view captures Esc/Enter/Space
    if (this.detailVisible) {
      if (e.code === 'Escape' || e.code === 'Enter' || e.code === 'Space' || e.code === 'Backspace') {
        e.preventDefault();
        this.closeDetail();
      }
      return;
    }

    switch (e.code) {
      case 'Escape':
      case 'Backspace':
        e.preventDefault();
        this.goBack();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.navigateCards(-GRID_COLS);
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.navigateCards(GRID_COLS);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this.navigateCards(-1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.navigateCards(1);
        break;
      case 'Enter':
      case 'Space':
        e.preventDefault();
        this.activateSelectedCard();
        break;
      case 'Tab':
        e.preventDefault();
        this.navigateCards(e.shiftKey ? -1 : 1);
        break;
    }
  }

  private navigateCards(delta: number): void {
    if (this.cardGraphics.length === 0) return;
    const next = Math.max(0, Math.min(this.cardGraphics.length - 1, this.selectedCardIndex + delta));
    if (next === this.selectedCardIndex) return;
    this.selectedCardIndex = next;
    this.updateFocusRing();
    this.scrollToFocusedCard();

    const entry = this.cardGraphics[next]?.entry;
    if (entry) {
      announce(entry.discovered ? entry.config.displayName : `Undiscovered ${entry.config.rarity} plant`);
    }
  }

  private activateSelectedCard(): void {
    const card = this.cardGraphics[this.selectedCardIndex];
    if (card && card.entry.discovered) {
      this.openDetail(card.entry);
    }
  }

  private updateFocusRing(): void {
    if (!this.focusRing) return;
    this.focusRing.clear();
    const card = this.cardGraphics[this.selectedCardIndex];
    if (!card) return;

    const c = card.container;
    this.focusRing.roundRect(c.x - 3, c.y - 3, CARD_WIDTH + 6, CARD_HEIGHT + 6, 10);
    this.focusRing.stroke({ color: 0xffffff, width: 2, alpha: 0.9 });
  }

  private scrollToFocusedCard(): void {
    const card = this.cardGraphics[this.selectedCardIndex];
    if (!card) return;

    const cardTop = card.container.y;
    const cardBottom = cardTop + CARD_HEIGHT;
    const viewportHeight = this.screenHeight - CONTENT_TOP - 50;

    if (cardTop < this.scrollOffset) {
      this.scrollOffset = Math.max(0, cardTop - GRID_GAP);
    } else if (cardBottom > this.scrollOffset + viewportHeight) {
      this.scrollOffset = Math.min(this.maxScroll, cardBottom - viewportHeight + GRID_GAP);
    }
    this.applyScroll();
  }

  // ── Scroll ─────────────────────────────────────────────────────────

  private scroll(delta: number): void {
    this.scrollOffset = Math.max(0, Math.min(this.maxScroll, this.scrollOffset + delta));
    this.applyScroll();
  }

  private applyScroll(): void {
    this.cardsContainer.y = CONTENT_TOP - this.scrollOffset;
  }

  // ── Firefly particles (consistent with MenuScene) ──────────────────

  private updateFireflies(dt: number): void {
    this.fireflyCooldown -= dt;
    if (this.fireflyCooldown <= 0) {
      this.fireflyCooldown = 0.8 + Math.random() * 1.5;
      this.particleSystem.burst({
        x: Math.random() * this.screenWidth,
        y: this.screenHeight * 0.5 + Math.random() * this.screenHeight * 0.4,
        count: 1,
        speed: 8 + Math.random() * 12,
        lifetime: 2.5 + Math.random() * 2,
        colors: [0xfff9c4, 0xffe082, 0xc8e6c9, 0xb9f6ca],
        size: 2 + Math.random() * 2,
        gravity: -15 - Math.random() * 10,
        fadeOut: true,
        shrink: false,
      });
    }
  }

  // ── Scene lifecycle ────────────────────────────────────────────────

  update(dt: number, _ctx: SceneContext): void {
    this.elapsed += dt;
    this.particleSystem.update(dt);
    this.updateFireflies(dt);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.boundOnKeyDown);
    window.removeEventListener('wheel', this.boundOnWheel);
    window.removeEventListener('resize', this.boundOnResize);
    this.particleSystem.destroy();

    this.detailOverlay.removeChildren();
    this.container.destroy({ children: true });
    this.container = new Container();
    this.bgLayer = new Container();
    this.particleLayer = new Container();
    this.contentLayer = new Container();
    this.cardsContainer = new Container();
    this.detailOverlay = new Container();
    this.cardGraphics = [];
    this.filterButtons = [];
    this.filteredEntries = [];
    this.focusRing = null;
    this.ctx = null;
  }
}
