import { Container, Graphics, Text } from 'pixi.js';
import type { System } from './index';

/**
 * TLDR: Reusable particle emitter — burst, ripple, and glow effects
 * Lightweight: raw Graphics objects, auto-cleanup on death.
 */

interface Particle {
  graphic: Graphics;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  gravity: number;
  fadeOut: boolean;
  shrink: boolean;
}

export interface BurstConfig {
  x: number;
  y: number;
  count: number;
  speed: number;
  lifetime: number;
  colors: number[];
  size: number;
  gravity?: number;
  fadeOut?: boolean;
  shrink?: boolean;
}

export interface RippleConfig {
  x: number;
  y: number;
  rings: number;
  maxRadius: number;
  duration: number;
  color: number;
}

export interface GlowConfig {
  x: number;
  y: number;
  radius: number;
  color: number;
  pulseSpeed: number;
  minAlpha: number;
  maxAlpha: number;
  duration: number;
}

interface ActiveRipple {
  graphics: Graphics[];
  elapsed: number;
  duration: number;
  maxRadius: number;
  color: number;
}

interface ActiveGlow {
  graphic: Graphics;
  elapsed: number;
  duration: number;
  pulseSpeed: number;
  minAlpha: number;
  maxAlpha: number;
}

export interface FloatingTextConfig {
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  duration: number;
  riseSpeed: number;
}

export interface WaterDropletsConfig {
  x: number;
  y: number;
  count: number;
  color: number;
  size: number;
  spread: number;
}

interface ActiveFloatingText {
  textObj: Text;
  elapsed: number;
  duration: number;
  riseSpeed: number;
  startY: number;
}

export class ParticleSystem implements System {
  readonly name = 'ParticleSystem';
  private container: Container;
  private particles: Particle[] = [];
  private ripples: ActiveRipple[] = [];
  private glows: ActiveGlow[] = [];
  private floatingTexts: ActiveFloatingText[] = [];

  constructor() {
    this.container = new Container();
  }

  /**
   * TLDR: Emit a radial burst of particles (harvest pop, seed drops)
   */
  burst(config: BurstConfig): void {
    for (let i = 0; i < config.count; i++) {
      const angle = (Math.PI * 2 * i) / config.count + (Math.random() - 0.5) * 0.5;
      const speed = config.speed * (0.5 + Math.random() * 0.5);
      const color = config.colors[Math.floor(Math.random() * config.colors.length)];
      const size = config.size * (0.5 + Math.random() * 0.5);

      const graphic = new Graphics();
      graphic.circle(0, 0, size);
      graphic.fill({ color });
      graphic.x = config.x;
      graphic.y = config.y;

      this.container.addChild(graphic);

      this.particles.push({
        graphic,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: config.lifetime,
        maxLife: config.lifetime,
        gravity: config.gravity ?? 180,
        fadeOut: config.fadeOut ?? true,
        shrink: config.shrink ?? true,
      });
    }
  }

  /**
   * TLDR: Concentric expanding rings (water ripple)
   */
  ripple(config: RippleConfig): void {
    const graphics: Graphics[] = [];
    for (let i = 0; i < config.rings; i++) {
      const ring = new Graphics();
      ring.x = config.x;
      ring.y = config.y;
      ring.alpha = 0;
      this.container.addChild(ring);
      graphics.push(ring);
    }

    this.ripples.push({
      graphics,
      elapsed: 0,
      duration: config.duration,
      maxRadius: config.maxRadius,
      color: config.color,
    });
  }

  /**
   * TLDR: Pulsing glow circle (synergy aura)
   */
  glow(config: GlowConfig): void {
    const graphic = new Graphics();
    graphic.circle(0, 0, config.radius);
    graphic.fill({ color: config.color, alpha: 0.5 });
    graphic.x = config.x;
    graphic.y = config.y;
    graphic.alpha = config.minAlpha;

    this.container.addChild(graphic);

    this.glows.push({
      graphic,
      elapsed: 0,
      duration: config.duration,
      pulseSpeed: config.pulseSpeed,
      minAlpha: config.minAlpha,
      maxAlpha: config.maxAlpha,
    });
  }

  /**
   * TLDR: Rising text that fades out ("+3 Seeds" on harvest)
   */
  floatingText(config: FloatingTextConfig): void {
    const textObj = new Text({
      text: config.text,
      style: {
        fontFamily: 'Arial',
        fontSize: config.fontSize,
        fill: config.color,
        fontWeight: 'bold',
        align: 'center',
      },
    });
    textObj.anchor.set(0.5);
    textObj.x = config.x;
    textObj.y = config.y;

    this.container.addChild(textObj);

    this.floatingTexts.push({
      textObj,
      elapsed: 0,
      duration: config.duration,
      riseSpeed: config.riseSpeed,
      startY: config.y,
    });
  }

  /**
   * TLDR: Small droplets that splash upward then fall (watering effect)
   */
  waterDroplets(config: WaterDropletsConfig): void {
    for (let i = 0; i < config.count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = 40 + Math.random() * 60;
      const size = config.size * (0.5 + Math.random() * 0.5);
      const offsetX = (Math.random() - 0.5) * config.spread;

      const graphic = new Graphics();
      graphic.ellipse(0, 0, size, size * 1.4);
      graphic.fill({ color: config.color, alpha: 0.8 });
      graphic.x = config.x + offsetX;
      graphic.y = config.y;

      this.container.addChild(graphic);

      this.particles.push({
        graphic,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8,
        gravity: 250,
        fadeOut: true,
        shrink: true,
      });
    }
  }

  update(delta: number): void {
    const dt = delta;

    // TLDR: Update particles — physics, fade, shrink
    const deadParticles: number[] = [];
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        deadParticles.push(i);
        continue;
      }

      p.vx *= 0.98;
      p.vy += p.gravity * dt;
      p.graphic.x += p.vx * dt;
      p.graphic.y += p.vy * dt;

      const lifeRatio = p.life / p.maxLife;
      if (p.fadeOut) p.graphic.alpha = lifeRatio;
      if (p.shrink) p.graphic.scale.set(lifeRatio);
    }

    for (let i = deadParticles.length - 1; i >= 0; i--) {
      const idx = deadParticles[i];
      this.particles[idx].graphic.destroy();
      this.particles.splice(idx, 1);
    }

    // TLDR: Update ripples — expand rings outward with fade
    const deadRipples: number[] = [];
    for (let i = 0; i < this.ripples.length; i++) {
      const r = this.ripples[i];
      r.elapsed += dt;

      if (r.elapsed >= r.duration) {
        deadRipples.push(i);
        continue;
      }

      const progress = r.elapsed / r.duration;
      for (let j = 0; j < r.graphics.length; j++) {
        const ringDelay = j * 0.15;
        const ringProgress = Math.max(0, progress - ringDelay);
        const ring = r.graphics[j];

        if (ringProgress > 0 && ringProgress < 1) {
          const radius = r.maxRadius * ringProgress;
          ring.clear();
          ring.circle(0, 0, radius);
          ring.stroke({ color: r.color, width: 2 });
          ring.alpha = 1 - ringProgress;
        }
      }
    }

    for (let i = deadRipples.length - 1; i >= 0; i--) {
      const idx = deadRipples[i];
      for (const g of this.ripples[idx].graphics) g.destroy();
      this.ripples.splice(idx, 1);
    }

    // TLDR: Update glows — sine-wave alpha pulse
    const deadGlows: number[] = [];
    for (let i = 0; i < this.glows.length; i++) {
      const g = this.glows[i];
      g.elapsed += dt;

      if (g.elapsed >= g.duration) {
        deadGlows.push(i);
        continue;
      }

      const pulse = Math.sin(g.elapsed * g.pulseSpeed * Math.PI * 2);
      g.graphic.alpha = g.minAlpha + (g.maxAlpha - g.minAlpha) * (pulse * 0.5 + 0.5);
    }

    for (let i = deadGlows.length - 1; i >= 0; i--) {
      const idx = deadGlows[i];
      this.glows[idx].graphic.destroy();
      this.glows.splice(idx, 1);
    }

    // TLDR: Update floating texts — rise and fade
    const deadTexts: number[] = [];
    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      ft.elapsed += dt;

      if (ft.elapsed >= ft.duration) {
        deadTexts.push(i);
        continue;
      }

      const progress = ft.elapsed / ft.duration;
      ft.textObj.y = ft.startY - ft.riseSpeed * ft.elapsed;
      ft.textObj.alpha = 1 - progress;
    }

    for (let i = deadTexts.length - 1; i >= 0; i--) {
      const idx = deadTexts[i];
      this.floatingTexts[idx].textObj.destroy();
      this.floatingTexts.splice(idx, 1);
    }
  }

  getContainer(): Container {
    return this.container;
  }

  get activeCount(): number {
    return this.particles.length + this.ripples.length + this.glows.length + this.floatingTexts.length;
  }

  destroy(): void {
    for (const p of this.particles) p.graphic.destroy();
    for (const r of this.ripples) r.graphics.forEach((g) => g.destroy());
    for (const g of this.glows) g.graphic.destroy();
    for (const ft of this.floatingTexts) ft.textObj.destroy();
    this.particles = [];
    this.ripples = [];
    this.glows = [];
    this.floatingTexts = [];
    this.container.destroy({ children: true });
  }
}
