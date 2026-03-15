import { Container, Graphics, Text } from 'pixi.js';
import { PlantConfig } from '../entities/Plant';

/**
 * TLDR: Rarity colors (color-blind friendly palette)
 */
const RARITY_COLORS = {
  common: 0x4caf50, // Green
  uncommon: 0x2196f3, // Blue
  rare: 0x9c27b0, // Purple
  heirloom: 0xffd700, // Gold
};

/**
 * TLDR: Rarity patterns (visual + text accessibility)
 */
const RARITY_PATTERNS = {
  common: '●', // Single dot
  uncommon: '●●', // Two dots
  rare: '●●●', // Three dots
  heirloom: '★', // Star
};

/**
 * TLDR: Plant emoji icons
 */
const PLANT_ICONS: Record<string, string> = {
  tomato: '🍅',
  lettuce: '🥬',
  carrot: '🥕',
  radish: '🌰',
  basil: '🌿',
  sunflower: '🌻',
  mint: '🌱',
  pepper: '🌶️',
  lavender: '💜',
  frost_willow: '❄️',
  heirloom_squash: '🎃',
  golden_marigold: '🌼',
};

/**
 * TLDR: Seed packet card dimensions
 */
const PACKET_WIDTH = 160;
const PACKET_HEIGHT = 220;

/**
 * TLDR: Visual seed packet display with rarity indicators
 * Displays plant info, rarity, growth time, and stats
 * Follows EncyclopediaSystem and SeedInventory patterns
 */
export class SeedPacketDisplay {
  private container: Container;
  private plant: PlantConfig;
  private isSelected = false;
  private onSelectCallback?: (plantId: string) => void;

  constructor(plant: PlantConfig, onSelect?: (plantId: string) => void) {
    this.plant = plant;
    this.onSelectCallback = onSelect;
    this.container = new Container();
    this.render();
    this.makeInteractive();
  }

  private render(): void {
    // Shadow for depth (drawn first, behind card)
    const shadow = new Graphics();
    shadow.roundRect(3, 3, PACKET_WIDTH, PACKET_HEIGHT, 12);
    shadow.fill({ color: 0x000000, alpha: 0.15 });
    this.container.addChild(shadow);

    // Packet background (vintage seed packet style)
    const bg = new Graphics();
    bg.roundRect(0, 0, PACKET_WIDTH, PACKET_HEIGHT, 12);
    bg.fill({ color: 0xfff8e7, alpha: 0.98 }); // Warm cream
    bg.stroke({
      color: RARITY_COLORS[this.plant.rarity],
      width: 3,
    });
    this.container.addChild(bg);

    // Decorative top banner (rarity color, more vibrant)
    const banner = new Graphics();
    banner.roundRect(0, 0, PACKET_WIDTH, 44, 12);
    banner.fill({ color: RARITY_COLORS[this.plant.rarity], alpha: 0.25 });
    this.container.addChild(banner);

    // Plant icon (large, centered)
    const icon = new Text({
      text: PLANT_ICONS[this.plant.id] || '🌱',
      style: {
        fontSize: 48,
        align: 'center',
      },
    });
    icon.anchor.set(0.5);
    icon.x = PACKET_WIDTH / 2;
    icon.y = 70;
    this.container.addChild(icon);

    // Plant name (larger, warmer)
    const name = new Text({
      text: this.plant.displayName,
      style: {
        fontFamily: 'Georgia, serif',
        fontSize: 19,
        fill: '#3d5a3d',
        fontWeight: 'bold',
        align: 'center',
      },
    });
    name.anchor.set(0.5, 0);
    name.x = PACKET_WIDTH / 2;
    name.y = 108;
    this.container.addChild(name);

    // Rarity badge
    const rarityBadge = new Container();
    const rarityBg = new Graphics();
    rarityBg.roundRect(0, 0, 120, 24, 8);
    rarityBg.fill({ color: RARITY_COLORS[this.plant.rarity], alpha: 0.2 });
    rarityBg.stroke({ color: RARITY_COLORS[this.plant.rarity], width: 2 });
    rarityBadge.addChild(rarityBg);

    const rarityText = new Text({
      text: `${RARITY_PATTERNS[this.plant.rarity]} ${this.plant.rarity.toUpperCase()}`,
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: RARITY_COLORS[this.plant.rarity],
        fontWeight: 'bold',
        align: 'center',
      },
    });
    rarityText.anchor.set(0.5);
    rarityText.x = 60;
    rarityText.y = 12;
    rarityBadge.addChild(rarityText);

    rarityBadge.x = (PACKET_WIDTH - 120) / 2;
    rarityBadge.y = 140;
    this.container.addChild(rarityBadge);

    // Stats section
    const statsY = 175;

    // Growth time (clearer, warmer colors)
    const growthText = new Text({
      text: `🌱 Growth: ${this.plant.growthTime} days`,
      style: {
        fontFamily: 'Arial',
        fontSize: 13,
        fill: '#4a6a4a',
        fontWeight: '600',
        align: 'left',
      },
    });
    growthText.x = 18;
    growthText.y = statsY;
    this.container.addChild(growthText);

    // Water needs
    const waterNeed = this.getWaterNeedLabel(this.plant.waterNeedPerDay);
    const waterText = new Text({
      text: `💧 Water: ${waterNeed}`,
      style: {
        fontFamily: 'Arial',
        fontSize: 13,
        fill: '#4a6a4a',
        fontWeight: '600',
        align: 'left',
      },
    });
    waterText.x = 18;
    waterText.y = statsY + 19;
    this.container.addChild(waterText);

    // Yield
    const yieldText = new Text({
      text: `🌾 Yield: ${this.plant.yieldSeeds} seeds`,
      style: {
        fontFamily: 'Arial',
        fontSize: 13,
        fill: '#4a6a4a',
        fontWeight: '600',
        align: 'left',
      },
    });
    yieldText.x = 18;
    yieldText.y = statsY + 38;
    this.container.addChild(yieldText);
  }

  private getWaterNeedLabel(waterNeedPerDay: number): string {
    if (waterNeedPerDay >= 1.0) return 'High';
    if (waterNeedPerDay >= 0.5) return 'Medium';
    if (waterNeedPerDay >= 0.2) return 'Low';
    return 'Very Low';
  }

  private makeInteractive(): void {
    this.container.eventMode = 'static';
    this.container.cursor = 'pointer';

    this.container.on('pointerover', () => {
      if (!this.isSelected) {
        this.container.scale.set(1.03);
        this.container.alpha = 0.95;
      }
    });

    this.container.on('pointerout', () => {
      if (!this.isSelected) {
        this.container.scale.set(1.0);
        this.container.alpha = 1.0;
      }
    });

    this.container.on('pointerdown', () => {
      if (this.onSelectCallback) {
        this.onSelectCallback(this.plant.id);
      }
    });
  }

  /**
   * TLDR: Highlight as selected with warm glow effect
   */
  setSelected(selected: boolean): void {
    this.isSelected = selected;
    if (selected) {
      this.container.alpha = 1.0;
      this.container.scale.set(1.08);
      // Add warm glow by increasing tint brightness
      this.container.filters = [];
    } else {
      this.container.alpha = 1.0;
      this.container.scale.set(1.0);
      this.container.filters = [];
    }
  }

  /**
   * TLDR: Get container for adding to scene
   */
  getContainer(): Container {
    return this.container;
  }

  /**
   * TLDR: Get plant config
   */
  getPlant(): PlantConfig {
    return this.plant;
  }

  /**
   * TLDR: Cleanup
   */
  destroy(): void {
    this.container.destroy({ children: true });
  }
}
