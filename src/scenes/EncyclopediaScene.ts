import { Container, Graphics, Text, FederatedPointerEvent } from 'pixi.js';
import type { Scene, SceneContext } from '../core';
import { eventBus } from '../core/EventBus';
import { SCENES, COLORS, GAME, UI_COLORS, RARITY_UI_COLORS, RARITY_UI_TEXT_COLORS } from '../config';
import { FIREFLY_PARTICLE_COLORS } from '../config/animations';
import { EncyclopediaSystem, EncyclopediaEntry } from '../systems/EncyclopediaSystem';
import { ParticleSystem } from '../systems';
import { announce } from '../utils/accessibility';
import { MenuScene } from './MenuScene';

type RarityFilter = 'all' | 'common' | 'uncommon' | 'rare' | 'heirloom';
type DiscoveryFilter = 'all' | 'discovered' | 'undiscovered';

const CARD_WIDTH = 160;
const CARD_HEIGHT = 130;
const GRID_COLS = 4;
const GRID_GAP = 14;
const SCROLL_SPEED = 40;

/**
 * TLDR: Standalone encyclopedia scene — browse all plants from the main menu
 */
export class EncyclopediaScene implements Scene {
  readonly name = 'encyclopedia';

  private container = new Container();
  private bgLayer = new Container();
  private particleLayer = new Container();
  private contentLayer = new Container();
  private filterLayer = new Container();
  private cardsContainer = new Container();
  private cardsMask!: Graphics;
  private detailOverlay = new Container();

  private particleSystem: ParticleSystem;
  private encyclopediaSystem: EncyclopediaSystem;

  private ctx: SceneContext | null = null;
  private screenWidth: number = GAME.WIDTH;
  private screenHeight: number = GAME.HEIGHT;
  private elapsed = 0;
  private fireflyCooldown = 0;

  private rarityFilter: RarityFilter = 'all';
  private discoveryFilter: DiscoveryFilter = 'all';
  private filterButtons: { bg: Graphics; text: Text; group: string; value: string }[] = [];

  private cardGraphics: { container: Container; entry: EncyclopediaEntry; bg: Graphics }[] = [];
  private selectedCardIndex = 0;

  private scrollOffset = 0;
  private maxScroll = 0;
  private isDragging = false;
  private dragLastY = 0;

  private detailVisible = false;
  private navigatingBack = false;

  private boundOnKeyDown!: (e: KeyboardEvent) => void;
  private boundOnWheel!: (e: WheelEvent) => void;

  private statsText!: Text;
  private progressBar!: Graphics;
  private progressFill!: Graphics;

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

    this.container.addChild(this.bgLayer);
    this.container.addChild(this.particleLayer);
    this.particleLayer.addChild(this.particleSystem.getContainer());
    this.container.addChild(this.contentLayer);
    this.container.addChild(this.detailOverlay);
    this.detailOverlay.visible = false;

    this.buildBackground();
    this.buildHeader();
    this.buildFilters();
    this.buildCardGrid();
    this.buildBackButton();

    this.boundOnKeyDown = (e: KeyboardEvent) => this.handleKeyDown(e);
    window.addEventListener('keydown', this.boundOnKeyDown);

    this.boundOnWheel = (e: WheelEvent) => {
      if (this.detailVisible) return;
      this.scroll(e.deltaY > 0 ? SCROLL_SPEED : -SCROLL_SPEED);
    };
    window.addEventListener('wheel', this.boundOnWheel, { passive: true });

    this.elapsed = 0;
    this.fireflyCooldown = 0;
    this.navigatingBack = false;

    announce('Encyclopedia opened. Browse discovered plants.');
    eventBus.emit('scene:ready', { scene: 'encyclopedia' });
  }

  // ── Background (consistent with MenuScene) ─────────────────────────

  private buildBackground(): void {
    const w = this.screenWidth;
    const h = this.screenHeight;

    const bg = new Graphics();
    bg.rect(0, 0, w, h);
    bg.fill({ color: COLORS.DARK_GREEN });
    this.bgLayer.addChild(bg);

    const hills = new Graphics();
    hills.moveTo(0, h * 0.7);
    hills.quadraticCurveTo(w * 0.15, h * 0.55, w * 0.3, h * 0.65);
    hills.quadraticCurveTo(w * 0.5, h * 0.75, w * 0.65, h * 0.6);
    hills.quadraticCurveTo(w * 0.85, h * 0.5, w, h * 0.62);
    hills.lineTo(w, h);
    hills.lineTo(0, h);
    hills.closePath();
    hills.fill({ color: UI_COLORS.HILLS_DARK_MID, alpha: 0.6 });
    this.bgLayer.addChild(hills);

    const fgHills = new Graphics();
    fgHills.moveTo(0, h * 0.82);
    fgHills.quadraticCurveTo(w * 0.25, h * 0.72, w * 0.45, h * 0.78);
    fgHills.quadraticCurveTo(w * 0.7, h * 0.85, w, h * 0.76);
    fgHills.lineTo(w, h);
    fgHills.lineTo(0, h);
    fgHills.closePath();
    fgHills.fill({ color: UI_COLORS.HILLS_DARK_FG, alpha: 0.5 });
    this.bgLayer.addChild(fgHills);

    for (let i = 0; i < 18; i++) {
      const flower = new Graphics();
      const fx = Math.random() * w;
      const fy = h * 0.7 + Math.random() * h * 0.25;
      const colors = [UI_COLORS.FLOWER_PINK, UI_COLORS.FLOWER_GOLD, UI_COLORS.FLOWER_RED, UI_COLORS.FLOWER_SKY_BLUE, UI_COLORS.FLOWER_PLUM];
      const color = colors[Math.floor(Math.random() * colors.length)];
      flower.circle(fx, fy, 2 + Math.random() * 2);
      flower.fill({ color, alpha: 0.4 + Math.random() * 0.3 });
      this.bgLayer.addChild(flower);
    }
  }

  // ── Header with title + discovery tracker ───────────────────────────

  private buildHeader(): void {
    const headerBg = new Graphics();
    headerBg.rect(0, 0, this.screenWidth, 70);
    headerBg.fill({ color: UI_COLORS.SCENE_HEADER_BG, alpha: 0.88 });
    this.contentLayer.addChild(headerBg);

    const title = new Text({
      text: '📖  Seed Encyclopedia',
      style: { fontFamily: 'Arial', fontSize: 30, fill: UI_COLORS.TEXT_PRIMARY, fontWeight: 'bold' },
    });
    title.anchor.set(0, 0.5);
    title.x = 20;
    title.y = 24;
    this.contentLayer.addChild(title);

    const barWidth = 160;
    const barHeight = 10;
    const barX = this.screenWidth - barWidth - 20;
    const barY = 14;
    const stats = this.encyclopediaSystem.getStats();

    this.statsText = new Text({
      text: `${stats.discovered}/${stats.total} discovered (${stats.percentComplete}%)`,
      style: { fontFamily: 'Arial', fontSize: 13, fill: UI_COLORS.TEXT_MID_GRAY },
    });
    this.statsText.anchor.set(1, 0);
    this.statsText.x = this.screenWidth - 20;
    this.statsText.y = barY + barHeight + 6;
    this.contentLayer.addChild(this.statsText);

    this.progressBar = new Graphics();
    this.progressBar.roundRect(barX, barY, barWidth, barHeight, 5);
    this.progressBar.fill({ color: COLORS.DARK_GREEN });
    this.progressBar.stroke({ color: COLORS.MID_GREEN, width: 1 });
    this.contentLayer.addChild(this.progressBar);

    this.progressFill = new Graphics();
    const fillW = Math.max(0, barWidth * (stats.percentComplete / 100));
    if (fillW > 0) {
      this.progressFill.roundRect(barX, barY, fillW, barHeight, 5);
      this.progressFill.fill({ color: COLORS.LIGHT_GREEN });
    }
    this.contentLayer.addChild(this.progressFill);

    const cx = this.screenWidth / 2;
    const rarities = ['common', 'uncommon', 'rare', 'heirloom'] as const;
    let rx = cx - 160;
    const ry = 48;
    for (const rarity of rarities) {
      const rd = stats.byRarity[rarity];
      const dot = new Graphics();
      dot.circle(rx, ry, 5);
      dot.fill({ color: RARITY_UI_COLORS[rarity] });
      this.contentLayer.addChild(dot);
      const label = new Text({
        text: `${rd.discovered}/${rd.total}`,
        style: { fontFamily: 'Arial', fontSize: 11, fill: RARITY_UI_TEXT_COLORS[rarity] },
      });
      label.x = rx + 10;
      label.y = ry - 7;
      this.contentLayer.addChild(label);
      rx += 80;
    }
  }

  // ── Filter bar ──────────────────────────────────────────────────────

  private buildFilters(): void {
    this.filterLayer.y = 74;
    this.contentLayer.addChild(this.filterLayer);

    const filterBg = new Graphics();
    filterBg.rect(0, 0, this.screenWidth, 40);
    filterBg.fill({ color: UI_COLORS.SCENE_FILTER_BG, alpha: 0.8 });
    this.filterLayer.addChild(filterBg);

    this.filterButtons = [];
    let x = 12;
    const y = 6;

    const rarities: { label: string; value: RarityFilter }[] = [
      { label: 'All', value: 'all' },
      { label: '🟢 Common', value: 'common' },
      { label: '🔵 Uncommon', value: 'uncommon' },
      { label: '🟣 Rare', value: 'rare' },
      { label: '🟡 Heirloom', value: 'heirloom' },
    ];
    for (const r of rarities) { x = this.addFilterButton(x, y, r.label, 'rarity', r.value); }

    x += 12;
    const sep = new Graphics();
    sep.rect(x, y + 2, 1, 24);
    sep.fill({ color: COLORS.MID_GREEN, alpha: 0.5 });
    this.filterLayer.addChild(sep);
    x += 8;

    const discoveries: { label: string; value: DiscoveryFilter }[] = [
      { label: '✅', value: 'discovered' },
      { label: '❓', value: 'undiscovered' },
    ];
    for (const d of discoveries) { x = this.addFilterButton(x, y, d.label, 'discovery', d.value); }

    this.updateFilterHighlights();
  }

  private addFilterButton(x: number, y: number, label: string, group: string, value: string): number {
    const text = new Text({
      text: label,
      style: { fontFamily: 'Arial', fontSize: 12, fill: UI_COLORS.TEXT_LIGHT_GRAY, fontWeight: 'bold' },
    });
    const textWidth = Math.max(text.width + 16, 40);
    const bg = new Graphics();
    bg.roundRect(x, y, textWidth, 28, 6);
    bg.fill({ color: UI_COLORS.BACK_BUTTON_BG });
    bg.stroke({ color: COLORS.MID_GREEN, width: 1 });
    bg.eventMode = 'static';
    bg.cursor = 'pointer';
    this.filterLayer.addChild(bg);
    text.anchor.set(0.5, 0.5);
    text.x = x + textWidth / 2;
    text.y = y + 14;
    this.filterLayer.addChild(text);
    bg.on('pointerdown', () => this.toggleFilter(group, value));
    this.filterButtons.push({ bg, text, group, value });
    return x + textWidth + 6;
  }

  private toggleFilter(group: string, value: string): void {
    if (group === 'rarity') {
      this.rarityFilter = this.rarityFilter === value as RarityFilter ? 'all' : value as RarityFilter;
    } else if (group === 'discovery') {
      this.discoveryFilter = this.discoveryFilter === value as DiscoveryFilter ? 'all' : value as DiscoveryFilter;
    }
    this.updateFilterHighlights();
    this.rebuildCards();
    announce(`Filter updated. Showing ${this.getFilteredEntries().length} plants.`);
  }

  private updateFilterHighlights(): void {
    for (const btn of this.filterButtons) {
      const active =
        (btn.group === 'rarity' && btn.value === this.rarityFilter) ||
        (btn.group === 'discovery' && btn.value === this.discoveryFilter);
      const textW = Math.max(btn.text.width + 16, 40);
      const bx = btn.text.x - textW / 2;
      const by = btn.text.y - 14;
      btn.bg.clear();
      btn.bg.roundRect(bx, by, textW, 28, 6);
      if (active) {
        btn.bg.fill({ color: COLORS.MID_GREEN, alpha: 0.9 });
        btn.bg.stroke({ color: COLORS.LIGHT_GREEN, width: 2 });
        btn.text.style.fill = UI_COLORS.TEXT_WHITE;
      } else {
        btn.bg.fill({ color: UI_COLORS.BACK_BUTTON_BG });
        btn.bg.stroke({ color: COLORS.MID_GREEN, width: 1 });
        btn.text.style.fill = UI_COLORS.TEXT_LIGHT_GRAY;
      }
    }
  }

  // ── Card grid ───────────────────────────────────────────────────────

  private getFilteredEntries(): EncyclopediaEntry[] {
    let entries = this.encyclopediaSystem.getEntries();
    if (this.rarityFilter !== 'all') {
      entries = entries.filter((e) => e.config.rarity === this.rarityFilter);
    }
    if (this.discoveryFilter === 'discovered') {
      entries = entries.filter((e) => e.discovered);
    } else if (this.discoveryFilter === 'undiscovered') {
      entries = entries.filter((e) => !e.discovered);
    }
    const rarityOrder: Record<string, number> = { common: 0, uncommon: 1, rare: 2, heirloom: 3 };
    return entries.sort((a, b) => {
      if (a.discovered !== b.discovered) return a.discovered ? -1 : 1;
      const aR = rarityOrder[a.config.rarity] ?? 0;
      const bR = rarityOrder[b.config.rarity] ?? 0;
      if (aR !== bR) return aR - bR;
      return a.config.displayName.localeCompare(b.config.displayName);
    });
  }

  private buildCardGrid(): void {
    const gridTop = 118;
    const viewportH = this.screenHeight - gridTop - 50;
    this.cardsMask = new Graphics();
    this.cardsMask.rect(0, gridTop, this.screenWidth, viewportH);
    this.cardsMask.fill({ color: COLORS.WHITE });
    this.contentLayer.addChild(this.cardsMask);
    this.cardsContainer.y = gridTop;
    this.cardsContainer.mask = this.cardsMask;
    this.contentLayer.addChild(this.cardsContainer);

    const hitArea = new Graphics();
    hitArea.rect(0, gridTop, this.screenWidth, viewportH);
    hitArea.fill({ color: COLORS.BLACK, alpha: 0.001 });
    hitArea.eventMode = 'static';
    this.contentLayer.addChildAt(hitArea, this.contentLayer.getChildIndex(this.cardsContainer));
    hitArea.on('pointerdown', (e: FederatedPointerEvent) => { this.isDragging = true; this.dragLastY = e.globalY; });
    hitArea.on('pointermove', (e: FederatedPointerEvent) => {
      if (!this.isDragging) return;
      const dy = this.dragLastY - e.globalY;
      this.dragLastY = e.globalY;
      this.scroll(dy);
    });
    hitArea.on('pointerup', () => { this.isDragging = false; });
    hitArea.on('pointerupoutside', () => { this.isDragging = false; });
    this.rebuildCards();
  }

  private rebuildCards(): void {
    this.cardsContainer.removeChildren();
    this.cardGraphics = [];
    this.scrollOffset = 0;
    this.selectedCardIndex = 0;
    const entries = this.getFilteredEntries();
    const gridWidth = GRID_COLS * (CARD_WIDTH + GRID_GAP) - GRID_GAP;
    const offsetX = (this.screenWidth - gridWidth) / 2;
    entries.forEach((entry, i) => {
      const row = Math.floor(i / GRID_COLS);
      const col = i % GRID_COLS;
      const x = offsetX + col * (CARD_WIDTH + GRID_GAP);
      const y = GRID_GAP + row * (CARD_HEIGHT + GRID_GAP);
      const card = this.createCard(entry, x, y);
      this.cardsContainer.addChild(card.container);
      this.cardGraphics.push(card);
    });
    const totalRows = Math.ceil(entries.length / GRID_COLS);
    const contentH = totalRows * (CARD_HEIGHT + GRID_GAP) + GRID_GAP;
    const viewportH = this.screenHeight - 118 - 50;
    this.maxScroll = Math.max(0, contentH - viewportH);
    this.applyScroll();
    this.highlightCard(0);
  }

  private createCard(entry: EncyclopediaEntry, x: number, y: number): { container: Container; entry: EncyclopediaEntry; bg: Graphics } {
    const card = new Container();
    card.x = x;
    card.y = y;
    const rarityColor = entry.discovered ? (RARITY_UI_COLORS[entry.config.rarity] ?? RARITY_UI_COLORS.common) : UI_COLORS.UNDISCOVERED_GRAY;
    const bg = new Graphics();
    bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 8);
    bg.fill({ color: UI_COLORS.SCENE_CARD_BG, alpha: 0.92 });
    bg.stroke({ color: rarityColor, width: 2 });
    bg.eventMode = 'static';
    bg.cursor = entry.discovered ? 'pointer' : 'default';
    card.addChild(bg);

    if (entry.discovered) {
      const thumb = new Graphics();
      thumb.circle(CARD_WIDTH / 2, 35, 24);
      thumb.fill({ color: rarityColor, alpha: 0.35 });
      thumb.stroke({ color: rarityColor, width: 2 });
      card.addChild(thumb);
      const nameText = new Text({
        text: entry.config.displayName,
        style: { fontFamily: 'Arial', fontSize: 14, fill: UI_COLORS.TEXT_WHITE, fontWeight: 'bold', align: 'center', wordWrap: true, wordWrapWidth: CARD_WIDTH - 16 },
      });
      nameText.anchor.set(0.5, 0); nameText.x = CARD_WIDTH / 2; nameText.y = 66;
      card.addChild(nameText);
      const rarityText = new Text({
        text: entry.config.rarity.toUpperCase(),
        style: { fontFamily: 'Arial', fontSize: 10, fill: RARITY_UI_TEXT_COLORS[entry.config.rarity] ?? RARITY_UI_TEXT_COLORS.common, fontWeight: 'bold' },
      });
      rarityText.anchor.set(0.5, 0); rarityText.x = CARD_WIDTH / 2; rarityText.y = 90;
      card.addChild(rarityText);
      const infoText = new Text({
        text: `🌱 ${entry.config.growthTime}d  💧 ${Math.round(entry.config.waterNeedPerDay * 100)}%`,
        style: { fontFamily: 'Arial', fontSize: 10, fill: UI_COLORS.TEXT_DARK_GRAY },
      });
      infoText.anchor.set(0.5, 0); infoText.x = CARD_WIDTH / 2; infoText.y = 108;
      card.addChild(infoText);
      bg.on('pointerdown', () => { this.showDetail(entry); });
      bg.on('pointerover', () => {
        const idx = this.cardGraphics.findIndex((c) => c.entry === entry);
        if (idx >= 0) { this.selectedCardIndex = idx; this.highlightCard(idx); }
      });
    } else {
      const silhouette = new Graphics();
      silhouette.circle(CARD_WIDTH / 2, 35, 24);
      silhouette.fill({ color: UI_COLORS.UNDISCOVERED_GRAY, alpha: 0.5 });
      card.addChild(silhouette);
      const qMark = new Text({ text: '?', style: { fontFamily: 'Arial', fontSize: 28, fill: UI_COLORS.TEXT_FADED, fontWeight: 'bold' } });
      qMark.anchor.set(0.5, 0.5); qMark.x = CARD_WIDTH / 2; qMark.y = 35;
      card.addChild(qMark);
      const unknown = new Text({ text: '???', style: { fontFamily: 'Arial', fontSize: 14, fill: UI_COLORS.TEXT_FADED, fontWeight: 'bold' } });
      unknown.anchor.set(0.5, 0); unknown.x = CARD_WIDTH / 2; unknown.y = 66;
      card.addChild(unknown);
      const rarityHint = new Text({ text: entry.config.rarity.toUpperCase(), style: { fontFamily: 'Arial', fontSize: 10, fill: UI_COLORS.TEXT_DARKEST } });
      rarityHint.anchor.set(0.5, 0); rarityHint.x = CARD_WIDTH / 2; rarityHint.y = 90;
      card.addChild(rarityHint);
    }
    return { container: card, entry, bg };
  }

  private highlightCard(index: number): void {
    for (let i = 0; i < this.cardGraphics.length; i++) {
      const { bg, entry } = this.cardGraphics[i];
      const selected = i === index;
      const rarityColor = entry.discovered ? (RARITY_UI_COLORS[entry.config.rarity] ?? RARITY_UI_COLORS.common) : UI_COLORS.UNDISCOVERED_GRAY;
      bg.clear();
      bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 8);
      if (selected) {
        bg.fill({ color: UI_COLORS.SCENE_CARD_SELECTED_BG, alpha: 0.95 });
        bg.stroke({ color: entry.discovered ? COLORS.LIGHT_GREEN : UI_COLORS.TEXT_FADED, width: 3 });
      } else {
        bg.fill({ color: UI_COLORS.SCENE_CARD_BG, alpha: 0.92 });
        bg.stroke({ color: rarityColor, width: 2 });
      }
    }
  }

  private scroll(delta: number): void {
    this.scrollOffset = Math.max(0, Math.min(this.maxScroll, this.scrollOffset + delta));
    this.applyScroll();
  }

  private applyScroll(): void {
    this.cardsContainer.y = 118 - this.scrollOffset;
  }

  // ── Detail popup ────────────────────────────────────────────────────

  private showDetail(entry: EncyclopediaEntry): void {
    this.detailOverlay.removeChildren();
    this.detailVisible = true;
    this.detailOverlay.visible = true;

    const backdrop = new Graphics();
    backdrop.rect(0, 0, this.screenWidth, this.screenHeight);
    backdrop.fill({ color: COLORS.BLACK, alpha: 0.7 });
    backdrop.eventMode = 'static';
    backdrop.on('pointerdown', () => this.closeDetail());
    this.detailOverlay.addChild(backdrop);

    const cx = this.screenWidth / 2;
    const panelW = 420;
    const panelH = 380;
    const panelX = cx - panelW / 2;
    const panelY = (this.screenHeight - panelH) / 2;
    const rarityColor = RARITY_UI_COLORS[entry.config.rarity] ?? RARITY_UI_COLORS.common;
    const rarityTextColor = RARITY_UI_TEXT_COLORS[entry.config.rarity] ?? RARITY_UI_TEXT_COLORS.common;
    const panel = new Graphics();
    panel.roundRect(panelX, panelY, panelW, panelH, 16);
    panel.fill({ color: UI_COLORS.SCENE_HEADER_BG, alpha: 0.96 });
    panel.stroke({ color: rarityColor, width: 3 });
    panel.eventMode = 'static';
    this.detailOverlay.addChild(panel);

    const config = entry.config;
    let ty = panelY + 20;

    const icon = new Graphics();
    icon.circle(cx, ty + 30, 36);
    icon.fill({ color: rarityColor, alpha: 0.3 });
    icon.stroke({ color: rarityColor, width: 2 });
    this.detailOverlay.addChild(icon);
    ty += 76;

    const nameText = new Text({ text: config.displayName, style: { fontFamily: 'Arial', fontSize: 26, fill: UI_COLORS.TEXT_WHITE, fontWeight: 'bold', align: 'center' } });
    nameText.anchor.set(0.5, 0); nameText.x = cx; nameText.y = ty;
    this.detailOverlay.addChild(nameText);
    ty += 34;

    const rarityBadge = new Text({ text: `✦ ${config.rarity.toUpperCase()}`, style: { fontFamily: 'Arial', fontSize: 14, fill: rarityTextColor, fontWeight: 'bold' } });
    rarityBadge.anchor.set(0.5, 0); rarityBadge.x = cx; rarityBadge.y = ty;
    this.detailOverlay.addChild(rarityBadge);
    ty += 26;

    const descText = new Text({
      text: config.description,
      style: { fontFamily: 'Arial', fontSize: 14, fill: UI_COLORS.TEXT_PRIMARY, wordWrap: true, wordWrapWidth: panelW - 40, align: 'center' },
    });
    descText.anchor.set(0.5, 0); descText.x = cx; descText.y = ty;
    this.detailOverlay.addChild(descText);
    ty += descText.height + 16;

    const divider = new Graphics();
    divider.rect(panelX + 30, ty, panelW - 60, 1);
    divider.fill({ color: COLORS.MID_GREEN, alpha: 0.5 });
    this.detailOverlay.addChild(divider);
    ty += 12;

    this.addDetailStat(panelX + 40, ty, '🌱 Growth Time', `${config.growthTime} days`);
    this.addDetailStat(cx + 10, ty, '💧 Water Need', `${Math.round(config.waterNeedPerDay * 100)}%/day`);
    ty += 24;
    this.addDetailStat(panelX + 40, ty, '🌾 Seed Yield', `${config.yieldSeeds} seeds`);
    this.addDetailStat(cx + 10, ty, '🗓️ Seasons', config.availableSeasons.join(', '));
    ty += 28;

    if (config.synergyTraits && config.synergyTraits.length > 0) {
      const synergyLabel = new Text({ text: '🔗 Synergy Traits', style: { fontFamily: 'Arial', fontSize: 14, fill: COLORS.LIGHT_GREEN, fontWeight: 'bold' } });
      synergyLabel.x = panelX + 40; synergyLabel.y = ty;
      this.detailOverlay.addChild(synergyLabel);
      ty += 20;
      const traitText = new Text({
        text: config.synergyTraits.map((t) => this.formatTraitName(t)).join('  •  '),
        style: { fontFamily: 'Arial', fontSize: 13, fill: UI_COLORS.TEXT_MID_GRAY, wordWrap: true, wordWrapWidth: panelW - 80 },
      });
      traitText.x = panelX + 40; traitText.y = ty;
      this.detailOverlay.addChild(traitText);
    }

    const closeBg = new Graphics();
    closeBg.roundRect(cx - 60, panelY + panelH - 50, 120, 36, 8);
    closeBg.fill({ color: COLORS.MID_GREEN });
    closeBg.stroke({ color: COLORS.LIGHT_GREEN, width: 2 });
    closeBg.eventMode = 'static';
    closeBg.cursor = 'pointer';
    closeBg.on('pointerdown', () => this.closeDetail());
    closeBg.on('pointerover', () => { closeBg.clear(); closeBg.roundRect(cx - 60, panelY + panelH - 50, 120, 36, 8); closeBg.fill({ color: UI_COLORS.BACK_BUTTON_HOVER_BG }); closeBg.stroke({ color: COLORS.LIGHT_GREEN, width: 2 }); });
    closeBg.on('pointerout', () => { closeBg.clear(); closeBg.roundRect(cx - 60, panelY + panelH - 50, 120, 36, 8); closeBg.fill({ color: COLORS.MID_GREEN }); closeBg.stroke({ color: COLORS.LIGHT_GREEN, width: 2 }); });
    this.detailOverlay.addChild(closeBg);
    const closeText = new Text({ text: 'Close', style: { fontFamily: 'Arial', fontSize: 16, fill: UI_COLORS.TEXT_WHITE, fontWeight: 'bold' } });
    closeText.anchor.set(0.5, 0.5); closeText.x = cx; closeText.y = panelY + panelH - 32;
    this.detailOverlay.addChild(closeText);

    announce(`Viewing ${config.displayName}. ${config.rarity} plant. ${config.description}`);
  }

  private addDetailStat(x: number, y: number, label: string, value: string): void {
    const lbl = new Text({ text: label, style: { fontFamily: 'Arial', fontSize: 12, fill: UI_COLORS.TEXT_DARK_GRAY } });
    lbl.x = x; lbl.y = y;
    this.detailOverlay.addChild(lbl);
    const val = new Text({ text: value, style: { fontFamily: 'Arial', fontSize: 12, fill: UI_COLORS.TEXT_WHITE, fontWeight: 'bold' } });
    val.x = x; val.y = y + 14;
    this.detailOverlay.addChild(val);
  }

  private formatTraitName(trait: string): string {
    return trait.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private closeDetail(): void {
    this.detailVisible = false;
    this.detailOverlay.visible = false;
    this.detailOverlay.removeChildren();
    announce('Detail closed.');
  }

  // ── Back button ─────────────────────────────────────────────────────

  private buildBackButton(): void {
    const backBg = new Graphics();
    backBg.roundRect(10, this.screenHeight - 44, 100, 34, 8);
    backBg.fill({ color: UI_COLORS.BACK_BUTTON_BG, alpha: 0.9 });
    backBg.stroke({ color: COLORS.MID_GREEN, width: 2 });
    backBg.eventMode = 'static';
    backBg.cursor = 'pointer';
    this.contentLayer.addChild(backBg);
    const backText = new Text({ text: '🔙 Back', style: { fontFamily: 'Arial', fontSize: 16, fill: UI_COLORS.TEXT_WHITE, fontWeight: 'bold' } });
    backText.anchor.set(0.5, 0.5); backText.x = 60; backText.y = this.screenHeight - 27;
    this.contentLayer.addChild(backText);
    backBg.on('pointerover', () => { backBg.clear(); backBg.roundRect(10, this.screenHeight - 44, 100, 34, 8); backBg.fill({ color: UI_COLORS.BACK_BUTTON_HOVER_BG }); backBg.stroke({ color: COLORS.LIGHT_GREEN, width: 2 }); });
    backBg.on('pointerout', () => { backBg.clear(); backBg.roundRect(10, this.screenHeight - 44, 100, 34, 8); backBg.fill({ color: UI_COLORS.BACK_BUTTON_BG, alpha: 0.9 }); backBg.stroke({ color: COLORS.MID_GREEN, width: 2 }); });
    backBg.on('pointerdown', () => this.goBack());

    const hint = new Text({ text: '↑↓ Scroll  •  Enter View  •  Esc Back', style: { fontFamily: 'Arial', fontSize: 12, fill: UI_COLORS.TEXT_DIM_GRAY, align: 'center' } });
    hint.anchor.set(0.5, 0.5); hint.x = this.screenWidth / 2; hint.y = this.screenHeight - 27;
    this.contentLayer.addChild(hint);
  }

  private goBack(): void {
    if (!this.ctx || this.navigatingBack) return;
    this.navigatingBack = true;
    announce('Returning to menu.');
    MenuScene.skipTitle = true;
    this.ctx.sceneManager.transitionTo(SCENES.MENU, { type: 'fade' }).catch(console.error);
  }

  // ── Keyboard handling ───────────────────────────────────────────────

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.detailVisible) {
      if (e.code === 'Escape' || e.code === 'Enter' || e.code === 'Space' || e.code === 'Backspace') {
        e.preventDefault();
        this.closeDetail();
      }
      return;
    }
    switch (e.code) {
      case 'Escape': case 'Backspace': e.preventDefault(); this.goBack(); break;
      case 'ArrowUp': e.preventDefault(); this.navigateCards(-GRID_COLS); break;
      case 'ArrowDown': e.preventDefault(); this.navigateCards(GRID_COLS); break;
      case 'ArrowLeft': e.preventDefault(); this.navigateCards(-1); break;
      case 'ArrowRight': e.preventDefault(); this.navigateCards(1); break;
      case 'Enter': case 'Space': e.preventDefault(); this.activateSelectedCard(); break;
      case 'Tab': e.preventDefault(); this.navigateCards(e.shiftKey ? -1 : 1); break;
    }
  }

  private navigateCards(delta: number): void {
    if (this.cardGraphics.length === 0) return;
    const next = Math.max(0, Math.min(this.cardGraphics.length - 1, this.selectedCardIndex + delta));
    if (next !== this.selectedCardIndex) {
      this.selectedCardIndex = next;
      this.highlightCard(next);
      this.scrollToCard(next);
      const entry = this.cardGraphics[next].entry;
      announce(entry.discovered ? entry.config.displayName : 'Undiscovered plant');
    }
  }

  private scrollToCard(index: number): void {
    if (this.cardGraphics.length === 0) return;
    const card = this.cardGraphics[index].container;
    const cardTop = card.y;
    const cardBottom = card.y + CARD_HEIGHT;
    const viewportH = this.screenHeight - 118 - 50;
    if (cardTop < this.scrollOffset) {
      this.scrollOffset = Math.max(0, cardTop - GRID_GAP);
    } else if (cardBottom > this.scrollOffset + viewportH) {
      this.scrollOffset = Math.min(this.maxScroll, cardBottom - viewportH + GRID_GAP);
    }
    this.applyScroll();
  }

  private activateSelectedCard(): void {
    const card = this.cardGraphics[this.selectedCardIndex];
    if (!card || !card.entry.discovered) return;
    this.showDetail(card.entry);
  }

  // ── Update loop ─────────────────────────────────────────────────────

  update(dt: number, _ctx: SceneContext): void {
    this.elapsed += dt;
    this.particleSystem.update(dt);
    this.updateFireflies(dt);
  }

  private updateFireflies(dt: number): void {
    this.fireflyCooldown -= dt;
    if (this.fireflyCooldown <= 0) {
      this.fireflyCooldown = 0.8 + Math.random() * 1.5;
      this.particleSystem.burst({
        x: Math.random() * this.screenWidth,
        y: this.screenHeight * 0.5 + Math.random() * this.screenHeight * 0.4,
        count: 1, speed: 8 + Math.random() * 12, lifetime: 2.5 + Math.random() * 2,
        colors: FIREFLY_PARTICLE_COLORS,
        size: 2 + Math.random() * 2, gravity: -15 - Math.random() * 10,
        fadeOut: true, shrink: false,
      });
    }
  }

  // ── Cleanup ─────────────────────────────────────────────────────────

  destroy(): void {
    window.removeEventListener('keydown', this.boundOnKeyDown);
    window.removeEventListener('wheel', this.boundOnWheel);
    this.particleSystem.destroy();
    this.container.destroy({ children: true });
    this.container = new Container();
    this.bgLayer = new Container();
    this.particleLayer = new Container();
    this.contentLayer = new Container();
    this.filterLayer = new Container();
    this.cardsContainer = new Container();
    this.detailOverlay = new Container();
    this.cardGraphics = [];
    this.filterButtons = [];
    this.detailVisible = false;
    this.navigatingBack = false;
    this.ctx = null;
  }
}
