import { Container, Graphics } from 'pixi.js';
import type { System } from './index';
import { shouldReduceMotion } from '../utils/accessibility';

/**
 * TLDR: Ambient cloud drift — 2-3 soft white clouds crossing the top 15% of screen (Sabrina §5.1 item 12)
 */

interface Cloud {
  graphic: Graphics;
  speed: number;
  y: number;
}

export class CloudSystem implements System {
  readonly name = 'CloudSystem';
  private container: Container;
  private clouds: Cloud[] = [];
  private screenWidth: number;
  private screenHeight: number;

  constructor(screenWidth: number, screenHeight: number) {
    this.container = new Container();
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }

  /** TLDR: Spawn initial clouds at random x positions across the sky band */
  init(): void {
    if (shouldReduceMotion()) return;

    const cloudCount = 2 + Math.floor(Math.random() * 2); // 2-3 clouds
    for (let i = 0; i < cloudCount; i++) {
      this.spawnCloud(Math.random() * (this.screenWidth + 200) - 100);
    }
  }

  private spawnCloud(startX: number): void {
    const width = 80 + Math.random() * 40; // 80-120px wide
    const height = width * (0.3 + Math.random() * 0.15); // oval proportions
    const skyBand = this.screenHeight * 0.15;
    const y = 10 + Math.random() * (skyBand - height);

    // TLDR: 60-90s to cross full screen width → speed = screenWidth / crossTime
    const crossTime = 60 + Math.random() * 30;
    const speed = (this.screenWidth + width * 2) / crossTime;

    const graphic = new Graphics();
    // TLDR: Soft cloud built from overlapping ovals for organic shape
    graphic.ellipse(0, 0, width * 0.5, height * 0.5);
    graphic.fill({ color: 0xffffff, alpha: 0.15 });
    graphic.ellipse(width * 0.2, -height * 0.1, width * 0.35, height * 0.4);
    graphic.fill({ color: 0xffffff, alpha: 0.12 });
    graphic.ellipse(-width * 0.15, height * 0.05, width * 0.3, height * 0.35);
    graphic.fill({ color: 0xffffff, alpha: 0.10 });

    graphic.x = startX;
    graphic.y = y;

    this.container.addChild(graphic);
    this.clouds.push({ graphic, speed, y });
  }

  update(delta: number): void {
    if (shouldReduceMotion()) return;

    for (const cloud of this.clouds) {
      cloud.graphic.x += cloud.speed * delta;

      // TLDR: Respawn on the left side after drifting off-screen right
      if (cloud.graphic.x > this.screenWidth + 120) {
        cloud.graphic.x = -150;
        const skyBand = this.screenHeight * 0.15;
        cloud.graphic.y = 10 + Math.random() * (skyBand - 30);
      }
    }
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    for (const cloud of this.clouds) {
      cloud.graphic.destroy();
    }
    this.clouds = [];
    this.container.destroy({ children: true });
  }
}
