import { System } from './index';
import { ALL_PLANTS, PLANT_BY_ID } from '../config/plants';
import type { PlantConfig } from '../entities/Plant';

export interface DiscoveryEvent {
  plantId: string;
  config: PlantConfig;
  timestamp: number;
}

export interface EncyclopediaEntry {
  plantId: string;
  config: PlantConfig;
  discovered: boolean;
  firstDiscoveredAt?: number;
}

const STORAGE_KEY = 'flora_encyclopedia';

/**
 * EncyclopediaSystem manages seed discovery tracking and persistence.
 * Provides meta-progression by persisting discovered plants across runs.
 */
export class EncyclopediaSystem implements System {
  readonly name = 'EncyclopediaSystem';
  private discoveredPlants: Set<string> = new Set();
  private discoveryTimestamps: Map<string, number> = new Map();
  private discoveryCallbacks: Array<(event: DiscoveryEvent) => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  /** Register a callback to be notified of new discoveries */
  onDiscovery(callback: (event: DiscoveryEvent) => void): void {
    this.discoveryCallbacks.push(callback);
  }

  /** Mark a plant as discovered (triggers discovery event if first time) */
  discoverPlant(plantId: string): boolean {
    if (this.discoveredPlants.has(plantId)) {
      return false; // Already discovered
    }

    const config = PLANT_BY_ID[plantId];
    if (!config) {
      console.warn(`EncyclopediaSystem: Unknown plant ID: ${plantId}`);
      return false;
    }

    const timestamp = Date.now();
    this.discoveredPlants.add(plantId);
    this.discoveryTimestamps.set(plantId, timestamp);
    this.saveToStorage();

    const event: DiscoveryEvent = {
      plantId,
      config,
      timestamp,
    };

    // Notify all callbacks
    for (const callback of this.discoveryCallbacks) {
      callback(event);
    }

    return true; // New discovery
  }

  /** Check if a plant has been discovered */
  isDiscovered(plantId: string): boolean {
    return this.discoveredPlants.has(plantId);
  }

  /** Get all discovered plant IDs */
  getDiscoveredPlantIds(): string[] {
    return Array.from(this.discoveredPlants);
  }

  /** Get encyclopedia entries (all plants with discovery status) */
  getEntries(): EncyclopediaEntry[] {
    return ALL_PLANTS.map((config) => ({
      plantId: config.id,
      config,
      discovered: this.discoveredPlants.has(config.id),
      firstDiscoveredAt: this.discoveryTimestamps.get(config.id),
    }));
  }

  /** Get entries by rarity tier */
  getEntriesByRarity(rarity: PlantConfig['rarity']): EncyclopediaEntry[] {
    return this.getEntries().filter((entry) => entry.config.rarity === rarity);
  }

  /** Get discovery progress stats */
  getStats(): {
    total: number;
    discovered: number;
    percentComplete: number;
    byRarity: Record<string, { total: number; discovered: number }>;
  } {
    const byRarity: Record<string, { total: number; discovered: number }> = {
      common: { total: 0, discovered: 0 },
      uncommon: { total: 0, discovered: 0 },
      rare: { total: 0, discovered: 0 },
      heirloom: { total: 0, discovered: 0 },
    };

    for (const plant of ALL_PLANTS) {
      byRarity[plant.rarity].total++;
      if (this.discoveredPlants.has(plant.id)) {
        byRarity[plant.rarity].discovered++;
      }
    }

    const total = ALL_PLANTS.length;
    const discovered = this.discoveredPlants.size;
    const percentComplete = total > 0 ? Math.round((discovered / total) * 100) : 0;

    return {
      total,
      discovered,
      percentComplete,
      byRarity,
    };
  }

  /** Load discovered plants from localStorage */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (Array.isArray(data)) {
          // Legacy format: plain array of plant IDs
          this.discoveredPlants = new Set(data);
        } else if (data && typeof data === 'object') {
          // New format: { plants: string[], timestamps: Record<string, number> }
          this.discoveredPlants = new Set(data.plants ?? []);
          this.discoveryTimestamps = new Map(
            Object.entries(data.timestamps ?? {}).map(([k, v]) => [k, v as number])
          );
        }
      }
    } catch (error) {
      console.warn('EncyclopediaSystem: Failed to load from storage', error);
      this.discoveredPlants = new Set();
      this.discoveryTimestamps = new Map();
    }
  }

  /** Save discovered plants to localStorage */
  private saveToStorage(): void {
    try {
      const data = {
        plants: Array.from(this.discoveredPlants),
        timestamps: Object.fromEntries(this.discoveryTimestamps),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('EncyclopediaSystem: Failed to save to storage', error);
    }
  }

  /** Reset discovered plants (for testing or new game+) */
  reset(): void {
    this.discoveredPlants.clear();
    this.discoveryTimestamps.clear();
    this.saveToStorage();
  }

  update(_delta: number): void {
    // No per-frame update needed
  }

  destroy(): void {
    this.discoveryCallbacks = [];
  }
}
