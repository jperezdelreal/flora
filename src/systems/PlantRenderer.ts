/**
 * TLDR: Dedicated rendering system for procedural plant visuals — 22 species × 5 growth stages
 * Decoupled from game logic: receives entity data, produces visuals.
 * Sprites cached per (plantType, growthStage, season) — no per-frame regeneration.
 */

import { Container, Graphics } from 'pixi.js';
import { GrowthStage } from '../entities/Plant';
import { Season } from '../config/seasons';
import { ANIMATION, PLANT_STAGE_COLORS } from '../config/animations';
import { COLORS } from '../config';
import { AnimationSystem, Easing } from './AnimationSystem';
import type { PlantSystem } from './PlantSystem';
import type { GardenGrid } from '../entities/GardenGrid';
import {
  getPlantVisual,
  getStageKeyframe,
  adjustColorForHealth,
  adjustColorForAccessibility,
  getShapeData,
  type PlantVisualDef,
  type PlantShapeData,
} from '../config/plantVisuals';
import { getSeasonalPalette, lerpColor, adjustSaturation } from '../config/seasonalPalettes';
import type { System } from './index';

export interface PlantRendererConfig {
  animationSystem: AnimationSystem;
  plantSystem: PlantSystem;
  grid: GardenGrid;
}

/** Cache key encodes the visual state — only redraw when key changes */
function makeCacheKey(
  plantType: string,
  stage: GrowthStage,
  healthBucket: number,
  season: Season,
): string {
  return `${plantType}_${stage}_${healthBucket}_${season}`;
}

export class PlantRenderer implements System {
  readonly name = 'PlantRenderer';

  private plantVisualLayer: Container;
  private plantVisuals = new Map<string, Container>();
  private swayPhases = new Map<string, number>();
  private plantBaseX = new Map<string, number>();
  private plantHealthCache = new Map<string, number>();
  private visualStateCache = new Map<string, string>();
  private synergyShimmerPhases = new Map<string, number>();
  private maturityGlows = new Map<string, Graphics>();
  private currentSeason: Season = Season.SPRING;

  private animationSystem: AnimationSystem;
  private plantSystem: PlantSystem;
  private grid: GardenGrid;

  constructor(config: PlantRendererConfig) {
    this.animationSystem = config.animationSystem;
    this.plantSystem = config.plantSystem;
    this.grid = config.grid;
    this.plantVisualLayer = new Container();
  }

  // ─── Public API ──────────────────────────────────────────────────────

  getContainer(): Container {
    return this.plantVisualLayer;
  }

  setSeason(season: Season): void {
    this.currentSeason = season;
    this.visualStateCache.clear();
    for (const [plantId] of this.plantVisuals) {
      this.refreshPlantVisual(plantId);
    }
  }

  setGrid(grid: GardenGrid): void {
    this.grid = grid;
  }

  /** Create an animated visual container for a plant at grid position */
  createPlantVisual(plantId: string, col: number, row: number): void {
    const plant = this.plantSystem.getPlant(plantId);
    if (!plant) return;

    const tilePos = this.grid.getTilePosition(row, col);
    const tileSize = this.grid.config.tileSize;

    const visual = new Container();
    visual.x = tilePos.x + tileSize / 2;
    visual.y = tilePos.y + tileSize / 2;
    visual.scale.set(0.01);

    const gfx = new Graphics();
    const configId = plant.getConfig().id;
    this.drawPlantShape(gfx, configId, GrowthStage.SEED, plant.getHealth());
    visual.addChild(gfx);

    this.plantVisualLayer.addChild(visual);
    this.plantVisuals.set(plantId, visual);

    const keyframe = getStageKeyframe(configId, GrowthStage.SEED);

    this.swayPhases.set(plantId, Math.random() * Math.PI * 2);
    this.plantBaseX.set(plantId, visual.x);
    this.synergyShimmerPhases.set(plantId, Math.random() * Math.PI * 2);

    this.animationSystem.tween(
      visual.scale as unknown as Record<string, unknown>,
      { x: keyframe.scale, y: keyframe.scale },
      ANIMATION.GROWTH_SCALE_DURATION,
      { easing: Easing.backOut },
    );

    this.animationSystem.tween(
      visual as unknown as Record<string, unknown>,
      { alpha: keyframe.alpha },
      ANIMATION.GROWTH_SCALE_DURATION * 0.5,
    );
  }

  /** Animate plant visual when growth stage changes — scale pop + redraw */
  animatePlantGrowth(plantId: string, stage: GrowthStage): void {
    const visual = this.plantVisuals.get(plantId);
    if (!visual) return;

    const plant = this.plantSystem.getPlant(plantId);
    if (!plant) return;

    const configId = plant.getConfig().id;
    const keyframe = getStageKeyframe(configId, stage);
    const visualDef = getPlantVisual(configId);

    const gfx = visual.children[0] as Graphics;
    if (gfx) {
      this.drawPlantShape(gfx, configId, stage, plant.getHealth());
    }

    const swayIntensity = visualDef?.swayIntensity ?? 1.0;
    const targetScale = keyframe.scale * (1 + 0.15 * swayIntensity);

    visual.scale.set(targetScale);
    this.animationSystem.tween(
      visual.scale as unknown as Record<string, unknown>,
      { x: keyframe.scale, y: keyframe.scale },
      ANIMATION.GROWTH_SCALE_DURATION,
      { easing: Easing.elasticOut },
    );

    this.animationSystem.tween(
      visual as unknown as Record<string, unknown>,
      { alpha: keyframe.alpha },
      ANIMATION.GROWTH_SCALE_DURATION * 0.5,
    );
  }

  /** Remove plant visual container — cleanup all caches */
  removePlantVisual(plantId: string): void {
    const visual = this.plantVisuals.get(plantId);
    if (visual) {
      visual.destroy({ children: true });
      this.plantVisuals.delete(plantId);
      this.swayPhases.delete(plantId);
      this.plantBaseX.delete(plantId);
      this.plantHealthCache.delete(plantId);
      this.visualStateCache.delete(plantId);
      this.synergyShimmerPhases.delete(plantId);
      this.removeMaturityGlow(plantId);
    }
  }

  /**
   * TLDR: Attach a persistent pulsing glow to a mature plant sprite
   * Glow alpha oscillates each frame in update(). Removed on harvest/death.
   */
  addMaturityGlow(plantId: string, color: number): void {
    if (this.maturityGlows.has(plantId)) return;
    const visual = this.plantVisuals.get(plantId);
    if (!visual) return;

    const glow = new Graphics();
    glow.circle(0, 0, ANIMATION.MATURE_GLOW_RADIUS);
    glow.fill({ color, alpha: 0.3 });
    glow.alpha = ANIMATION.MATURE_GLOW_MIN_ALPHA;
    visual.addChildAt(glow, 0);
    this.maturityGlows.set(plantId, glow);
  }

  /** Remove maturity glow graphic for a plant */
  private removeMaturityGlow(plantId: string): void {
    const glow = this.maturityGlows.get(plantId);
    if (glow) {
      glow.destroy();
      this.maturityGlows.delete(plantId);
    }
  }

  /** Rebuild all plant visuals (after season change / restart) */
  rebuildAllVisuals(): void {
    for (const [, visual] of this.plantVisuals) {
      visual.destroy({ children: true });
    }
    this.plantVisuals.clear();
    this.swayPhases.clear();
    this.plantBaseX.clear();
    this.plantHealthCache.clear();
    this.visualStateCache.clear();
    this.synergyShimmerPhases.clear();
    this.maturityGlows.clear();

    const activePlants = this.plantSystem.getActivePlants();
    for (const plant of activePlants) {
      this.createPlantVisual(plant.id, plant.x, plant.y);
      const visual = this.plantVisuals.get(plant.id);
      if (visual) {
        const keyframe = getStageKeyframe(plant.getConfig().id, plant.getGrowthStage());
        visual.scale.set(keyframe.scale);
        const gfx = visual.children[0] as Graphics;
        if (gfx) {
          this.drawPlantShape(gfx, plant.getConfig().id, plant.getGrowthStage(), plant.getHealth());
        }
      }
    }
  }

  /** Refresh a single plant's visual (for health changes / wilting) */
  refreshPlantVisual(plantId: string): void {
    const visual = this.plantVisuals.get(plantId);
    const plant = this.plantSystem.getPlant(plantId);
    if (!visual || !plant) return;

    const gfx = visual.children[0] as Graphics;
    if (gfx) {
      this.drawPlantShape(gfx, plant.getConfig().id, plant.getGrowthStage(), plant.getHealth());
    }
  }

  /** Get a plant visual's position in local container coords (for particle effects) */
  getPlantVisualPosition(plantId: string): { x: number; y: number } | null {
    const visual = this.plantVisuals.get(plantId);
    if (!visual) return null;
    return { x: visual.x, y: visual.y };
  }

  /** Find a plant visual whose backing plant no longer exists (just harvested) */
  findOrphanedPlantPosition(): { x: number; y: number; plantId: string } | null {
    for (const [pid, v] of this.plantVisuals) {
      const p = this.plantSystem.getPlant(pid);
      if (!p) {
        return { x: v.x, y: v.y, plantId: pid };
      }
    }
    return null;
  }

  /** Animate shrink-to-nothing on the first orphaned plant visual */
  animateOrphanedRemoval(): void {
    for (const [pid, visual] of this.plantVisuals) {
      const plant = this.plantSystem.getPlant(pid);
      if (!plant && visual) {
        this.animationSystem.tween(
          visual.scale as unknown as Record<string, unknown>,
          { x: 0, y: 0 },
          0.1,
          {
            easing: Easing.easeIn,
            onComplete: () => {
              this.removePlantVisual(pid);
            },
          },
        );
        break;
      }
    }
  }

  /** Check if a plant visual exists */
  hasPlantVisual(plantId: string): boolean {
    return this.plantVisuals.has(plantId);
  }

  /** Get the plant visual Container (for external animation) */
  getPlantVisual(plantId: string): Container | null {
    return this.plantVisuals.get(plantId) ?? null;
  }

  // ─── Per-Frame Update ────────────────────────────────────────────────

  /** Per-frame visual update: idle sway, synergy shimmer, health refresh, orphan cleanup */
  update(_delta: number): void {
    const time = performance.now() / 1000;

    for (const [plantId, visual] of this.plantVisuals) {
      const plant = this.plantSystem.getPlant(plantId);
      if (!plant) continue;

      const visualDef = getPlantVisual(plant.getConfig().id);
      const swayIntensity = visualDef?.swayIntensity ?? 1.0;
      const phase = this.swayPhases.get(plantId) ?? 0;
      const stage = plant.getGrowthStage();
      const isMatureOrGrowing = stage === GrowthStage.MATURE || stage === GrowthStage.GROWING;

      // Idle sway: rotation on all non-seed stages
      if (stage !== GrowthStage.SEED) {
        const rotationScale = stage === GrowthStage.SPROUT ? 0.4 : 1.0;
        visual.rotation = Math.sin(time * ANIMATION.SWAY_FREQUENCY * Math.PI * 2 + phase) *
                          ANIMATION.SWAY_AMPLITUDE * swayIntensity * rotationScale;
      } else {
        visual.rotation = 0;
      }

      // Idle sway: x-offset on mature/growing plants
      if (isMatureOrGrowing) {
        const baseX = this.plantBaseX.get(plantId) ?? visual.x;
        const xSway = Math.sin(time * ANIMATION.SWAY_X_FREQUENCY * Math.PI * 2 + phase * 1.5) *
                       ANIMATION.SWAY_X_AMPLITUDE * swayIntensity;
        visual.x = baseX + xSway;
      }

      // Mature pulse: subtle scale breathing to signal "harvest me"
      if (stage === GrowthStage.MATURE && plant.getHealth() > 70) {
        const keyframe = getStageKeyframe(plant.getConfig().id, stage);
        const pulseSpeed = visualDef?.glowOnMature ? 2.5 : 1.8;
        const pulseAmount = visualDef?.glowOnMature ? 0.06 : 0.03;
        const pulse = 1.0 + Math.sin(time * pulseSpeed + phase) * pulseAmount;
        visual.scale.set(keyframe.scale * pulse);
      }

      // Synergy shimmer: alpha pulse on plants with active synergies
      const state = plant.getState();
      if (state.activeSynergies && state.activeSynergies.size > 0 && stage === GrowthStage.MATURE) {
        const shimmerPhase = this.synergyShimmerPhases.get(plantId) ?? 0;
        const shimmer = 0.85 + 0.15 * Math.sin(time * 4.0 + shimmerPhase);
        const gfx = visual.children[0] as Graphics;
        if (gfx) {
          gfx.alpha = shimmer;
        }
      }

      // Maturity glow: gentle alpha oscillation on persistent glow graphic
      const maturityGlow = this.maturityGlows.get(plantId);
      if (maturityGlow) {
        const pulse = Math.sin(time * ANIMATION.MATURE_GLOW_PULSE_SPEED * Math.PI * 2 + phase);
        maturityGlow.alpha = ANIMATION.MATURE_GLOW_MIN_ALPHA +
          (ANIMATION.MATURE_GLOW_MAX_ALPHA - ANIMATION.MATURE_GLOW_MIN_ALPHA) * (pulse * 0.5 + 0.5);
      }

      // Health-based visual refresh(only when health changes by >5%)
      const currentHealth = plant.getHealth();
      const cachedHealth = this.plantHealthCache.get(plantId);
      if (cachedHealth === undefined || Math.abs(currentHealth - cachedHealth) > 5) {
        this.plantHealthCache.set(plantId, currentHealth);
        this.refreshPlantVisual(plantId);
      }
    }

    // Clean up visuals for plants that no longer exist
    for (const [plantId] of this.plantVisuals) {
      if (!this.plantSystem.getPlant(plantId)) {
        this.removePlantVisual(plantId);
      }
    }
  }

  destroy(): void {
    for (const [, visual] of this.plantVisuals) {
      visual.destroy({ children: true });
    }
    this.plantVisuals.clear();
    this.swayPhases.clear();
    this.plantBaseX.clear();
    this.plantHealthCache.clear();
    this.visualStateCache.clear();
    this.synergyShimmerPhases.clear();
    this.maturityGlows.clear();
    this.plantVisualLayer.destroy({ children: true });
  }

  // ─── Drawing Methods ─────────────────────────────────────────────────

  /**
   * Draw plant shape per growth stage — unique visual identity per plant.
   * Uses cache key to skip redundant redraws.
   */
  private drawPlantShape(gfx: Graphics, plantId: string, stage: GrowthStage, health: number): void {
    // Check cache to avoid redundant redraws
    const healthBucket = Math.floor(health / 10) * 10;
    const cacheKey = makeCacheKey(plantId, stage, healthBucket, this.currentSeason);
    const existingKey = this.visualStateCache.get(plantId);
    if (existingKey === cacheKey) return;
    this.visualStateCache.set(plantId, cacheKey);

    gfx.clear();

    const visualDef = getPlantVisual(plantId);
    if (!visualDef) {
      this.drawFallbackShape(gfx, stage);
      return;
    }

    const keyframe = getStageKeyframe(plantId, stage);
    const baseSize = ANIMATION.PLANT_SIZE_MATURE;
    const shapeData = getShapeData(visualDef, stage, baseSize);

    // Apply accessibility + seasonal saturation + seasonal color temperature shift
    const palette = getSeasonalPalette(this.currentSeason);
    const satFactor = palette.plantSaturation;
    const shiftColor = palette.plantColorShift;
    const shiftIntensity = palette.plantColorShiftIntensity;

    const baseColor = lerpColor(
      adjustSaturation(adjustColorForAccessibility(visualDef.baseColor), satFactor),
      shiftColor, shiftIntensity,
    );
    const accentColor = lerpColor(
      adjustSaturation(adjustColorForAccessibility(visualDef.accentColor), satFactor),
      shiftColor, shiftIntensity,
    );
    const detailColor = visualDef.detailColor
      ? lerpColor(
          adjustSaturation(adjustColorForAccessibility(visualDef.detailColor), satFactor),
          shiftColor, shiftIntensity,
        )
      : accentColor;

    const mainColor = adjustColorForHealth(baseColor, health);
    const accColor = adjustColorForHealth(accentColor, health);
    const detColor = adjustColorForHealth(detailColor, health);

    const alpha = keyframe.alpha * (health > 50 ? 1.0 : 0.7);

    // Harvest-ready glow on ALL mature plants; stronger glow for glowOnMature species
    if (stage === GrowthStage.MATURE && health > 70) {
      const glowAlpha = visualDef.glowOnMature ? 0.4 : 0.2;
      const glowRadius = shapeData.mainRadius + (visualDef.glowOnMature ? 6 : 4);
      gfx.circle(0, keyframe.yOffset, glowRadius);
      gfx.fill({ color: accColor, alpha: glowAlpha });
    }

    switch (stage) {
      case GrowthStage.SEED:
        this.drawSeedShape(gfx, visualDef, shapeData, mainColor, accColor, alpha);
        break;
      case GrowthStage.SPROUT:
        this.drawSproutShape(gfx, visualDef, shapeData, mainColor, accColor, detColor, alpha, keyframe.yOffset);
        break;
      case GrowthStage.GROWING:
        this.drawGrowingShape(gfx, visualDef, shapeData, mainColor, accColor, detColor, alpha, keyframe.yOffset);
        break;
      case GrowthStage.MATURE:
        this.drawMatureShape(gfx, visualDef, shapeData, mainColor, accColor, detColor, alpha, keyframe.yOffset);
        break;
      case GrowthStage.WILTING:
        this.drawWiltingShape(gfx, visualDef, shapeData, mainColor, accColor, detColor, alpha, keyframe.yOffset);
        break;
    }
  }

  private drawFallbackShape(gfx: Graphics, stage: GrowthStage): void {
    const sizeMap: Record<string, number> = {
      [GrowthStage.SEED]: ANIMATION.PLANT_SIZE_SEED,
      [GrowthStage.SPROUT]: ANIMATION.PLANT_SIZE_SPROUT,
      [GrowthStage.GROWING]: ANIMATION.PLANT_SIZE_GROWING,
      [GrowthStage.MATURE]: ANIMATION.PLANT_SIZE_MATURE,
      [GrowthStage.WILTING]: ANIMATION.PLANT_SIZE_WILTING,
    };
    const radius = sizeMap[stage] ?? ANIMATION.PLANT_SIZE_SEED;
    const colors = PLANT_STAGE_COLORS[stage] ?? PLANT_STAGE_COLORS.seed;

    gfx.circle(0, 0, radius);
    gfx.fill({ color: colors[0] });

    if (radius > 5) {
      gfx.circle(-radius * 0.2, -radius * 0.2, radius * 0.4);
      gfx.fill({ color: colors[1], alpha: 0.5 });
    }
  }

  // ─── Shape Primitives ────────────────────────────────────────────────

  private drawEllipse(
    gfx: Graphics,
    shape: PlantShapeData,
    mainColor: number,
    accentColor: number,
    alpha: number,
    yOffset: number,
  ): void {
    gfx.ellipse(0, yOffset, shape.mainRadius, shape.mainRadius / shape.aspectRatio);
    gfx.fill({ color: mainColor, alpha });

    if (shape.mainRadius > 5) {
      const highlightSize = shape.mainRadius * 0.35;
      gfx.ellipse(
        -shape.mainRadius * 0.2,
        yOffset - shape.mainRadius * 0.2,
        highlightSize,
        highlightSize / shape.aspectRatio,
      );
      gfx.fill({ color: accentColor, alpha: alpha * 0.6 });
    }
  }

  private drawFlower(
    gfx: Graphics,
    shape: PlantShapeData,
    mainColor: number,
    _accentColor: number,
    detailColor: number,
    alpha: number,
    yOffset: number,
  ): void {
    const petalCount = shape.petals ?? 6;
    const petalRadius = shape.mainRadius * 0.5;
    const centerRadius = shape.secondaryRadius ?? shape.mainRadius * 0.3;

    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      const x = Math.cos(angle) * shape.mainRadius * 0.6;
      const y = yOffset + Math.sin(angle) * shape.mainRadius * 0.6;
      gfx.circle(x, y, petalRadius);
      gfx.fill({ color: mainColor, alpha });
    }

    gfx.circle(0, yOffset, centerRadius);
    gfx.fill({ color: detailColor, alpha });
  }

  private drawStar(
    gfx: Graphics,
    shape: PlantShapeData,
    mainColor: number,
    accentColor: number,
    alpha: number,
    yOffset: number,
  ): void {
    const points = shape.petals ?? 5;
    const outerRadius = shape.mainRadius;
    const innerRadius = shape.secondaryRadius ?? shape.mainRadius * 0.5;

    gfx.moveTo(0, yOffset - outerRadius);

    for (let i = 0; i <= points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = yOffset + Math.sin(angle) * radius;
      gfx.lineTo(x, y);
    }

    gfx.fill({ color: mainColor, alpha });

    gfx.circle(0, yOffset, innerRadius * 0.5);
    gfx.fill({ color: accentColor, alpha: alpha * 0.8 });
  }

  private drawBush(
    gfx: Graphics,
    shape: PlantShapeData,
    mainColor: number,
    accentColor: number,
    alpha: number,
    yOffset: number,
  ): void {
    const clusters = 5;
    for (let i = 0; i < clusters; i++) {
      const angle = (i / clusters) * Math.PI * 2;
      const offset = shape.mainRadius * 0.4;
      const x = Math.cos(angle) * offset;
      const y = yOffset + Math.sin(angle) * offset;
      const clusterSize = shape.secondaryRadius ?? shape.mainRadius * 0.7;

      gfx.circle(x, y, clusterSize);
      gfx.fill({ color: i % 2 === 0 ? mainColor : accentColor, alpha });
    }

    gfx.circle(0, yOffset, shape.mainRadius * 0.6);
    gfx.fill({ color: mainColor, alpha });
  }

  private drawRoot(
    gfx: Graphics,
    shape: PlantShapeData,
    mainColor: number,
    accentColor: number,
    alpha: number,
    yOffset: number,
  ): void {
    gfx.ellipse(0, yOffset + shape.mainRadius * 0.3, shape.mainRadius, shape.mainRadius * 0.6);
    gfx.fill({ color: mainColor, alpha });

    const frondCount = 3;
    for (let i = 0; i < frondCount; i++) {
      const xOffset = (i - 1) * shape.mainRadius * 0.4;
      gfx.ellipse(xOffset, yOffset - shape.mainRadius * 0.5, shape.mainRadius * 0.3, shape.mainRadius * 0.8);
      gfx.fill({ color: accentColor, alpha });
    }
  }

  // ─── Growth Stage Shapes ─────────────────────────────────────────────

  /** Seed: small mound with species-specific seed shape hint */
  private drawSeedShape(
    gfx: Graphics,
    visualDef: PlantVisualDef,
    shape: PlantShapeData,
    mainColor: number,
    _accentColor: number,
    alpha: number,
  ): void {
    const seedSize = Math.max(shape.mainRadius, 3);

    // Soil mound
    gfx.ellipse(0, 2, seedSize * 1.4, seedSize * 0.5);
    gfx.fill({ color: COLORS.SOIL_LIGHT, alpha: alpha * 0.5 });

    // Species-specific seed shape
    switch (visualDef.seedShape) {
      case 'oval':
        gfx.ellipse(0, 0, seedSize * 0.9, seedSize * 0.6);
        gfx.fill({ color: COLORS.SEED_SHELL, alpha });
        gfx.ellipse(0, -seedSize * 0.1, seedSize * 0.5, seedSize * 0.3);
        gfx.fill({ color: mainColor, alpha: alpha * 0.5 });
        break;
      case 'flat':
        gfx.ellipse(0, 0, seedSize * 1.1, seedSize * 0.45);
        gfx.fill({ color: COLORS.SEED_SHELL, alpha });
        gfx.ellipse(0, -seedSize * 0.05, seedSize * 0.6, seedSize * 0.2);
        gfx.fill({ color: mainColor, alpha: alpha * 0.45 });
        break;
      case 'pointed':
        // Teardrop-shaped seed
        gfx.moveTo(0, -seedSize * 0.7);
        gfx.lineTo(seedSize * 0.5, seedSize * 0.3);
        gfx.lineTo(-seedSize * 0.5, seedSize * 0.3);
        gfx.closePath();
        gfx.fill({ color: COLORS.SEED_SHELL, alpha });
        gfx.circle(0, seedSize * 0.05, seedSize * 0.3);
        gfx.fill({ color: mainColor, alpha: alpha * 0.4 });
        break;
      default: // 'round'
        gfx.circle(0, 0, seedSize);
        gfx.fill({ color: COLORS.SEED_SHELL, alpha });
        gfx.circle(0, -seedSize * 0.15, seedSize * 0.45);
        gfx.fill({ color: mainColor, alpha: alpha * 0.4 });
        break;
    }
  }

  /** Sprout: species-specific stem + cotyledon leaves */
  private drawSproutShape(
    gfx: Graphics,
    visualDef: PlantVisualDef,
    shape: PlantShapeData,
    mainColor: number,
    accentColor: number,
    _detailColor: number,
    alpha: number,
    yOffset: number,
  ): void {
    const stemHeight = shape.mainRadius * 1.6;
    const stemWidthMap = { thin: 1.2, medium: 1.8, thick: 2.4 };
    const stemWidth = Math.max(shape.mainRadius * 0.2, stemWidthMap[visualDef.stemStyle]);

    // Stem
    gfx.rect(-stemWidth / 2, yOffset, stemWidth, stemHeight);
    gfx.fill({ color: accentColor, alpha });

    // Cotyledon leaves — shape varies by leafShape
    const leafW = shape.mainRadius * 0.4;
    const leafH = shape.mainRadius * 0.2;
    switch (visualDef.leafShape) {
      case 'pointed':
        // Pointed cotyledons (triangular tips)
        gfx.moveTo(-leafW * 2, yOffset + stemHeight * 0.3);
        gfx.lineTo(-leafW * 0.5, yOffset + stemHeight * 0.25);
        gfx.lineTo(-leafW * 0.8, yOffset + stemHeight * 0.4);
        gfx.closePath();
        gfx.fill({ color: mainColor, alpha });
        gfx.moveTo(leafW * 2, yOffset + stemHeight * 0.15);
        gfx.lineTo(leafW * 0.5, yOffset + stemHeight * 0.12);
        gfx.lineTo(leafW * 0.8, yOffset + stemHeight * 0.3);
        gfx.closePath();
        gfx.fill({ color: mainColor, alpha: alpha * 0.9 });
        break;
      case 'narrow':
        // Narrow elongated cotyledons
        gfx.ellipse(-leafW * 0.8, yOffset + stemHeight * 0.3, leafW * 0.2, leafH * 1.8);
        gfx.fill({ color: mainColor, alpha });
        gfx.ellipse(leafW * 0.8, yOffset + stemHeight * 0.15, leafW * 0.18, leafH * 1.6);
        gfx.fill({ color: mainColor, alpha: alpha * 0.9 });
        break;
      case 'serrated':
        // Round cotyledons with a notch (serrated hint)
        gfx.ellipse(-leafW, yOffset + stemHeight * 0.3, leafW, leafH);
        gfx.fill({ color: mainColor, alpha });
        gfx.ellipse(-leafW * 1.1, yOffset + stemHeight * 0.3, leafW * 0.15, leafH * 0.8);
        gfx.fill({ color: accentColor, alpha: alpha * 0.5 });
        gfx.ellipse(leafW, yOffset + stemHeight * 0.15, leafW * 0.9, leafH * 0.9);
        gfx.fill({ color: mainColor, alpha: alpha * 0.9 });
        break;
      default: // 'round'
        gfx.ellipse(-leafW, yOffset + stemHeight * 0.3, leafW, leafH);
        gfx.fill({ color: mainColor, alpha });
        gfx.ellipse(leafW, yOffset + stemHeight * 0.15, leafW * 0.9, leafH * 0.9);
        gfx.fill({ color: mainColor, alpha: alpha * 0.9 });
        break;
    }

    // Growing tip
    gfx.circle(0, yOffset - shape.mainRadius * 0.15, shape.mainRadius * 0.25);
    gfx.fill({ color: accentColor, alpha: alpha * 0.8 });
  }

  /** Growing: intermediate form developing toward mature shape dispatched by plant family */
  private drawGrowingShape(
    gfx: Graphics,
    visualDef: PlantVisualDef,
    shape: PlantShapeData,
    mainColor: number,
    accentColor: number,
    detailColor: number,
    alpha: number,
    yOffset: number,
  ): void {
    const r = shape.mainRadius;
    const stemWidthMap = { thin: 1.2, medium: 1.8, thick: 2.4 };
    const stemHeight = r * 1.2;
    const stemWidth = Math.max(r * 0.18, stemWidthMap[visualDef.stemStyle]);
    gfx.rect(-stemWidth / 2, yOffset + r * 0.3, stemWidth, stemHeight);
    gfx.fill({ color: accentColor, alpha: alpha * 0.8 });

    switch (visualDef.plantFamily) {
      case 'flower': {
        // Developing bud with partial petals radiating from center
        const petalCount = Math.max(3, (shape.petals ?? 6) - 2);
        const petalRadius = r * 0.35;
        for (let i = 0; i < petalCount; i++) {
          const angle = (i / petalCount) * Math.PI * 2;
          const x = Math.cos(angle) * r * 0.4;
          const y = yOffset + Math.sin(angle) * r * 0.4;
          gfx.circle(x, y, petalRadius);
          gfx.fill({ color: mainColor, alpha: alpha * 0.8 });
        }
        gfx.circle(0, yOffset, r * 0.25);
        gfx.fill({ color: detailColor, alpha: alpha * 0.9 });
        // Stem leaf
        this.drawLeaf(gfx, visualDef.leafShape, r * 0.4, yOffset + r * 0.5, r * 0.3, accentColor, alpha * 0.7);
        break;
      }
      case 'herb': {
        // Small paired leaves along stem + growing tip
        const pairs = Math.min(visualDef.leafCount, 4);
        for (let i = 0; i < pairs; i++) {
          const ly = yOffset + r * 0.3 + (i / pairs) * stemHeight * 0.8;
          const side = i % 2 === 0 ? 1 : -1;
          this.drawLeaf(gfx, visualDef.leafShape, side * r * 0.3, ly, r * 0.25, mainColor, alpha * 0.8);
        }
        gfx.circle(0, yOffset - r * 0.1, r * 0.18);
        gfx.fill({ color: detailColor, alpha: alpha * 0.7 });
        break;
      }
      case 'vegetable': {
        // Small developing fruit + leaves around it
        gfx.circle(0, yOffset, r * 0.4);
        gfx.fill({ color: mainColor, alpha: alpha * 0.7 });
        for (let i = 0; i < 3; i++) {
          const angle = ((i / 3) * Math.PI) - Math.PI / 2;
          const lx = Math.cos(angle) * r * 0.5;
          const ly = yOffset + Math.sin(angle) * r * 0.35;
          this.drawLeaf(gfx, visualDef.leafShape, lx, ly, r * 0.3, accentColor, alpha * 0.7);
        }
        break;
      }
      case 'root_veg': {
        // Root emerging from soil + developing fronds above
        gfx.moveTo(0, yOffset + r * 0.8);
        gfx.lineTo(r * 0.25, yOffset + r * 0.2);
        gfx.lineTo(-r * 0.25, yOffset + r * 0.2);
        gfx.closePath();
        gfx.fill({ color: mainColor, alpha: alpha * 0.8 });
        for (let i = 0; i < 3; i++) {
          const fx = (i - 1) * r * 0.2;
          gfx.ellipse(fx, yOffset - r * 0.1, r * 0.06, r * 0.35);
          gfx.fill({ color: accentColor, alpha: alpha * 0.7 });
        }
        break;
      }
      case 'leafy': {
        // Developing rosette of overlapping leaves
        const leafCount = Math.min(visualDef.leafCount, 5);
        for (let i = 0; i < leafCount; i++) {
          const angle = (i / leafCount) * Math.PI * 2;
          const lx = Math.cos(angle) * r * 0.25;
          const ly = yOffset + Math.sin(angle) * r * 0.2;
          gfx.ellipse(lx, ly, r * 0.4, r * 0.25);
          gfx.fill({ color: i % 2 === 0 ? mainColor : accentColor, alpha: alpha * 0.8 });
        }
        break;
      }
      case 'vine': {
        // Climbing stem with tendril curl + small leaves
        gfx.circle(r * 0.3, yOffset - r * 0.2, r * 0.15);
        gfx.stroke({ color: accentColor, alpha: alpha * 0.6, width: 1.5 });
        for (let i = 0; i < 3; i++) {
          const side = i % 2 === 0 ? 1 : -1;
          const ly = yOffset + r * 0.2 + i * r * 0.3;
          this.drawLeaf(gfx, visualDef.leafShape, side * r * 0.3, ly, r * 0.22, mainColor, alpha * 0.7);
        }
        break;
      }
      case 'tree': {
        // Developing trunk + small canopy ellipse
        gfx.rect(-r * 0.12, yOffset + r * 0.2, r * 0.24, r * 1.0);
        gfx.fill({ color: detailColor, alpha: alpha * 0.8 });
        gfx.ellipse(0, yOffset - r * 0.15, r * 0.5, r * 0.4);
        gfx.fill({ color: mainColor, alpha: alpha * 0.7 });
        break;
      }
      case 'berry': {
        // Bush forming with small berry hints
        const clusters = 3;
        for (let i = 0; i < clusters; i++) {
          const angle = (i / clusters) * Math.PI * 2;
          const x = Math.cos(angle) * r * 0.3;
          const y = yOffset + Math.sin(angle) * r * 0.3;
          gfx.circle(x, y, r * 0.4);
          gfx.fill({ color: accentColor, alpha: alpha * 0.75 });
        }
        gfx.circle(r * 0.15, yOffset - r * 0.05, r * 0.12);
        gfx.fill({ color: mainColor, alpha: alpha * 0.5 });
        break;
      }
      case 'melon': {
        // Vine sprawl with developing fruit
        gfx.ellipse(0, yOffset + r * 0.1, r * 0.55, r * 0.35);
        gfx.fill({ color: mainColor, alpha: alpha * 0.6 });
        this.drawLeaf(gfx, 'round', -r * 0.5, yOffset - r * 0.1, r * 0.3, accentColor, alpha * 0.7);
        gfx.circle(r * 0.3, yOffset - r * 0.2, r * 0.12);
        gfx.stroke({ color: accentColor, alpha: alpha * 0.5, width: 1.2 });
        break;
      }
      case 'exotic': {
        // Star-ish emerging shape with spiky hints
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
          const sx = Math.cos(angle) * r * 0.5;
          const sy = yOffset + Math.sin(angle) * r * 0.5;
          gfx.moveTo(0, yOffset);
          gfx.lineTo(sx, sy);
          gfx.stroke({ color: mainColor, alpha: alpha * 0.8, width: 2 });
        }
        gfx.circle(0, yOffset, r * 0.25);
        gfx.fill({ color: accentColor, alpha: alpha * 0.7 });
        break;
      }
      default: {
        // Generic ellipse with leaf ring
        gfx.ellipse(0, yOffset, r * 0.8, r * 0.7 / shape.aspectRatio);
        gfx.fill({ color: mainColor, alpha });
        const leafCount = Math.min(visualDef.leafCount, 4);
        for (let i = 0; i < leafCount; i++) {
          const angle = ((i / leafCount) * Math.PI) - Math.PI / 2;
          const lx = Math.cos(angle) * r * 0.5;
          const ly = yOffset + Math.sin(angle) * r * 0.3;
          this.drawLeaf(gfx, visualDef.leafShape, lx, ly, r * 0.3, accentColor, alpha * 0.7);
        }
        break;
      }
    }
  }

  /** Mature: full unique shape per plant species — 22 unique silhouettes dispatched by plantId */
  private drawMatureShape(
    gfx: Graphics,
    visualDef: PlantVisualDef,
    shape: PlantShapeData,
    mainColor: number,
    accentColor: number,
    detailColor: number,
    alpha: number,
    yOffset: number,
  ): void {
    const r = shape.mainRadius;

    switch (visualDef.plantId) {
      case 'tomato': {
        // Round red fruit + green calyx star on top + stem
        gfx.rect(-r * 0.06, yOffset - r * 0.5, r * 0.12, r * 0.5);
        gfx.fill({ color: accentColor, alpha: alpha * 0.8 });
        gfx.circle(0, yOffset + r * 0.15, r * 0.55);
        gfx.fill({ color: mainColor, alpha });
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
          const sx = Math.cos(angle) * r * 0.3;
          const sy = yOffset - r * 0.25 + Math.sin(angle) * r * 0.15;
          gfx.ellipse(sx, sy, r * 0.12, r * 0.06);
          gfx.fill({ color: accentColor, alpha: alpha * 0.9 });
        }
        break;
      }
      case 'lettuce': {
        // 4-ring layered rosette of overlapping leaves
        for (let ring = 4; ring >= 1; ring--) {
          const ringR = r * 0.25 * ring;
          const leaves = 5 + ring;
          for (let i = 0; i < leaves; i++) {
            const angle = (i / leaves) * Math.PI * 2 + ring * 0.3;
            const lx = Math.cos(angle) * ringR * 0.5;
            const ly = yOffset + Math.sin(angle) * ringR * 0.4;
            gfx.ellipse(lx, ly, ringR * 0.4, ringR * 0.28);
            gfx.fill({ color: ring % 2 === 0 ? mainColor : accentColor, alpha: alpha * (0.7 + ring * 0.05) });
          }
        }
        break;
      }
      case 'carrot': {
        // Orange tapered cone pointing down + 5 feathery green fronds above
        gfx.moveTo(0, yOffset + r * 1.0);
        gfx.lineTo(r * 0.3, yOffset);
        gfx.lineTo(-r * 0.3, yOffset);
        gfx.closePath();
        gfx.fill({ color: mainColor, alpha });
        for (let i = 0; i < 5; i++) {
          const fx = (i - 2) * r * 0.15;
          gfx.ellipse(fx, yOffset - r * 0.35, r * 0.05, r * 0.4);
          gfx.fill({ color: accentColor, alpha: alpha * 0.8 });
        }
        break;
      }
      case 'radish': {
        // Round pink bulb + tapering root tip + small leaf sprouts
        gfx.circle(0, yOffset + r * 0.1, r * 0.45);
        gfx.fill({ color: mainColor, alpha });
        gfx.moveTo(0, yOffset + r * 0.8);
        gfx.lineTo(r * 0.08, yOffset + r * 0.5);
        gfx.lineTo(-r * 0.08, yOffset + r * 0.5);
        gfx.closePath();
        gfx.fill({ color: mainColor, alpha: alpha * 0.7 });
        for (let i = 0; i < 3; i++) {
          const lx = (i - 1) * r * 0.2;
          gfx.ellipse(lx, yOffset - r * 0.3, r * 0.08, r * 0.2);
          gfx.fill({ color: accentColor, alpha: alpha * 0.8 });
        }
        break;
      }
      case 'pea': {
        // Vine stem + 3 pea pods with bumps inside + tendril curl
        gfx.rect(-r * 0.04, yOffset - r * 0.3, r * 0.08, r * 1.3);
        gfx.fill({ color: accentColor, alpha: alpha * 0.7 });
        for (let p = 0; p < 3; p++) {
          const py = yOffset + r * 0.1 + p * r * 0.35;
          gfx.ellipse(r * 0.2, py, r * 0.3, r * 0.12);
          gfx.fill({ color: mainColor, alpha });
          for (let b = 0; b < 3; b++) {
            gfx.circle(r * 0.1 + b * r * 0.1, py, r * 0.06);
            gfx.fill({ color: detailColor, alpha: alpha * 0.5 });
          }
        }
        gfx.circle(r * 0.25, yOffset - r * 0.35, r * 0.15);
        gfx.stroke({ color: accentColor, alpha: alpha * 0.6, width: 1.5 });
        break;
      }
      case 'sunflower': {
        // Thick stem + elongated golden petals radiating + brown center disk
        gfx.rect(-r * 0.1, yOffset + r * 0.3, r * 0.2, r * 1.0);
        gfx.fill({ color: accentColor, alpha: alpha * 0.8 });
        const petalCount = visualDef.leafCount;
        for (let i = 0; i < petalCount; i++) {
          const angle = (i / petalCount) * Math.PI * 2;
          const px = Math.cos(angle) * r * 0.45;
          const py = yOffset + Math.sin(angle) * r * 0.45;
          gfx.ellipse(px, py, r * 0.12, r * 0.35);
          gfx.fill({ color: mainColor, alpha });
        }
        gfx.circle(0, yOffset, r * 0.3);
        gfx.fill({ color: detailColor || accentColor, alpha });
        break;
      }
      case 'mint': {
        // Central stem + 4 pairs of serrated leaves at increasing spread
        gfx.rect(-r * 0.05, yOffset - r * 0.2, r * 0.1, r * 1.2);
        gfx.fill({ color: accentColor, alpha: alpha * 0.8 });
        for (let i = 0; i < 4; i++) {
          const ly = yOffset + r * 0.7 - i * r * 0.25;
          const spread = r * (0.2 + i * 0.1);
          this.drawLeaf(gfx, 'serrated', spread, ly, r * 0.3, mainColor, alpha * 0.85);
          this.drawLeaf(gfx, 'serrated', -spread, ly, r * 0.3, mainColor, alpha * 0.85);
        }
        break;
      }
      case 'pepper': {
        // Bell body (wide ellipse) + 3 lobe ridges + stem on top
        gfx.rect(-r * 0.05, yOffset - r * 0.5, r * 0.1, r * 0.35);
        gfx.fill({ color: accentColor, alpha: alpha * 0.8 });
        gfx.ellipse(0, yOffset + r * 0.15, r * 0.45, r * 0.55);
        gfx.fill({ color: mainColor, alpha });
        for (let i = 0; i < 3; i++) {
          const lx = (i - 1) * r * 0.2;
          gfx.ellipse(lx, yOffset + r * 0.15, r * 0.08, r * 0.45);
          gfx.fill({ color: detailColor, alpha: alpha * 0.2 });
        }
        break;
      }
      case 'basil': {
        // Compact dome of 3 pairs of large round leaves + top bud
        gfx.rect(-r * 0.06, yOffset + r * 0.1, r * 0.12, r * 0.8);
        gfx.fill({ color: accentColor, alpha: alpha * 0.7 });
        for (let i = 0; i < 3; i++) {
          const ly = yOffset + r * 0.5 - i * r * 0.25;
          const spread = r * (0.35 - i * 0.05);
          gfx.ellipse(spread, ly, r * 0.25, r * 0.18);
          gfx.fill({ color: mainColor, alpha: alpha * 0.85 });
          gfx.ellipse(-spread, ly, r * 0.25, r * 0.18);
          gfx.fill({ color: mainColor, alpha: alpha * 0.85 });
        }
        gfx.circle(0, yOffset - r * 0.1, r * 0.12);
        gfx.fill({ color: detailColor || accentColor, alpha: alpha * 0.7 });
        break;
      }
      case 'cucumber': {
        // Elongated vertical oval + lighter stripe ellipses + vine curl + blossom end
        gfx.ellipse(0, yOffset + r * 0.1, r * 0.3, r * 0.7);
        gfx.fill({ color: mainColor, alpha });
        for (let i = 0; i < 3; i++) {
          gfx.ellipse(r * 0.05, yOffset - r * 0.2 + i * r * 0.3, r * 0.06, r * 0.18);
          gfx.fill({ color: accentColor, alpha: alpha * 0.4 });
        }
        gfx.circle(r * 0.35, yOffset - r * 0.5, r * 0.12);
        gfx.stroke({ color: accentColor, alpha: alpha * 0.5, width: 1.2 });
        gfx.circle(0, yOffset + r * 0.75, r * 0.08);
        gfx.fill({ color: detailColor, alpha: alpha * 0.6 });
        break;
      }
      case 'blueberry': {
        // Branch + leaf backdrop + 5 dark berry circles with crown dots
        gfx.rect(-r * 0.05, yOffset, r * 0.1, r * 0.8);
        gfx.fill({ color: accentColor, alpha: alpha * 0.7 });
        gfx.ellipse(0, yOffset - r * 0.1, r * 0.6, r * 0.45);
        gfx.fill({ color: accentColor, alpha: alpha * 0.4 });
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2;
          const bx = Math.cos(angle) * r * 0.3;
          const by = yOffset + Math.sin(angle) * r * 0.25;
          gfx.circle(bx, by, r * 0.13);
          gfx.fill({ color: mainColor, alpha });
          gfx.circle(bx, by - r * 0.08, r * 0.03);
          gfx.fill({ color: detailColor, alpha: alpha * 0.6 });
        }
        break;
      }
      case 'frost_willow': {
        // Thick trunk + 5 drooping branch ellipses + canopy crown + 3 diamond ice crystals
        gfx.rect(-r * 0.12, yOffset + r * 0.2, r * 0.24, r * 1.0);
        gfx.fill({ color: detailColor, alpha: alpha * 0.8 });
        gfx.ellipse(0, yOffset - r * 0.2, r * 0.65, r * 0.35);
        gfx.fill({ color: mainColor, alpha: alpha * 0.6 });
        for (let i = 0; i < 5; i++) {
          const bx = (i - 2) * r * 0.25;
          gfx.ellipse(bx, yOffset + r * 0.05, r * 0.1, r * 0.45);
          gfx.fill({ color: accentColor, alpha: alpha * 0.5 });
        }
        for (let i = 0; i < 3; i++) {
          const dx = (i - 1) * r * 0.35;
          const dy = yOffset - r * 0.35;
          gfx.moveTo(dx, dy - r * 0.1);
          gfx.lineTo(dx + r * 0.06, dy);
          gfx.lineTo(dx, dy + r * 0.1);
          gfx.lineTo(dx - r * 0.06, dy);
          gfx.closePath();
          gfx.fill({ color: 0xb3e5fc, alpha: alpha * 0.7 });
        }
        break;
      }
      case 'lavender': {
        // Thin stem + narrow base leaves + vertical spike of 7 tiny flower circles
        gfx.rect(-r * 0.03, yOffset - r * 0.3, r * 0.06, r * 1.3);
        gfx.fill({ color: accentColor, alpha: alpha * 0.7 });
        this.drawLeaf(gfx, 'narrow', -r * 0.15, yOffset + r * 0.5, r * 0.3, accentColor, alpha * 0.6);
        this.drawLeaf(gfx, 'narrow', r * 0.15, yOffset + r * 0.5, r * 0.3, accentColor, alpha * 0.6);
        for (let i = 0; i < 7; i++) {
          const fy = yOffset - r * 0.3 + i * r * 0.12;
          gfx.circle(0, fy, r * 0.08);
          gfx.fill({ color: mainColor, alpha: alpha * (0.6 + i * 0.05) });
        }
        break;
      }
      case 'orchid': {
        // Thin stem + 3 outer sepal ellipses + 2 inner petal ellipses + central lip + detail dot
        gfx.rect(-r * 0.03, yOffset + r * 0.3, r * 0.06, r * 0.7);
        gfx.fill({ color: accentColor, alpha: alpha * 0.7 });
        for (let i = 0; i < 3; i++) {
          const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
          const sx = Math.cos(angle) * r * 0.45;
          const sy = yOffset + Math.sin(angle) * r * 0.35;
          gfx.ellipse(sx, sy, r * 0.18, r * 0.35);
          gfx.fill({ color: accentColor, alpha: alpha * 0.7 });
        }
        gfx.ellipse(-r * 0.2, yOffset - r * 0.05, r * 0.22, r * 0.3);
        gfx.fill({ color: mainColor, alpha: alpha * 0.85 });
        gfx.ellipse(r * 0.2, yOffset - r * 0.05, r * 0.22, r * 0.3);
        gfx.fill({ color: mainColor, alpha: alpha * 0.85 });
        gfx.ellipse(0, yOffset + r * 0.15, r * 0.15, r * 0.22);
        gfx.fill({ color: detailColor, alpha: alpha * 0.9 });
        gfx.circle(0, yOffset + r * 0.1, r * 0.05);
        gfx.fill({ color: 0xffffff, alpha: alpha * 0.7 });
        break;
      }
      case 'venus_flytrap': {
        // 2 stems + upper jaw + lower jaw + inner mouth + 5 white teeth triangles + smaller secondary trap
        gfx.rect(-r * 0.06, yOffset + r * 0.2, r * 0.08, r * 0.8);
        gfx.fill({ color: accentColor, alpha: alpha * 0.8 });
        gfx.rect(r * 0.15, yOffset + r * 0.3, r * 0.06, r * 0.6);
        gfx.fill({ color: accentColor, alpha: alpha * 0.7 });
        // Upper jaw
        gfx.arc(0, yOffset, r * 0.4, Math.PI, 0);
        gfx.fill({ color: mainColor, alpha });
        // Lower jaw
        gfx.arc(0, yOffset + r * 0.05, r * 0.38, 0, Math.PI);
        gfx.fill({ color: detailColor, alpha: alpha * 0.9 });
        // Inner mouth
        gfx.ellipse(0, yOffset + r * 0.02, r * 0.25, r * 0.1);
        gfx.fill({ color: accentColor, alpha: alpha * 0.6 });
        // 5 white teeth
        for (let i = 0; i < 5; i++) {
          const tx = -r * 0.3 + i * r * 0.15;
          gfx.moveTo(tx, yOffset - r * 0.02);
          gfx.lineTo(tx + r * 0.04, yOffset + r * 0.08);
          gfx.lineTo(tx - r * 0.04, yOffset + r * 0.08);
          gfx.closePath();
          gfx.fill({ color: 0xffffff, alpha: alpha * 0.8 });
        }
        // Smaller secondary trap
        gfx.arc(r * 0.18, yOffset + r * 0.25, r * 0.18, Math.PI, 0);
        gfx.fill({ color: mainColor, alpha: alpha * 0.6 });
        gfx.arc(r * 0.18, yOffset + r * 0.28, r * 0.16, 0, Math.PI);
        gfx.fill({ color: detailColor, alpha: alpha * 0.5 });
        break;
      }
      case 'heirloom_squash': {
        // Vine tendril arc + stem + wide oval body + 4 vertical rib ellipses
        gfx.circle(-r * 0.5, yOffset - r * 0.3, r * 0.2);
        gfx.stroke({ color: accentColor, alpha: alpha * 0.5, width: 1.5 });
        gfx.rect(-r * 0.05, yOffset - r * 0.4, r * 0.1, r * 0.3);
        gfx.fill({ color: accentColor, alpha: alpha * 0.8 });
        gfx.ellipse(0, yOffset + r * 0.15, r * 0.6, r * 0.45);
        gfx.fill({ color: mainColor, alpha });
        for (let i = 0; i < 4; i++) {
          const rx = -r * 0.3 + i * r * 0.2;
          gfx.ellipse(rx, yOffset + r * 0.15, r * 0.06, r * 0.38);
          gfx.fill({ color: detailColor, alpha: alpha * 0.25 });
        }
        break;
      }
      case 'golden_marigold': {
        // Stem + leaves + outer ring of leafCount circles + inner ring of 8 circles + center
        gfx.rect(-r * 0.06, yOffset + r * 0.3, r * 0.12, r * 0.7);
        gfx.fill({ color: accentColor, alpha: alpha * 0.8 });
        this.drawLeaf(gfx, visualDef.leafShape, -r * 0.35, yOffset + r * 0.5, r * 0.3, accentColor, alpha * 0.7);
        this.drawLeaf(gfx, visualDef.leafShape, r * 0.35, yOffset + r * 0.5, r * 0.3, accentColor, alpha * 0.7);
        const outerCount = visualDef.leafCount;
        for (let i = 0; i < outerCount; i++) {
          const angle = (i / outerCount) * Math.PI * 2;
          const px = Math.cos(angle) * r * 0.5;
          const py = yOffset + Math.sin(angle) * r * 0.5;
          gfx.circle(px, py, r * 0.14);
          gfx.fill({ color: mainColor, alpha });
        }
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const px = Math.cos(angle) * r * 0.28;
          const py = yOffset + Math.sin(angle) * r * 0.28;
          gfx.circle(px, py, r * 0.1);
          gfx.fill({ color: detailColor, alpha: alpha * 0.85 });
        }
        gfx.circle(0, yOffset, r * 0.15);
        gfx.fill({ color: detailColor, alpha });
        break;
      }
      case 'ghost_pepper': {
        // Stem + oval body + 3 wrinkle bump circles + pointed tip triangle + shimmer dots
        gfx.rect(-r * 0.04, yOffset - r * 0.5, r * 0.08, r * 0.4);
        gfx.fill({ color: accentColor, alpha: alpha * 0.8 });
        gfx.ellipse(0, yOffset + r * 0.05, r * 0.3, r * 0.5);
        gfx.fill({ color: mainColor, alpha });
        for (let i = 0; i < 3; i++) {
          const by = yOffset - r * 0.1 + i * r * 0.2;
          gfx.circle(r * 0.15, by, r * 0.08);
          gfx.fill({ color: detailColor, alpha: alpha * 0.35 });
        }
        gfx.moveTo(0, yOffset + r * 0.7);
        gfx.lineTo(r * 0.08, yOffset + r * 0.5);
        gfx.lineTo(-r * 0.08, yOffset + r * 0.5);
        gfx.closePath();
        gfx.fill({ color: mainColor, alpha: alpha * 0.9 });
        for (let i = 0; i < 4; i++) {
          gfx.circle(r * 0.1 * (i % 2 === 0 ? 1 : -1), yOffset + r * 0.1 * i - r * 0.15, r * 0.025);
          gfx.fill({ color: 0xffffff, alpha: alpha * 0.3 });
        }
        break;
      }
      case 'moonflower': {
        // Vine stem + leaf + 5 star-petals (elongated ellipses) + luminous center + white inner glow
        gfx.rect(-r * 0.04, yOffset + r * 0.3, r * 0.08, r * 0.7);
        gfx.fill({ color: accentColor, alpha: alpha * 0.7 });
        this.drawLeaf(gfx, 'round', -r * 0.3, yOffset + r * 0.5, r * 0.3, accentColor, alpha * 0.6);
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
          const px = Math.cos(angle) * r * 0.25;
          const py = yOffset + Math.sin(angle) * r * 0.25;
          gfx.ellipse(px, py, r * 0.12, r * 0.4);
          gfx.fill({ color: mainColor, alpha: alpha * 0.85 });
        }
        gfx.circle(0, yOffset, r * 0.2);
        gfx.fill({ color: detailColor, alpha: alpha * 0.9 });
        gfx.circle(0, yOffset, r * 0.1);
        gfx.fill({ color: 0xffffff, alpha: alpha * 0.5 });
        break;
      }
      case 'strawberry': {
        // Spreading runner + 3 trifoliate leaves + 3 berries (circle + triangle + seed dots)
        gfx.rect(-r * 0.6, yOffset + r * 0.6, r * 1.2, r * 0.05);
        gfx.fill({ color: accentColor, alpha: alpha * 0.5 });
        for (let i = 0; i < 3; i++) {
          const lx = (i - 1) * r * 0.35;
          const ly = yOffset + r * 0.3;
          this.drawLeaf(gfx, 'serrated', lx - r * 0.08, ly, r * 0.2, accentColor, alpha * 0.7);
          this.drawLeaf(gfx, 'serrated', lx + r * 0.08, ly, r * 0.2, accentColor, alpha * 0.7);
          this.drawLeaf(gfx, 'serrated', lx, ly - r * 0.1, r * 0.2, accentColor, alpha * 0.7);
        }
        for (let i = 0; i < 3; i++) {
          const bx = (i - 1) * r * 0.35;
          const by = yOffset + r * 0.05;
          gfx.circle(bx, by, r * 0.15);
          gfx.fill({ color: mainColor, alpha });
          gfx.moveTo(bx, by + r * 0.22);
          gfx.lineTo(bx + r * 0.1, by);
          gfx.lineTo(bx - r * 0.1, by);
          gfx.closePath();
          gfx.fill({ color: mainColor, alpha: alpha * 0.9 });
          for (let s = 0; s < 3; s++) {
            gfx.circle(bx + (s - 1) * r * 0.06, by + r * 0.02, r * 0.02);
            gfx.fill({ color: detailColor, alpha: alpha * 0.6 });
          }
        }
        break;
      }
      case 'sage': {
        // Woody stem + 5 alternating elongated leaves with fuzzy dots + top bud cluster
        gfx.rect(-r * 0.06, yOffset - r * 0.1, r * 0.12, r * 1.1);
        gfx.fill({ color: detailColor, alpha: alpha * 0.6 });
        for (let i = 0; i < 5; i++) {
          const side = i % 2 === 0 ? 1 : -1;
          const ly = yOffset + r * 0.7 - i * r * 0.2;
          const lx = side * r * 0.25;
          gfx.ellipse(lx, ly, r * 0.12, r * 0.3);
          gfx.fill({ color: mainColor, alpha: alpha * 0.8 });
          gfx.circle(lx, ly, r * 0.03);
          gfx.fill({ color: accentColor, alpha: alpha * 0.3 });
        }
        for (let i = 0; i < 3; i++) {
          gfx.circle((i - 1) * r * 0.08, yOffset - r * 0.2, r * 0.06);
          gfx.fill({ color: accentColor, alpha: alpha * 0.7 });
        }
        break;
      }
      case 'watermelon': {
        // Vine runner + large oval body + 5 dark stripe ellipses + ground shadow + highlight
        gfx.rect(-r * 0.7, yOffset + r * 0.55, r * 1.4, r * 0.04);
        gfx.fill({ color: accentColor, alpha: alpha * 0.4 });
        // Ground shadow
        gfx.ellipse(0, yOffset + r * 0.55, r * 0.65, r * 0.08);
        gfx.fill({ color: 0x333333, alpha: alpha * 0.15 });
        gfx.ellipse(0, yOffset + r * 0.1, r * 0.6, r * 0.42);
        gfx.fill({ color: mainColor, alpha });
        for (let i = 0; i < 5; i++) {
          const sx = -r * 0.3 + i * r * 0.15;
          gfx.ellipse(sx, yOffset + r * 0.1, r * 0.04, r * 0.35);
          gfx.fill({ color: detailColor, alpha: alpha * 0.4 });
        }
        // Highlight
        gfx.ellipse(-r * 0.15, yOffset - r * 0.05, r * 0.15, r * 0.08);
        gfx.fill({ color: 0xffffff, alpha: alpha * 0.2 });
        break;
      }
      default:
        this.drawMatureShapeFallback(gfx, visualDef, shape, mainColor, accentColor, detailColor, alpha, yOffset);
        break;
    }
  }

  /** Fallback mature shape using matureShape categories */
  private drawMatureShapeFallback(
    gfx: Graphics,
    visualDef: PlantVisualDef,
    shape: PlantShapeData,
    mainColor: number,
    accentColor: number,
    detailColor: number,
    alpha: number,
    yOffset: number,
  ): void {
    switch (visualDef.matureShape) {
      case 'flower':
        this.drawFlower(gfx, shape, mainColor, accentColor, detailColor, alpha, yOffset);
        this.drawLeafRing(gfx, visualDef, shape, accentColor, alpha, yOffset + shape.mainRadius * 0.6, Math.min(visualDef.leafCount, 4));
        break;
      case 'star':
        this.drawStar(gfx, shape, mainColor, accentColor, alpha, yOffset);
        break;
      case 'bush':
        this.drawBush(gfx, shape, mainColor, accentColor, alpha, yOffset);
        if (visualDef.fruitSize > 0) {
          const fruitCount = Math.min(visualDef.leafCount, 5);
          for (let i = 0; i < fruitCount; i++) {
            const angle = (i / fruitCount) * Math.PI * 2 + 0.3;
            const dist = shape.mainRadius * 0.35;
            const fx = Math.cos(angle) * dist;
            const fy = yOffset + Math.sin(angle) * dist;
            gfx.circle(fx, fy, shape.mainRadius * 0.15 * visualDef.fruitSize);
            gfx.fill({ color: detailColor, alpha: alpha * 0.9 });
          }
        }
        break;
      case 'root':
        this.drawRoot(gfx, shape, mainColor, accentColor, alpha, yOffset);
        break;
      default:
        this.drawEllipse(gfx, shape, mainColor, accentColor, alpha, yOffset);
        this.drawLeafRing(gfx, visualDef, shape, accentColor, alpha, yOffset, Math.min(visualDef.leafCount, 6));
        if (visualDef.fruitSize > 0.5) {
          gfx.circle(shape.mainRadius * 0.3, yOffset - shape.mainRadius * 0.2, shape.mainRadius * 0.2 * visualDef.fruitSize);
          gfx.fill({ color: detailColor, alpha: alpha * 0.85 });
        }
        break;
    }
  }

  /** Wilting: desaturated colors, drooping posture */
  private drawWiltingShape(
    gfx: Graphics,
    visualDef: PlantVisualDef,
    shape: PlantShapeData,
    mainColor: number,
    accentColor: number,
    detailColor: number,
    alpha: number,
    yOffset: number,
  ): void {
    const gray = 0x808080;
    const wiltMain = lerpColor(mainColor, gray, 0.5);
    const wiltAccent = lerpColor(accentColor, gray, 0.5);
    const wiltDetail = lerpColor(detailColor, gray, 0.5);
    const wiltAlpha = alpha * 0.7;

    const stemHeight = shape.mainRadius * 0.8;
    const stemWidth = Math.max(shape.mainRadius * 0.15, 1.5);
    gfx.rect(-stemWidth / 2, yOffset + 2, stemWidth, stemHeight);
    gfx.fill({ color: wiltAccent, alpha: wiltAlpha * 0.6 });

    const droopOffset = yOffset + 3;
    switch (visualDef.matureShape) {
      case 'flower':
        this.drawFlower(gfx, shape, wiltMain, wiltAccent, wiltDetail, wiltAlpha, droopOffset);
        break;
      case 'star':
        this.drawStar(gfx, shape, wiltMain, wiltAccent, wiltAlpha, droopOffset);
        break;
      case 'bush':
        this.drawBush(gfx, shape, wiltMain, wiltAccent, wiltAlpha, droopOffset);
        break;
      case 'root':
        this.drawRoot(gfx, shape, wiltMain, wiltAccent, wiltAlpha, droopOffset);
        break;
      default:
        this.drawEllipse(gfx, shape, wiltMain, wiltAccent, wiltAlpha, droopOffset);
        break;
    }
  }

  // ─── Species-Specific Leaf Helpers ──────────────────────────────────

  /** Draw a single leaf at position, styled by leafShape */
  private drawLeaf(
    gfx: Graphics,
    leafShape: string,
    x: number,
    y: number,
    size: number,
    color: number,
    alpha: number,
  ): void {
    switch (leafShape) {
      case 'pointed':
        gfx.moveTo(x, y - size);
        gfx.lineTo(x + size * 0.4, y);
        gfx.lineTo(x - size * 0.4, y);
        gfx.closePath();
        gfx.fill({ color, alpha });
        break;
      case 'narrow':
        gfx.ellipse(x, y, size * 0.15, size * 0.8);
        gfx.fill({ color, alpha });
        break;
      case 'serrated':
        gfx.ellipse(x, y, size * 0.4, size * 0.25);
        gfx.fill({ color, alpha });
        // Serration nicks
        gfx.circle(x - size * 0.3, y, size * 0.08);
        gfx.fill({ color, alpha: alpha * 0.6 });
        gfx.circle(x + size * 0.3, y, size * 0.08);
        gfx.fill({ color, alpha: alpha * 0.6 });
        break;
      default: // 'round'
        gfx.ellipse(x, y, size * 0.35, size * 0.25);
        gfx.fill({ color, alpha });
        break;
    }
  }

  /** Draw a ring of species-specific leaves around a center point */
  private drawLeafRing(
    gfx: Graphics,
    visualDef: PlantVisualDef,
    shape: PlantShapeData,
    color: number,
    alpha: number,
    yCenter: number,
    count: number,
  ): void {
    const radius = shape.mainRadius * 0.75;
    const leafSize = shape.mainRadius * 0.35;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const lx = Math.cos(angle) * radius;
      const ly = yCenter + Math.sin(angle) * radius * 0.6;
      this.drawLeaf(gfx, visualDef.leafShape, lx, ly, leafSize, color, alpha * 0.7);
    }
  }
}
