import { Container, Graphics, Text } from 'pixi.js';
import { COLORS } from '../config';

export interface PlantData {
  name: string;
  growthPercent: number;
  waterStatus: string; // 'Thirsty', 'Hydrated', 'Overwatered'
  health: number; // 0-100
}

/**
 * Plant info tooltip — shows on hover/click
 * Displays growth %, water status, and health
 */
export class PlantInfo extends Container {
  private nameText: Text;
  private growthText: Text;
  private waterText: Text;
  private healthText: Text;
  private panel: Graphics;

  constructor() {
    super();
    this.visible = false;

    // Background panel
    this.panel = new Graphics();
    this.panel.rect(0, 0, 200, 110);
    this.panel.fill({ color: COLORS.DARK_GREEN, alpha: 0.95 });
    this.panel.stroke({ color: COLORS.ACCENT_GREEN, width: 2 });
    this.addChild(this.panel);

    // Plant name
    this.nameText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: COLORS.PALE_GREEN,
        fontWeight: 'bold',
      },
    });
    this.nameText.x = 10;
    this.nameText.y = 10;
    this.addChild(this.nameText);

    // Growth percentage
    this.growthText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: COLORS.WHITE,
      },
    });
    this.growthText.x = 10;
    this.growthText.y = 35;
    this.addChild(this.growthText);

    // Water status
    this.waterText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: COLORS.WHITE,
      },
    });
    this.waterText.x = 10;
    this.waterText.y = 55;
    this.addChild(this.waterText);

    // Health
    this.healthText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: COLORS.WHITE,
      },
    });
    this.healthText.x = 10;
    this.healthText.y = 75;
    this.addChild(this.healthText);
  }

  show(data: PlantData, x: number, y: number): void {
    this.nameText.text = data.name;
    this.growthText.text = `Growth: ${data.growthPercent}%`;
    this.waterText.text = `Water: ${data.waterStatus}`;
    
    // Color-code health
    const healthColor = this.getHealthColor(data.health);
    this.healthText.text = `Health: ${data.health}%`;
    this.healthText.style.fill = healthColor;

    this.x = x;
    this.y = y;
    this.visible = true;
  }

  hide(): void {
    this.visible = false;
  }

  private getHealthColor(health: number): number {
    if (health >= 70) return COLORS.ACCENT_GREEN;
    if (health >= 40) return 0xffd700; // Gold/yellow
    return 0xff6b6b; // Red
  }
}
