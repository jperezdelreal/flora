# Decision: UI Components Must Clean Up Window Listeners

**Date:** 2025-07-14  
**Author:** Oak  
**Context:** PR #25 review (Garden UI/HUD, Issue #9)

## Decision

Any component or scene that calls `window.addEventListener()` MUST:
1. Store the handler as a bound class field (e.g., `private boundOnKeyDown`)
2. Remove it in `destroy()` via `window.removeEventListener()`

## Rationale

GardenScene.setupKeyboardShortcuts() used an anonymous listener that can't be removed. On scene transitions, this causes listener accumulation → double-fired events. Encyclopedia.ts already follows the correct pattern — this formalizes it as a project-wide rule.

## Scope

Applies to all `src/ui/` and `src/scenes/` files. Any future `window.addEventListener` usage.
