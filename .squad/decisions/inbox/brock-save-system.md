# Save System Architecture Decision

**Author:** Brock (Web Engine Dev)  
**Date:** 2026-03-13  
**Status:** Implemented  
**PR:** #61

## Context

Flora needed a persistent save system to retain player progress across sessions. Previously, Encyclopedia, Unlock, Scoring, and Audio systems each managed their own localStorage keys independently, creating fragmentation and making schema changes risky.

## Decision

Implemented a **centralized SaveManager** that coordinates all persistence operations:

1. **Single source of truth**: `SaveManager` owns the unified `SaveData` schema
2. **Versioned schema**: All saves include a version number for safe migrations
3. **Optional injection pattern**: Systems accept optional `SaveManager` in constructor, fall back to direct localStorage if not provided (backward compatible)
4. **Auto-save with dirty tracking**: SaveManager subscribes to EventBus, auto-saves every 60s when dirty
5. **Safe storage utilities**: Never-throw wrappers around localStorage with fallback values
6. **UI feedback**: `SaveIndicator` component shows save status with fade animation

## Rationale

- **Consolidation prevents conflicts**: Single save file eliminates key collisions, ensures atomic updates
- **Versioning enables evolution**: Schema changes are safe; old saves migrate automatically
- **Optional injection preserves backward compatibility**: Systems work standalone or with SaveManager
- **Auto-save reduces data loss**: Player never has to manually save; progress persists across crashes
- **Corruption handling**: Validates structure on load, repairs broken saves, never crashes

## Alternatives Considered

1. **Keep scattered localStorage keys** — Rejected: fragile, hard to version, no atomicity
2. **Require SaveManager everywhere** — Rejected: breaks existing tests, not backward compatible
3. **IndexedDB instead of localStorage** — Deferred: localStorage sufficient for MVP, IndexedDB for cloud sync later

## Consequences

### Positive
- Unified save format across all systems
- Easy to add export/import features later
- Safe schema evolution via versioning
- Clear UI feedback on save status

### Negative
- Slightly more complex initialization (wire SaveManager to all systems)
- Systems now have dual save paths (SaveManager vs direct localStorage)

## Implementation Notes

- SaveManager updates are batched via dirty flag + 60s timer
- Systems call `saveManager.updateX()` methods, not `saveManager.save()` directly
- Manual saves triggered at run end, not per-action
- SaveIndicator positioned bottom-right, fades after 1s display
