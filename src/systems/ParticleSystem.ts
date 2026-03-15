import { Container, Graphics, Text } from 'pixi.js';
import type { System } from './index';
import { ObjectPool } from '../utils/objectPool';
import { shouldReduceMotion } from '../utils/accessibility';

/**
 * TLDR: Reusable particle emitter — burst, ripple, and glow effects
 * Uses ObjectPool for Graphics to reduce GC pressure.
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

export interface AmbientParticleConfig {
  type: 'petals' | 'fireflies' | 'leaves' | 'snow';
  count: number;
  bounds: { width: number; height: number };
  colors: number[];
}

interface AmbientParticle {
  graphic: Graphics;
  vx: number;
  vy: number;
  wobblePhase: number;
  wobbleSpeed: number;
  wobbleAmplitude: number;
  life: number;
  maxLife: number;
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
  private ambientParticles: AmbientParticle[] = [];
  private ambientConfig: AmbientParticleConfig | null = null;
  private ambientSpawnTimer = 0;

  // TLDR: Object pool for Graphics to avoid new/destroy churn
  private graphicsPool: ObjectPool<Graphics>;

  constructor() {
    this.container = new Container();

    this.graphicsPool = new ObjectPool<Graphics>({
      create: () => new Graphics(),
      reset: (g) => {
        g.clear();
        g.alpha = 1;
        g.scale.set(1);
        g.x = 0;
        g.y = 0;
        g.visible = true;
        g.removeFromParent();
      },
      destroy: (g) => g.destroy(),
      initialSize: 80,
      maxSize: 256,
    });
  }

  /**
   * TLDR: Emit a radial burst of particles (harvest pop, seed drops)
   * Reduced motion: skip burst entirely — essential feedback handled by floating text
   */
  burst(config: BurstConfig): void {
    if (shouldReduceMotion()) return;

    // Cap burst count to prevent unbounded particle allocation
    const safeCount = Math.min(config.count, 128);

    for (let i = 0; i < safeCount; i++) {
      const angle = (Math.PI * 2 * i) / config.count + (Math.random() - 0.5) * 0.5;
      const speed = config.speed * (0.5 + Math.random() * 0.5);
      const color = config.colors[Math.floor(Math.random() * config.colors.length)];
      const size = config.size * (0.5 + Math.random() * 0.5);

      const graphic = this.graphicsPool.acquire();
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
   * Reduced motion: skip ripple animation
   */
  ripple(config: RippleConfig): void {
    if (shouldReduceMotion()) return;

    const graphics: Graphics[] = [];
    for (let i = 0; i < config.rings; i++) {
      const ring = this.graphicsPool.acquire();
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
   * Reduced motion: show static glow at mid-alpha instead of pulsing
   */
  glow(config: GlowConfig): void {
    if (shouldReduceMotion()) {
      const graphic = this.graphicsPool.acquire();
      graphic.circle(0, 0, config.radius);
      graphic.fill({ color: config.color, alpha: 0.5 });
      graphic.x = config.x;
      graphic.y = config.y;
      graphic.alpha = (config.minAlpha + config.maxAlpha) / 2;
      this.container.addChild(graphic);
      this.glows.push({
        graphic,
        elapsed: 0,
        duration: config.duration,
        pulseSpeed: 0,
        minAlpha: graphic.alpha,
        maxAlpha: graphic.alpha,
      });
      return;
    }

    const graphic = this.graphicsPool.acquire();
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
   * Reduced motion: skip droplet animation
   */
  waterDroplets(config: WaterDropletsConfig): void {
    if (shouldReduceMotion()) return;

    for (let i = 0; i < config.count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = 40 + Math.random() * 60;
      const size = config.size * (0.5 + Math.random() * 0.5);
      const offsetX = (Math.random() - 0.5) * config.spread;

      const graphic = this.graphicsPool.acquire();
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

  /**
   * TLDR: Start continuous ambient particles for seasonal atmosphere
   * Reduced motion: skip ambient particles entirely
   */
  startAmbientParticles(config: AmbientParticleConfig): void {
    if (shouldReduceMotion()) return;

    this.stopAmbientParticles();
    this.ambientConfig = config;
    this.ambientSpawnTimer = 0;
    for (let i = 0; i < config.count; i++) {
      this.spawnAmbientParticle(true);
    }
  }

  /**
   * TLDR: Stop and clean up all ambient particles
   */
  stopAmbientParticles(): void {
    for (const p of this.ambientParticles) {
      this.graphicsPool.release(p.graphic);
    }
    this.ambientParticles = [];
    this.ambientConfig = null;
  }

  private spawnAmbientParticle(randomizeY = false): void {
    if (!this.ambientConfig) return;
    const cfg = this.ambientConfig;
    const color = cfg.colors[Math.floor(Math.random() * cfg.colors.length)];
    const size = 2 + Math.random() * 3;

    const graphic = this.graphicsPool.acquire();
    switch (cfg.type) {
      case 'petals':
        graphic.ellipse(0, 0, size, size * 0.6);
        graphic.fill({ color, alpha: 0.7 });
        break;
      case 'fireflies':
        graphic.circle(0, 0, size * 0.5);
        graphic.fill({ color, alpha: 0.8 });
        break;
      case 'leaves':
        graphic.ellipse(0, 0, size, size * 0.4);
        graphic.fill({ color, alpha: 0.6 });
        break;
      case 'snow':
        graphic.circle(0, 0, size * 0.4);
        graphic.fill({ color, alpha: 0.9 });
        break;
    }

    graphic.x = Math.random() * cfg.bounds.width;
    graphic.y = randomizeY
      ? Math.random() * cfg.bounds.height
      : -10 - Math.random() * 50;

    let vx = 0, vy = 0, wobbleSpeed = 0, wobbleAmplitude = 0;
    switch (cfg.type) {
      case 'petals':
        vx = 10 + Math.random() * 15;
        vy = 15 + Math.random() * 10;
        wobbleSpeed = 1.5 + Math.random();
        wobbleAmplitude = 20;
        break;
      case 'fireflies':
        vx = (Math.random() - 0.5) * 10;
        vy = (Math.random() - 0.5) * 5;
        wobbleSpeed = 2.0 + Math.random();
        wobbleAmplitude = 30;
        graphic.y = Math.random() * cfg.bounds.height;
        break;
      case 'leaves':
        vx = 20 + Math.random() * 20;
        vy = 25 + Math.random() * 15;
        wobbleSpeed = 1.0 + Math.random() * 0.5;
        wobbleAmplitude = 40;
        break;
      case 'snow':
        vx = (Math.random() - 0.5) * 8;
        vy = 12 + Math.random() * 8;
        wobbleSpeed = 0.8 + Math.random() * 0.5;
        wobbleAmplitude = 15;
        break;
    }

    this.container.addChild(graphic);
    this.ambientParticles.push({
      graphic,
      vx,
      vy,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed,
      wobbleAmplitude,
      life: 5 + Math.random() * 10,
      maxLife: 15,
    });
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
      this.graphicsPool.release(this.particles[idx].graphic);
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
      for (const g of this.ripples[idx].graphics) this.graphicsPool.release(g);
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
      this.graphicsPool.release(this.glows[idx].graphic);
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

    // TLDR: Update ambient particles — continuous drift with wobble
    if (this.ambientConfig) {
      this.ambientSpawnTimer += dt;
      if (this.ambientSpawnTimer > 0.5 && this.ambientParticles.length < this.ambientConfig.count * 2) {
        this.ambientSpawnTimer = 0;
        this.spawnAmbientParticle();
      }
    }

    const deadAmbient: number[] = [];
    for (let i = 0; i < this.ambientParticles.length; i++) {
      const p = this.ambientParticles[i];
      p.life -= dt;
      p.wobblePhase += p.wobbleSpeed * dt;

      if (p.life <= 0 || (this.ambientConfig && (
        p.graphic.y > this.ambientConfig.bounds.height + 20 ||
        p.graphic.x > this.ambientConfig.bounds.width + 20 ||
        p.graphic.x < -20
      ))) {
        deadAmbient.push(i);
        continue;
      }

      const wobble = Math.sin(p.wobblePhase) * p.wobbleAmplitude * dt;
      p.graphic.x += p.vx * dt + wobble;
      p.graphic.y += p.vy * dt;

      // Fireflies pulse alpha
      if (this.ambientConfig?.type === 'fireflies') {
        p.graphic.alpha = 0.3 + 0.7 * Math.abs(Math.sin(p.wobblePhase * 0.5));
      }
    }

    for (let i = deadAmbient.length - 1; i >= 0; i--) {
      const idx = deadAmbient[i];
      this.graphicsPool.release(this.ambientParticles[idx].graphic);
      this.ambientParticles.splice(idx, 1);
    }
  }

  getContainer(): Container {
    return this.container;
  }

  get activeCount(): number {
    return this.particles.length + this.ripples.length + this.glows.length + this.floatingTexts.length + this.ambientParticles.length;
  }

  /** TLDR: Pool utilization stats for FPS monitor overlay */
  getPoolStats(): { active: number; available: number; total: number } {
    return {
      active: this.graphicsPool.activeCount,
      available: this.graphicsPool.availableCount,
      total: this.graphicsPool.totalCount,
    };
  }

  destroy(): void {
    this.stopAmbientParticles();
    for (const p of this.particles) this.graphicsPool.release(p.graphic);
    for (const r of this.ripples) r.graphics.forEach((g) => this.graphicsPool.release(g));
    for (const g of this.glows) this.graphicsPool.release(g.graphic);
    for (const ft of this.floatingTexts) ft.textObj.destroy();
    this.particles = [];
    this.ripples = [];
    this.glows = [];
    this.floatingTexts = [];
    this.graphicsPool.drain();
    this.container.destroy({ children: true });
  }
}
