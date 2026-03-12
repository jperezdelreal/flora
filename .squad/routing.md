# Work Routing — FLORA

| Work Type | Route To | Examples |
|-----------|----------|----------|
| Game engine, PixiJS, rendering, game loop, ECS | Brock | PixiJS setup, render pipeline, bitECS integration, frame timing |
| Plant mechanics, growth, roguelite systems, content data | Erika | L-system growth, seed mechanics, seasonal cycles, run progression, plant definitions, biome configs |
| Procedural art, shaders, visual identity | Sabrina | Botanical shaders, watercolor gradients, L-system rendering, palette design |
| Web UI, HUD, menus, responsive layout | Misty | HTML/CSS UI, garden HUD, seed inventory, menu screens |
| Architecture, integration, decisions, code review | Oak | Project structure, system integration, architectural trade-offs, quality gates |
| CI/CD, Vite config, deploy, tooling | Brock | Vite config, build optimization (escalate to Oak for CI/CD pipeline) |
| Game design, creative direction | Oak | Feature triage, GDD updates (user provides creative vision) |
| Session logging | Scribe | Automatic — never needs routing |

## Rules

1. Eager by default — spawn all agents who could usefully start work
2. Scribe always runs after substantial work, always background
3. Quick facts → coordinator answers directly
4. "Team, ..." → fan-out to all relevant agents
5. All comments MUST start with **TLDR:** (studio convention)
