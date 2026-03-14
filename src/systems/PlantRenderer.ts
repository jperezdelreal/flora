/**
 * TLDR: Dedicated rendering system for procedural plant visuals — 22 species × 5 growth stages
 * Decoupled from game logic: receives entity data, produces visuals.
 * Sprites cached per (plantType, growthStage, season) — no per-frame regeneration.
 */

import { Container, Graphics } from 'pixi.js';
import { GrowthStage } from '../entities/Plant';
import { Season } from '../config/seasons';
import { ANIMATION, PLANT_STAGE_COLORS } from '../config/animations';
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

      // Health-based visual refresh (only when health changes by >5%)
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
    gfx.fill({ color: 0x795548, alpha: alpha * 0.5 });

    // Species-specific seed shape
    switch (visualDef.seedShape) {
      case 'oval':
        gfx.ellipse(0, 0, seedSize * 0.9, seedSize * 0.6);
        gfx.fill({ color: 0x8d6e63, alpha });
        gfx.ellipse(0, -seedSize * 0.1, seedSize * 0.5, seedSize * 0.3);
        gfx.fill({ color: mainColor, alpha: alpha * 0.5 });
        break;
      case 'flat':
        gfx.ellipse(0, 0, seedSize * 1.1, seedSize * 0.45);
        gfx.fill({ color: 0x8d6e63, alpha });
        gfx.ellipse(0, -seedSize * 0.05, seedSize * 0.6, seedSize * 0.2);
        gfx.fill({ color: mainColor, alpha: alpha * 0.45 });
        break;
      case 'pointed':
        // Teardrop-shaped seed
        gfx.moveTo(0, -seedSize * 0.7);
        gfx.lineTo(seedSize * 0.5, seedSize * 0.3);
        gfx.lineTo(-seedSize * 0.5, seedSize * 0.3);
        gfx.closePath();
        gfx.fill({ color: 0x8d6e63, alpha });
        gfx.circle(0, seedSize * 0.05, seedSize * 0.3);
        gfx.fill({ color: mainColor, alpha: alpha * 0.4 });
        break;
      default: // 'round'
        gfx.circle(0, 0, seedSize);
        gfx.fill({ color: 0x8d6e63, alpha });
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

  /** Growing: intermediate form developing toward mature shape with species-specific leaves */
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
    const stemWidthMap = { thin: 1.2, medium: 1.8, thick: 2.4 };
    const stemHeight = shape.mainRadius * 1.2;
    const stemWidth = Math.max(shape.mainRadius * 0.18, stemWidthMap[visualDef.stemStyle]);
    gfx.rect(-stemWidth / 2, yOffset + shape.mainRadius * 0.3, stemWidth, stemHeight);
    gfx.fill({ color: accentColor, alpha: alpha * 0.8 });

    // Growing leaves — count and shape determined by species
    const growingLeafCount = Math.min(visualDef.leafCount, 4);

    if (visualDef.matureShape === 'flower') {
      const petalCount = Math.max(3, (shape.petals ?? 6) - 2);
      const petalRadius = shape.mainRadius * 0.35;
      for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2;
        const x = Math.cos(angle) * shape.mainRadius * 0.4;
        const y = yOffset + Math.sin(angle) * shape.mainRadius * 0.4;
        gfx.circle(x, y, petalRadius);
        gfx.fill({ color: mainColor, alpha: alpha * 0.8 });
      }
      gfx.circle(0, yOffset, shape.mainRadius * 0.25);
      gfx.fill({ color: detailColor, alpha: alpha * 0.9 });
    } else if (visualDef.matureShape === 'bush') {
      const clusters = Math.min(growingLeafCount, 3);
      for (let i = 0; i < clusters; i++) {
        const angle = (i / clusters) * Math.PI * 2;
        const x = Math.cos(angle) * shape.mainRadius * 0.3;
        const y = yOffset + Math.sin(angle) * shape.mainRadius * 0.3;
        gfx.circle(x, y, shape.mainRadius * 0.5);
        gfx.fill({ color: i % 2 === 0 ? mainColor : accentColor, alpha: alpha * 0.85 });
      }
      // Fruit preview for berry/strawberry bushes
      if (visualDef.fruitSize > 0.3) {
        gfx.circle(shape.mainRadius * 0.2, yOffset - shape.mainRadius * 0.1, shape.mainRadius * 0.15 * visualDef.fruitSize);
        gfx.fill({ color: detailColor, alpha: alpha * 0.5 });
      }
    } else if (visualDef.matureShape === 'root') {
      this.drawRoot(gfx, shape, mainColor, accentColor, alpha, yOffset);
    } else if (visualDef.matureShape === 'star') {
      gfx.circle(0, yOffset, shape.mainRadius * 0.6);
      gfx.fill({ color: mainColor, alpha });
      gfx.circle(0, yOffset, shape.mainRadius * 0.3);
      gfx.fill({ color: accentColor, alpha: alpha * 0.7 });
    } else {
      // Oval/circle/tall/wide: leaves arranged by species parameters
      gfx.ellipse(0, yOffset, shape.mainRadius * 0.8, shape.mainRadius * 0.7 / shape.aspectRatio);
      gfx.fill({ color: mainColor, alpha });
      for (let i = 0; i < growingLeafCount; i++) {
        const angle = ((i / growingLeafCount) * Math.PI) - Math.PI / 2;
        const lx = Math.cos(angle) * shape.mainRadius * 0.5;
        const ly = yOffset + Math.sin(angle) * shape.mainRadius * 0.3;
        this.drawLeaf(gfx, visualDef.leafShape, lx, ly, shape.mainRadius * 0.3, accentColor, alpha * 0.7);
      }
    }
  }

  /** Mature: full unique shape per plant species with fruit/flower detail and species leaves */
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
    switch (visualDef.matureShape) {
      case 'flower':
        this.drawFlower(gfx, shape, mainColor, accentColor, detailColor, alpha, yOffset);
        // Species-specific leaf ring around the base
        this.drawLeafRing(gfx, visualDef, shape, accentColor, alpha, yOffset + shape.mainRadius * 0.6, Math.min(visualDef.leafCount, 4));
        break;
      case 'star':
        this.drawStar(gfx, shape, mainColor, accentColor, alpha, yOffset);
        break;
      case 'bush':
        this.drawBush(gfx, shape, mainColor, accentColor, alpha, yOffset);
        // Fruit dots for berry/fruit-bearing bushes
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
        // Species-distinguishing leaves around oval/circle/tall/wide shapes
        this.drawLeafRing(gfx, visualDef, shape, accentColor, alpha, yOffset, Math.min(visualDef.leafCount, 6));
        // Fruit detail for fruit-bearing plants
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
