import { System } from './index';
import { Plant } from '../entities/Plant';
import { SynergyTrait, SYNERGY_CONFIG, NEGATIVE_SYNERGY_EFFECTS } from '../config/synergies';
import { PLANT_BY_ID } from '../config/plants';
import { eventBus } from '../core/EventBus';

/**
 * TLDR: SynergySystem manages adjacency bonuses, polyculture detection, and negative synergies
 * - Shade: tall plants benefit shade-loving neighbors
 * - Nitrogen: fixers enrich adjacent soil (+20% health)
 * - Pest deterrent: aromatic plants reduce pest spawn in radius
 * - Polyculture: 3+ different types adjacent = +10% growth
 * - Water competition: heavy drinkers increase neighbor water needs (negative)
 * - Allelopathy: chemical compounds slow adjacent growth (negative)
 * - Pest attraction: draws pests to nearby tiles (negative)
 */
export class SynergySystem implements System {
  readonly name = 'SynergySystem';
  private tutorialShown = false;

  constructor() {
    // TLDR: Subscribe to plant events for synergy recalculation
    eventBus.on('plant:created', () => this.scheduleSynergyCheck());
    eventBus.on('plant:harvested', () => this.scheduleSynergyCheck());
  }

  private synergyCheckScheduled = false;

  /**
   * TLDR: Schedule a synergy check for next update cycle
   * Debounces multiple plant changes in single frame
   */
  private scheduleSynergyCheck(): void {
    this.synergyCheckScheduled = true;
  }

  /**
   * TLDR: Calculate and apply synergies (positive + negative) for all plants
   */
  calculateSynergies(plants: Plant[]): void {
    const activePlants = plants.filter((p) => p.active);

    // Clear existing synergies
    for (const plant of activePlants) {
      plant.clearSynergies();
    }

    // Calculate synergies for each plant
    for (const plant of activePlants) {
      const neighbors = this.getAdjacentPlants(plant, activePlants);
      
      // TLDR: Positive synergies
      if (this.hasShadeBonus(plant, neighbors)) {
        plant.applySynergyBonuses(
          { growthSpeedMultiplier: 1 + SYNERGY_CONFIG.shadeBonusMultiplier },
          'shade_bonus'
        );
        this.emitSynergyActivated(plant, 'shade_bonus');
      }

      if (this.hasNitrogenBonus(plant, neighbors)) {
        plant.applySynergyBonuses(
          { healthBonus: SYNERGY_CONFIG.nitrogenHealthBonus },
          'nitrogen_bonus'
        );
        this.emitSynergyActivated(plant, 'nitrogen_bonus');
      }

      if (this.hasPolycultureBonus(plant, neighbors)) {
        plant.applySynergyBonuses(
          { growthSpeedMultiplier: 1 + SYNERGY_CONFIG.polycultureGrowthBonus },
          'polyculture'
        );
        this.emitSynergyActivated(plant, 'polyculture');
      }

      // TLDR: Negative synergies — applied after positive to allow counterplay
      if (this.hasWaterCompetition(plant, neighbors)) {
        const effect = NEGATIVE_SYNERGY_EFFECTS['water_competition'];
        plant.applyNegativeSynergy(
          { waterNeedMultiplier: effect.waterNeedMultiplier },
          'water_competition'
        );
        this.emitSynergyWarning(plant, 'water_competition');
      }

      if (this.hasAllelopathy(plant, neighbors)) {
        const effect = NEGATIVE_SYNERGY_EFFECTS['allelopathy'];
        plant.applyNegativeSynergy(
          { growthSpeedMultiplier: effect.growthSpeedMultiplier },
          'allelopathy'
        );
        this.emitSynergyWarning(plant, 'allelopathy');
      }
    }

    this.synergyCheckScheduled = false;
  }

  /**
   * TLDR: Get adjacent plants (4 cardinal directions)
   */
  private getAdjacentPlants(plant: Plant, allPlants: Plant[]): Plant[] {
    const adjacentPositions = [
      { x: plant.x - 1, y: plant.y },
      { x: plant.x + 1, y: plant.y },
      { x: plant.x, y: plant.y - 1 },
      { x: plant.x, y: plant.y + 1 },
    ];

    return allPlants.filter((p) => {
      if (p.id === plant.id) return false;
      return adjacentPositions.some((pos) => p.x === pos.x && p.y === pos.y);
    });
  }

  /**
   * TLDR: Check if plant receives shade bonus
   * Shade-loving plants benefit from adjacent shade providers
   */
  private hasShadeBonus(plant: Plant, neighbors: Plant[]): boolean {
    const config = plant.getConfig();
    if (!config.synergyTraits?.includes(SynergyTrait.SHADE_LOVER)) {
      return false;
    }

    return neighbors.some((neighbor) =>
      neighbor.getConfig().synergyTraits?.includes(SynergyTrait.SHADE_PROVIDER)
    );
  }

  /**
   * TLDR: Check if plant receives nitrogen bonus
   * Plants adjacent to nitrogen fixers get health boost
   */
  private hasNitrogenBonus(plant: Plant, neighbors: Plant[]): boolean {
    return neighbors.some((neighbor) =>
      neighbor.getConfig().synergyTraits?.includes(SynergyTrait.NITROGEN_FIXER)
    );
  }

  /**
   * TLDR: Check if plant receives polyculture bonus
   * 3+ different plant types adjacent = bonus
   */
  private hasPolycultureBonus(plant: Plant, neighbors: Plant[]): boolean {
    if (neighbors.length < SYNERGY_CONFIG.polycultureMinTypes - 1) {
      return false;
    }

    const uniqueTypes = new Set(neighbors.map((n) => n.getConfig().id));
    uniqueTypes.add(plant.getConfig().id);

    return uniqueTypes.size >= SYNERGY_CONFIG.polycultureMinTypes;
  }

  /**
   * TLDR: Check if plant suffers water competition
   * Plants adjacent to water competitors need more water
   * Self-excluded: water competitors don't penalize themselves
   */
  private hasWaterCompetition(plant: Plant, neighbors: Plant[]): boolean {
    const config = plant.getConfig();
    if (config.synergyTraits?.includes(SynergyTrait.WATER_COMPETITOR)) {
      return false;
    }

    return neighbors.some((neighbor) =>
      neighbor.getConfig().synergyTraits?.includes(SynergyTrait.WATER_COMPETITOR)
    );
  }

  /**
   * TLDR: Check if plant suffers allelopathic slowdown
   * Plants adjacent to allelopathic plants grow slower
   * Self-excluded: allelopathic plants don't slow themselves
   */
  private hasAllelopathy(plant: Plant, neighbors: Plant[]): boolean {
    const config = plant.getConfig();
    if (config.synergyTraits?.includes(SynergyTrait.ALLELOPATHIC)) {
      return false;
    }

    return neighbors.some((neighbor) =>
      neighbor.getConfig().synergyTraits?.includes(SynergyTrait.ALLELOPATHIC)
    );
  }

  /**
   * TLDR: Check if plant is protected by pest deterrent
   * Used by HazardSystem to reduce pest spawn
   */
  isPestDeterrentActive(x: number, y: number, allPlants: Plant[]): boolean {
    const activePlants = allPlants.filter((p) => p.active);
    
    for (const plant of activePlants) {
      const config = plant.getConfig();
      if (!config.synergyTraits?.includes(SynergyTrait.PEST_DETERRENT)) {
        continue;
      }

      const distance = Math.abs(plant.x - x) + Math.abs(plant.y - y);
      if (distance <= SYNERGY_CONFIG.pestDeterrentRadius) {
        return true;
      }
    }

    return false;
  }

  /**
   * TLDR: Check if a tile has increased pest attraction from nearby pest attractors
   * Used by HazardSystem to increase pest spawn chance
   */
  isPestAttractorActive(x: number, y: number, allPlants: Plant[]): boolean {
    const activePlants = allPlants.filter((p) => p.active);

    for (const plant of activePlants) {
      const config = plant.getConfig();
      if (!config.synergyTraits?.includes(SynergyTrait.PEST_ATTRACTOR)) {
        continue;
      }

      const distance = Math.abs(plant.x - x) + Math.abs(plant.y - y);
      if (distance <= SYNERGY_CONFIG.pestAttractionRadius) {
        return true;
      }
    }

    return false;
  }

  /**
   * TLDR: Get negative synergy warnings for a plant config at a given position
   * Used by SynergyTooltip to show warnings BEFORE planting
   */
  getPlantingWarnings(
    plantId: string,
    x: number,
    y: number,
    allPlants: Plant[]
  ): string[] {
    const warnings: string[] = [];
    const activePlants = allPlants.filter((p) => p.active);
    const neighbors = this.getAdjacentPlantsAt(x, y, activePlants);

    // TLDR: Check if the plant being placed has negative traits that affect neighbors
    const plantConfig = PLANT_BY_ID[plantId];

    if (plantConfig?.synergyTraits) {
      if (plantConfig.synergyTraits.includes(SynergyTrait.WATER_COMPETITOR) && neighbors.length > 0) {
        warnings.push(NEGATIVE_SYNERGY_EFFECTS['water_competition'].warningText);
      }
      if (plantConfig.synergyTraits.includes(SynergyTrait.ALLELOPATHIC) && neighbors.length > 0) {
        warnings.push(NEGATIVE_SYNERGY_EFFECTS['allelopathy'].warningText);
      }
      if (plantConfig.synergyTraits.includes(SynergyTrait.PEST_ATTRACTOR)) {
        warnings.push(NEGATIVE_SYNERGY_EFFECTS['pest_attraction'].warningText);
      }
    }

    // TLDR: Check if existing neighbors have negative traits that affect this plant
    for (const neighbor of neighbors) {
      const nConfig = neighbor.getConfig();
      if (nConfig.synergyTraits?.includes(SynergyTrait.WATER_COMPETITOR)) {
        warnings.push(`${nConfig.displayName} nearby: ${NEGATIVE_SYNERGY_EFFECTS['water_competition'].description}`);
        break;
      }
    }

    for (const neighbor of neighbors) {
      const nConfig = neighbor.getConfig();
      if (nConfig.synergyTraits?.includes(SynergyTrait.ALLELOPATHIC)) {
        warnings.push(`${nConfig.displayName} nearby: ${NEGATIVE_SYNERGY_EFFECTS['allelopathy'].description}`);
        break;
      }
    }

    return [...new Set(warnings)];
  }

  /**
   * TLDR: Get adjacent plants at a position (for pre-planting checks)
   */
  private getAdjacentPlantsAt(x: number, y: number, allPlants: Plant[]): Plant[] {
    const adjacentPositions = [
      { x: x - 1, y },
      { x: x + 1, y },
      { x, y: y - 1 },
      { x, y: y + 1 },
    ];

    return allPlants.filter((p) =>
      adjacentPositions.some((pos) => p.x === pos.x && p.y === pos.y)
    );
  }

  /**
   * TLDR: Emit synergy activation event for scoring/UI
   */
  private emitSynergyActivated(plant: Plant, synergyId: string): void {
    eventBus.emit('synergy:activated', {
      plantId: plant.id,
      synergyId,
      x: plant.x,
      y: plant.y,
    });

    // Show tutorial on first synergy
    if (!this.tutorialShown) {
      this.tutorialShown = true;
      eventBus.emit('synergy:tutorial', { synergyId });
    }
  }

  /**
   * TLDR: Emit negative synergy warning event for UI
   */
  private emitSynergyWarning(plant: Plant, synergyId: string): void {
    eventBus.emit('synergy:warning', {
      plantId: plant.id,
      synergyId,
      x: plant.x,
      y: plant.y,
    });
  }

  /**
   * TLDR: Get all plants with active synergies (for visual indicators)
   */
  getPlantsWithSynergies(plants: Plant[]): Array<{ plant: Plant; synergies: Set<string> }> {
    return plants
      .filter((p) => p.active && p.getActiveSynergies().size > 0)
      .map((plant) => ({
        plant,
        synergies: plant.getActiveSynergies(),
      }));
  }

  /**
   * TLDR: Get plants affected by negative synergies (for penalty visual indicators)
   */
  getPlantsWithNegativeSynergies(plants: Plant[]): Array<{ plant: Plant; penalties: Set<string> }> {
    return plants
      .filter((p) => p.active && p.getNegativeSynergies().size > 0)
      .map((plant) => ({
        plant,
        penalties: plant.getNegativeSynergies(),
      }));
  }

  update(_delta: number): void {
    // Synergies are calculated on-demand when plants change
    // No per-frame update needed
  }

  destroy(): void {
    this.tutorialShown = false;
    this.synergyCheckScheduled = false;
  }
}
