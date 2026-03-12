# Work Routing — FLORA

| Work Type | Route To | Examples |
|-----------|----------|----------|
| Game engine, PixiJS, rendering, game loop, ECS | Brock | PixiJS setup, render pipeline, bitECS integration, frame timing |
| Plant mechanics, growth, roguelite systems | Erika | L-system growth, seed mechanics, seasonal cycles, run progression |
| Procedural art, shaders, visual identity | Sabrina | Botanical shaders, watercolor gradients, L-system rendering, palette design |
| Plant species, biomes, content data | Surge | Plant definitions, biome configs, harvest data, procedural layouts |
| Web UI, HUD, menus, responsive layout | Misty | HTML/CSS UI, garden HUD, seed inventory, menu screens |
| Audio, ambient, music, cozy SFX | Meowth | Nature ambience, growth sounds, seasonal music, procedural audio |
| QA, playtesting, browser compat | Blaine | Browser testing, performance, accessibility, game feel |
| CI/CD, Vite config, deploy, tooling | Giovanni | GitHub Actions, Vite config, deploy pipelines, build optimization |
| Architecture, integration, decisions | Oak | Project structure, system integration, architectural trade-offs |
| Sprint planning, scope, timelines | Cynthia | Sprint planning, milestone tracking, scope management |
| Game design, vision, creative direction | Lance | Core loop, GDD, feature triage, creative coherence |
| Session logging | Scribe | Automatic — never needs routing |

## Rules

1. Eager by default — spawn all agents who could usefully start work
2. Scribe always runs after substantial work, always background
3. Quick facts → coordinator answers directly
4. "Team, ..." → fan-out to all relevant agents
5. All comments MUST start with **TLDR:** (studio convention)
