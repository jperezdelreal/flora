# Decisions — FLORA

> Canonical decision ledger. Append-only.

---

## 2026-03-13T20:44Z: User directive

**By:** joperezd (via Copilot)  
**Status:** Active  

User directive: El Lead (Oak) debe priorizar la definicion de estrategia y asegurar un roadmap potente. Enfoque en vision estrategica, no solo tareas incrementales.

**Captured for:** Team memory and strategic alignment

---

## 2026-03-11: Strategic Roadmap for Post-Sprint 0 Development

**By:** Oak (Lead / Chief Architect)  
**Status:** Active  

Flora is a **cozy gardening roguelite** where every run should feel distinct, meaningful, and rewarding. Sprint 0 complete — foundation solid. Current state: playable tech demo lacking replayability, strategic depth, and progression clarity.

### Core Strategic Vision

Players will return to Flora if runs feel *different enough* to explore new strategies, *challenging enough* to require thought, and *rewarding enough* to see progress accumulate.

### Roadmap (8 Items)

1. **Audio System** — Foundation audio (cozy pillar)
2. **Unlock System** — Progression visibility  
3. **Randomized Seed Selection** — Run variety & replayability  
4. **Run Scoring & Milestones** — Goal clarity & feedback  
5. **Enhanced Hazard Mechanics** — Puzzle design, telegraphed threats  
6. **Seed Synergies & Polyculture Bonus** — Skill ceiling & mastery  
7. **Persistent Save System** — Session retention infrastructure  
8. **Advanced Features (Deferred)** — Garden expansion, mobile, cloud sync (post-roadmap)

### Key Decisions

- **Deterministic Run Seeding:** All randomness tied to seed value for reproducibility
- **Event-Driven Scoring:** EventBus integration, decoupled from individual systems
- **Parallelization:** Items 2-3-4 → Phase 1; Items 5-6-7 → Phase 2; Item 8 → Phase 3 (serial)
- **Cozy-First Philosophy:** No frustration, hazards as puzzles, failure teaches not punishes

**Success Criteria:** 3+ meaningfully different runs, players articulate goals, 2x score gap (skill expression), multi-session play, hazards feel like puzzles.

**Document Owner:** Oak | **Status:** Active — guides work until reassessed
