import { Container, Text, Graphics } from 'pixi.js';

export interface DroughtWarningOptions {
  daysRemaining: number;
  waterMultiplier: number;
}

export interface FrostWarningOptions {
  damagePerDay: number;
}

/**
 * UI component for displaying hazard warnings
 */
export class HazardUI {
  private container: Container;
  private droughtWarning: Text | null = null;
  private droughtBg: Graphics | null = null;
  private frostWarning: Text | null = null;
  private frostBg: Graphics | null = null;

  constructor() {
    this.container = new Container();
  }

  /** Show drought warning indicator */
  showDroughtWarning(options: DroughtWarningOptions): void {
    this.hideDroughtWarning();

    // Background for warning
    this.droughtBg = new Graphics();
    this.droughtBg.rect(0, 0, 320, 60);
    this.droughtBg.fill({ color: 0x4a2c0a, alpha: 0.85 });
    this.droughtBg.rect(0, 0, 320, 60);
    this.droughtBg.stroke({ color: 0xff6f00, width: 2 });

    // Warning text
    const warningText = `⚠️ DROUGHT ACTIVE\nWater needs +${Math.round((options.waterMultiplier - 1) * 100)}% | ${options.daysRemaining} days left`;
    
    this.droughtWarning = new Text({
      text: warningText,
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: '#ffb74d',
        align: 'center',
        fontWeight: 'bold',
      },
    });
    this.droughtWarning.anchor.set(0.5, 0.5);
    this.droughtWarning.x = 160;
    this.droughtWarning.y = 30;

    this.container.addChild(this.droughtBg);
    this.container.addChild(this.droughtWarning);
  }

  /** Hide drought warning */
  hideDroughtWarning(): void {
    if (this.droughtWarning) {
      this.droughtWarning.destroy();
      this.droughtWarning = null;
    }
    if (this.droughtBg) {
      this.droughtBg.destroy();
      this.droughtBg = null;
    }
  }

  /** Show frost warning indicator */
  showFrostWarning(options: FrostWarningOptions): void {
    this.hideFrostWarning();

    this.frostBg = new Graphics();
    this.frostBg.rect(0, 65, 320, 55);
    this.frostBg.fill({ color: 0x0a1a3a, alpha: 0.85 });
    this.frostBg.stroke({ color: 0x64b5f6, width: 2 });

    const warningText = `❄️ FROST ACTIVE\n${options.damagePerDay} HP/day to non-frost-resistant plants`;

    this.frostWarning = new Text({
      text: warningText,
      style: {
        fontFamily: 'Arial',
        fontSize: 15,
        fill: '#90caf9',
        align: 'center',
        fontWeight: 'bold',
      },
    });
    this.frostWarning.anchor.set(0.5, 0.5);
    this.frostWarning.x = 160;
    this.frostWarning.y = 93;

    this.container.addChild(this.frostBg);
    this.container.addChild(this.frostWarning);
  }

  /** Hide frost warning */
  hideFrostWarning(): void {
    if (this.frostWarning) {
      this.frostWarning.destroy();
      this.frostWarning = null;
    }
    if (this.frostBg) {
      this.frostBg.destroy();
      this.frostBg = null;
    }
  }

  /** Position the UI relative to viewport */
  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  /** Get the UI container for adding to scene */
  getContainer(): Container {
    return this.container;
  }

  /** Destroy the UI component */
  destroy(): void {
    this.hideDroughtWarning();
    this.hideFrostWarning();
    this.container.destroy({ children: true });
  }
}
