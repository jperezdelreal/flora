import { System } from './index';
import { Plant } from '../entities/Plant';
import { SynergyTrait, SYNERGY_CONFIG } from '../config/synergies';
import { eventBus } from '../core/EventBus';

/**
 * TLDR: SynergySystem manages adjacency bonuses and polyculture detection
 * - Shade: tall plants benefit shade-loving neighbors
 * - Nitrogen: fixers enrich adjacent soil (+20% health)
 * - Pest deterrent: aromatic plants reduce pest spawn in radius
 * - Polyculture: 3+ different types adjacent = +10% growth
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
   * TLDR: Calculate and apply synergies for all plants
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
      
      // Check shade bonus
      if (this.hasShadeBonus(plant, neighbors)) {
        plant.applySynergyBonuses(
          { growthSpeedMultiplier: 1 + SYNERGY_CONFIG.shadeBonusMultiplier },
          'shade_bonus'
        );
        this.emitSynergyActivated(plant, 'shade_bonus');
      }

      // Check nitrogen bonus
      if (this.hasNitrogenBonus(plant, neighbors)) {
        plant.applySynergyBonuses(
          { healthBonus: SYNERGY_CONFIG.nitrogenHealthBonus },
          'nitrogen_bonus'
        );
        this.emitSynergyActivated(plant, 'nitrogen_bonus');
      }

      // Check polyculture bonus
      if (this.hasPolycultureBonus(plant, neighbors)) {
        plant.applySynergyBonuses(
          { growthSpeedMultiplier: 1 + SYNERGY_CONFIG.polycultureGrowthBonus },
          'polyculture'
        );
        this.emitSynergyActivated(plant, 'polyculture');
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

  update(_delta: number): void {
    // Synergies are calculated on-demand when plants change
    // No per-frame update needed
  }

  destroy(): void {
    this.tutorialShown = false;
    this.synergyCheckScheduled = false;
  }
}
