import { Container, Graphics, Text } from 'pixi.js';
import { Plant, WaterState } from '../entities/Plant';

/**
 * PlantInfoPanel displays detailed information about a plant on hover/click:
 * - Plant name
 * - Growth stage bar (%)
 * - Water status icon (💧/🏜️)
 * - Health bar
 * Positioned near the hovered tile as a tooltip.
 */
export class PlantInfoPanel {
  private container: Container;
  private nameText: Text;
  private growthText: Text;
  private growthBar: Graphics;
  private growthBarBg: Graphics;
  private waterStatusText: Text;
  private healthBar: Graphics;
  private healthBarBg: Graphics;
  private healthText: Text;

  constructor() {
    this.container = new Container();
    this.container.visible = false;

    // Semi-transparent background panel
    const bg = new Graphics();
    bg.roundRect(0, 0, 200, 140, 8);
    bg.fill({ color: 0x1a1a1a, alpha: 0.95 });
    bg.stroke({ color: 0x4caf50, width: 2 });
    this.container.addChild(bg);

    // Plant name
    this.nameText = new Text({
      text: 'Tomato',
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: '#c8e6c9',
        fontWeight: 'bold',
      },
    });
    this.nameText.x = 10;
    this.nameText.y = 10;
    this.container.addChild(this.nameText);

    // Growth progress label
    this.growthText = new Text({
      text: 'Growth: 60%',
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: '#aaaaaa',
      },
    });
    this.growthText.x = 10;
    this.growthText.y = 35;
    this.container.addChild(this.growthText);

    // Growth bar background
    this.growthBarBg = new Graphics();
    this.growthBarBg.roundRect(10, 55, 180, 12, 4);
    this.growthBarBg.fill({ color: 0x2a2a2a });
    this.container.addChild(this.growthBarBg);

    // Growth bar fill
    this.growthBar = new Graphics();
    this.container.addChild(this.growthBar);

    // Water status
    this.waterStatusText = new Text({
      text: '💧 Watered',
      style: {
        fontFamily: 'Arial',
        fontSize: 13,
        fill: '#64b5f6',
      },
    });
    this.waterStatusText.x = 10;
    this.waterStatusText.y = 75;
    this.container.addChild(this.waterStatusText);

    // Health label
    this.healthText = new Text({
      text: 'Health: 80%',
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: '#aaaaaa',
      },
    });
    this.healthText.x = 10;
    this.healthText.y = 98;
    this.container.addChild(this.healthText);

    // Health bar background
    this.healthBarBg = new Graphics();
    this.healthBarBg.roundRect(10, 118, 180, 12, 4);
    this.healthBarBg.fill({ color: 0x2a2a2a });
    this.container.addChild(this.healthBarBg);

    // Health bar fill
    this.healthBar = new Graphics();
    this.container.addChild(this.healthBar);
  }

  /**
   * Show panel with plant information
   * @param plant Plant to display info for
   * @param x X position (tooltip position)
   * @param y Y position (tooltip position)
   */
  showPlant(plant: Plant, x: number, y: number): void {
    const config = plant.getConfig();
    const state = plant.getState();

    // Update plant name
    this.nameText.text = config.displayName;

    // Calculate growth percentage
    const growthPercent = Math.round((state.daysGrown / config.growthTime) * 100);
    this.growthText.text = `Growth: ${growthPercent}%`;

    // Update growth bar
    this.growthBar.clear();
    if (growthPercent > 0) {
      const barWidth = 180 * (growthPercent / 100);
      this.growthBar.roundRect(10, 55, barWidth, 12, 4);
      
      // Color based on progress
      let growthColor = 0x4caf50; // Green for mature
      if (growthPercent < 33) {
        growthColor = 0xff5252; // Red for early stage
      } else if (growthPercent < 66) {
        growthColor = 0xffeb3b; // Yellow for mid stage
      }
      this.growthBar.fill({ color: growthColor });
    }

    // Update water status with color-blind friendly icons
    if (state.waterState === WaterState.WET) {
      this.waterStatusText.text = '💧 Watered';
      this.waterStatusText.style.fill = '#64b5f6'; // Blue
    } else {
      this.waterStatusText.text = '🏜️ Dry';
      this.waterStatusText.style.fill = '#ff9800'; // Orange
    }

    // Calculate health percentage
    const healthPercent = Math.round(state.health);
    this.healthText.text = `Health: ${healthPercent}%`;

    // Update health bar
    this.healthBar.clear();
    if (healthPercent > 0) {
      const barWidth = 180 * (healthPercent / 100);
      this.healthBar.roundRect(10, 118, barWidth, 12, 4);
      
      // Color based on health
      let healthColor = 0x4caf50; // Green for healthy
      if (healthPercent < 33) {
        healthColor = 0xff5252; // Red for critical
      } else if (healthPercent < 66) {
        healthColor = 0xffeb3b; // Yellow for moderate
      }
      this.healthBar.fill({ color: healthColor });
    }

    // Position tooltip near the plant
    // Adjust if near screen edge (assuming 800x600 screen)
    let tooltipX = x + 80; // Default: to the right
    let tooltipY = y - 70; // Default: above

    if (tooltipX + 200 > 800) {
      tooltipX = x - 220; // Move to left if too far right
    }
    if (tooltipY < 0) {
      tooltipY = y + 80; // Move below if too far up
    }

    this.container.x = tooltipX;
    this.container.y = tooltipY;
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
    this.container.destroy({ children: true });
  }
}
