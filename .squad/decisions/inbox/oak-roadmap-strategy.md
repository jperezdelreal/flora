# Decision: Strategic Roadmap for Post-Sprint 0 Development

**Date:** 2026-03-11  
**Decider:** Oak (Lead / Chief Architect)  
**Status:** Active  
**Context:** Sprint 0 complete. Roadmap exhausted. User requested powerful strategic vision for next phase.

---

## Strategic Vision

Flora is a **cozy gardening roguelite** where every run should feel distinct, meaningful, and rewarding. Sprint 0 delivered the technical foundation: scene system, garden grid, plant growth, basic hazards, encyclopedia, HUD, seasonal themes, and CI/CD. The game is playable but lacks **replayability, strategic depth, and progression clarity**.

### The Core Problem
Current state feels like a tech demo, not a compelling game loop:
- **No run variety:** Every run offers the same plants in the same order
- **No meaningful choices:** Plant anything, water everything, harvest when ready
- **No challenge:** Hazards are trivial; no tension or puzzle-solving
- **No sense of mastery:** No scoring, no milestones, no skill expression
- **No long-term hook:** Unlocks exist but feel disconnected; no save system means progress doesn't persist

### The Strategic Bet

**Thesis:** Players will return to Flora if runs feel *different enough* to explore new strategies, *challenging enough* to require thought, and *rewarding enough* to see progress accumulate.

To achieve this, we prioritize:
1. **Polish the core loop** (audio, unlocks) → Make existing mechanics feel complete
2. **Inject variety** (randomized seeds) → Force adaptation, create replayability
3. **Add clarity** (scoring, milestones) → Give players goals and feedback
4. **Deepen strategy** (hazards, synergies) → Reward mastery, create skill ceiling
5. **Enable retention** (save system) → Let progress persist across sessions

---

## Roadmap Rationale

### Priority Order (Why This Sequence?)

**Items 2-3: Audio + Unlock System** (Already in roadmap; kept as-is)
- **Why first:** These are polish and core loop completion. Audio makes everything feel better (cozy pillar). Unlocks create visible progression (roguelite pillar).
- **Dependencies:** None. Can run in parallel.
- **Impact:** Medium-High. Essential for "game feel" but don't change strategic depth.

**Item 4: Randomized Seed Selection & Run Seeding**
- **Why next:** This is the *single biggest replayability lever*. Forces players to adapt to what's available, creates run variety, enables "I wonder what seeds I'll get this time" anticipation.
- **Dependencies:** Requires unlock system (seed availability respects unlocks).
- **Impact:** **High**. Transforms game from deterministic puzzle to roguelite exploration.
- **Technical notes:** Deterministic seeding critical for debugging and potential future features (daily challenge, share run seed). Use weighted rarity pool (70/20/10 common/uncommon/rare). Seed selection UI can be simple (packet display) or elaborate (pre-run planning screen) — spec flexible for implementation.

**Item 5: Run Scoring & Milestone System**
- **Why here:** Once runs vary, players need a way to measure success. Scoring gives every run a "how did I do?" answer. Milestones create short-term goals ("get 500 points this run").
- **Dependencies:** None, but synergizes with randomized seeds (varied strategies = varied scores).
- **Impact:** Medium-High. Adds clear feedback loop, goal-setting, and sense of progression *within* a run.
- **Design notes:** Score breakdown is critical (show *why* you got X points). Avoid grindy milestones; focus on diversity and perfection bonuses (aligns with cozy philosophy).

**Item 6: Enhanced Hazard Mechanics & Puzzle Design**
- **Why middle priority:** Hazards currently exist but feel trivial. This item turns them into meaningful puzzles (telegraphed threats, mitigation strategies, trade-offs).
- **Dependencies:** None, but works best after scoring (hazards overcome = points).
- **Impact:** Medium. Adds tension and decision-making without violating cozy pillar (no instant-kill, always warning period).
- **Technical notes:** 3 pest types with unique behaviors (aphids spread, slugs target young, beetles damage mature). Weather telegraphs 2 days early. Hover tooltips explain threats. This creates skill expression: "I saw drought coming, so I planted drought-tolerant seeds."

**Item 7: Seed Synergies & Polyculture Bonus System**
- **Why later:** This is the skill ceiling. Once players understand basic loop, synergies reward optimization and planning.
- **Dependencies:** None, but best experienced after randomized seeds (synergies emerge from available pool).
- **Impact:** Medium-High. Creates mastery path, strategic depth, "aha" moments.
- **Design notes:** Start simple (adjacency bonuses). Avoid negative interactions in MVP (no competition for water/nutrients — cozy first). Encyclopedia hints at synergies ("Grows well near: Sunflower").

**Item 8: Persistent Save System & Session Management**
- **Why last:** Save system is retention infrastructure. Once the game loop is compelling (items 2-7), persistence makes progress meaningful across sessions.
- **Dependencies:** Requires finalized unlock schema, scoring schema, GameState structure.
- **Impact:** **High** (long-term). Enables multi-session play, reduces drop-off, supports future features (cloud sync, achievement tracking).
- **Technical notes:** localStorage only (no backend). Auto-save every 60s + end of run. Export/import for backup. Versioned schema with migration or graceful reset on breaking changes.

---

## Architectural Considerations

### Key Technical Decisions

**1. Deterministic Run Seeding**
- All randomness tied to seed value (e.g., hash of timestamp + player ID)
- Enables: Reproducible runs for debugging, future daily challenge mode, share run seeds
- Implementation: `src/systems/SeedSelectionSystem.ts` uses seeded RNG (not `Math.random()`)

**2. Scoring System Architecture**
- Event-driven: EventBus emits scoring events (`plant:harvested`, `hazard:overcome`, `synergy:activated`)
- ScoringSystem subscribes and accumulates points
- Decoupled from individual systems (PlantSystem doesn't know about scoring)
- Config-driven point values (`src/config/scoring.ts`)

**3. Save System Schema Versioning**
```typescript
interface SaveData {
  version: number;  // Increment on breaking changes
  player: PlayerState;
  encyclopedia: EncyclopediaState;
  unlocks: UnlockState;
  scores: HighScoreState[];
  settings: SettingsState;
}
```
- Migration functions for v1 → v2, v2 → v3, etc.
- Fallback: If migration fails, reset with user notification

**4. Hazard System Refactor**
- Current: Monolithic HazardSystem handles all hazards
- Future: Split into `PestSystem`, `WeatherSystem` for clarity
- Both subscribe to EventBus, emit hazard events
- HazardWarning UI consolidates notifications

**5. Synergy System Integration**
- New system: `SynergySystem.ts`
- Runs after PlantSystem update each frame
- Checks adjacency graph, applies bonuses to Plant entities
- Emits synergy events for scoring + UI feedback
- No negative interactions in MVP (add later if needed)

### File Organization Principles

- **Systems are single-responsibility:** One system = one core mechanic (growth, hazards, scoring, synergies)
- **Config files are data-driven:** All tuning values in `src/config/` (no magic numbers in systems)
- **EventBus is the integration layer:** Systems don't call each other directly; they emit/subscribe to typed events
- **UI components are self-contained:** Each UI class owns its Container, handles lifecycle (init/update/destroy)

### Dependencies & Wiring

Roadmap items can largely run **in parallel** until Item 8 (Save System):
- Items 2, 3, 4 are independent
- Item 5 depends on Item 4 (scoring needs run variance to be meaningful)
- Item 6 is independent but synergizes with Item 5
- Item 7 is independent but synergizes with Item 4
- Item 8 depends on Items 2, 3, 5 (needs finalized schemas)

**Recommended parallelization:**
- **Phase 1 (parallel):** Items 2 (Brock), 3 (Misty), 4 (Erika)
- **Phase 2 (parallel):** Items 5 (Misty), 6 (Erika), 7 (Erika)
- **Phase 3 (serial):** Item 8 (Brock) — requires all schemas finalized

---

## Success Criteria (How We'll Know It's Working)

After completing roadmap items 2-8:

**Replayability:**
- 3+ runs feel meaningfully different (seed pool variety)
- Players adjust strategy based on available seeds (not autopilot)

**Progression Clarity:**
- Players can articulate "what I'm working toward" (next unlock, milestone, high score)
- Encyclopedia feels like a growing achievement (not just a list)

**Strategic Depth:**
- Skilled players achieve 2x score of new players (mastery gap exists)
- Synergies are discovered organically ("Oh, sunflowers help lettuce!")

**Retention:**
- Players return for 2nd session within 24h (save system enables this)
- Average session length increases to 40+ min (compelling enough to play multiple runs)

**Cozy Pillar Maintained:**
- No frustration feedback in playtesting
- Hazards feel like puzzles, not punishment
- Failure teaches, doesn't punish

---

## What's Still Deferred (Post-Roadmap)

These features are **out of scope** for current roadmap but aligned with GDD vision:

- **Garden Expansion** (secondary plot, larger grids)
- **Advanced Tools** (soil tester, compost bin, trellis)
- **Complex Synergies** (negative interactions, competition for resources)
- **Cosmetic Unlocks** (seed packet skins, HUD themes)
- **Achievements System** (badges, special challenges)
- **Mobile Optimization** (touch controls, responsive layout)
- **Cloud Sync** (cross-device save)
- **Multiplayer/Social** (shared gardens, leaderboards)

**Why deferred:** Current roadmap focuses on core loop depth. These are expansion features that add breadth but not core replayability. Reassess after Items 2-8 are complete and playtested.

---

## Conclusion

This roadmap transforms Flora from a playable prototype to a compelling cozy roguelite with replayability, strategic depth, and clear progression. Each item is sequenced to maximize player value: polish → variety → clarity → depth → retention.

**Next actions:**
1. Perpetual-motion workflow converts roadmap items 4-8 to GitHub issues
2. Squad members pick up assigned work (Brock: Audio, Misty: Unlocks, etc.)
3. Oak reviews PRs for architectural consistency and integration quality
4. Iterate based on playtesting feedback after each item completes

**Strategic commitment:** No feature creep. If an item balloons in scope, split it or defer it. Cozy first, complex second.

---

**Document Owner:** Oak  
**Reviewers:** Squad (via decisions.md append)  
**Status:** Active — guides work until reassessed
