# Flora — Game Design Document

**Status:** Initial Design v1.0  
**Last Updated:** 2026-03-11  
**Game Designer:** Yoda  
**Team:** First Frame Studios

---

## 1. Game Overview

**Title:** Flora  
**Genre:** Cozy Gardening Roguelite  
**Platform:** Web Browser (responsive)  
**Target Audience:** Players aged 13+; fans of casual/cozy games (Stardew Valley, A Short Hike) who enjoy light progression systems and discovery  
**Elevator Pitch:**  
*Plant seeds, tend your garden, and survive seasonal challenges in a roguelite where every run grows new memories. Lose your garden each season, but keep what you discover. A gentle game about growth, patience, and the joy of watching things bloom.*

**Core Fantasy:**
- I am a gardener nurturing a living space across one season
- Each run feels manageable in 20–40 minutes
- My choices matter: what I plant, when I harvest, how I prepare for challenges
- I gradually unlock rarer seeds and tools, making future runs more expressive
- Failure is never harsh—just "next season, I'll try something different"

---

## 2. Vision & Pillars

### Design Philosophy
**Cozy First, Challenge Second.** The game's tone is relaxing and inviting, but progression requires thoughtful decision-making and mild resource management. We are *not* building a stressful roguelike; we are building a game where tending a garden feels good.

### Core Pillars

**Pillar 1: Cozy but Intentional**
- Ambient, non-threatening art and audio; no jump scares, time pressure, or punishing difficulty
- Every action (planting, watering, harvesting) should feel satisfying
- Failure is reframed as "exploration" — losing a run teaches you what not to do next time
- The garden is a safe space; challenges are environmental puzzles, not combat

**Pillar 2: Every Run is Different**
- Randomized plant selection at season start; players discover new plant synergies each run
- Weather varies; seasonal hazards (drought, frost, pests) create unique scenarios
- Player choices cascade: what you plant early determines what strategies are available mid-run
- Progression unlocks new seed types, expanding strategic depth over time

**Pillar 3: Grow & Discover**
- Each season, players gradually unlock a botanical encyclopedia of seeds, tools, and garden features
- Discovery is rewarded: rare seeds have unique properties; unlocking them feels special
- Incremental empowerment: new tools make gardening faster/easier; new seeds make strategies possible
- Long-term progression is meta (persistent between runs); short-term progression is tactical (within a run)

**Pillar 4: The Garden Reflects You**
- Your aesthetic choices (plant arrangement, colors, tools) are visible and expressive
- While the garden resets each season, the *memory* of what grew there persists
- The botanical encyclopedia grows with your playtime; it's a monument to your exploration

---

## 3. Core Loop

### One Season Run (20–40 minutes)

**Phase 1: Seeding** (3–5 min)
- Season begins with your garden plot empty
- You see 4–6 random plant options and choose which seeds to plant
- You have a limited number of planting actions (e.g., 8–12 tiles in MVP)
- You arrange seeds strategically based on:
  - Growth time (fast vs. slow crops)
  - Water requirements (drought-tolerant vs. thirsty)
  - Synergies (e.g., "tall plants shade short ones"; "nitrogen fixers help neighbors")
  - What challenges you expect (e.g., frost-resistant if winter is coming)

**Phase 2: Tending** (12–25 min)
- Each in-game day (real-time ~20–30 seconds), the garden state advances:
  - Plants grow
  - Soil moisture depletes
  - Hazards appear (pests, weather, weeds)
- Player actions per day:
  - **Water** 1–2 plants (costs time/energy per day)
  - **Harvest** mature plants (yields seeds + food)
  - **Remove pests** (hand-pick or use tools)
  - **Build** garden infrastructure (trellises, mulch, compost)
  - **Rest** (skip the day, gather energy)
- No resource meter or "stamina"; actions are free but time is limited (season ends after ~10–12 in-game days)

**Phase 3: Harvest & Reflection** (2–5 min)
- Season ends; surviving plants mature
- You harvest and collect new seeds (rare drops from healthy plants)
- The encyclopedia updates with any new discoveries
- Unlocks are awarded if milestones hit (e.g., "grow 3 crops to full maturity" → new tool)
- Next season button appears; loop repeats with your unlocks intact

### Moment-to-Moment Feel
- Clicking a plant to water feels tactile (ripple effect, plant brightens)
- Harvesting a fully-grown plant is rewarding (satisfying pop, seed drops, catalog updated)
- Pest removal is puzzle-solving, not reflexes (choose which plant to save, plan ahead)
- Time passes visually (sky color, plant growth animation); no UI countdown
- The soundscape is ambient: subtle music, soft water droplets, happy chirps when harvesting

---

## 4. Roguelite Elements

### What Resets Each Run
- Garden layout (empty plot)
- Season weather (different hazards)
- Plant availability (4–6 random seed options)
- Individual plant states (growth, health)

### What Persists (Meta-Progression)
- **Seed Encyclopedia:** All seeds you've ever grown remain discoverable
- **Tool Unlocks:** New gardening tools (better watering can, pest spray, etc.) unlock permanently
- **Garden Upgrades:** Larger plot size, new soil types, garden structures (greenhouse, compost bin)
- **Seasonal Bonuses:** Unlock seasonal modifiers (longer season, better plant stats, new hazards)
- **Challenge Milestones:** Achievements that grant cosmetics or gameplay bonuses

### Progression Arc (Per Session)
**Session = 5–10 runs over 1–2 hours**

| Runs | Discoveries | New Mechanics | Player Power |
|------|-------------|---------------|--------------|
| 1–2  | 8–10 common seeds, basic tools | Watering, harvesting, pests | Baseline: water & wait |
| 3–5  | Rare seeds (unusual colors, growth times), soil upgrades | Compost system, plant synergies | Medium: can plan ahead, adjust mid-run |
| 6–10 | Heirloom seeds (bonus properties), garden structures | Seasonal modifiers, advanced tools | High: execute complex strategies |

### Why Roguelite?
- **Discovery is rewarding:** Unlocking rare seeds feels like loot drops in traditional roguelikes
- **Runs feel distinct:** Random seed availability forces fresh strategies
- **Progression is visible:** The encyclopedia fills up; new tools appear in your garden
- **Accessibility:** A failed run is "this strategy didn't work" not "I lost 10 hours of progress"

---

## 5. Garden Mechanics

### Plant System

**Plant Anatomy:**
- **Growth Time:** 3–8 in-game days (configurable per plant)
- **Water Need:** 1–5 waterings per life cycle (some plants need daily watering; others tolerate drought)
- **Maturity:** Plant stops growing and enters "ready to harvest" state; visible visual change (color brightens, outline glow)
- **Yield:** 1–3 seeds per harvest + bonus fruit/food for the aesthetic (no economy, just flavor)
- **Health:** 0–100% (depletes if under-watered, damaged by pests, or exposed to harsh weather)

**Example Plants (MVP: 15–20 types):**
- **Tomato** (Classic): 5-day growth, daily watering, moderate health, 2 seeds
- **Lettuce** (Starter): 3-day growth, every-other-day watering, fragile (pests target), 2 seeds
- **Carrot** (Root Crop): 6-day growth, weekly watering, hardy, 1 seed (slow payout, high reward)
- **Sunflower** (Tall): 7-day growth, moderate water, blocks pests from shorter plants, 3 seeds (synergy plant)
- **Mint** (Herb): 4-day growth, daily water, pest-resistant, bonus aesthetic (decorative)
- **Frost Willow** (Cold-Resistant, Unlock): 5-day growth, weekly water, survives frost event, 1 seed (strategic unlock)

### Soil & Environment
- **Soil Quality:** Ranges 0–100%; better soil speeds growth and increases health
- **Compost Mechanic:** Harvest waste (dead plants, dropped leaves) → compost → spread compost to restore soil over time
- **Seasons:** Spring (mild), Summer (drought risk), Fall (pest surge), Winter (frost hazard) — different hazards each season
- **Lighting:** Shadows from tall plants; some plants prefer shade or sun
- **Spacing:** Plants need room; too dense → slower growth and pest vulnerability

### Hazards (Non-Combat)
All hazards are **puzzles to solve**, not enemies to fight.

**Pest Events:**
- Aphids, slugs, beetles appear on ~day 6–8 of season
- Player sees pest icon on affected plant
- Choice: remove pest (click to pick off, costs 1 action), spray (use tool, faster), or sacrifice plant (let it die, compost it)
- Healthy plants resist pests better (health = % chance to avoid infestation)

**Weather Hazards:**
- **Drought** (Summer): Watering needed more frequently; soil dries fast
- **Frost** (Winter): Sensitive plants wilt; player must harvest before frost hits or lose crop
- **Heavy Rain** (Spring): Plants waterlog if over-watered; player balances moisture
- Visual warning 1–2 days before; player prepares

**Weeds:**
- Appear randomly; occupy planting space or slow nearby growth
- Player removes manually (click) or ignores (free compost later)

**No Combat.** All hazards are resource management + planning puzzles.

---

## 6. Exploration & Discovery

### What Players Discover
- **Seed Varieties:** 40–60 plant types across unlocks (MVP: 15–20)
- **Plant Synergies:** Tall plants shade others; legumes enrich soil; certain combos unlock special "polyculture bonus"
- **Tool Types:** Watering cans (different speeds), pest spray, soil tester, compost bin, trellis
- **Garden Structures:** Greenhouse (extends season), compost bin (accelerates decomposition), rain barrel (improves drought resistance)
- **Seasonal Secrets:** Rare plants only appear in specific seasons or after specific achievements

### Incentive Loop
1. **See a new seed option** → Plant it
2. **Grow it to maturity** → Unlock it (encyclopedia updates)
3. **Rare drop?** → Feel special, re-run to find it again
4. **Use new tool** → Garden feels different, strategies expand
5. Repeat 20+ times → Player feels invested

---

## 7. Progression & Unlockables

### Meta-Progression (Between Runs)
Tracked in persistent **Gardener's Journal** (accessible from main menu):

**Seed Collection:** Track which seeds you've discovered; rarity rating (common → rare → heirloom)

**Tools Acquired:**
- Starter Set: Basic watering can (slow), hand (free)
- Day 5 Unlock: Watering can+ (faster, larger range)
- Day 15 Unlock: Pest spray (saves time on infestations)
- Day 25 Unlock: Soil tester (reveals soil quality)
- Rare Unlock: Heirloom seeds (plants with bonus properties)

**Garden Plot Expansions:**
- MVP: 8×8 grid (64 tiles)
- Unlock A (10 runs): Expand to 10×10 (100 tiles)
- Unlock B (20 runs): Expand to 12×12 (144 tiles)
- Unlock C (50 runs): Add second garden plot (mini-game)

**Achievements (Cosmetics):**
- "Grow 10 Tomatoes" → Tomato-themed seed packet cosmetic
- "Harvest in Frost" → Winter gardening badge
- "Perfect Season" (no failed plants) → Heirloom seed guaranteed next run
- "Five-Plant Polyculture" (grow 5 different plants in one run) → Unlock Polyculture Bonus (synergy bonus visible in UI)

### Skill Expression
- **Players who master synergies** will plan multi-run gardens: "This run I prep soil; next run I plant the combo"
- **Players who prefer chill play** will plant random seeds and adapt; still rewarding
- **Completionists** will chase rare seeds and 100% the encyclopedia
- **Speedrunners** will optimize tool usage and timing

---

## 8. Art Style & Aesthetic

### Visual Language
- **Palette:** Warm, earthy, nature-inspired
  - Soil browns, plant greens, sky blues, accent flower colors (coral, lavender, gold)
  - No black outlines; soft edges; organic shapes
  - Color temperature shifts with season (golden summer, cool autumn, icy winter)

- **Pixel Art Style:** Tilebase + character-style animation
  - 16×16 base grid for tiles, 32×32 for large plants and player character
  - Smooth grow animation: plants transition from seed → sprout → full growth over 3–5 frames
  - Harvest pop: satisfying particle effect when collecting
  - Clean, minimalist UI; no screen clutter

- **Animation:** 
  - Plants sway gently in idle (growth progression visible)
  - Player character crouches to plant, stretches to reach tall crops
  - Water droplets fall and absorb into soil
  - Pest crawl across leaves; player hand flicks them off

- **Seasonal Visual Shifts:**
  - Spring: Soft pastels, fresh greens, light sky
  - Summer: Golden light, deeper greens, hazy background
  - Fall: Warm oranges, rust tones, cloudy sky
  - Winter: Cool blues, frost sparkle effects, bare branches in distance

### Why This Aesthetic?
Cozy games are *about* feeling. Our palette and animation timing should say "this is a safe place where growth happens." No harsh colors; no jarring movements. Every animation is a tiny promise: "your plants are okay."

---

## 9. Audio Design

### Music & Ambient Sound

**Compositional Approach:**
- Gentle, looping underscore (60–90 BPM; think lo-fi gardening hip-hop)
- No dramatic stings; cues are subtle (soft chime when plant matures, not orchestral fanfare)
- Seasonal themes: Spring lute, Summer flute, Fall cello, Winter strings

**Soundscape:**
- **Ambient Layer:** Soft wind, distant birds, rustling leaves (always playing)
- **Action Layer:** Water pour, soil tap, pest squish, harvest pop (contextual, short duration)
- **UI Layer:** Soft beep on menu interaction; never jarring

**Volume Hierarchy:**
- Ambient: 30% (present but not intrusive)
- Actions: 50% (rewarding but not startling)
- Music: 40% (supportive, never overwhelming)
- Total mix: Encourages relaxation, not focus

### SFX Direction
| Action | Sound | Tone |
|--------|-------|------|
| Plant seed | Soft soil tap, subtle chime | Hopeful |
| Water plant | Gentle pour, droplet absorption | Soothing |
| Pest appear | Low cricketSound, whoosh | Curious, not alarming |
| Harvest | Pop + chime + brief musical phrase | Joyful |
| Wilt/Die | Fade + sad xylophone note | Wistful, not tragic |

---

## 10. MVP Scope (Sprint 0)

**Goal:** Prove the core loop: plant → tend → harvest across one season. Prove that discovery and cozy progression feel good.

### What's IN MVP
- **Garden Plot:** 8×8 grid, one season (12 in-game days)
- **Plant Types:** 12 base plants (4 common, 4 uncommon, 2 rare, 2 heirloom unlocks)
- **Mechanics:**
  - Planting / watering / harvesting
  - Pest events (simple: appear on day 7, click to remove)
  - One weather hazard (drought; increases watering need)
  - Soil quality affects growth speed (basic feedback)
  - Encyclopedia (visual list of discovered seeds)
- **Tools:** Basic watering can, hand, pest remover (3 actions: water, harvest, remove pest)
- **Audio:** 1 ambient loop + 5 SFX (plant, water, harvest, wilt, pest appear)
- **UI:** Main menu, garden view, encyclopedia, season summary
- **Progression:** Unlock 1 new tool after first harvest, 1 new plant after first season
- **Session Loop:** 3–5 runs to feel meaningful progression

### What's OUT of MVP
- **Deferred Features:**
  - Garden expansion (secondary plot)
  - Complex synergies (polyculture bonus, shade mechanic)
  - Advanced tools (soil tester, compost bin, trellis)
  - Seasonal variety (all MVP runs same season)
  - Cosmetics / achievements
  - Save/load (single session only; new run each refresh)
  - Mobile optimization (desktop-first)

### Success Criteria
- Players complete 3–5 runs in one session ✓
- At least 1 new plant discovered per run ✓
- Harvesting a plant feels rewarding (audio + visual feedback works) ✓
- 40-minute playtime achievable without rushing ✓
- Encyclopedia grows; players feel progression ✓
- No frustration; all hazards are solvable by restart ✓

### Tech Stack (Pre-Set)
- **Framework:** Vite + TypeScript
- **Rendering:** PixiJS v8
- **Time Management:** Frame-based loop (60 FPS, deterministic state)
- **State:** Minimal; garden state is tile data + plant data + player state

### Assets Needed (Sprint 0)
- **Pixel Art:** 12 plants (idle + grow frames) + player character + UI tiles
- **Audio:** 1 ambient track (90 sec loop) + 5 SFX files
- **Data:** Plant configs (growth time, water need, yield), tool configs, seed rarities

---

## 11. Design Principles (Constraints)

**When in doubt, pick cozy over complex.**
- If a feature makes the game "more realistic" but less relaxing, cut it
- If a feature makes progression harder to see, cut it
- If a feature requires tutorial, it's too complex for MVP

**All failure is feedback, never punishment.**
- Dead plant? You learn what it needs; compost it and try again
- Pests won? That's a strategy to adjust; no time penalty
- Bad weather? Plan ahead next run; no "game over"

**Discovery > Grind.**
- Never ask players to repeat actions mindlessly
- Each new seed should feel like a small event (encyclopedia animation, visual difference)
- Session length should encourage stopping before fatigue sets in

**The garden is safe. Challenges are external.**
- Player has agency; hazards are solvable with information
- No instant-fail moments; always a path to salvage your crop
- Rest mechanic exists: if overwhelmed, skip the day and recharge

---

## 12. Success Metrics (Future, Post-MVP)

- **Retention:** 40%+ of players return for a 2nd session within 24h
- **Engagement:** Average 3–5 runs per session; 30–40 min session length
- **Discovery:** 50%+ of players unlock at least 5 unique plants in first session
- **Satisfaction:** 4.0+ stars on itch.io or similar; qualitative feedback emphasizes "cozy" and "relaxing"
- **Market Fit:** 200–500+ plays in first month (realistic for niche cozy game)

---

## Design Document Sign-Off

**Status:** Ready for Architecture Review  
**Next Steps:** 
1. Solo reviews for technical feasibility
2. Jango plans Sprint 0 timeline
3. Art spike on plant sprites
4. Audio spike on seasonal ambient tracks

**Authored by:** Yoda, Game Designer  
**Date:** 2026-03-11

---

*This document reflects the creative vision for Flora. All code decisions, asset production, and team planning should reference this GDD as the source of truth for "what is Flora."*
