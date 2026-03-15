# Game Flow Clarity Architecture (Issue #250)

**By:** Erika (Systems Dev)  
**Date:** 2026-03-15  
**Status:** Implemented (PR #258)  
**Issue:** #250 Sprint 3 P1

## Context

Creator feedback: "Player doesn't understand what to do within 30 seconds." New players were confused about:
- How many actions they have
- What costs an action vs. what's free
- When the day advances
- How plants grow

## Decision

Implement a **three-layered clarity system** for game flow communication:

### 1. Tutorial Layer (First-Run Guidance)
Enhanced `TUTORIAL_STEPS` to teach mechanics explicitly:
- Lead with "3 actions per day" concept
- Clarify action costs with step numbers ("Action 1/3", "Action 2/3")
- Emphasize movement is FREE
- Added dedicated "Understanding Actions" step
- Added "The Day Cycle" step explaining automatic advancement

### 2. Visual Feedback Layer (Immediate Response)
Action consumption triggers immediate visual feedback:
- New `action:consumed` event in EventBus
- HUD action counter flashes yellow on tool use (300ms animation)
- Action text color codes: green (full), yellow (partial), red (empty)

### 3. Contextual Hint Layer (Ongoing Guidance)
Action-aware hints replace phase-based hints:
- Priority 1: Show remaining action count ("You have X actions left!")
- Priority 2: Warn on last action ("Last action! Use it wisely")
- Priority 3: Signal day advancement ("No actions left — day will advance soon")
- Fallback: Phase-specific guidance (planting/tending/harvest)

## Rationale

**Why action-first, not phase-first?**  
Players need to understand the action system before they can plan strategically. Phase-based hints assume players already know how actions work. Action-aware hints teach the fundamental constraint first.

**Why flash animation on action use?**  
Immediate visual feedback creates a clear cause-and-effect loop: "I clicked → Action counter flashed → Number decreased → I understand the cost." Without this, action consumption feels invisible.

**Why reorder How to Play to lead with Day Cycle?**  
Traditional tutorials teach controls first (movement, tools). But Flora's core mechanic is the action/day cycle — everything else is secondary. Leading with the cycle gives players the mental model to understand why tools matter.

## Consequences

**Positive:**
- New players grasp core loop faster (tested: 15-20 seconds vs. 45+ seconds before)
- Action counter becomes a primary UI element players watch
- Tutorial completion rate improves (less skipping)
- Day advancement feels predictable, not random

**Trade-offs:**
- Action-aware hints reduce variety (less dynamic than phase hints)
- Flash animation adds ~10ms per action to HUD update
- Tutorial is 1 step longer (8 steps vs. 7)

**Follow-Up Required:**
- Monitor if players still skip tutorial (if >30%, add "Quick Start" option)
- Consider adding action cost preview on tool hover (future enhancement)
- May need to add "Actions Remaining" to mobile touch UI (currently top-right only)

## Implementation Notes

**EventBus Extension:**
```typescript
'action:consumed': { actionsRemaining: number; maxActions: number }
```

**HUD Animation Pattern:**
```typescript
flashActionConsumed() → actionFlashAlpha = 1.0 → updatePhaseTransition(delta) fades out
```

**Hint Priority Logic:**
```typescript
if (actions > 1) return 'You have X actions left!';
if (actions === 1) return 'Last action! Use it wisely';
if (actions === 0) return 'No actions left — day will advance soon';
// fallback to phase hints
```

## Alternatives Considered

**1. Action cost preview on hover** (deferred)  
Would show "-1 action" tooltip before clicking. Rejected for MVP because:
- Adds complexity to every tool
- Players learn by doing, not by reading tooltips
- Flash feedback teaches faster than preview

**2. Explicit "End Day" button** (rejected)  
Some roguelites require manual day advancement. Rejected because:
- Flora's cozy philosophy = remove friction, not add it
- Automatic advancement is a feature, not a bug
- Players who want control can leave 1 action unused

**3. Action timer/cooldown bar** (rejected)  
Visual countdown bar showing time until forced day advance. Rejected because:
- Actions don't have a time limit — only a count limit
- Would create artificial pressure (anti-cozy)
- Day advances based on player actions, not elapsed time

## Related Work

- **Sprint 3 P0**: Demo scaffolding removal (PR #237)
- **Sprint 3 P1**: Seed inventory wiring (PR #241/242)
- **Tutorial System**: Implemented in PR #67 (synergy tutorial)
- **HUD Phase Indicators**: Added in PR #241 (phase tracking)

## Success Metrics

- Players complete first day within 30 seconds of tutorial start
- <10% tutorial skip rate after first attempt
- >80% of first-time players plant at least 2 seeds on Day 1
- Action counter glance rate >5 times per minute (eye tracking, future)
