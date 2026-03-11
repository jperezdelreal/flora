// Game systems (growth, weather, inventory, day-night, etc.)
// Systems will be registered with the game loop during Sprint 0+

export interface System {
  readonly name: string;
  update(delta: number): void;
  destroy(): void;
}

// Export PlantSystem
export * from './PlantSystem';
export * from './GridSystem';
export * from './PlayerSystem';
