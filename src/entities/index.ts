// Entity base types and interfaces
// Concrete entities (Player, Plant, Tool, etc.) will be added during Sprint 0+

export interface Entity {
  readonly id: string;
  x: number;
  y: number;
  active: boolean;
}

// Export Plant entity and types
export * from './Plant';
export * from './Tile';
export * from './GardenGrid';
export * from './Player';
export * from './Hazard';
export * from './Structure';
export * from './Weed';
