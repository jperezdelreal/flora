# Decision: Procedural Audio Scene Integration

**Date:** 2026-03-14  
**By:** Brock (Web Engine Dev)  
**Status:** Implemented (PR #211)  
**Issue:** #203

## Context

Flora has a fully implemented AudioManager with Web Audio API procedural synthesis for ambient music and SFX. GardenScene has complete EventBus integration for triggering SFX on gameplay events. However, MenuScene and SeedSelectionScene did not start the ambient audio loop, creating a silent experience on the title screen and seed selection, breaking the cozy atmosphere.

## Decision

Start ambient audio in MenuScene and SeedSelectionScene to maintain continuous atmospheric audio throughout the player experience.

### Implementation

1. **MenuScene lifecycle**
   - `init()`: Call `audioManager.startAmbient()` after scene setup
   - `destroy()`: Call `audioManager.stopAmbient()` before cleanup

2. **SeedSelectionScene lifecycle**
   - `init()`: Call `audioManager.startAmbient()` after scene setup
   - `destroy()`: Call `audioManager.stopAmbient()` before cleanup

3. **Audio flow**
   - BootScene (silent - loading screen)
   - MenuScene (ambient starts - cozy atmosphere begins)
   - SeedSelectionScene (ambient continues - maintain mood)
   - GardenScene (ambient continues + SFX active - full audio experience)

## Alternatives Considered

1. **Single ambient instance across all scenes**
   - Would avoid stop/start on transitions
   - Rejected: Couples scene lifecycle management, harder to reason about ownership
   - Current approach keeps each scene self-contained

2. **Ambient only in GardenScene**
   - Simpler, less code
   - Rejected: Creates jarring silence in menu, breaks cozy-first design philosophy

3. **Global AudioController managing scene audio**
   - Centralized audio state machine
   - Rejected: Over-engineered for current needs, scenes already manage their own resources

## Rationale

- **Cozy-first philosophy**: Continuous gentle ambient creates relaxing atmosphere from first screen
- **Scene autonomy**: Each scene owns its audio lifecycle, following existing pattern for particles, animations
- **Brief silence acceptable**: During scene transitions, a moment of silence is natural and provides audio reset
- **Zero code duplication**: AudioManager already has all synthesis, just needed scene integration
- **Consistent with existing patterns**: Matches how scenes manage ParticleSystem, AnimationSystem

## Impact

- Positive user experience: ambient music greets players immediately
- No performance concerns: AudioManager reuses oscillators, minimal CPU overhead
- Maintainable: Audio lifecycle follows same pattern as other scene resources

## Follow-up

None required. Audio system is complete.

