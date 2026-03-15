# Oak — Playwright QA Findings
**Date:** 2026-03-15  
**Context:** First Playwright E2E test run against deployed Flora

---

## Executive Summary

**Tests Run:** 5 E2E tests covering page load, WebGL, menu navigation, keyboard input, error detection  
**Tests Passing:** 2/5 (40%)  
**Tests Failing:** 3/5 (60%)  
**Issues Created:** 2 (#268, #269)  
**Critical Blocker:** WebGL context operations timeout in headless Chrome (P1)

---

## Findings

### ✅ What Works

1. **Deployment is live and functional**
   - Site loads at `https://jperezdelreal.github.io/flora/`
   - HTML renders correctly with PixiJS bundle (617KB JS)
   - Canvas element appears in DOM
   - WebGL context can be created
   - **No runtime errors on page load** ✅

2. **Core infrastructure is solid**
   - GitHub Actions workflow succeeds (90 successful deployments)
   - Vite build configuration correct (`base: '/flora/'`)
   - GitHub Pages properly configured
   - No console errors, no crashes

### ❌ What's Broken

#### Issue #269: Playwright baseURL Navigation (P0) — ✅ FIXED

**Problem:** Tests navigated to `https://jperezdelreal.github.io/` instead of `/flora/` due to `page.goto('/')` path resolution.

**Root Cause:** Playwright treats `'/'` as absolute path replacement, not relative to baseURL.

**Fix:** Changed all `page.goto('/')` to `page.goto('')` — now resolves correctly.

**Status:** Committed to main (7cd4906), ready for PR.

---

#### Issue #268: WebGL Context Timeouts in Headless Chrome (P1) — 🚧 BLOCKED

**Problem:** Any WebGL operation (reading canvas dimensions, taking screenshots) hangs for 30+ seconds before timing out.

**Evidence:**
```
✅ Canvas visible in DOM
✅ WebGL context created  
❌ canvas.width evaluation → timeout after 30s
❌ canvas.screenshot() → timeout after 30s
```

**Root Cause:** SwiftShader software renderer (used for headless WebGL) appears incompatible with PixiJS v8's rendering path. Suspected GPU context lock or infinite wait in rendering pipeline.

**Impact:** Cannot run E2E tests in CI. All visual validation tests blocked.

**Proposed Solutions:**
1. **Use headed browser in CI** — GitHub Actions + Xvfb (headless X server) for real GPU
2. **Try alternative Chrome flags** — `--disable-gpu-sandbox`, `--enable-unsafe-swiftshader`, etc.
3. **Isolate PixiJS init** — Test if issue is in Application.init() or first render
4. **Defer to Brock** — WebGL/engine specialist, closest to rendering layer

**Assignment:** squad:brock

---

## Test Results Breakdown

| Test | Status | Details |
|------|--------|---------|
| WebGL context is active | ✅ PASS | Context creation succeeds, drawingBuffer dimensions valid |
| No runtime errors on load | ✅ PASS | Page loads cleanly, no console errors |
| Page loads and canvas renders | ❌ FAIL | Canvas exists but dimension read times out |
| Game reaches menu screen | ❌ FAIL | Canvas screenshot operation hangs |
| Keyboard navigation works | ❌ FAIL | Baseline screenshot times out |

**Pass Rate:** 40% (2/5)  
**Blockers:** 1 critical (WebGL timeout)

---

## Overall Health Assessment

**Grade: B− (Functional but Not Testable)**

### Strengths
- ✅ **Deployment pipeline works** — 90 successful deploys, no build failures
- ✅ **Core game loads without errors** — No crashes, no console errors, clean startup
- ✅ **Infrastructure is production-ready** — GitHub Pages, Vite, PixiJS all configured correctly

### Weaknesses
- ❌ **E2E testing blocked** — Cannot validate visual state or user interactions in CI
- ⚠️ **No visual regression detection** — Screenshots unavailable due to WebGL issue
- ⚠️ **Manual testing required** — Cannot automate QA until #268 resolved

### The Critical Question
**Can a user play Flora in a real browser?** → **Unknown.**

Playwright proves the page *loads*, but we can't verify:
- Does BootScene animate?
- Does MenuScene render the title?
- Do buttons respond to clicks?
- Does GardenScene show the garden grid?

These require **headed browser testing** or **manual QA** until #268 is resolved.

---

## Strategic Recommendations for Sprint 6

### Immediate (Next 48 Hours)
1. **Brock investigates #268** — Try Xvfb, alternative Chrome flags, isolate PixiJS init
2. **Manual smoke test** — Someone plays the deployed game for 5 minutes, validates core flow
3. **Oak pushes PR #269 fix** — Unblocks future test development

### Short-Term (Sprint 6)
1. **Add headed CI tests** — GitHub Actions with Xvfb for real GPU rendering
2. **Expand test coverage** — Scene transitions, tool interactions, save/load (once WebGL works)
3. **Visual regression baseline** — Capture reference screenshots for menu, garden, modals

### Medium-Term (Sprint 7+)
1. **Performance testing** — FPS monitoring, memory profiling in CI
2. **Mobile viewport tests** — Verify touch interactions, responsive layout
3. **Accessibility audit** — Screen reader, keyboard-only navigation, WCAG validation

---

## What This Means for the Team

**For Brock (Web Engine):** You own #268. This is a deep WebGL compatibility issue. Xvfb might unlock it, but if not, we may need to wait for PixiJS v8 + Playwright maturity.

**For Erika/Sabrina/Misty:** Continue feature work. We have eyes on the deployed game now — manual testing is viable. E2E will catch up once #268 resolves.

**For Ralph:** Sprint 6 should include "E2E Test Infrastructure" as a backlog item — don't assume Playwright will work out-of-the-box.

**For the User (joperezd):** The good news: **your game is deployed and loads cleanly**. The bad news: we can't *see* it yet through automated tests. Manual QA required until Brock resolves #268.

---

## Lessons Learned

1. **Playwright + WebGL is non-trivial** — Software rendering (SwiftShader) may not support all GPU features
2. **baseURL path resolution is a gotcha** — `'/'` is not relative, `''` is
3. **Deployment success ≠ functional game** — Workflow passed 90 times; we only now know the game loads

---

## Next Actions

- [x] Issue #268 created, assigned to Brock
- [x] Issue #269 created, fixed, committed (7cd4906)
- [ ] Oak opens PR for #269 fix
- [ ] Brock investigates Xvfb/headed testing for CI
- [ ] Manual smoke test by any team member

---

**Bottom Line:** Flora's deployment is solid. Tests exist but are blocked by WebGL rendering in headless Chrome. Short-term: manual QA. Medium-term: headed CI. Long-term: full E2E coverage.

**Oak signing off.**
