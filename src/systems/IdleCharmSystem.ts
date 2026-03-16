import { Container, Graphics } from 'pixi.js';
import type { System } from './index';
import { shouldReduceMotion } from '../utils/accessibility';

/**
 * TLDR: Idle charm events — tiny bird/ladybug animations after 5s inactivity (Sabrina §5.6 item 13)
 * Pure delight, no gameplay effect.
 */

type CharmType = 'bird' | 'ladybug';

interface ActiveCharm {
  type: CharmType;
  graphic: Container;
  elapsed: number;
  duration: number;
  phase: 'enter' | 'idle' | 'exit';
  phaseElapsed: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
}

export interface IdleCharmConfig {
  screenWidth: number;
  screenHeight: number;
  /** TLDR: Callback to get occupied plant positions for bird landing spots */
  getPlantPositions: () => Array<{ x: number; y: number }>;
  /** TLDR: Callback to get tile positions for ladybug crawling */
  getTilePositions: () => Array<{ x: number; y: number; size: number }>;
}

export class IdleCharmSystem implements System {
  readonly name = 'IdleCharmSystem';
  private container: Container;
  private config: IdleCharmConfig;

  private idleTime = 0;
  private charmTimer = 0;
  private nextCharmInterval = 0;
  private activeCharm: ActiveCharm | null = null;
  private lastInputTime = 0;
  private isIdle = false;

  // TLDR: Track pointer/keyboard activity
  private boundPointerHandler: () => void;
  private boundKeyHandler: () => void;

  constructor(config: IdleCharmConfig) {
    this.container = new Container();
    this.config = config;
    this.nextCharmInterval = 10 + Math.random() * 10; // 10-20s

    this.boundPointerHandler = () => this.resetIdle();
    this.boundKeyHandler = () => this.resetIdle();

    window.addEventListener('pointermove', this.boundPointerHandler);
    window.addEventListener('pointerdown', this.boundPointerHandler);
    window.addEventListener('keydown', this.boundKeyHandler);
  }

  private resetIdle(): void {
    this.idleTime = 0;
    this.charmTimer = 0;
    this.isIdle = false;
    this.lastInputTime = performance.now();
  }

  update(delta: number): void {
    if (shouldReduceMotion()) return;

    this.idleTime += delta;

    // TLDR: Only start charm events after 5s of idle
    if (this.idleTime < 5) {
      // Clean up any active charm if player became active
      if (this.activeCharm) {
        this.removeCharm();
      }
      return;
    }

    this.isIdle = true;

    // TLDR: Update active charm animation
    if (this.activeCharm) {
      this.updateCharm(delta);
      return;
    }

    // TLDR: Count toward next charm spawn
    this.charmTimer += delta;
    if (this.charmTimer >= this.nextCharmInterval) {
      this.charmTimer = 0;
      this.nextCharmInterval = 10 + Math.random() * 10;
      this.spawnCharm();
    }
  }

  private spawnCharm(): void {
    const type: CharmType = Math.random() < 0.5 ? 'bird' : 'ladybug';

    if (type === 'bird') {
      this.spawnBird();
    } else {
      this.spawnLadybug();
    }
  }

  /** TLDR: Bird lands on a random plant, bobs for 3s, flies away */
  private spawnBird(): void {
    const plants = this.config.getPlantPositions();
    if (plants.length === 0) return;

    const target = plants[Math.floor(Math.random() * plants.length)];
    const graphic = new Container();

    // TLDR: Tiny bird body — 6px, warm brown (0x8B7355)
    const body = new Graphics();
    body.ellipse(0, 0, 4, 3);
    body.fill({ color: 0x8b7355 });
    // Head
    body.circle(4, -2, 2);
    body.fill({ color: 0x8b7355 });
    // Beak
    body.moveTo(6, -2);
    body.lineTo(8, -1.5);
    body.lineTo(6, -1);
    body.fill({ color: 0xd4a574 });
    // Eye
    body.circle(4.5, -2.5, 0.5);
    body.fill({ color: 0x2a2a2a });

    graphic.addChild(body);

    // Start from offscreen
    const startX = Math.random() < 0.5 ? -20 : this.config.screenWidth + 20;
    const startY = target.y - 40;
    graphic.x = startX;
    graphic.y = startY;
    graphic.scale.x = startX > target.x ? -1 : 1;

    this.container.addChild(graphic);

    this.activeCharm = {
      type: 'bird',
      graphic,
      elapsed: 0,
      duration: 5.0, // total: 1s enter + 3s idle + 1s exit
      phase: 'enter',
      phaseElapsed: 0,
      startX,
      startY,
      targetX: target.x,
      targetY: target.y - 20, // Land slightly above plant
    };
  }

  /** TLDR: Ladybug crawls across a tile edge */
  private spawnLadybug(): void {
    const tiles = this.config.getTilePositions();
    if (tiles.length === 0) return;

    const tile = tiles[Math.floor(Math.random() * tiles.length)];
    const graphic = new Container();

    // TLDR: Tiny ladybug — 4px, terracotta red with dark dots
    const body = new Graphics();
    body.ellipse(0, 0, 3, 2.5);
    body.fill({ color: 0xd4745f });
    // Wing line
    body.moveTo(0, -2.5);
    body.lineTo(0, 2.5);
    body.stroke({ color: 0x3a3a3a, width: 0.5 });
    // Dots
    body.circle(-1.2, -0.5, 0.6);
    body.fill({ color: 0x3a3a3a });
    body.circle(1.2, -0.5, 0.6);
    body.fill({ color: 0x3a3a3a });
    body.circle(-0.8, 1.2, 0.5);
    body.fill({ color: 0x3a3a3a });
    body.circle(0.8, 1.2, 0.5);
    body.fill({ color: 0x3a3a3a });
    // Head
    body.circle(0, -3, 1.2);
    body.fill({ color: 0x3a3a3a });

    graphic.addChild(body);

    // TLDR: Crawl along the bottom edge of a tile
    const edgeY = tile.y + tile.size * 0.45;
    const startX = tile.x - tile.size * 0.5;
    const endX = tile.x + tile.size * 0.5;

    graphic.x = startX;
    graphic.y = edgeY;

    this.container.addChild(graphic);

    this.activeCharm = {
      type: 'ladybug',
      graphic,
      elapsed: 0,
      duration: 4.0, // crawl across in ~4s
      phase: 'enter',
      phaseElapsed: 0,
      startX,
      startY: edgeY,
      targetX: endX,
      targetY: edgeY,
    };
  }

  private updateCharm(delta: number): void {
    if (!this.activeCharm) return;
    const charm = this.activeCharm;
    charm.elapsed += delta;
    charm.phaseElapsed += delta;

    if (charm.type === 'bird') {
      this.updateBird(charm, delta);
    } else {
      this.updateLadybug(charm, delta);
    }

    if (charm.elapsed >= charm.duration) {
      this.removeCharm();
    }
  }

  private updateBird(charm: ActiveCharm, _delta: number): void {
    const enterDur = 1.0;
    const idleDur = 3.0;
    const exitDur = 1.0;

    if (charm.phase === 'enter') {
      const t = Math.min(charm.phaseElapsed / enterDur, 1);
      const eased = t * t * (3 - 2 * t); // smoothstep
      charm.graphic.x = charm.startX + (charm.targetX - charm.startX) * eased;
      charm.graphic.y = charm.startY + (charm.targetY - charm.startY) * eased;

      if (t >= 1) {
        charm.phase = 'idle';
        charm.phaseElapsed = 0;
      }
    } else if (charm.phase === 'idle') {
      // TLDR: Gentle head bob while perched
      charm.graphic.y = charm.targetY + Math.sin(charm.phaseElapsed * 4) * 1.5;

      if (charm.phaseElapsed >= idleDur) {
        charm.phase = 'exit';
        charm.phaseElapsed = 0;
      }
    } else if (charm.phase === 'exit') {
      const t = Math.min(charm.phaseElapsed / exitDur, 1);
      // TLDR: Fly upward and offscreen
      charm.graphic.x = charm.targetX + (charm.targetX > this.config.screenWidth / 2 ? 1 : -1) * 80 * t;
      charm.graphic.y = charm.targetY - 60 * t;
      charm.graphic.alpha = 1 - t;
    }
  }

  private updateLadybug(charm: ActiveCharm, _delta: number): void {
    const t = Math.min(charm.elapsed / charm.duration, 1);
    // TLDR: Steady crawl with tiny wobble
    charm.graphic.x = charm.startX + (charm.targetX - charm.startX) * t;
    charm.graphic.y = charm.startY + Math.sin(charm.elapsed * 6) * 0.5;
    charm.graphic.alpha = t < 0.1 ? t / 0.1 : t > 0.9 ? (1 - t) / 0.1 : 1;
  }

  private removeCharm(): void {
    if (this.activeCharm) {
      this.activeCharm.graphic.destroy({ children: true });
      this.activeCharm = null;
    }
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    window.removeEventListener('pointermove', this.boundPointerHandler);
    window.removeEventListener('pointerdown', this.boundPointerHandler);
    window.removeEventListener('keydown', this.boundKeyHandler);
    this.removeCharm();
    this.container.destroy({ children: true });
  }
}
