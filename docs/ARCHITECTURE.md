# Flora — Architecture

> Cozy gardening roguelite · Vite + TypeScript + PixiJS v8

## Module Structure

```
src/
  core/           — Game loop, scene manager, input handling, asset loader, event bus
  scenes/         — Individual game scenes (menu, garden, exploration, game-over)
  entities/       — Game objects: plants, player character, tools, hazards, NPCs
  systems/        — ECS-lite systems: growth, weather, inventory, day-night cycle
  ui/             — HUD overlays, menus, dialogs, tooltips
  utils/          — Math helpers, RNG, collections, type guards
  config/         — Game constants, balance values, plant definitions, tuning
  main.ts         — Entry point: initializes PixiJS Application and boots first scene
```

## Key Patterns

### Scene-Based Architecture

All game states are **scenes** managed by a central `SceneManager`. Each scene implements a common interface:

```typescript
interface Scene {
  readonly name: string;
  init(): Promise<void>;
  update(delta: number): void;
  destroy(): void;
}
```

- Only one scene is active at a time.
- Scene transitions are handled by `SceneManager.switchTo(sceneName)`.
- Scenes own their own PixiJS display objects and clean up on `destroy()`.

### ECS-Lite

Not a full ECS framework — instead, lightweight **systems** that iterate over typed entity collections each frame:

- Systems live in `src/systems/` and are registered with the game loop.
- Entities are plain TypeScript objects/classes with component-like properties.
- This keeps complexity low while allowing clean separation of concerns (growth logic vs rendering vs input).

### Event Bus

A typed publish-subscribe bus for decoupling modules:

```typescript
// Example: growth system emits, UI subscribes
eventBus.emit('plant:grew', { plantId, stage });
eventBus.on('plant:grew', (data) => hud.updatePlantStatus(data));
```

- Prevents circular dependencies between systems, UI, and scenes.
- All event types are defined in a central `EventMap` type for type safety.

### Asset Pipeline

- **PixiJS Assets API** (`Assets.load()`, `Assets.addBundle()`) for all asset loading.
- Sprite sheets bundled as JSON atlas + PNG.
- Assets loaded per-scene (lazy) or in a preload scene (eager) depending on size.
- All asset keys defined in `src/config/assets.ts` to avoid magic strings.

## Build Pipeline

| Tool       | Purpose                        |
|------------|--------------------------------|
| Vite       | Dev server, HMR, production bundler |
| TypeScript | Strict mode, no implicit any   |
| PixiJS v8  | Rendering, sprites, text, input |

### TypeScript Configuration

- `strict: true` — all strict checks enabled
- `target: ES2022` — modern JS output
- `moduleResolution: bundler` — Vite-compatible resolution
- `isolatedModules: true` — compatible with Vite's esbuild transform

### Dev Workflow

```bash
npm run dev      # Start Vite dev server with HMR (port 3000)
npm run build    # Type-check + production build
npm run preview  # Preview production build locally
```

## Dependency Direction

```
main.ts
  └─► core/SceneManager
        └─► scenes/*
              ├─► entities/*
              ├─► systems/*
              └─► ui/*

config/  ◄── imported by anything (pure data, no side effects)
utils/   ◄── imported by anything (pure functions)
core/EventBus  ◄── imported by scenes, systems, ui (decoupling layer)
```

**Rules:**
1. `config/` and `utils/` never import from other `src/` modules.
2. `entities/` never imports from `scenes/` (entities are scene-agnostic).
3. `systems/` communicate via the event bus, not direct imports of each other.
4. `ui/` subscribes to events — it never mutates game state directly.

## PixiJS v8 Notes

- `Application` uses async `app.init()` (not constructor options).
- `app.canvas` replaces `app.view`.
- Text uses `new Text({ text, style })` object syntax.
- Assets API: `await Assets.load('spritesheet.json')`.
