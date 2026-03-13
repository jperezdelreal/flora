export interface System {
  readonly name: string;
  update(delta: number): void;
  destroy(): void;
}

export * from './PlantSystem';
export * from './GridSystem';
export * from './PlayerSystem';
export * from './EncyclopediaSystem';
export * from './UnlockSystem';
export * from './HazardSystem';
export * from './WeatherSystem';
export * from './ScoringSystem';
export * from './SeedSelectionSystem';
export * from './SynergySystem';
export { AudioManager, audioManager } from './AudioManager';
export type { SFXType } from '../config/audio';
export { AnimationSystem, Easing } from './AnimationSystem';
export type { TweenOptions, EasingFn } from './AnimationSystem';
export { ParticleSystem } from './ParticleSystem';
export type { BurstConfig, RippleConfig, GlowConfig } from './ParticleSystem';
export { SaveManager } from './SaveManager';
export type { SaveStateCallback } from './SaveManager';
