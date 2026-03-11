import { Container, Graphics, Text } from 'pixi.js';
import { COLORS } from '../config';

export interface Seed {
  name: string;
  icon: string;
  available: boolean;
}

/**
 * Seed inventory sidebar — shows available seeds to plant at season start
 * Can be toggled on/off; displays seed name + icon
 */
export class SeedInventory extends Container {
  private panel: Graphics;
  private titleText: Text;
  private seedList: Container;
  private seeds: Seed[] = [];
  private isExpanded = false;

  constructor() {
    super();

    // Collapsed state initially
    this.visible = true;

    // Background panel
    this.panel = new Graphics();
    this.updatePanel();
    this.addChild(this.panel);

    // Title
    this.titleText = new Text({
      text: '🌱 Seeds',
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: COLORS.PALE_GREEN,
        fontWeight: 'bold',
      },
    });
    this.titleText.x = 10;
    this.titleText.y = 10;
    this.addChild(this.titleText);

    // Seed list container
    this.seedList = new Container();
    this.seedList.x = 10;
    this.seedList.y = 40;
    this.seedList.visible = false;
    this.addChild(this.seedList);

    // Make panel interactive for toggle
    this.panel.eventMode = 'static';
    this.panel.cursor = 'pointer';
    this.panel.on('pointerdown', () => this.toggle());
  }

  private updatePanel(): void {
    this.panel.clear();
    const width = this.isExpanded ? 200 : 120;
    const height = this.isExpanded ? 300 : 40;
    this.panel.rect(0, 0, width, height);
    this.panel.fill({ color: COLORS.DARK_GREEN, alpha: 0.9 });
    this.panel.stroke({ color: COLORS.ACCENT_GREEN, width: 2 });
  }

  setSeeds(seeds: Seed[]): void {
    this.seeds = seeds;
    this.updateSeedList();
  }

  private updateSeedList(): void {
    this.seedList.removeChildren();
    let yOffset = 0;

    this.seeds.forEach((seed) => {
      const seedItem = new Container();

      // Icon
      const icon = new Text({
        text: seed.icon,
        style: {
          fontFamily: 'Arial',
          fontSize: 20,
        },
      });
      icon.x = 0;
      icon.y = yOffset;
      seedItem.addChild(icon);

      // Name
      const name = new Text({
        text: seed.name,
        style: {
          fontFamily: 'Arial',
          fontSize: 14,
          fill: seed.available ? COLORS.WHITE : COLORS.MID_GREEN,
        },
      });
      name.x = 30;
      name.y = yOffset + 3;
      seedItem.addChild(name);

      // Availability indicator
      if (!seed.available) {
        const locked = new Text({
          text: '🔒',
          style: {
            fontFamily: 'Arial',
            fontSize: 12,
          },
        });
        locked.x = 170;
        locked.y = yOffset;
        seedItem.addChild(locked);
      }

      this.seedList.addChild(seedItem);
      yOffset += 30;
    });
  }

  toggle(): void {
    this.isExpanded = !this.isExpanded;
    this.seedList.visible = this.isExpanded;
    this.updatePanel();
  }

  expand(): void {
    this.isExpanded = true;
    this.seedList.visible = true;
    this.updatePanel();
  }

  collapse(): void {
    this.isExpanded = false;
    this.seedList.visible = false;
    this.updatePanel();
  }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }
}
