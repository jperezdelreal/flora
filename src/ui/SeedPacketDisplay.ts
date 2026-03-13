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
    // Packet background (vintage seed packet style)
    const bg = new Graphics();
    bg.roundRect(0, 0, PACKET_WIDTH, PACKET_HEIGHT, 12);
    bg.fill({ color: 0xf5f5dc, alpha: 0.98 }); // Beige paper color
    bg.stroke({
      color: RARITY_COLORS[this.plant.rarity],
      width: 3,
    });
    this.container.addChild(bg);

    // Decorative top banner (rarity color)
    const banner = new Graphics();
    banner.roundRect(0, 0, PACKET_WIDTH, 40, 12);
    banner.fill({ color: RARITY_COLORS[this.plant.rarity], alpha: 0.3 });
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

    // Plant name
    const name = new Text({
      text: this.plant.displayName,
      style: {
        fontFamily: 'Georgia, serif',
        fontSize: 18,
        fill: '#2d2d2d',
        fontWeight: 'bold',
        align: 'center',
      },
    });
    name.anchor.set(0.5, 0);
    name.x = PACKET_WIDTH / 2;
    name.y = 110;
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

    // Growth time
    const growthText = new Text({
      text: `🌱 Growth: ${this.plant.growthTime} days`,
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: '#555555',
        align: 'left',
      },
    });
    growthText.x = 15;
    growthText.y = statsY;
    this.container.addChild(growthText);

    // Water needs
    const waterNeed = this.getWaterNeedLabel(this.plant.waterNeedPerDay);
    const waterText = new Text({
      text: `💧 Water: ${waterNeed}`,
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: '#555555',
        align: 'left',
      },
    });
    waterText.x = 15;
    waterText.y = statsY + 18;
    this.container.addChild(waterText);

    // Yield
    const yieldText = new Text({
      text: `🌾 Yield: ${this.plant.yieldSeeds} seeds`,
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: '#555555',
        align: 'left',
      },
    });
    yieldText.x = 15;
    yieldText.y = statsY + 36;
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
        this.container.alpha = 0.9;
      }
    });

    this.container.on('pointerout', () => {
      if (!this.isSelected) {
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
   * TLDR: Highlight as selected
   */
  setSelected(selected: boolean): void {
    this.isSelected = selected;
    if (selected) {
      this.container.alpha = 1.0;
      this.container.scale.set(1.05);
    } else {
      this.container.alpha = 1.0;
      this.container.scale.set(1.0);
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
