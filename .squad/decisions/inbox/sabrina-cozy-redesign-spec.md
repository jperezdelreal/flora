# 🌿 Flora — "Cozy" Visual Redesign Specification

**Author:** Sabrina (Procedural Art Director)  
**Date:** 2025-07-25  
**Status:** Proposal — awaiting team review  
**References:** GDD §8 (Art Style), Issue feedback ("visualmente es muy mejorable," "poco cozy")

---

## Executive Summary

Flora plays well mechanically but looks like a tech demo wearing a cute hat. The player character is charming, the menu has good bones, but the garden — *where you spend 90% of your time* — feels like a spreadsheet with colored circles. This spec defines what "cozy" looks like for Flora, with exact colors, sizes, and timings so Brock and Misty can implement without guessing.

**The North Star:** The garden should feel like a warm illustration from a children's storybook — a place you want to *be in*, not just a grid you click on.

**Inspiration touchstones:** Stardew Valley (warmth + readability), Spiritfarer (soft gradients + emotional color), A Short Hike (roundedness + breathing animation), Unpacking (tactile satisfaction + attention to small detail).

---

## 1. Color Palette Redesign

### 1.1 The Problem

Current palette leans too heavily on material-design greens (`0x2d5a27`, `0x4caf50`, `0x66bb6a`) and raw browns (`0x5c3a1e`, `0x8d6e63`). These are *correct* colors for a garden, but they lack warmth. Material green is clinical; real gardens are messy, golden, warm. The dark background (`0x2d5a27`) absorbs all light — no breathing room.

### 1.2 Primary Palette (All Seasons Base)

| Role | Current | Proposed | Rationale |
|------|---------|----------|-----------|
| **Sky / Scene BG** | `0x2d5a27` (dark green) | `0xF0E6D3` (warm parchment) | Light base lets everything else pop. Garden is the focal point, not the void. |
| **Garden Border/Frame** | None | `0xC9B896` (warm khaki) | A subtle wooden-frame border around the garden grid grounds it as a physical space. |
| **Soil (Dry)** | `0xC4A882` (flat beige) | `0xD4B896` (warm sand) | Warmer, more golden — sun-baked earth. |
| **Soil (Moist)** | `0x5C3A1E` (cold dark brown) | `0x7A5C3D` (rich chocolate) | Warmer, redder — freshly watered garden soil. |
| **Soil (Rich)** | `0x3D2817` (almost black) | `0x5E3D26` (deep umber) | Still dark but with warmth — composted earth. |
| **Primary Text** | `#f5e6d3` (cream on dark) | `#5E4B3B` (warm brown on light) | Inverted: dark text on light backgrounds is warmer, more book-like. |
| **Secondary Text** | `#d4a574` (tan) | `#8B7355` (warm taupe) | Readable on parchment backgrounds. |
| **Accent (positive)** | `0x66bb6a` (material green) | `0x7FB069` (sage green) | Softer, more natural green. |
| **Accent (highlight)** | `0xffd54f` (sharp gold) | `0xF2CC8F` (warm honey) | Less neon, more golden hour. |
| **Accent (danger)** | `0xff5252` (material red) | `0xD4745F` (terracotta) | Danger should be "autumn warning," not "error state." |
| **UI Panel BG** | `0x2a2520` @ 0.92 (near-black) | `0xFAF3E8` @ 0.95 (warm cream) | Light panels feel like paper/parchment, not computer UI. |
| **UI Panel Border** | `0x6b5b4e` (dark brown) | `0xD4C4A8` (soft khaki) | Matches wooden-frame aesthetic. |

### 1.3 Per-Season Palette Variations

**SPRING — "Morning Dew"**

| Element | Hex | Description |
|---------|-----|-------------|
| Sky gradient top | `0xC5E8F0` | Pale robin-egg blue |
| Sky gradient bottom | `0xE8F5E0` | Misty green-white |
| Soil tint | `0xB8976A` | Rain-softened earth |
| Grass/edge accent | `0xA8D5A2` | Fresh new-growth green |
| Particle color | `0xFFC8D0` | Pale cherry blossom pink |
| Ambient light tint | `0xFFFFF0` | Clean, bright, neutral |
| Season accent | `0xE8A0B0` | Soft rose |

**SUMMER — "Golden Hour"**

| Element | Hex | Description |
|---------|-----|-------------|
| Sky gradient top | `0x7EC8E3` | Warm cerulean |
| Sky gradient bottom | `0xFFF3D6` | Hazy gold at horizon |
| Soil tint | `0xC9A06C` | Sun-baked warm sand |
| Grass/edge accent | `0x8DB86C` | Deep warm green |
| Particle color | `0xFFF5B8` | Warm firefly gold |
| Ambient light tint | `0xFFF8E0` | Golden warm overlay |
| Season accent | `0xF2CC8F` | Honey gold |

**FALL — "Warm Embers"**

| Element | Hex | Description |
|---------|-----|-------------|
| Sky gradient top | `0xE8C8A0` | Warm amber sky |
| Sky gradient bottom | `0xF0DFC8` | Pale cream at horizon |
| Soil tint | `0x8B6844` | Rich autumn earth |
| Grass/edge accent | `0xC8963C` | Golden-brown dying grass |
| Particle color | `0xD4855F` | Warm copper leaf |
| Ambient light tint | `0xFFF0D8` | Amber warm overlay |
| Season accent | `0xCC7744` | Burnt sienna |

**WINTER — "Quiet Hearth"**

| Element | Hex | Description |
|---------|-----|-------------|
| Sky gradient top | `0xC8D8E8` | Soft steel blue |
| Sky gradient bottom | `0xE8E4E0` | Warm grey-white (not cold blue) |
| Soil tint | `0x9E9080` | Frost-kissed grey-brown |
| Grass/edge accent | `0xB8B0A0` | Dormant beige |
| Particle color | `0xF0ECE8` | Warm white snow (NOT blue) |
| Ambient light tint | `0xF0EBE5` | Slightly warm — winter should feel "cozy cold," not "hostile cold" |
| Season accent | `0x8FAABE` | Dusty blue |

**Critical change:** Winter snow particles should be warm white `0xF0ECE8`, not cold blue. Cozy winter = warm blanket + snowfall viewed from inside, not blizzard.

---

## 2. Tile & Garden Visual Redesign

### 2.1 The Problem

Current tiles are flat colored rectangles with optional pebble/grass sprites. The grid reads as a spreadsheet. There's no sense that this is *soil* — living, textured, warm earth.

### 2.2 Empty Tile Design

**Shape:** Rounded-corner rectangles with 6px corner radius (currently sharp corners). The 4px padding between tiles should be filled with grass-green `0xA8C88A`, not left as background — this turns "grid gaps" into "grass paths between garden beds."

**Soil texture:** Each tile should have 2-3 subtle procedural variations:
- Tiny pebbles: 2-3 circles, 2-3px radius, 10-15% darker than base soil, random positions
- Soil cracks: 1-2 thin lines, 1px wide, 5-8% darker, organic curves (not straight)
- Grass tufts at edges: 2-3 small triangles on random edges, `0x8DB86C`, 3-5px tall

**Moisture visual:** Instead of binary dry/wet color, use a gradient:
- 0-25% moisture: Base soil color (dry, warm)
- 25-50%: 10% darker, 1 small "damp spot" circle in center (4px radius, 15% darker)
- 50-75%: 20% darker overall, 2 damp spots
- 75-100%: Full moist color, subtle sheen (1px highlight line at top edge, `0xFFFFFF` @ 0.08 alpha)

### 2.3 Planted Tile Design

**Visual distinction from empty:** When a seed is planted, the tile should show:
- A small mound of earth in the center: 12px wide, 4px tall arc, 10% darker than soil
- Radiating concentric soil lines from center (2 rings, 1px, 5% darker) — "freshly dug"
- The mound rises over the first 0.3s after planting (satisfying "tucked into earth" feel)

### 2.4 Grid Lines

**Remove hard grid lines entirely.** The 4px grass paths between tiles serve as natural dividers. Each tile's rounded corners create visual separation without needing explicit borders.

If grid reference is needed for planting guidance, show a very subtle dotted guide (`0x000000` @ 0.05 alpha, 1px dots, 8px spacing) that fades in on hover and fades out 0.5s after mouse leaves the garden area.

### 2.5 Ambient Tile Animations

To make the garden feel alive even when idle:

- **Grass sway:** The grass tufts on tile edges should sway gently. Amplitude: 2px horizontal, Period: 3-4s (staggered per tile so they don't sync). Use sine wave: `offsetX = sin(time * 0.8 + tileIndex * 0.7) * 2`
- **Occasional sparkle:** Rich soil (>75% quality) should occasionally show a tiny yellow sparkle (`0xF2CC8F`, 2px, 0.3s lifetime, 1 per 4-6 seconds per tile, random position within tile)
- **Worm wiggle:** 1 in 20 tiles randomly shows a tiny pink worm (`0xE8A0A0`, 4px long, 1px wide) that peeks up, wiggles for 1s, and retreats. Cycle: every 8-12 seconds, random tile. Pure charm.

---

## 3. Plant Visual Redesign

### 3.1 The Problem

Plants are procedural shapes (circles, ovals, triangles) that read as "colored blobs." A tomato and a pepper are both red circles of different sizes. The GDD says "no black outlines" but current outlines are dark and heavy. Plants don't feel like *plants* — they feel like geometric primitives.

### 3.2 Seed Stage — "Tucked In"

**Current:** Small brown circle (20px radius). Invisible against soil.  
**Proposed:**

- Visual: A slightly raised mound with a tiny seed peeking out. The seed is a small oval (8×5px), rotated 15-30° randomly, colored per species (use the plant's `accent` color, desaturated 40%).
- Above the mound: 1-2 tiny dirt particles floating upward (just planted feel), 2px, soil color, 0.5s lifetime.
- The seed should have a subtle "breathing" scale animation: scale oscillates 0.95-1.05 over 2s period. This tells the player "something is alive here."
- Clear visual difference from empty soil: the species-colored seed dot is the key differentiator.

### 3.3 Sprout Stage — "Hello World"

**Current:** Slightly larger green shape (28px). Generic.  
**Proposed:**

- Two small leaves emerging from center, angled outward at ±35°. Each leaf is a small ellipse (10×6px) with a 1px lighter center vein.
- Leaves colored in species' base green (not generic green — a tomato sprout is slightly yellow-green, a blueberry sprout is blue-green).
- Tiny stem visible: 1px wide, 8px tall, slightly darker than leaves.
- **Animation:** Leaves do a gentle "unfurling" when transitioning from seed (rotate from 0° to ±35° over 0.5s with ease-out). Then settle into gentle sway (amplitude: 3°, period: 2.5s, offset per leaf so they alternate).

### 3.4 Growing Stage — "Getting There"

**Current:** Larger shape (36px). Hard to distinguish species.  
**Proposed:**

- Species silhouette becomes identifiable here. Each plant type has a distinct shape:
  - **Root crops** (carrot, radish): Bushy top leaves, wide and low. 3-4 leaves radiating from center.
  - **Vine crops** (tomato, cucumber, pea): Taller, narrower. Visible stem with leaves at intervals.
  - **Herbs** (mint, basil, sage): Bushy, rounded. Multiple small leaves clustered.
  - **Flowers** (sunflower, lavender, orchid): Tall stem with bud forming at top (closed).
  - **Berries** (blueberry, strawberry): Medium bush shape with tiny green pre-fruit dots.
  - **Trees** (frost willow): Miniature trunk visible, branching top.
  - **Exotic** (venus flytrap, ghost pepper): Unique shapes — angular, dramatic.

- Color: Species base color at 70% saturation (not full — still growing).
- Small progress indicator: A tiny circular progress ring around the plant base (1px, `0xA8C88A` @ 0.3 alpha), filling clockwise to show growth %.

### 3.5 Mature Stage — "Ta-da!"

**Current:** Full-size shape (44px) with optional glow. Glow is good but the base shape is still a blob.  
**Proposed:**

- **Full species silhouette** with fruit/flower visible:
  - Tomato: Red fruit clusters (3 small circles, 5-6px, `0xE8574C`) hanging below green leaves
  - Sunflower: Large open flower head (20px), bright center `0xF2CC8F`, petals `0xFFD54F` radiating
  - Lavender: Tall purple flower spike (multiple small circles stacked vertically, `0x9E6BB0`)
  - Carrot: Bushy green top with orange root tip poking from soil, `0xE89050`
  - Etc. — each of the 22 species should have a unique mature visual

- **Color:** Full saturation. Mature plants should be the most vibrant things on screen.
- **Gentle "breathing":** Scale oscillates 0.98-1.02 over 3s. Plants feel alive.
- **Glow:** Keep the current mature glow system but change the color from generic green to the plant's `accent` color at 0.15 alpha. Glow radius: 24px (up from 20px).
- **Ready-to-harvest indicator:** Instead of (or in addition to) glow, add 1-2 tiny sparkle particles orbiting the plant. Sparkle color: `0xF2CC8F` (honey gold). Orbit radius: 18px, period: 4s. This makes mature plants *visually active* — you can scan the garden and instantly see what's ready.

### 3.6 Wilting Stage — "Help Me"

**Current:** Smaller, desaturated, lower alpha. Reads as "fading out."  
**Proposed:**

- Keep desaturation (30% sat) and slight droop (tilt 5-10° to one side).
- Add a visual "droop" animation: the plant leans slightly more over time. Max tilt: 15°.
- Color overlay: `0xC8B89C` (dusty beige) @ 0.25 alpha — like a sepia filter.
- Occasional "distress" particle: A small brown leaf falls from the plant (1 per 3 seconds, drifts down 20px and fades, `0xC8A878`).
- **No harsh visual punishment.** Wilting is "this plant needs help," not "you failed."

### 3.7 Plant Sway (All Stages)

**Current:** Sway amplitude 0.04 radians, frequency 1.2 Hz. This is too fast and robotic.  
**Proposed:**

- **Amplitude:** 0.02 radians (subtler — plants don't whip around)
- **Frequency:** 0.6-0.9 Hz (slower — gentle breeze, not wind tunnel)
- **Per-plant offset:** Each plant gets a random phase offset (0 to 2π) AND a slightly randomized frequency (±15%). This prevents the "synchronized dancing" effect.
- **Height-based:** Taller plants (sunflower, frost willow) sway more (0.03 radians); short plants (lettuce, radish) sway less (0.015 radians).
- **Wind gusts:** Every 15-25 seconds, all plants briefly increase sway amplitude by 2× for 2 seconds, staggered by column (left-to-right wave, 0.1s delay per column). Like a breeze passing through.

### 3.8 Species Distinction Strategy

With 22 species, players need to distinguish them at a glance. Three-channel identification:

1. **Silhouette** (shape): 8 distinct shape types (circle, oval, tall, wide, star, bush, flower, root). Each species maps to one. Even colorblind players can tell shapes apart.
2. **Color** (base + accent): Each species has a unique base color. No two species share the same hue within 30° on the color wheel.
3. **Size/proportion** (mature scale): Tall plants are visually taller; root crops are wider; herbs are compact.

A quick reference table for the 22 species should be visible in the encyclopedia. On the garden grid, species name appears as a small floating label (10px, warm brown, 50% alpha) 4px above the plant when hovered. No label clutter otherwise.

---

## 4. UI/HUD Redesign

### 4.1 The Problem

Current HUD: dark panels (`0x2a2520`) with thin brown borders, cream text. Functional but cold — feels like a debug overlay, not part of the game world. The dark-on-dark aesthetic is "gaming UI" not "cozy storybook."

### 4.2 Panel Style — "Paper & Wood"

**Background:** `0xFAF3E8` (warm cream/parchment) @ 0.92 alpha  
**Border:** `0xD4C4A8` (soft khaki) @ 2px width, with 8px corner radius (rounded!)  
**Drop shadow:** `0x8B7355` @ 0.12 alpha, offset (2px, 3px), blur 6px — subtle lift  
**Inner padding:** 12px all sides (currently too tight in places)

Panels should feel like notes pinned to a corkboard or labels on mason jars — part of the garden aesthetic, not a computer interface.

### 4.3 Typography — "Warm & Readable"

**Font family priority:** `'Nunito', 'Quicksand', 'Comfortissimo', system-ui, sans-serif`  
(Nunito and Quicksand are free Google Fonts, rounded sans-serifs that feel hand-drawn without sacrificing readability. Load via CDN or bundle.)

If custom fonts aren't feasible for MVP, use `'Segoe UI', 'Helvetica Neue', Arial, sans-serif` — but set `letter-spacing: 0.5px` to add airiness.

| Tier | Current Size | Proposed Size | Current Color | Proposed Color | Weight |
|------|-------------|---------------|---------------|----------------|--------|
| **Title** | 20px | 24px | `#f5e6d3` | `#5E4B3B` (warm brown) | Bold (700) |
| **Heading** | 14px | 16px | `#d4a574` | `#7A6550` (medium brown) | SemiBold (600) |
| **Body** | 12px | 14px | `#8a7a6a` | `#8B7355` (warm taupe) | Regular (400) |
| **Caption** | 10-11px | 12px | `#8a7a6a` | `#A09080` (light taupe) | Regular (400) |

**Key change:** Dark text on light backgrounds, not light text on dark backgrounds. Every cozy game reference (Stardew, Spiritfarer, A Short Hike) uses warm dark-on-light for in-world UI.

### 4.4 Button Style — "Friendly Pill"

**Shape:** Pill-shaped (full border-radius, i.e., `height / 2` corner radius). Minimum size: 48×48px touch target.

| State | Fill | Border | Text | Scale |
|-------|------|--------|------|-------|
| **Default** | `0xE8DCC8` (warm beige) | `0xC9B896` 2px | `#5E4B3B` | 1.0 |
| **Hover** | `0xF2E8D4` (lighter cream) | `0xD4C4A8` 2px | `#5E4B3B` | 1.04 |
| **Active/Pressed** | `0xD4C4A8` (darker beige) | `0xB8A888` 2px | `#5E4B3B` | 0.97 |
| **Selected** | `0xC5DEB5` (soft sage) | `0x7FB069` 2px | `#4A6A3A` | 1.0 |
| **Disabled** | `0xE8E0D8` (grey beige) | `0xD0C8C0` 1px | `#B0A898` | 1.0 |

**Hover transition:** 0.15s ease-out (currently 0.12s — nearly the same, just ensure smooth)  
**Click feedback:** Scale to 0.97 over 0.06s, bounce to 1.0 over 0.15s (elastic ease)

### 4.5 Toolbar Redesign

**Current:** 80×80px buttons at screen bottom with emoji icons (🌱, 💧, etc.)

**Proposed changes:**
- Reduce button size to 64×64px — current is oversized and eats garden space
- Round corners: 12px border radius (currently sharp or minimal)
- Background: `0xFAF3E8` (parchment) — match panel style
- Selected tool: Soft sage background `0xC5DEB5` with thicker border `0x7FB069` 3px
- Tool icon size: Keep 36px emoji but consider adding a subtle circular background `0xF0E6D3` behind each emoji (48px circle, 0.5 alpha) for visual grounding
- Separator lines: Replace hard lines with 8px gaps — let spacing do the work

### 4.6 HUD Layout — "Breathe"

**Principle:** The HUD should use ≤15% of screen real estate. The garden is the star.

**Top-left info panel:**
- Current: Compact block with Day, Season, Actions, Score all stacked
- Proposed: Horizontal strip along top edge, not a block. Items flow left-to-right with 16px gaps:
  `[🌱 Day 4/12] · [☀️ Summer] · [💧 3 actions left] · [⭐ 142 pts]`
- Panel: `0xFAF3E8` @ 0.88 alpha, 32px tall, 8px corner radius, full-width or content-width
- This frees up the left side for garden view

**Bottom toolbar:** Keep at bottom, centered. Max width: 400px. Don't stretch full-width.

**Right panel (seed inventory):** Should slide in from right when needed, not be always visible. When hidden, show a small tab `[🌱]` that the player clicks to expand. This maximizes garden view.

---

## 5. Animation & Feedback

### 5.1 Ambient (Always Running)

| Animation | Description | Timing | Visual |
|-----------|-------------|--------|--------|
| **Plant sway** | All plants gently rock | 0.6-0.9 Hz, 0.02 rad amplitude | Per section 3.7 |
| **Grass tuft sway** | Tile-edge grass wiggles | 0.3-0.5 Hz, 2px amplitude | Sine wave, per-tile offset |
| **Cloud drift** | 2-3 soft white clouds cross sky above garden | 60-90s crossing time, top 15% of screen | `0xFFFFFF` @ 0.15 alpha, soft oval 80-120px wide |
| **Butterfly/bee** | Small colored shape follows bezier path across garden | 8-15s path, 1 on screen at a time, respawn after 5-10s | 6px, species-colored, gentle bob ±4px |
| **Sparkle on rich soil** | Tiny gold flash on high-quality tiles | 1 per 4-6s per qualifying tile | `0xF2CC8F`, 2px, 0.3s fade |
| **Seasonal particles** | Per-season ambient (petals/fireflies/leaves/snow) | Keep current system but with updated colors from §1.3 | Reduce particle rate by 30% — current is slightly busy |

### 5.2 Planting Feedback — "Satisfying Tuck"

When the player plants a seed:

1. **Soil splash** (0-0.15s): 4-6 tiny soil-colored particles (`0xC9A06C`) burst upward from tile center, 30px max height, gravity: 200 px/s², fade over 0.4s
2. **Seed drop** (0.05-0.2s): The seed sprite drops from 10px above tile center to center, ease-in, slight bounce at bottom (1px overshoot)
3. **Mound rise** (0.1-0.4s): Earth mound graphic rises from flat to 4px height, ease-out
4. **Tile pulse** (0-0.3s): Tile briefly brightens 15%, then returns to normal over 0.3s
5. **Subtle screen response:** Very gentle camera nudge — 1px downward, returns over 0.2s. Barely perceptible but adds weight.

**Audio cue (for audio team):** Soft "tup" — soil compression sound, ~0.15s

### 5.3 Watering Feedback — "Gentle Rain"

When the player waters a plant:

1. **Water arc** (0-0.3s): A small arc of blue-white (`0x9ECFEF`) dots (5-7 particles) traveling from the watering can position toward the plant tile, following a parabolic path
2. **Splash ring** (0.2-0.5s): 2 concentric ripple rings expand from tile center. Inner ring: 14px max radius, outer: 24px. Color: `0x9ECFEF` @ 0.3 alpha, fading to 0 over 0.4s
3. **Soil darkening** (0.2-0.8s): Tile color smoothly transitions 15% darker (toward moist color) over 0.6s
4. **Plant brightening** (0.3-0.8s): Plant saturation increases 15% over 0.5s, then settles to +5% (permanently more vibrant until dry)
5. **Droplet drip** (0.3-0.6s): 2-3 tiny droplets (`0xB8DFEF`, 2px) fall from plant leaves, slight horizontal drift, 15px drop distance

### 5.4 Harvest Feedback — "Celebration!"

This should be the most rewarding moment in the game. When the player harvests a mature plant:

1. **Plant pop** (0-0.15s): Plant scales to 1.3× over 0.1s, then rapidly shrinks to 0 over 0.2s (satisfying "pop" feel)
2. **Harvest burst** (0.05-0.5s): 12-16 particles burst radially from plant center:
   - 8 particles in plant's accent color (species-specific celebration)
   - 4 particles in `0xF2CC8F` (gold sparkle — universal reward color)
   - 2-4 tiny leaf shapes in plant's base green
   - Speed: 120-180 px/s, gravity: 150 px/s², lifetime: 0.6-0.9s
3. **Score float** (0.1-1.5s): Score value rises from harvest point. Font: 18px bold, color `0xF2CC8F` (honey gold), rises 30px over 1.2s, fades over last 0.3s. Slight ease-out (decelerating rise).
4. **Seed drop** (0.3-0.7s): 1-3 small seed sprites (per species color) drop from burst center, bounce once on the tile (3px bounce height), then float toward the seed inventory panel over 0.5s (guided path, not linear).
5. **Tile refresh** (0.2-0.6s): Harvested tile returns to empty-soil visual with a brief "settling" animation — soil color lightens slightly then returns to base.
6. **Screen shake** (0-0.15s): Keep current system. Amplitude: 3px (not more — cozy, not violent). Duration: 0.12s.

**Rarity escalation:** Rare and heirloom harvests should have MORE particles (20+), a brief golden ring flash (`0xF2CC8F`, 40px radius, 0.3s), and hold the score float 0.5s longer.

### 5.5 Pest Arrival — "Uh Oh (but cute)"

Pests should be concerning but not alarming:

1. **Pest crawl-in** (0-0.5s): Pest sprite (small, 8px) enters from tile edge, wobbling along a curved path to the plant. Speed: 20 px/s. Wobbly sine overlay ±2px.
2. **Plant shudder** (0.4-0.7s): Affected plant does a quick shiver (3 rapid ±1px x-offsets over 0.2s), then resumes normal sway.
3. **Warning indicator:** Small `!` icon (12px) appears above the plant, colored `0xD4745F` (terracotta), with a gentle pulse (0.8-1.0 alpha, 1.5s period). NOT a flashing red alarm.
4. **Tile tint:** Affected tile gets a very subtle warm tint overlay — `0xD4745F` @ 0.06 alpha. Barely there, but enough to spot at a glance.

### 5.6 Idle State (5+ Seconds of No Input)

When the player stops interacting for 5 seconds:

1. **Wind gust** passes through garden (per section 3.7 wind gust spec)
2. **Camera breathe:** Very subtle zoom oscillation — 0.998 to 1.002 over 8s period. The entire scene gently "breathes."
3. **Random charm event** (one of, every 10-20 seconds):
   - A small bird (`0x8B7355`, 6px) lands on a random plant for 3s, bobs head, flies away
   - A ladybug (`0xD4745F` + `0x3A3A3A` dots, 4px) crawls across a tile edge
   - A water droplet falls from a recently watered plant's leaf
   - A tiny mushroom (`0xE8DCC8`, 4px) briefly appears at a tile corner, then retreats

These are pure charm — no gameplay effect. They reward patience and make the garden feel inhabited.

### 5.7 Season Transition

**Current:** 2-second color lerp. This is good but could be more.  
**Proposed addition:**

Over the 2-second transition:
- Current season's ambient particles accelerate offscreen (wind carries them away over 0.5s)
- 0.3s of calm (no particles)
- New season's particles begin (slowly ramping from 0 to full rate over 1.2s)
- A subtle vignette (`0x000000` @ 0.08 alpha at edges) pulses in and out during transition — like blinking

---

## 6. Implementation Priority

### P0 — "Transform the Feel" (Biggest impact, least code)

These changes will make Flora feel cozy *immediately* with relatively small code changes:

| # | Change | Impact | Effort | Notes |
|---|--------|--------|--------|-------|
| 1 | **Light background** — Change scene BG from `0x2d5a27` to `0xF0E6D3` | HUGE — immediately feels warmer | ~1 line + UI text color inversion | The single biggest visual win |
| 2 | **Rounded tile corners** — Add 6px border-radius to all tiles | HIGH — removes "spreadsheet" feel | Small — PixiJS Graphics roundRect | Changes garden from grid to garden beds |
| 3 | **Grass paths between tiles** — Fill 4px gaps with `0xA8C88A` | HIGH — tiles feel planted in ground | Small — background rect behind grid | Turns "gaps" into "paths" |
| 4 | **Plant sway slowdown** — Reduce frequency from 1.2 to 0.7 Hz, amplitude to 0.02 | MEDIUM — plants feel natural | 2 constants | Removes robotic synchronized sway |
| 5 | **UI panel inversion** — Light panels `0xFAF3E8`, dark text `#5E4B3B` | HIGH — removes "dark game UI" feel | Medium — touch multiple files | Storybook aesthetic |
| 6 | **Button pill shape** — Full border-radius on all buttons | MEDIUM — friendly, inviting | Small — roundRect with height/2 radius | Every cozy game does this |
| 7 | **Warm soil colors** — Update soil hex values per §1.2 | MEDIUM — earth feels alive | Config change | Golden vs. grey-brown |

**P0 estimated effort:** 2-3 focused sessions. These 7 changes will make Flora look like a different game.

### P1 — "Add Depth & Polish" (Makes it feel complete)

| # | Change | Impact | Effort |
|---|--------|--------|--------|
| 8 | **Distinct plant species silhouettes** (§3.4, §3.5) | HIGH — plants become identifiable | HIGH — requires per-species drawing code |
| 9 | **Harvest celebration particles** (§5.4) | HIGH — most satisfying moment | MEDIUM — extend existing particle system |
| 10 | **Planting soil splash** (§5.2) | MEDIUM — satisfying feedback | SMALL — simple particle burst |
| 11 | **Watering ripple upgrade** (§5.3) | MEDIUM — more tactile | SMALL — extend existing ripple |
| 12 | **Cloud drift ambient** (§5.1) | MEDIUM — depth and atmosphere | SMALL — 2-3 moving sprites |
| 13 | **Idle charm events** (§5.6) | MEDIUM — garden feels alive | MEDIUM — multiple small sprites + timers |
| 14 | **HUD layout to horizontal strip** (§4.6) | MEDIUM — more garden visible | MEDIUM — layout restructure |
| 15 | **Updated seasonal palettes** (§1.3) | MEDIUM — seasons feel distinct | SMALL — config values |
| 16 | **Toolbar size reduction** (§4.5) | SMALL — more garden visible | SMALL — size constants |

### P2 — "Nice-to-Have Refinements"

| # | Change | Impact | Effort |
|---|--------|--------|--------|
| 17 | **Custom font (Nunito/Quicksand)** | SMALL — subtle but polished | SMALL — font load + CSS |
| 18 | **Camera breathe on idle** (§5.6) | SMALL — subliminal cozy feel | SMALL — sine on camera zoom |
| 19 | **Wind gust system** (§3.7) | SMALL — naturalistic detail | MEDIUM — staggered per-column timing |
| 20 | **Soil moisture gradient** (§2.2) | SMALL — visual depth | MEDIUM — multi-step color logic |
| 21 | **Seed-to-inventory guided path** (§5.4) | SMALL — juicy detail | MEDIUM — bezier path animation |
| 22 | **Worm charm animation** (§2.5) | TINY — pure delight | SMALL — single sprite + timer |
| 23 | **Pest cute crawl-in** (§5.5) | SMALL — replaces jarring appearance | MEDIUM — pathing + wobble |
| 24 | **Season transition vignette** (§5.7) | SMALL — cinematic touch | SMALL — overlay alpha tween |

---

## Appendix A: Quick-Reference Color Swatches

### Base Palette (Season-Independent)

```
Parchment BG:       #F0E6D3   ████
Panel BG:            #FAF3E8   ████
Panel Border:        #D4C4A8   ████
Garden Frame:        #C9B896   ████
Grass Path:          #A8C88A   ████
Soil (dry):          #D4B896   ████
Soil (moist):        #7A5C3D   ████
Soil (rich):         #5E3D26   ████
Primary Text:        #5E4B3B   ████
Secondary Text:      #8B7355   ████
Accent Green:        #7FB069   ████
Accent Gold:         #F2CC8F   ████
Accent Danger:       #D4745F   ████
Button Default:      #E8DCC8   ████
Button Hover:        #F2E8D4   ████
Button Selected:     #C5DEB5   ████
```

### Season Accent Colors

```
Spring:  #E8A0B0  (soft rose)        ████
Summer:  #F2CC8F  (honey gold)       ████
Fall:    #CC7744  (burnt sienna)      ████
Winter:  #8FAABE  (dusty blue)        ████
```

---

## Appendix B: Animation Timing Cheat Sheet

| Animation | Duration | Easing | Notes |
|-----------|----------|--------|-------|
| Plant sway | 1.1-1.7s period | Sine | Per-plant random offset |
| Grass sway | 2.5-3.5s period | Sine | Per-tile offset |
| Seed breathe | 2s period | Sine | 0.95-1.05 scale |
| Sprout unfurl | 0.5s | Ease-out | Rotation 0° → ±35° |
| Plant growth pop | 0.4s | Back-out (1.25 overshoot) | Keep current |
| Harvest pop | 0.3s total | Ease-in (scale up), linear (shrink) | 0.1s up, 0.2s down |
| Harvest particles | 0.6-0.9s | Gravity (150 px/s²) | 12-16 particles |
| Score float | 1.2s | Ease-out (rise) | 30px rise, fade last 0.3s |
| Planting soil splash | 0.4s | Gravity (200 px/s²) | 4-6 particles |
| Water ripple | 0.4s | Ease-out (expand) | 2 rings, updated from 3 |
| Soil darken | 0.6s | Linear | Moisture color shift |
| Button hover | 0.15s | Ease-out | 1.0 → 1.04 scale |
| Button press | 0.06s down, 0.15s up | Linear down, elastic up | 1.0 → 0.97 → 1.0 |
| Cloud drift | 60-90s | Linear | 0.15 alpha, top 15% screen |
| Wind gust | 2s | Ease-in-out | 2× sway amplitude, per-column stagger |
| Camera breathe | 8s period | Sine | 0.998-1.002 zoom |
| Season transition | 2s | Ease-in-out | Keep current |
| Idle charm event | 3-5s per event | Varied | Every 10-20s |

---

## Appendix C: What NOT to Change

Some things are already good and should be preserved:

1. ✅ **Player character design** — The cute gardener with straw hat is the best visual element. Don't touch it (except possibly soften the outline weight from 2px to 1.5px).
2. ✅ **Menu parallax** — The layered hills + fireflies are already cozy. Update colors to match new palette, but keep the structure.
3. ✅ **Event-driven animation architecture** — The AnimationSystem + ParticleSystem + EventBus pattern is clean and extensible. All new animations should use this same pattern.
4. ✅ **Growth stage system** — 5 stages (seed → sprout → growing → mature → wilting) is the right granularity.
5. ✅ **Seasonal palette system** — The infrastructure for per-season colors is already built. We're just updating the values.
6. ✅ **Accessibility palettes** — Keep the colorblind-safe alternatives. Ensure all new colors are tested against deuteranopia and protanopia variants.

---

*"A cozy game's art direction isn't about what's pretty — it's about what feels safe. Every rounded corner, every warm color, every gentle animation is a promise to the player: you belong here, and nothing will hurt you."*

— Sabrina, Procedural Art Director
