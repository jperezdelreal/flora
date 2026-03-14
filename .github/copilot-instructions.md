# Flora — Copilot Context Guide

**Flora** is a cozy gardening roguelite built with **Vite + TypeScript + PixiJS v8**. This document provides context for AI-assisted development.

## Project Overview

**Genre:** Cozy Gardening Roguelite  
**Engine:** PixiJS v8  
**Build Tool:** Vite  
**Language:** TypeScript 5.9+  
**Target:** Web Browser (responsive)

**Core Fantasy:** Plant seeds, tend your garden, and survive seasonal challenges. Lose your garden each season, but keep what you discover—a gentle game about growth, patience, and discovery.

For full design details, see [docs/GDD.md](../docs/GDD.md).

## Architecture Overview

### Key Design Patterns

**1. Scene Manager**
- Central orchestrator for screen/level transitions
- All scenes implement the `Scene` interface: `init(app)`, `update(delta)`, `destroy()`
- Located: `src/core/SceneManager.ts`
- Use scene manager to switch between Boot → Menu → Garden → Results scenes

**2. Event Bus (Typed)**
- Decouples modules via published events
- Fully typed: events and payloads defined in `EventMap` interface
- Located: `src/core/EventBus.ts`
- Usage: `eventBus.emit('plant:grew', { plantId: '...', stage: 2 })`
- Add new events to `EventMap` as features develop

**3. ECS-Lite Architecture**
- Entities (plants, garden tiles) are simple data structures
- Systems (growth, watering, pest logic) update entities each frame
- Directories: `src/entities/` and `src/systems/`
- Not a full ECS engine; lightweight composition-based design

### Directory Structure

```
src/
├── main.ts          # Entry point; initializes app & scene manager
├── config/          # Game constants (speeds, colors, plant configs)
├── core/            # Scene manager, event bus, shared interfaces
├── entities/        # Plant, garden tile, player state data structures
├── scenes/          # Screen implementations (Boot, Menu, Garden, etc.)
├── systems/         # Game logic modules (growth, hazards, input)
├── ui/              # UI components (menus, HUD, panels)
└── utils/           # Helpers (math, validation, asset loading)
```

## PixiJS v8 Conventions

**Initialization (async pattern):**
```typescript
const app = new Application();
await app.init({ background: 0x000000, resizeTo: window });
document.body.appendChild(app.canvas);  // Use .canvas not .view
```

**Text rendering (object syntax):**
```typescript
const text = new Text({
  text: 'Hello Flora',
  style: {
    fontFamily: 'Arial',
    fontSize: 24,
    fill: '#88d498',
    align: 'center',
  },
});
```

**Asset loading:**
```typescript
import { Assets } from 'pixi.js';
const texture = await Assets.load('path/to/sprite.png');
```

**Containers and hierarchy:**
- Use `Container` to group visual objects
- Call `addChild()` to attach to parent
- Call `destroy()` with `{ children: true }` to clean up recursively

## Game Loop & Time Management

**Frame-based loop (60 FPS):**
```typescript
app.ticker.add((ticker) => {
  const deltaTime = ticker.deltaTime;  // Milliseconds since last frame
  sceneManager.update(deltaTime);
});
```

**Future: Fixed timestep accumulator pattern**
- Game logic will use fixed 60 FPS timestep with accumulator
- Separate render loop from logic loop for deterministic state
- See design notes in `src/core/` for implementation details

## State Management

- **Game state** lives in individual scene/system classes (e.g., `GardenScene` holds garden grid)
- **Global state** (player progress, unlocks) stored in a singleton or passed via dependency injection
- **No Redux/Pinia:** Keep it minimal for MVP
- **Persistence:** Player data serialized to localStorage at run end

## Code Organization Guidelines

1. **Keep systems focused:** One system = one responsibility (growth, input, hazards)
2. **Use TypeScript strict mode:** All files should enable `strict: true` in tsconfig
3. **Type everything:** Avoid `any`; use `unknown` if needed
4. **ESLint rules:** Enforced via package.json (no rules configured yet; plan to add)
5. **No external UI frameworks:** Build UI with raw PixiJS for simplicity

## Common Tasks

### Adding a New Plant Type
1. Define plant config in `src/config/plants.ts`
2. Create plant entity in `src/entities/Plant.ts`
3. Emit `'plant:created'` event from garden system
4. Renderers subscribe to event to draw sprite

### Adding a New Scene
1. Create file in `src/scenes/MyScene.ts` implementing `Scene` interface
2. Register in main.ts: `sceneManager.register(new MyScene())`
3. Transition via: `sceneManager.switchTo('my-scene')`

### Listening to Game Events
```typescript
import { eventBus } from '../core';

eventBus.on('plant:grew', (data) => {
  console.log(`Plant ${data.plantId} reached stage ${data.stage}`);
});
```

## Testing & Validation

- **Type checking:** `npm run build` (includes `tsc` step)
- **Dev server:** `npm run dev` (Vite hot reload)
- **Preview:** `npm run preview` (test production build locally)

## Resources

- **Game Design Document:** [docs/GDD.md](../docs/GDD.md) — canonical source for mechanics, art direction, progression
- **PixiJS v8 Docs:** https://pixijs.io/
- **Vite Docs:** https://vitejs.dev/
- **TypeScript Docs:** https://www.typescriptlang.org/

## Design Philosophy

**Cozy First, Complex Second.** When in doubt:
- Prioritize player relaxation over mechanical depth
- Make discovery and progression visible
- All hazards are puzzles; no punishment
- No tutorial needed for MVP features

## Current Sprint Status

See branch and PR for active work. All issues reference the GDD for feature acceptance criteria.


## ⚠️ CRITICAL: Protected Files — NEVER Delete

The following files are essential Squad infrastructure. NEVER delete, move, or rename them under any circumstances. If a task seems to require removing these files, STOP and ask for guidance.

- .github/agents/squad.agent.md — Squad coordinator governance (session fails without this)
- .squad/team.md — Team roster (workflows break without this)
- .squad/ceremonies.md — Ceremony definitions
- .squad/routing.md — Agent routing rules
- .squad/agents/*/charter.md — Agent identity files