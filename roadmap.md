# Roadmap — Phase 2: Polish & Depth

Ordered work items for autonomous execution via perpetual-motion.yml.
Each item becomes a GitHub issue assigned to @copilot.

**Phase 1 (complete):** Core loop, seasonal themes, audio, unlocks, randomized seeds, run scoring, hazard mechanics, synergies, persistent saves. Flora is mechanically sound — all roguelite systems operational.

**Phase 2 goal:** Transform functional prototype into a game that *feels* cozy to play, is accessible to new players, and rewards long-term engagement. Prioritized by player impact.

## 1. [ ] Visual Polish & Game Feel
   - Add plant growth animations: seed → sprout → mature with smooth frame transitions (3–5 keyframes per plant)
   - Harvest particle effect: satisfying pop with seed drops, color burst, brief screen shake
   - Water ripple effect on watering action: droplets fall and absorb into soil visually
   - Plant idle sway animation (gentle oscillation on all growing plants)
   - Scene transitions: fade-in/fade-out between Boot → SeedSelection → Garden → DaySummary
   - Day advance visual: sky color lerp, subtle lighting shift to mark time passage
   - Pest crawl animation on affected tiles (small sprite movement)
   - Synergy glow effect on plants receiving adjacency bonuses (pulsing highlight)
   - Button/menu hover and click feedback (scale bounce, color shift)
   - Acceptance: All GDD-listed tactile feedback present; 3+ distinct particle effects; transitions feel smooth; no frame drops below 55 FPS
   - Files: src/scenes/GardenScene.ts, src/systems/PlantSystem.ts, src/ui/*.ts, src/core/SceneManager.ts, new src/systems/ParticleSystem.ts, new src/systems/AnimationSystem.ts

## 2. [ ] Tutorial & Onboarding System
   - First-run detection (no save data → trigger tutorial)
   - Guided first season: step-by-step overlay teaching plant → water → harvest cycle
   - Contextual hints: tooltip appears on first encounter of each mechanic (synergies, hazards, tools, scoring)
   - "How to Play" accessible from PauseMenu for returning players
   - Hint system tracks which hints have been shown (persisted to localStorage)
   - Non-intrusive: hints dismiss on click or auto-fade after 5 seconds
   - Skip tutorial option for experienced players
   - Acceptance: New player completes first run without confusion; all major mechanics have contextual hints; tutorial completable in < 3 minutes; no tutorial blocks gameplay flow
   - Files: new src/systems/TutorialSystem.ts, new src/ui/TutorialOverlay.ts, new src/config/tutorial.ts, src/scenes/GardenScene.ts, src/ui/PauseMenu.ts, src/utils/storage.ts

## 3. [ ] Garden Expansion & Structures
   - Unlockable grid sizes: 10×10 at 10 completed runs, 12×12 at 20 runs (config-driven thresholds)
   - Garden structures as placeable tile objects: Greenhouse (extends season by 2 days), Compost Bin (converts dead plants to soil boost), Rain Barrel (auto-waters 2 adjacent tiles per day)
   - Structure unlock progression tied to UnlockSystem milestones
   - Grid expansion persists across runs via SaveManager
   - Structure placement UI: drag-and-drop or click-to-place on empty tiles
   - Visual representation for each structure (distinct tile sprite or colored container)
   - Balance: structures occupy planting space (trade-off: utility vs. grow area)
   - Acceptance: Grid scales cleanly to 12×12 without layout breakage; 3 structures functional; structures affect gameplay measurably; expansion unlocks visible in progression UI
   - Files: src/config/index.ts (GARDEN constants), new src/config/structures.ts, new src/entities/Structure.ts, src/systems/GridSystem.ts, src/systems/PlantSystem.ts, src/systems/UnlockSystem.ts, src/scenes/GardenScene.ts, src/ui/HUD.ts

## 4. [ ] Achievements & Cosmetic Rewards
   - Achievement system tracking player milestones across runs (separate from tool unlocks)
   - GDD-defined achievements: "Grow 10 Tomatoes", "Harvest in Frost", "Perfect Season" (no failed plants), "Five-Plant Polyculture"
   - 10+ achievements total across categories: harvest, survival, synergy, exploration, mastery
   - Achievement notification popup with badge icon on unlock
   - Achievements gallery accessible from main menu (grid of locked/unlocked badges)
   - Cosmetic rewards tied to achievements: seed packet visual skins, HUD color themes
   - Persistent storage via SaveManager (achievements survive across sessions)
   - Acceptance: 10+ achievements defined; notifications display correctly; gallery shows progress; at least 2 cosmetic rewards functional; no save data corruption
   - Files: new src/systems/AchievementSystem.ts, new src/config/achievements.ts, new src/ui/AchievementNotification.ts, new src/ui/AchievementGallery.ts, src/systems/SaveManager.ts, src/config/saveSchema.ts, src/scenes/GardenScene.ts
