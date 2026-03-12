import { Container, Graphics, Text } from 'pixi.js';
import { PLANT_BY_ID, ALL_PLANTS } from '../config/plants';
import { PlantConfig } from '../entities/Plant';

const RARITY_COLORS = {
  common: '#4caf50',    // Green
  uncommon: '#2196f3',  // Blue
  rare: '#9c27b0',      // Purple
  heirloom: '#ffd700',  // Gold
};

const RARITY_PATTERNS = {
  common: '●',    // Single dot
  uncommon: '●●',   // Two dots
  rare: '●●●',      // Three dots
  heirloom: '★',    // Star
};

const CARD_WIDTH = 140;
const CARD_HEIGHT = 120;
const CARD_PADDING = 12;
const CARDS_PER_ROW = 2;

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

  constructor() {
    this.container = new Container();
    this.container.visible = false;

    // Semi-transparent background overlay
    const overlay = new Graphics();
    overlay.rect(0, 0, 340, 600);
    overlay.fill({ color: 0x000000, alpha: 0.5 });
    this.container.addChild(overlay);

    // Panel background
    const panel = new Graphics();
    panel.roundRect(10, 10, 320, 580, 12);
    panel.fill({ color: 0x1a1a1a, alpha: 0.95 });
    panel.stroke({ color: 0x4caf50, width: 3 });
    this.container.addChild(panel);

    // Header
    this.headerText = new Text({
      text: '🌱 Seed Inventory',
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: '#c8e6c9',
        fontWeight: 'bold',
      },
    });
    this.headerText.x = 30;
    this.headerText.y = 30;
    this.container.addChild(this.headerText);

    // Instructions
    const instructions = new Text({
      text: 'Press I to close',
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: '#aaaaaa',
      },
    });
    instructions.x = 30;
    instructions.y = 60;
    this.container.addChild(instructions);

    // Cards container (scrollable content)
    this.cardsContainer = new Container();
    this.cardsContainer.y = 90;
    this.container.addChild(this.cardsContainer);

    // Initialize with starter seeds (common plants)
    this.setAvailableSeeds(ALL_PLANTS.filter(p => p.rarity === 'common'));
  }

  /**
   * Set the available seeds to display
   */
  setAvailableSeeds(seeds: PlantConfig[]): void {
    this.availableSeeds = seeds;
    this.renderCards();
  }

  private renderCards(): void {
    // Clear existing cards
    this.cardsContainer.removeChildren();

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

    // Card background
    const bg = new Graphics();
    bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 8);
    bg.fill({ color: 0x2a2a2a, alpha: 0.95 });
    bg.stroke({ color: RARITY_COLORS[seed.rarity], width: 2 });
    card.addChild(bg);

    // Seed icon (emoji or placeholder)
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
        fill: '#ffffff',
        fontWeight: 'bold',
        align: 'center',
      },
    });
    name.anchor.set(0.5, 0);
    name.x = CARD_WIDTH / 2;
    name.y = 52;
    card.addChild(name);

    // Rarity badge (color-blind friendly with pattern)
    const rarityText = new Text({
      text: `${RARITY_PATTERNS[seed.rarity]} ${seed.rarity}`,
      style: {
        fontFamily: 'Arial',
        fontSize: 11,
        fill: RARITY_COLORS[seed.rarity],
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
        fill: '#aaaaaa',
        align: 'center',
      },
    });
    growthText.anchor.set(0.5, 0);
    growthText.x = CARD_WIDTH / 2;
    growthText.y = 92;
    card.addChild(growthText);

    return card;
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
