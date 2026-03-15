# Decision: Playwright E2E Testing Strategy for WebGL Games

**By:** Brock (Web Engine Dev)  
**Date:** 2026-03-15  
**Status:** Active  

## Context

Issue #266 requested Playwright E2E setup for Flora, a PixiJS v8 WebGL game. Standard DOM-based testing approaches fail with WebGL canvases.

## Decision

Use Playwright's native `canvas.screenshot()` API for WebGL game testing, not `getContext('2d')` pixel inspection.

### Key Technical Choices

1. **Visual assertions via screenshot buffer size**: PNG >2KB = real content, not pixel-by-pixel analysis
2. **Canvas selection**: `page.locator('canvas')` — PixiJS appends canvas with no ID
3. **Frame synchronization**: `requestAnimationFrame` ticker injected via `page.evaluate()` to wait for N frames
4. **WebGL in headless**: Chromium launch args `--use-gl=angle --use-angle=swiftshader` for GPU emulation
5. **Error monitoring**: Subscribe to `pageerror` and console.error events before navigation

### Test Coverage

- Canvas rendering and visual content
- WebGL context validation (drawingBufferWidth > 0)
- Game state transitions (Boot → Menu)
- Keyboard input responsiveness (screenshot diff)
- Runtime error detection during load

## Rationale

- **canvas.screenshot() is WebGL-aware**: Unlike getContext('2d'), it captures WebGL frame buffer directly
- **Buffer size check is robust**: PNG compression means real content has substantial size, empty canvas is tiny
- **Frame waiting prevents flakes**: rAF ticker ensures game has rendered before assertions
- **Deployed URL testing**: baseURL points to GitHub Pages, tests real production build

## Alternatives Considered

- **Pixel-by-pixel inspection**: Rejected — requires fallback 2D canvas copy, fragile with GPU rendering
- **DOM-based assertions**: Rejected — PixiJS renders everything to canvas, no meaningful DOM structure
- **WebDriver protocol**: Rejected — Playwright's modern APIs better suited for WebGL

## Impact

- Enables automated E2E regression testing for all game scenes
- Validates WebGL rendering pipeline in CI/CD
- Catches runtime errors and load failures before deployment
- Pattern reusable for any PixiJS/Three.js/Babylon.js WebGL game

## References

- PR #267: Playwright E2E setup
- Issue #266: Original request
- Template source: openglad/openglad wasm-game.spec.js adaptation
