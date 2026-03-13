# Decision: Audio System Architecture (Issue #32)

**Date:** 2026-03-13  
**Agent:** Brock (Web Engine Dev)  
**Status:** Implemented (PR #45)

## Context
Flora needed ambient audio, seasonal music variants, and action sound effects to transform from mechanically sound to emotionally cozy and immersive.

## Decision
Implemented procedural audio system using Web Audio API with zero external audio assets.

### Architecture
- **AudioManager singleton** with routing graph: `sfxBus + ambientBus + musicBus → masterGain → compressor → destination`
- **Procedural synthesis** for all sounds:
  - Ambient: Layered oscillators (220Hz + 330Hz) + filtered noise + random bird chirps
  - SFX: Oscillators, noise buffers, bandpass/lowpass filters for plant/water/harvest/pest sounds
- **EventBus integration**: Systems emit typed events, GardenScene subscribes and triggers SFX
- **Volume control**: Per-bus gain nodes with localStorage persistence
- **User interaction unlock**: AudioContext requires user gesture before resume()

### Key Implementation Points
1. **main.ts**: Init audioManager, attach click/keydown listeners to resume AudioContext
2. **GardenScene.ts**: Subscribe to EventBus events (`plant:watered`, `pest:spawned`, etc.) and call `audioManager.playSFX()`
3. **PauseMenu.ts**: Mute toggle button updates master gain and persists state
4. **AudioManager.ts**: Already fully implemented with all SFX synthesis methods

## Rationale
- **No external assets**: Procedural audio = zero licensing/download overhead
- **Cozy aesthetic**: Lo-fi layered ambience with gentle SFX matches GDD §9 vision
- **Decoupled design**: EventBus pattern keeps audio logic separate from gameplay systems
- **Browser compliance**: Explicit resume() after user interaction satisfies autoplay policy

## Alternatives Considered
- **Audio files (MP3/WAV)**: Rejected due to licensing complexity and bundle size
- **Tone.js library**: Overkill for simple procedural synth needs
- **Direct coupling**: Rejected in favor of EventBus for maintainability

## Implications
- Future work: Seasonal ambient variants (different oscillator frequencies per season)
- Pattern established: All audio events go through EventBus, never direct calls to AudioManager from systems
- Volume preferences persist across sessions via localStorage
- AudioManager is a singleton; init() must be called before use

## Team Notes
- **For gameplay devs**: Emit typed events via `eventBus.emit()`, don't call audioManager directly
- **For audio enhancements**: Add new SFX types to `src/config/audio.ts` and AudioManager's switch statement
- **For seasonal variants**: Adjust oscillator frequencies and noise cutoffs in AUDIO.AMBIENT config per season
