import { Container, Graphics, Text } from 'pixi.js';
import { PlantConfig } from '../entities/Plant';
import { eventBus } from '../core/EventBus';
import { UI_COLORS } from '../config';

const RARITY_COLORS: Record<string, number> = {
  common: 0x4caf50,
  uncommon: 0x2196f3,
  rare: 0x9c27b0,
  heirloom: 0xffd700,
};

const RARITY_COLORS_HEX: Record<string, string> = {
  common: '#4caf50',
  uncommon: '#2196f3',
  rare: '#9c27b0',
  heirloom: '#ffd700',
};

const RARITY_PATTERNS: Record<string, string> = {
  common: '●',
  uncommon: '●●',
  rare: '●●●',
  heirloom: '★',
};

const CARD_WIDTH = 140;
const CARD_HEIGHT = 120;
const CARD_PADDING = 12;
const CARDS_PER_ROW = 2;
// TLDR: Panel width for seed inventory sidebar
const PANEL_WIDTH = 340;

/**
 * SeedInventory displays available seeds at season start.
 * Can be toggled with I key or button.
 * Shows seed cards with icon, name, rarity, growth time.
 */
export class SeedInventory {
  private container: Container;
  private cardsContainer: Container;
  private headerText: Text;
  private visible = false;
  private availableSeeds: PlantConfig[] = [];
  private selectedSeedId: string | null = null;
  private cardGraphics: Map<string, { bg: Graphics; card: Container }> = new Map();
  // TLDR: Track screen height for full-height overlay
  private screenHeight: number;
  private overlay: Graphics;

  constructor(screenHeight: number = 600) {
    this.screenHeight = screenHeight;
    this.container = new Container();
    this.container.visible = false;

    // TLDR: Semi-transparent overlay blocks clicks through to garden
    this.overlay = new Graphics();
    this.overlay.rect(0, 0, PANEL_WIDTH, this.screenHeight);
    this.overlay.fill({ color: UI_COLORS.OVERLAY_DARK, alpha: 0.5 });
    this.overlay.eventMode = 'static';
    this.container.addChild(this.overlay);

    // Panel background
    const panel = new Graphics();
    panel.roundRect(10, 10, 320, this.screenHeight - 20, 12);
    panel.fill({ color: UI_COLORS.PANEL_BG, alpha: 0.95 });
    panel.stroke({ color: UI_COLORS.PANEL_BORDER, width: 3 });
    this.container.addChild(panel);

    // Header
    this.headerText = new Text({
      text: '🌱 Seed Inventory',
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: UI_COLORS.TEXT_PRIMARY,
        fontWeight: 'bold',
      },
    });
    this.headerText.x = 30;
    this.headerText.y = 30;
    this.container.addChild(this.headerText);

    // Instructions
    const instructions = new Text({
      text: 'Press I to close • Click to select',
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: UI_COLORS.TEXT_HINT,
      },
    });
    instructions.x = 30;
    instructions.y = 60;
    this.container.addChild(instructions);

    // Cards container (scrollable content)
    this.cardsContainer = new Container();
    this.cardsContainer.y = 90;
    this.container.addChild(this.cardsContainer);
  }

  /**
   * Set the available seeds to display
   */
  setAvailableSeeds(seeds: PlantConfig[]): void {
    this.availableSeeds = seeds;
    this.renderCards();
  }

  // TLDR: Resize overlay to match actual screen height
  resize(screenHeight: number): void {
    this.screenHeight = screenHeight;
    this.overlay.clear();
    this.overlay.rect(0, 0, PANEL_WIDTH, this.screenHeight);
    this.overlay.fill({ color: UI_COLORS.OVERLAY_DARK, alpha: 0.5 });
  }

  private renderCards(): void {
    this.cardsContainer.removeChildren();
    this.cardGraphics.clear();

    this.availableSeeds.forEach((seed, index) => {
      const row = Math.floor(index / CARDS_PER_ROW);
      const col = index % CARDS_PER_ROW;
      const x = 20 + col * (CARD_WIDTH + CARD_PADDING);
      const y = row * (CARD_HEIGHT + CARD_PADDING);

      const card = this.createSeedCard(seed);
      card.x = x;
      card.y = y;
      this.cardsContainer.addChild(card);
    });
  }

  private createSeedCard(seed: PlantConfig): Container {
    const card = new Container();
    // TLDR: Make card interactive for seed selection
    card.eventMode = 'static';
    card.cursor = 'pointer';

    const isSelected = this.selectedSeedId === seed.id;
    const rarityColor = RARITY_COLORS[seed.rarity] ?? UI_COLORS.PANEL_BORDER;

    // Card background
    const bg = new Graphics();
    bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 8);
    if (isSelected) {
      bg.fill({ color: UI_COLORS.BUTTON_SELECTED_BG, alpha: 0.95 });
      bg.stroke({ color: UI_COLORS.BUTTON_SELECTED_BORDER, width: 3 });
    } else {
      bg.fill({ color: UI_COLORS.PANEL_BG, alpha: 0.95 });
      bg.stroke({ color: rarityColor, width: 2 });
    }
    card.addChild(bg);

    // TLDR: Store card reference for selection state updates
    this.cardGraphics.set(seed.id, { bg, card });

    // Seed icon
    const icon = new Text({
      text: this.getPlantIcon(seed.id),
      style: {
        fontSize: 32,
        align: 'center',
      },
    });
    icon.anchor.set(0.5);
    icon.x = CARD_WIDTH / 2;
    icon.y = 25;
    card.addChild(icon);

    // Plant name
    const name = new Text({
      text: seed.displayName,
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: UI_COLORS.TEXT_PRIMARY,
        fontWeight: 'bold',
        align: 'center',
      },
    });
    name.anchor.set(0.5, 0);
    name.x = CARD_WIDTH / 2;
    name.y = 52;
    card.addChild(name);

    // Rarity badge
    const rarityHex = RARITY_COLORS_HEX[seed.rarity] ?? UI_COLORS.TEXT_PRIMARY;
    const rarityText = new Text({
      text: `${RARITY_PATTERNS[seed.rarity] ?? '●'} ${seed.rarity}`,
      style: {
        fontFamily: 'Arial',
        fontSize: 11,
        fill: rarityHex,
        align: 'center',
      },
    });
    rarityText.anchor.set(0.5, 0);
    rarityText.x = CARD_WIDTH / 2;
    rarityText.y = 72;
    card.addChild(rarityText);

    // Growth time
    const growthText = new Text({
      text: `🌱 ${seed.growthTime} days`,
      style: {
        fontFamily: 'Arial',
        fontSize: 11,
        fill: UI_COLORS.TEXT_HINT,
        align: 'center',
      },
    });
    growthText.anchor.set(0.5, 0);
    growthText.x = CARD_WIDTH / 2;
    growthText.y = 92;
    card.addChild(growthText);

    // TLDR: Click handler emits seed:selected event
    card.on('pointerdown', () => {
      this.selectSeed(seed.id);
    });

    // TLDR: Hover effect for discoverability
    card.on('pointerover', () => {
      if (this.selectedSeedId !== seed.id) {
        bg.clear();
        bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 8);
        bg.fill({ color: UI_COLORS.BUTTON_HOVER_BG, alpha: 0.95 });
        bg.stroke({ color: UI_COLORS.BUTTON_HOVER_BORDER, width: 2 });
      }
    });

    card.on('pointerout', () => {
      if (this.selectedSeedId !== seed.id) {
        const rc = RARITY_COLORS[seed.rarity] ?? UI_COLORS.PANEL_BORDER;
        bg.clear();
        bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 8);
        bg.fill({ color: UI_COLORS.PANEL_BG, alpha: 0.95 });
        bg.stroke({ color: rc, width: 2 });
      }
    });

    return card;
  }

  // TLDR: Select a seed and update visual state for all cards
  private selectSeed(seedId: string): void {
    this.selectedSeedId = seedId;
    eventBus.emit('seed:selected', { seedId });
    this.updateSelectionVisuals();
  }

  private updateSelectionVisuals(): void {
    for (const [id, { bg }] of this.cardGraphics) {
      bg.clear();
      bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 8);
      if (id === this.selectedSeedId) {
        bg.fill({ color: UI_COLORS.BUTTON_SELECTED_BG, alpha: 0.95 });
        bg.stroke({ color: UI_COLORS.BUTTON_SELECTED_BORDER, width: 3 });
      } else {
        const seed = this.availableSeeds.find(s => s.id === id);
        const rarityColor = seed ? (RARITY_COLORS[seed.rarity] ?? UI_COLORS.PANEL_BORDER) : UI_COLORS.PANEL_BORDER;
        bg.fill({ color: UI_COLORS.PANEL_BG, alpha: 0.95 });
        bg.stroke({ color: rarityColor, width: 2 });
      }
    }
  }

  private getPlantIcon(plantId: string): string {
    const iconMap: Record<string, string> = {
      tomato: '🍅',
      lettuce: '🥬',
      carrot: '🥕',
      radish: '🌰',
      basil: '🌿',
      sunflower: '🌻',
      pumpkin: '🎃',
      pepper: '🌶️',
      bluebell: '🔵',
      lavender: '💜',
      moonflower: '🌙',
      phoenix: '🔥',
    };
    return iconMap[plantId] || '🌱';
  }

  toggle(): void {
    this.visible = !this.visible;
    this.container.visible = this.visible;
  }

  show(): void {
    this.visible = true;
    this.container.visible = true;
  }

  hide(): void {
    this.visible = false;
    this.container.visible = false;
  }

  isVisible(): boolean {
    return this.visible;
  }

  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
