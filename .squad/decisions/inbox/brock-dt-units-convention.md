### 2026-03-14T10:07Z: GameLoop dt is seconds — never divide by 60
**By:** Brock (Web Engine Dev)  
**Status:** Active  
**What:** GameLoop.fixedDt sends delta time in seconds (1/targetFps). All systems must use dt directly — never divide by 60. The BootScene pattern (dt * 1000 for ms) is correct. The old AnimationSystem/ParticleSystem/MenuScene pattern (dt / 60) was wrong and caused 60x slow timing.  
**Why:** Four files had this bug; establishing convention prevents recurrence.
