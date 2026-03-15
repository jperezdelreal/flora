# Performance Optimization Architecture — Issue #247

**By:** Oak (Lead / Chief Architect)  
**Date:** 2026-03-15  
**Status:** Implemented (PR #264)  
**Context:** Issue #247 performance audit

## Background

Sprint 5 performance audit revealed critical memory leak patterns and performance bottlenecks across multiple systems. 6 of 20 systems (30%) had EventBus subscription leaks preventing garbage collection. TileRenderer performed O(n) work every frame on 144+ tiles regardless of changes.

## Key Decisions

### 1. EventBus Subscription Lifecycle Pattern (CRITICAL)

**Decision:** ALL systems that subscribe to EventBus MUST store bound listener references and call `eventBus.off()` in `destroy()`.

**Pattern:**
```typescript
export class MySystem implements System {
  private boundHandler!: (data: EventData) => void;

  constructor() {
    this.boundHandler = (data) => this.handleEvent(data);
    eventBus.on('event:name', this.boundHandler);
  }

  destroy(): void {
    eventBus.off('event:name', this.boundHandler);
    // ... other cleanup
  }
}
```

**Rationale:**
- EventBus uses WeakMap internally but listeners are strong references
- Without `.off()`, listeners persist after system destruction
- Prevents memory leaks in scene transitions and run resets
- 6 systems (AchievementSystem, AudioManager, ScoringSystem, WeedSystem, SynergySystem) had this leak

**Consequences:**
- ALL new systems must follow this pattern (code review checkpoint)
- Squad agents should flag missing `.off()` in PR reviews
- Existing systems without EventBus subscriptions can skip this

---

### 2. Dirty Tracking for Large Collection Updates

**Decision:** When updating large collections (tiles, entities) in `update()` loops, implement dirty tracking instead of full iteration.

**Pattern:**
```typescript
export class TileRenderer implements System {
  private dirtyTiles = new Set<Tile>();

  update(): void {
    // Only check dirty tiles instead of all tiles
    for (const tile of this.dirtyTiles) {
      const gfx = this.tileGraphics.get(tile);
      if (gfx) this.renderTile(tile, gfx);
    }
    this.dirtyTiles.clear();
  }

  markTileDirty(tile: Tile): void {
    this.dirtyTiles.add(tile);
  }
}
```

**Rationale:**
- TileRenderer iterated 144+ tiles every frame checking visual state
- Only 0-5 tiles typically change per frame (tool use, moisture, growth)
- Dirty tracking reduces O(n) → O(k) where k << n
- Estimated 30-40% performance improvement for tile updates

**When to use:**
- Collections with 50+ items updated every frame
- Items change infrequently (< 10% per frame)
- Visual state can be marked dirty from game logic events

**When NOT to use:**
- Small collections (< 20 items)
- Items change frequently (> 50% per frame)
- State polling required (e.g., player input checks)

---

### 3. System Delegation and Early Returns

**Decision:** When a system delegates work to another system, the delegating system must early-return in `update()` to avoid duplicate work.

**Example:**
```typescript
// GridSystem delegates tile rendering to TileRenderer
public update(): void {
  if (this.tileRenderer) return; // Skip if delegated
  
  // Legacy rendering only if TileRenderer not active
  for (const [tile, graphics] of this.tileGraphics) {
    this.renderTile(tile, graphics);
  }
}
```

**Rationale:**
- GridSystem originally rendered tiles itself
- TileRenderer introduced to separate concerns but GridSystem kept rendering logic
- Both systems rendered tiles simultaneously → 2x rendering cost
- Early return restores single responsibility

---

### 4. Timer Cleanup in AudioManager

**Decision:** AudioManager must track and clear all `setTimeout`/`setInterval` IDs in `destroy()`.

**Issue:**
- `ambientIntervals` array stored recursive chirp timer IDs
- destroy() called `stopAmbient()` to disconnect audio nodes but never cleared timers
- Resulted in orphaned timers continuing to fire after scene destruction

**Fix:**
```typescript
destroy(): void {
  for (const intervalId of this.ambientIntervals) {
    clearTimeout(intervalId);
  }
  this.ambientIntervals = [];
  this.stopAmbient();
  // ... rest of cleanup
}
```

---

## Performance Impact Summary

**Before optimizations:**
- 6 systems with memory leaks (EventBus subscriptions)
- TileRenderer: 144 tiles checked per frame
- GridSystem: Duplicate rendering when TileRenderer active
- PlantSystem: Double iteration for dead plant detection
- AudioManager: Orphaned timers post-destruction

**After optimizations:**
- Zero memory leaks — all EventBus subscriptions properly cleaned
- TileRenderer: ~3-5 dirty tiles per frame (vs 144 full checks)
- GridSystem: No duplicate work
- PlantSystem: Single-pass plant advancement
- AudioManager: All timers cleared on destroy

**Measured impact:**
- Bundle size: 174.87 KB gzipped (35% of 500KB target) ✅
- Estimated frame time reduction: 5-15% on tile-heavy operations
- Memory churn: Significantly reduced via dirty tracking

---

## Code Review Checklist

When reviewing PRs with new systems, check:

1. ✅ Does system subscribe to EventBus?
   - If YES: Are bound listeners stored?
   - If YES: Does destroy() call `.off()` for all subscriptions?

2. ✅ Does system have large collection updates in update()?
   - If YES: Is dirty tracking implemented?
   - If NO: Is collection small (< 50 items) or changes frequently?

3. ✅ Does system use setTimeout/setInterval?
   - If YES: Are timer IDs stored and cleared in destroy()?

4. ✅ Does system delegate work to another system?
   - If YES: Does original system early-return in update()?

---

## Related Patterns

- ObjectPool integration: Already complete in ParticleSystem (uses acquire/release correctly)
- Container lifecycle: All UI/render systems call `destroy({ children: true })` on containers
- Save schema versioning: SaveManager pattern for persistent data

---

## Next Steps

- Monitor performance in production after PR #264 merges
- Consider extending dirty tracking to PlantRenderer if plant count exceeds 50
- Audit remaining systems (15 passed initial audit) for edge cases
- Add automated lint rule to flag EventBus.on() without corresponding .off()
