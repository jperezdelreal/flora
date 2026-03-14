# Roadmap — Phase 4: From Prototype to Product

Ordered work items for autonomous execution via perpetual-motion.yml.
Each item becomes a GitHub issue assigned to @copilot.

---

## Completed Phases

**Phase 1 (complete — 8 items):** Seasonal themes, audio system, unlock system, randomized seed selection, run scoring & milestones, enhanced hazard mechanics, seed synergies & polyculture bonus, persistent save system. Flora's roguelite core is operational.

**Phase 2 (complete — 4 items):** Visual polish & game feel (AnimationSystem, ParticleSystem, scene transitions), tutorial & onboarding (7-step guided tutorial, 7 contextual hints), garden expansion & structures (8×8→10×10→12×12 grid tiers, Greenhouse/Compost Bin/Rain Barrel), achievements & cosmetic rewards (12 achievements across 5 categories, notification system).

**Phase 3 (complete — 5 items):** Title screen & main menu (#117, state machine with title/main/settings/credits), daily challenge system (#118, deterministic seeds + 4 modifiers + leaderboard), mobile & touch support (#119, TouchController + responsive viewport + orientation hints), content expansion (#120, 10 new plants to 22 total + negative synergies: water competitor, allelopathic, pest attractor), performance & accessibility (#116, object pooling, FPS monitoring, 4 colorblind palettes, keyboard navigation, screen reader ARIA).

---

## Phase 4 Goal

**Transform Flora from complete prototype into a game people want to play repeatedly.** Phase 1 proved "mechanically interesting." Phase 2 proved "feels cozy." Phase 3 proved "accessible and content-rich." Phase 4 must prove **"I want to come back tomorrow."**

Strategic thesis: Replayability comes from three vectors — **variety** (runs feel different), **depth** (decisions have consequences), and **identity** (the game looks and feels like *Flora*, not a tech demo). Phase 4 attacks all three.

Prioritized by strategic impact (highest first).

---

## 1. [~] Encyclopedia & Achievements Standalone Scenes *(Sprint 2: #215, #216)*
   - Create EncyclopediaScene as a full scene (not just GardenScene overlay) accessible from main menu
   - Create AchievementsScene as a full scene accessible from main menu with gallery, progress stats, and reward previews
   - Wire MenuScene placeholder buttons (`case 'encyclopedia': break;` and `case 'achievements': break;`) to navigate to these scenes via SceneManager
   - Encyclopedia scene: scrollable plant catalog with filters (by rarity, season, discovered/undiscovered), plant detail view with growth stats and synergy info, discovery percentage tracker
   - Achievements scene: grid of unlocked/locked badges grouped by category, progress bars per category, reward preview for locked achievements, total completion percentage
   - Back navigation returns to MenuScene main state (not title state)
   - Both scenes share the animated background/particle layer from MenuScene for visual consistency
   - Keyboard and touch navigation in both scenes (follow existing PauseMenu patterns)
   - Screen reader announcements for navigation (use existing ARIA announce() utility)
   - Acceptance: Both menu buttons navigate to functional scenes; Encyclopedia shows all 22 plants with correct discovery state; Achievements shows all 12 achievements with correct unlock state; back navigation works; keyboard + touch accessible; no save data side effects from browsing
   - Files: new src/scenes/EncyclopediaScene.ts, new src/scenes/AchievementsScene.ts, src/scenes/MenuScene.ts (wire navigation), src/scenes/index.ts, src/main.ts (register scenes), src/ui/Encyclopedia.ts (refactor for reuse), src/ui/AchievementGallery.ts (refactor for reuse)

## 2. [~] Weed & Compost Gameplay Loop *(Sprint 2: #217)*
   - Implement WeedSystem: weeds spawn randomly on empty tiles (configurable frequency, increasing with season progression), occupy planting space, slow adjacent plant growth by 15%, spread to neighboring empty tiles if left unattended for 2+ days
   - Player action: remove weed (click/tap, costs 1 action) or ignore (free compost source later)
   - Weed entity with states: SPROUTING → ESTABLISHED → SPREADING
   - Weed visual: distinct tile appearance with growth animation (integrate with AnimationSystem)
   - Implement compost mechanic: dead plants and removed weeds generate compost points, compost accumulates in Compost Bin structure (if placed), player can spread compost to tiles to restore soil quality (+20 per application)
   - Compost as explicit player action: select Compost Bin → click target tile → soil quality restored
   - Add "Compost" tool to ToolBar (unlocked when Compost Bin structure is first placed)
   - EventBus events: `weed:spawned`, `weed:removed`, `weed:spread`, `compost:generated`, `compost:applied`
   - Weed config in src/config/weeds.ts: spawn rates per season, spread timer, growth slow multiplier, compost yield
   - Tutorial contextual hint for first weed encounter and first compost action
   - Achievement integration: "Weed Warrior" (remove 20 weeds), "Master Composter" (apply compost 10 times)
   - Acceptance: Weeds spawn during tending phase; removal costs action; compost cycle functional (dead plant → compost → soil boost); weed spread creates urgency without frustration; 2+ new achievements; tutorial hints fire; events emitted for scoring integration
   - Files: new src/systems/WeedSystem.ts, new src/entities/Weed.ts, new src/config/weeds.ts, src/config/tools.ts (add Compost tool), src/systems/PlantSystem.ts (compost interaction), src/entities/Tile.ts (weed state), src/scenes/GardenScene.ts (wire WeedSystem), src/ui/ToolBar.ts (Compost tool), src/config/achievements.ts (new achievements), src/core/EventBus.ts (new events)

## 3. [~] Tool Progression & Advanced Tools *(Sprint 2: #218)*
   - Implement tool upgrade system: tools have tiers (Basic → Improved → Advanced) with increasing effectiveness
   - Watering Can tiers: Basic (1 tile), Improved (cross pattern — 5 tiles, unlocked at 15 harvests), Advanced (3×3 area — 9 tiles, unlocked at 40 harvests)
   - Pest Spray tool: removes pest from target tile + adjacent tiles (unlocked at 10 runs), replaces manual 1-at-a-time pest removal
   - Soil Tester tool: reveals soil quality, moisture, and optimal plant suggestions for a tile (unlocked at 25 harvests), shows tooltip with detailed tile info
   - Trellis tool: placeable support structure that boosts adjacent climbing plants (Pea, Cucumber) growth speed by 25% (unlocked at 15 runs)
   - Tool unlock notifications via existing UnlockNotification UI
   - ToolBar updates: show locked tools as grayed with unlock hint, animate unlock with existing pulse animation
   - Tool selection persists across days within a run (QoL improvement)
   - Add tool tier indicator to ToolBar (★/★★/★★★ badges)
   - Tool configs in src/config/tools.ts: define all tools with tiers, unlock conditions, effect parameters
   - UnlockSystem integration: tool unlocks tracked as milestones, persisted via SaveManager
   - Acceptance: 3 watering can tiers functional; Pest Spray clears area; Soil Tester shows tile info; Trellis boosts climbing plants; all tools unlock at correct milestones; ToolBar reflects locked/unlocked/tier state; unlocks persist across sessions; no regression in existing tool behavior
   - Files: src/config/tools.ts (expanded tool definitions), new src/systems/ToolSystem.ts, src/systems/PlantSystem.ts (tool effect integration), src/systems/HazardSystem.ts (pest spray interaction), src/ui/ToolBar.ts (tiers + locked display), src/ui/PlantInfoPanel.ts (soil tester info), src/systems/UnlockSystem.ts (tool milestones), src/config/unlocks.ts (new milestones), src/scenes/GardenScene.ts (wire ToolSystem), src/config/plants.ts (climbing trait for trellis)

## 4. [~] Procedural Garden Visuals *(Sprint 2: #219, #220)*
   - Replace PixiJS primitive shapes with procedural plant sprites: each plant type gets a unique visual generated from configurable parameters (stem shape, leaf pattern, flower/fruit shape, color palette)
   - Growth stage visuals: seed (small mound), sprout (tiny stem + cotyledon), growing (stem + leaves, increasing size), mature (full plant with fruit/flower, glow effect)
   - Seasonal color shifts applied to all garden elements: spring pastels, summer gold, fall warm oranges, winter cool blues (reference GDD §8 palette specifications)
   - Structure sprites: Greenhouse (glass frame with green tint), Compost Bin (wooden slat container with soil), Rain Barrel (cylindrical barrel with water shimmer), Trellis (lattice frame)
   - Tile textures: soil with moisture-responsive darkness, planted tile ring, weed-infested tile visual
   - Procedural idle animations: gentle sway for mature plants, shimmer for watered tiles, slow pulse for synergy-active plants
   - Integration with existing AnimationSystem for growth transitions and ParticleSystem for harvest/water effects
   - Colorblind palette support: all procedural visuals use getActivePalette() from accessibility config
   - Performance budget: procedural generation cached per plant type + stage combo; no runtime generation during gameplay; target 60 FPS on mid-range hardware
   - Acceptance: All 22 plants have distinct procedural visuals across 4 growth stages; 4 structures have unique sprites; tiles respond visually to soil/moisture state; seasonal palette shifts visible; colorblind-safe; no FPS regression below 55 FPS; visual style cohesive and "cozy" per GDD §8
   - Files: new src/systems/PlantRenderer.ts, new src/systems/TileRenderer.ts, new src/config/plantVisuals.ts (visual parameters per plant), src/config/seasons.ts (palette definitions), src/systems/AnimationSystem.ts (growth transitions), src/systems/ParticleSystem.ts (effect integration), src/scenes/GardenScene.ts (renderer wiring), src/config/accessibility.ts (palette integration)

## 5. [ ] Cosmetic Reward Application
   - Apply cosmetic rewards earned from achievements to actual game visuals
   - Seed packet skins: "Golden Seed Packet", "Crystalline Seed Packet", "Bloom Seed Packet", "Radiant Seed Packet" — apply as visual variants in SeedSelectionScene seed cards and SeedInventory display
   - HUD themes: "Autumn Glow Theme", "Spring Meadow Theme", "Frost Blue Theme", "Golden Hour Theme" — apply as color palette overrides to HUD background, text colors, and progress bar fills
   - Badge displays: achievement badges shown on player profile in MenuScene (new profile section or credits area)
   - Cosmetic selection UI: settings panel or dedicated "Customize" option in MenuScene where players equip unlocked cosmetics
   - Active cosmetics persisted via SaveManager (extend SettingsSaveData with equipped cosmetics)
   - Preview system: in AchievementsScene, locked cosmetics show dimmed preview of what they look like
   - Visual feedback when cosmetic is first applied (brief sparkle animation)
   - Acceptance: 4+ seed packet skins render in seed selection; 4+ HUD themes change HUD appearance; cosmetic selection UI functional; selections persist across sessions; locked cosmetics show preview; no visual conflicts with colorblind modes
   - Files: src/ui/SeedPacketDisplay.ts (skin variants), src/ui/SeedInventory.ts (skin variants), src/ui/HUD.ts (theme system), src/scenes/MenuScene.ts (customize option + profile badges), src/scenes/SeedSelectionScene.ts (packet skin rendering), new src/config/cosmetics.ts (cosmetic definitions + theme palettes), src/config/saveSchema.ts (equipped cosmetics schema), src/systems/SaveManager.ts (cosmetics persistence), src/scenes/AchievementsScene.ts (reward preview)

## 6. [ ] Season Selection & Run Variety
   - Add season selection UI to SeedSelectionScene: player chooses which season to play (Spring/Summer/Fall/Winter) before selecting seeds
   - Each season presents unique strategic challenge: Spring (heavy rain risk, fast growth), Summer (drought, high yields), Fall (pest surge, rare seeds available), Winter (frost, heirloom seeds more common)
   - Season-specific seed pools: adjust seed availability per season (seasonal exclusive plants already configured; surface this as player-facing choice)
   - Season modifier stacking: daily challenge modifiers stack with seasonal effects for experienced players
   - Multi-season run mode: unlocked at 30 completed runs — play through Spring→Summer→Fall→Winter in sequence (4 mini-seasons of 3 days each), garden persists across seasons within the run, different hazards each season
   - Season selection persisted as player preference (default: random)
   - SeedSelectionScene UI update: season selector with visual preview (palette + icon + hazard warning), seed pool adjusts dynamically when season changes
   - Scoring bonus for multi-season runs: 2x base score multiplier for completing all 4 seasons
   - EventBus events: `season:selected`, `multiseason:transition`, `multiseason:completed`
   - Acceptance: Season selector visible and functional in SeedSelectionScene; seed pools change per season; seasonal hazards match selection; multi-season mode unlockable and playable; scoring reflects season choice; daily challenges still override season when active; multi-season saves correctly across season transitions
   - Files: src/scenes/SeedSelectionScene.ts (season selector UI), src/config/seasons.ts (season-specific seed pools), src/systems/HazardSystem.ts (seasonal hazard activation), src/systems/WeatherSystem.ts (seasonal weather patterns), src/systems/ScoringSystem.ts (multi-season scoring), src/config/unlocks.ts (multi-season unlock milestone), src/scenes/GardenScene.ts (multi-season transition logic), src/core/EventBus.ts (new events), src/config/saveSchema.ts (season preference + multi-season state)
