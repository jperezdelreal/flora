# Roadmap

Ordered work items for autonomous execution via perpetual-motion.yml.
Each item becomes a GitHub issue assigned to @copilot.

## 1. [x] Seasonal Themes System
   - Implement 4 seasons (Spring, Summer, Fall, Winter) with unique mechanics
   - Spring: all plants available, low pest spawn, mild watering needs
   - Summer: drought hazard activated, golden palette, heat-tolerant plants visible
   - Fall: pest surge, warm orange tones, long-growing plants encouraged
   - Winter: frost hazard, cool blue palette, frost-resistant plants only
   - Season displayed prominently in HUD
   - Visual palette shifts (sky color, ambient effects, plant colors)
   - 2+ runs feel visually distinct with smooth palette transitions
   - Files: src/config/index.ts, src/config/plants.ts, src/systems/HazardSystem.ts, src/systems/GridSystem.ts, src/scenes/GardenScene.ts, src/ui/HUD.ts

## 2. [x] Audio System Implementation
   - Implement ambient looping music with 6 seasonal variants
   - Action SFX: water pour, harvest chime, pest squish, plant wilt, day chime, discovery chime
   - Volume mixing: ambient 30%, SFX 50%, music 40%
   - Ambient loop plays continuously (90 sec, seamless repeat)
   - Seasonal music variants (spring lute, summer flute variations)
   - Water SFX on water action, harvest chime on collect
   - Pest squish sound on removal, plant death wilt sound
   - Mute toggle in pause menu working
   - No sound glitches or audio mixing issues
   - Files: src/systems/AudioManager.ts, src/scenes/GardenScene.ts, src/systems/PlantSystem.ts, src/systems/HazardSystem.ts, src/ui/PauseMenu.ts, src/config/audio.ts

## 3. [x] Unlock System & Meta-Progression UI
   - Track milestones: harvest plant, grow to maturity, plant diversity
   - Display next unlock target in HUD with progress indicator
   - Tool bar updates with animation when new tool unlocks
   - Persistent across runs (localStorage like encyclopedia)
   - Unlock notification pops up when milestone achieved
   - HUD shows "Next unlock" progress bar or text
   - Tool bar lights up new tools with notification
   - At least 3 unlock tiers visible in first 10 runs
   - No performance impact on game loop
   - Files: src/systems/UnlockSystem.ts, src/config/index.ts, src/ui/UnlockNotification.ts, src/ui/HUD.ts, src/ui/ToolBar.ts, src/systems/PlantSystem.ts
