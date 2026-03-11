/**
 * Example usage of AudioManager in Flora
 * 
 * This demonstrates how gameplay systems should integrate with the audio system.
 */

import { audioManager, type SFXType } from '../systems';

// ===== Initialization (in main game setup) =====

export function initAudio(): void {
  // Initialize audio context and routing graph
  audioManager.init();
}

// ===== User Interaction Handler =====

// CRITICAL: AudioContext must be resumed after user interaction
// Call this on first user click/tap/keypress
export async function resumeAudioAfterUserInteraction(): Promise<void> {
  await audioManager.resume();
  
  // Start ambient loop when game begins
  audioManager.startAmbient();
}

// ===== Gameplay Event Handlers =====

export function onPlantSeed(): void {
  // Player plants a seed in garden
  audioManager.playSFX('PLANT');
}

export function onWaterPlant(): void {
  // Player waters a plant
  audioManager.playSFX('WATER');
}

export function onHarvestPlant(): void {
  // Player harvests mature plant
  audioManager.playSFX('HARVEST');
}

export function onPlantWilts(): void {
  // Plant dies due to neglect
  audioManager.playSFX('WILT');
}

export function onPestAppears(): void {
  // Pest event triggers
  audioManager.playSFX('PEST_APPEAR');
}

// ===== Settings Menu Integration =====

export function toggleAmbientMute(muted: boolean): void {
  audioManager.setAmbientMute(muted);
}

export function toggleSFXMute(muted: boolean): void {
  audioManager.setSFXMute(muted);
}

export function toggleMusicMute(muted: boolean): void {
  audioManager.setMusicMute(muted);
}

export function setAmbientVolume(volume: number): void {
  // volume: 0.0 to 1.0
  audioManager.setAmbientVolume(volume);
}

export function setSFXVolume(volume: number): void {
  // volume: 0.0 to 1.0
  audioManager.setSFXVolume(volume);
}

export function setMusicVolume(volume: number): void {
  // volume: 0.0 to 1.0
  audioManager.setMusicVolume(volume);
}

// ===== Season Transitions =====

export function onSeasonEnd(): void {
  // Fade out ambient when season ends
  audioManager.stopAmbient();
}

export function onSeasonStart(): void {
  // Resume ambient for new season
  audioManager.startAmbient();
}

// ===== Cleanup =====

export function cleanupAudio(): void {
  // Call when closing game or navigating away
  audioManager.destroy();
}

// ===== Quick Test Function =====

export function testAllSounds(): void {
  console.log('Testing Flora audio system...');
  
  const sfxTypes: SFXType[] = ['PLANT', 'WATER', 'HARVEST', 'WILT', 'PEST_APPEAR'];
  let index = 0;
  
  const playNextSound = () => {
    if (index >= sfxTypes.length) {
      console.log('Audio test complete!');
      return;
    }
    
    const sfx = sfxTypes[index];
    console.log(`Playing: ${sfx}`);
    audioManager.playSFX(sfx);
    index++;
    
    setTimeout(playNextSound, 1000);
  };
  
  playNextSound();
}
