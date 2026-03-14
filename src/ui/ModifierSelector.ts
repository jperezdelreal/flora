// TLDR: Toggle-card UI for selecting run modifiers before a garden run

import { Container, Graphics, Text } from 'pixi.js';
import type { ModifierConfig, ModifierId } from '../config/modifiers';
import { getAllModifiers } from '../config/modifiers';

/** TLDR: Callback when modifier selection changes */
export type ModifierChangeCallback = (activeIds: ModifierId[]) => void;

/**
 * ModifierSelector renders toggle cards for each available run modifier.
 * Players tap/click cards to enable or disable them before starting a run.
 */
export class ModifierSelector {
  private container: Container;
  private cards: {
    id: ModifierId;
    bg: Graphics;
    active: boolean;
  }[] = [];
  private onChange?: ModifierChangeCallback;

  constructor() {
    this.container = new Container();
    this.buildCards();
  }

  /** TLDR: Build card visuals for each modifier */
  private buildCards(): void {
    const modifiers = getAllModifiers();
    const cardWidth = 150;
    const cardHeight = 160;
    const spacing = 16;
    const totalWidth = modifiers.length * cardWidth + (modifiers.length - 1) * spacing;
    const startX = -totalWidth / 2;

    for (let i = 0; i < modifiers.length; i++) {
      const mod = modifiers[i];
      const x = startX + i * (cardWidth + spacing);
      const card = this.buildCard(mod, x, 0, cardWidth, cardHeight);
      this.cards.push({ id: mod.id, bg: card, active: false });
    }
  }

  /** TLDR: Render a single modifier toggle card */
  private buildCard(
    mod: ModifierConfig,
    x: number,
    y: number,
    w: number,
    h: number,
  ): Graphics {
    const bg = new Graphics();
    this.drawCardState(bg, x, y, w, h, false);

    bg.eventMode = 'static';
    bg.cursor = 'pointer';
    bg.on('pointerdown', () => this.toggleCard(mod.id));

    this.container.addChild(bg);

    // TLDR: Emoji icon
    const emoji = new Text({
      text: mod.emoji,
      style: { fontFamily: 'Arial', fontSize: 32, align: 'center' },
    });
    emoji.anchor.set(0.5, 0);
    emoji.x = x + w / 2;
    emoji.y = y + 10;
    this.container.addChild(emoji);

    // TLDR: Name
    const name = new Text({
      text: mod.name,
      style: {
        fontFamily: 'Arial',
        fontSize: 13,
        fill: '#ffffff',
        fontWeight: 'bold',
        align: 'center',
        wordWrap: true,
        wordWrapWidth: w - 16,
      },
    });
    name.anchor.set(0.5, 0);
    name.x = x + w / 2;
    name.y = y + 50;
    this.container.addChild(name);

    // TLDR: Tooltip / effect description
    const tooltip = new Text({
      text: mod.tooltip,
      style: {
        fontFamily: 'Arial',
        fontSize: 11,
        fill: '#aaaaaa',
        align: 'center',
        wordWrap: true,
        wordWrapWidth: w - 16,
      },
    });
    tooltip.anchor.set(0.5, 0);
    tooltip.x = x + w / 2;
    tooltip.y = y + 80;
    this.container.addChild(tooltip);

    // TLDR: Difficulty badge
    const diffColor = mod.difficulty === 'hard' ? '#ff6b6b' : mod.difficulty === 'easy' ? '#88d498' : '#ffd700';
    const diff = new Text({
      text: mod.difficulty.toUpperCase(),
      style: {
        fontFamily: 'Arial',
        fontSize: 10,
        fill: diffColor,
        fontWeight: 'bold',
        align: 'center',
      },
    });
    diff.anchor.set(0.5, 0);
    diff.x = x + w / 2;
    diff.y = y + h - 30;
    this.container.addChild(diff);

    // TLDR: Score multiplier
    const mult = new Text({
      text: `×${mod.scoreMultiplier.toFixed(2)}`,
      style: {
        fontFamily: 'Courier New, monospace',
        fontSize: 11,
        fill: '#cccccc',
        align: 'center',
      },
    });
    mult.anchor.set(0.5, 0);
    mult.x = x + w / 2;
    mult.y = y + h - 16;
    this.container.addChild(mult);

    return bg;
  }

  /** TLDR: Draw card background in active or inactive state */
  private drawCardState(
    g: Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    active: boolean,
  ): void {
    g.clear();
    g.roundRect(x, y, w, h, 10);
    g.fill({ color: active ? 0x2e5a2e : 0x1a1a1a, alpha: 0.92 });
    g.stroke({ color: active ? 0x66bb6a : 0x3e7a38, width: active ? 3 : 2 });
  }

  /** TLDR: Toggle a modifier on/off */
  private toggleCard(id: ModifierId): void {
    const card = this.cards.find((c) => c.id === id);
    if (!card) return;
    card.active = !card.active;

    // TLDR: Redraw card state
    const modifiers = getAllModifiers();
    const idx = this.cards.indexOf(card);
    const cardWidth = 150;
    const cardHeight = 160;
    const spacing = 16;
    const totalWidth = modifiers.length * cardWidth + (modifiers.length - 1) * spacing;
    const startX = -totalWidth / 2;
    const x = startX + idx * (cardWidth + spacing);
    this.drawCardState(card.bg, x, 0, cardWidth, cardHeight, card.active);

    this.onChange?.(this.getActiveIds());
  }

  /** TLDR: Get currently selected modifier IDs */
  getActiveIds(): ModifierId[] {
    return this.cards.filter((c) => c.active).map((c) => c.id);
  }

  /** TLDR: Set modifiers as active (e.g. for daily challenge preset) */
  setActiveIds(ids: ModifierId[]): void {
    const idSet = new Set<ModifierId>(ids);
    const modifiers = getAllModifiers();
    const cardWidth = 150;
    const cardHeight = 160;
    const spacing = 16;
    const totalWidth = modifiers.length * cardWidth + (modifiers.length - 1) * spacing;
    const startX = -totalWidth / 2;

    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i];
      card.active = idSet.has(card.id);
      const x = startX + i * (cardWidth + spacing);
      this.drawCardState(card.bg, x, 0, cardWidth, cardHeight, card.active);
    }
  }

  /** TLDR: Lock cards so they cannot be toggled (for daily challenges) */
  setLocked(locked: boolean): void {
    for (const card of this.cards) {
      card.bg.eventMode = locked ? 'none' : 'static';
      card.bg.cursor = locked ? 'default' : 'pointer';
    }
  }

  /** TLDR: Register change callback */
  setOnChange(callback: ModifierChangeCallback): void {
    this.onChange = callback;
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
