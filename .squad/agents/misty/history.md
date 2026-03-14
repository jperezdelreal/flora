## Core Context

FLORA project. Vite + TypeScript + PixiJS v8. User: joperezd.

## Learnings

### Harvest Particle Effects and Game Feel Juice (Issue #199, PR #208)
- **Architecture**: Enhanced ParticleSystem with object pooling and new particle types
- **Pattern**: Object pooling (ObjectPool<Graphics>, ObjectPool<Text>) to reduce GC pressure
- **Key file updated**:
  - `src/systems/ParticleSystem.ts` — Added object pools (50 graphics, 10 text pre-allocated), floatingText(), waterDroplets(), deceleration/oval shape support
  - `src/config/animations.ts` — Added 11 new constants (HARVEST_SEED_*, HARVEST_PULSE_*, WATER_DROPLET_COUNT, PEST_SQUISH_*, PLANT_BRIGHTEN_*)
  - `src/scenes/GardenScene.ts` — Enhanced triggerHarvestBurst() with seed drops and floating text, enhanced triggerWaterRipple() with droplets and plant brightness, added triggerScreenPulse() and triggerPestSquish()
- **Harvest effects**:
  - Colorful particle burst (16 particles in plant color with deceleration)
  - Seed drops (3 brown oval particles with gravity arc)
  - Floating "+X Seeds" text in gold
  - Brief screen pulse (10% white overlay, 150ms fade)
- **Watering effects**:
  - Water droplets (7 blue particles falling downward)
  - Plant brightness animation (scale 1.0 → 1.1 → 1.0)
  - Ripple rings (unchanged)
- **Pest removal**:
  - Squish particle burst (4 brown particles)
  - Relief glow (green pulse, 0.5s duration)
- **Performance optimization**: Max 200 graphics, 30 text objects pooled; objects recycled instead of destroyed
- **New ParticleSystem methods**: floatingText(x, y, message, color), waterDroplets(x, y, count)
- **Branch cleanup issue**: Experienced branch context switching when git checkout accidentally reverted working changes; used create file workaround to preserve completed code

### Plant Growth Animations System (Issue #197, PR #207)
- **Architecture**: Per-plant visual definitions in `src/config/plantVisuals.ts` define unique appearances for all 22 plant types
- **Pattern**: Keyframe-based animation with smooth interpolation (scale, alpha, saturation, yOffset) between growth stages
- **Key file created**:
  - `src/config/plantVisuals.ts` — Visual definitions with shape types (circle/oval/flower/star/bush/root/tall/wide), colors, and growth keyframes
- **Key file updated**:
  - `src/scenes/GardenScene.ts` — Replaced simple circle rendering with shape-specific draw functions (drawFlower, drawStar, drawBush, drawRoot, drawEllipse)
- **Rendering approach**: Procedural PixiJS Graphics shapes (no sprite assets needed for MVP)
  - Each plant shape type has custom drawing logic (petals for flowers, clusters for bushes, fronds for roots)
  - Health-based color desaturation applied via `adjustColorForHealth()` for wilting effect
  - Accessibility palette integration via `adjustColorForAccessibility()`
- **Animation details**:
  - Growth stage transitions use elasticOut easing with per-plant overshoot based on `swayIntensity`
  - Idle sway applies sine-wave rotation with per-plant intensity multiplier (0.4–1.8x)
  - Alpha transitions fade in plants as they grow
  - Health cache tracks changes and refreshes visuals when health drops >5% (prevents per-frame redraw)
- **Conventions applied**: All comments "TLDR:", lowercase GrowthStage enum values used in Record types
- **Performance optimization**: Health change detection uses cached values to avoid redrawing every frame
- **22 plant visual identities**:
  - Common: tomato (circle), lettuce (wide), carrot (root), radish (root), pea (tall)
  - Uncommon: sunflower (flower), mint (bush), pepper (oval), basil (bush), cucumber (oval), blueberry (bush)
  - Rare: frost_willow (tall), lavender (flower), orchid (flower), venus_flytrap (star)
  - Heirloom: heirloom_squash (wide), golden_marigold (flower), ghost_pepper (oval), moonflower (flower)

### Event Listener Cleanup Pattern (PR #25 review fix)
- **Architecture**: Scenes must clean up their own event listeners in `destroy()` to prevent accumulation on scene transitions
- **Pattern**: Store bound function reference as class field (e.g., `private boundOnKeyDown: (e: KeyboardEvent) => void`), use it in `addEventListener`, and `removeEventListener` in `destroy()`
- **Reference implementation**: `src/ui/Encyclopedia.ts` lines 35, 114-124, 385 shows the correct pattern
- **Files touched**: `src/scenes/GardenScene.ts` (keyboard shortcuts cleanup), `src/ui/SeedInventory.ts` (unused import removal)

### Unlock System & Meta-Progression (Issue #33, PR #44)
- **Architecture**: UnlockSystem follows EncyclopediaSystem localStorage patterns for persistence
- **Pattern**: Milestone tracking with typed events via EventBus; UI components subscribe to unlock events
- **Key files created**:
  - `src/systems/UnlockSystem.ts` — Core unlock logic with localStorage persistence
  - `src/config/unlocks.ts` — Milestone definitions for 3 progression types (harvested, matured, diversity)
  - `src/ui/UnlockNotification.ts` — Toast-style popup following DiscoveryPopup pattern
- **Key files updated**:
  - `src/ui/HUD.ts` — Added unlock progress indicator at bottom (expanded height to 90px)
  - `src/ui/ToolBar.ts` — Added locked/unlocked states with lock icons, unlock animations (6-pulse highlight)
  - `src/systems/PlantSystem.ts` — Fixed to emit plant:matured events when reaching MATURE stage
  - `src/core/EventBus.ts` — Added plant:matured and milestone:unlocked events
- **Conventions applied**: All comments start with "TLDR:", localStorage key pattern `flora_*`, container lifecycle (getContainer/destroy)
- **Integration notes**: System ready for GardenScene integration; all tools start unlocked by default (MVP behavior)
- **Milestone thresholds**: Tier 1: 5 plants, Tier 2: 15 plants, Tier 3: 30 plants (tuned for first 10 runs per GDD §7)

### Title Screen & Main Menu (Issue #117, PR #144)
- **Architecture**: MenuScene implements Scene interface with state machine (title → main → settings → credits)
- **Pattern**: Layer-based rendering — each menu state has its own Container, toggled via `visible` property
- **Key file created**:
  - `src/scenes/MenuScene.ts` — Full menu scene: title screen, main menu, settings panel, credits
- **Key files updated**:
  - `src/scenes/BootScene.ts` — Transitions to 'menu' instead of 'seed-selection'
  - `src/scenes/index.ts` — Exports MenuScene
  - `src/main.ts` — Imports and registers MenuScene with SaveManager dependency
  - `src/systems/AudioManager.ts` — Added `getVolumes()` for settings panel to read current levels
- **Features**:
  - Title screen with bloom/glow logo, studio credit fade-in, "press any key" prompt
  - Firefly particles via ParticleSystem reuse (negative gravity, warm colors)
  - 5 menu items: New Run → SeedSelection, Continue → Garden (grayed if no save), Encyclopedia, Achievements, Settings
  - Settings: 4 volume sliders (draggable + keyboard), colorblind toggle, credits page
  - Full keyboard navigation: arrows, Tab, Enter, Esc across all states
  - Settings persist via SaveManager (SettingsSaveData with colorblindMode)
- **Conventions applied**: All comments "TLDR:", bound listener cleanup in destroy(), container lifecycle
- **Note**: Encyclopedia and Achievements menu items are placeholder — scenes not yet registered

### Encyclopedia Visual Polish with Card Layout (Issue #205, PR #212)
- **Architecture**: Beautiful card-based layout replaces simple list view
- **Pattern**: Filter/sort state machine with keyboard focus management and detail modal
- **Key file updated**:
  - `src/ui/Encyclopedia.ts` — Complete redesign: card grid, filters, sort, detail popup, animations
  - **New file**: `src/utils/plantRenderer.ts` — Shared rendering utilities for plant shape thumbnails
- **Card design**: 120×160px cards with plant sprite (mature stage), name, 1-4 star rarity, growth/water icons
- **Filter system**: Tabs for All/Common/Uncommon/Rare/Heirloom with visual state tracking
- **Sort options**: Name, Rarity, or Growth Time with ascending sort
- **Discovery counter**: Shows "Discovered: X / 22 (Y%)" at top
- **Detail popup**: Modal overlay with large plant sprite, full stats, description, close button
  - Click discovered card or press Enter while focused to open
  - Esc key to close, semi-transparent backdrop
- **Undiscovered plants**: Dark silhouette with ? icon and star rarity hint
- **Hover effects**: Subtle glow border on discovered cards (rarity color)
- **New discovery animation**: 5-second sparkle pulse effect on newly discovered plants (tracked in `newDiscoveries` Set)
- **Keyboard navigation**:
  - Arrow keys navigate focused card index across 5-column grid
  - Enter opens detail popup for discovered plant
  - Focus ring rendered as white stroke around card
  - Auto-scroll to keep focused card in viewport
- **Visual polish**: Warm parchment background (0x2a2520), rarity-colored borders, cozy aesthetic
- **Plant rendering**: Uses `plantRenderer.ts` utility to draw procedural shapes (flower, star, bush, root, etc.)
  - Each of 22 plants gets distinct visual from `plantVisuals.ts` config
  - No sprite assets needed — all shapes drawn with PixiJS Graphics
- **Animation ticker**: Subscribed to Ticker.shared for sparkle pulse effect
- **Bug fix**: Added missing `GrowthStage.WILTING` keyframe to `plantVisuals.ts` (scale 0.9, alpha 0.7, saturation 0.3)
- **Conventions applied**: All comments "TLDR:", Ticker cleanup in destroy(), container lifecycle

### HUD Information Hierarchy Redesign (Issue #239, PR #256)
- **Architecture**: 3-tier visual hierarchy replacing flat 8-element panel
- **Pattern**: Responsive panel width with `resize(viewportWidth)` / `getPanelWidth()` API, event-driven tertiary visibility with auto-hide timer
- **Key file updated**:
  - `src/ui/HUD.ts` — Complete redesign: 3 tiers (Primary 20px, Secondary 14px, Tertiary 12px), responsive width (280-700px), warm cozy palette
  - `src/scenes/GardenScene.ts` — Updated HUD initialization and resize to use responsive `resize()`/`getPanelWidth()` instead of hardcoded 600px
- **Primary tier** (always visible): Day counter, Season name (centered), Actions remaining (right-aligned with anchor)
- **Secondary tier** (present, subdued): Score + last action points (left), Day progress bar (right)
- **Tertiary tier** (event-driven, auto-hides after 4s): Weather warning, Unlock progress bar, Grid info — hidden by default in a separate Container
- **Phase indicator** (preserved from #241): Phase bar below main panel, contextual hint below phase bar, flash animation on phase change
- **Color palette**: Parchment background (0x2a2520), earthy border (0x6b5b4e), warm text (#f5e6d3, #d4a574, #8a7a6a)
- **Responsive layout**: `layoutPanel(width)` redraws all backgrounds and repositions all elements for any panel width
- **Timer cleanup**: `tertiaryHideTimer` cleared in `destroy()` to prevent memory leaks
- **Conventions applied**: All comments "TLDR:", timer cleanup in destroy(), container lifecycle, no hardcoded dimensions
- **Concurrent development note**: Had to rebase onto main mid-task to pick up #241/#243 changes; phase indicator methods added to maintain compatibility

