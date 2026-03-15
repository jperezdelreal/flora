### 2026-03-15T19:14:00Z: User directive
**By:** joperezd (via Copilot)
**What:** Playwright headed tests MUST run after every batch of agent work as a verification gate. If tests fail, create issues from failures. No more "builds clean" without gameplay verification.
**Why:** User request — the team was shipping code that "compiles" but doesn't actually work as a playable game. Playwright with window.__FLORA__ hooks is the only real QA the team has. It must be part of every cycle, not optional.
