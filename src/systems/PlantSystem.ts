import { System } from './index';
import { Plant, PlantConfig, GrowthStage } from '../entities/Plant';
import { PLANT_BY_ID } from '../config/plants';
import type { EncyclopediaSystem } from './EncyclopediaSystem';

export interface PlantSystemConfig {
  /** Frames per in-game day (60fps * seconds) */
  framesPerDay: number;
  /** Optional encyclopedia system for discovery tracking */
  encyclopediaSystem?: EncyclopediaSystem;
}

/**
 * PlantSystem manages the plant lifecycle:
 * - Growth advancement (1 stage per in-game day)
 * - Water state tracking
 * - Harvesting
 * - Plant health and death
 */
export class PlantSystem implements System {
  readonly name = 'PlantSystem';
  private plants: Map<string, Plant> = new Map();
  private frameCounter = 0;
  private currentDay = 0;
  private readonly config: PlantSystemConfig;

  // Encyclopedia: tracks discovered plant types
  private discoveredPlants: Set<string> = new Set();

  constructor(config: PlantSystemConfig) {
    this.config = config;
  }

  /** Add a plant to the system */
  addPlant(plant: Plant): void {
    this.plants.set(plant.id, plant);
  }

  /** Create and add a new plant at grid coordinates */
  createPlant(plantConfigId: string, x: number, y: number): Plant | null {
    const config = PLANT_BY_ID[plantConfigId];
    if (!config) {
      console.warn(`PlantSystem: Unknown plant config ID: ${plantConfigId}`);
      return null;
    }

    const plantId = `plant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const plant = new Plant(plantId, config, x, y);
    this.addPlant(plant);
    return plant;
  }

  /** Remove a plant from the system */
  removePlant(plantId: string): void {
    this.plants.delete(plantId);
  }

  /** Get a plant by ID */
  getPlant(plantId: string): Plant | undefined {
    return this.plants.get(plantId);
  }

  /** Get all active plants */
  getActivePlants(): Plant[] {
    return Array.from(this.plants.values()).filter((p) => p.active);
  }

  /** Get plant at specific grid position */
  getPlantAt(x: number, y: number): Plant | undefined {
    return this.getActivePlants().find((p) => p.x === x && p.y === y);
  }

  /** Water a plant at grid position */
  waterPlant(x: number, y: number): boolean {
    const plant = this.getPlantAt(x, y);
    if (plant) {
      plant.water();
      return true;
    }
    return false;
  }

  /** Harvest a plant at grid position */
  harvestPlant(x: number, y: number): { success: boolean; seeds: number; plantId: string; isNewDiscovery: boolean } {
    const plant = this.getPlantAt(x, y);
    if (!plant) {
      return { success: false, seeds: 0, plantId: '', isNewDiscovery: false };
    }

    if (!plant.canHarvest()) {
      return { success: false, seeds: 0, plantId: plant.getConfig().id, isNewDiscovery: false };
    }

    const seeds = plant.harvest();
    const plantConfigId = plant.getConfig().id;

    // Update local encyclopedia
    this.discoveredPlants.add(plantConfigId);

    // Update global encyclopedia system if available
    let isNewDiscovery = false;
    if (this.config.encyclopediaSystem) {
      isNewDiscovery = this.config.encyclopediaSystem.discoverPlant(plantConfigId);
    }

    // Remove plant from system
    this.removePlant(plant.id);

    return { success: true, seeds, plantId: plantConfigId, isNewDiscovery };
  }

  /** Click handler for plant interaction (harvest mature plants) */
  handlePlantClick(x: number, y: number): { harvested: boolean; seeds: number } {
    const result = this.harvestPlant(x, y);
    return { harvested: result.success, seeds: result.seeds };
  }

  /** Get current in-game day */
  getCurrentDay(): number {
    return this.currentDay;
  }

  /** Get discovered plant IDs */
  getDiscoveredPlants(): string[] {
    return Array.from(this.discoveredPlants);
  }

  /** Check if a plant type has been discovered */
  isPlantDiscovered(plantConfigId: string): boolean {
    return this.discoveredPlants.has(plantConfigId);
  }

  /** Fixed-timestep update (called by game loop) */
  update(delta: number): void {
    this.frameCounter++;

    // Advance day when frame threshold reached
    if (this.frameCounter >= this.config.framesPerDay) {
      this.advanceDay();
      this.frameCounter = 0;
    }
  }

  /** Advance all plants by one in-game day */
  private advanceDay(): void {
    this.currentDay++;

    const plants = this.getActivePlants();
    for (const plant of plants) {
      plant.advanceDay();
    }

    // Remove dead plants
    const deadPlants = Array.from(this.plants.values()).filter((p) => !p.active);
    for (const plant of deadPlants) {
      this.removePlant(plant.id);
    }
  }

  /** Get statistics for UI/debugging */
  getStats(): {
    totalPlants: number;
    activePlants: number;
    maturePlants: number;
    currentDay: number;
    discoveredCount: number;
  } {
    const active = this.getActivePlants();
    const mature = active.filter((p) => p.canHarvest());

    return {
      totalPlants: this.plants.size,
      activePlants: active.length,
      maturePlants: mature.length,
      currentDay: this.currentDay,
      discoveredCount: this.discoveredPlants.size,
    };
  }

  /** Reset the system for a new season */
  reset(): void {
    this.plants.clear();
    this.frameCounter = 0;
    this.currentDay = 0;
    // Note: discoveredPlants persists across seasons (meta-progression)
  }

  /** Destroy the system (cleanup) */
  destroy(): void {
    this.plants.clear();
    this.discoveredPlants.clear();
    this.frameCounter = 0;
    this.currentDay = 0;
  }
}
