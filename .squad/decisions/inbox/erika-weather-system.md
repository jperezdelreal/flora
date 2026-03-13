# Decision: Weather System Architecture

**Date:** 2026-03-13  
**By:** Erika (Systems Dev)  
**Status:** Proposed  
**PR:** #74  

## Context

Issue #49 required splitting weather events from HazardSystem and implementing 2-day advance warnings. Previous architecture had all hazards (pests + weather) in a single system, which violated single-responsibility principle and made weather mechanics hard to extend.

## Decision

### 1. System Separation
- **WeatherSystem**: Manages drought, frost, heavy rain with telegraph warnings
- **HazardSystem**: Focused solely on pest spawning and damage
- Weather logic completely removed from HazardSystem (drought multipliers, frost damage, etc.)

### 2. Telegraph Warning Pattern
- All weather events schedule warnings 2 days before activation
- `warningDay = startDay - 2` for consistent player preparation time
- WeatherSystem.onDayAdvance checks both warning triggers and event activation
- EventBus emits `weather:warning` with threat description + mitigation advice

### 3. UI Layering Strategy
- **HazardWarning**: Full-width telegraphs with detailed threat info (2 days ahead)
- **HazardUI**: Active status banners showing current weather effects
- **HUD**: Compact text indicator for upcoming warnings (bottom of HUD panel)
- Three layers ensure visibility without clutter

### 4. Weather Mechanics
- **Drought**: `waterNeedMultiplier: 1.5`, `soilDryingMultiplier: 2.0`
- **Frost**: Applies `damagePerDay` to plants without WINTER in availableSeasons
- **Heavy Rain**: Locks soil moisture at 100% (future implementation)
- All mechanics query WeatherSystem state rather than mutating plant/grid directly

### 5. Event Integration
- Added events: `weather:warning`, `frost:started/ended`, `heavy_rain:started/ended`
- GardenScene subscribes to `weather:warning` and displays via HazardWarning UI
- Decoupled: systems emit events, UI reacts independently

## Rationale

1. **Single Responsibility**: Each system has one clear purpose (pests vs. weather)
2. **Telegraph Design**: GDD states "hazards are puzzles, not enemies" — warnings enable strategic planning
3. **Extensibility**: New weather types add to WeatherSystem without touching HazardSystem
4. **Testability**: Weather and pest logic can be tested independently
5. **Visual Clarity**: Three UI layers match player attention needs (long-term warnings → active threats → quick reminders)

## Alternatives Considered

1. **Keep unified HazardSystem**: Rejected — too complex, violates SRP
2. **Single UI component for all hazards**: Rejected — can't distinguish urgent vs. informational
3. **Per-frame weather checks**: Rejected — weather events are day-based, no need for frame updates

## Consequences

### Positive
- Clean separation enables future weather types (heatwave, wind, etc.)
- Telegraph warnings align with cozy design philosophy (no surprises)
- UI layering scales to multiple simultaneous hazards

### Negative
- Two systems to manage instead of one (slightly more cognitive overhead)
- WeatherSystem.update() is a no-op (weather is day-based) but required by System interface

## Open Questions

- Should Heavy Rain implementation lock soil moisture immediately or gradually?
- Should weather tooltips show historical weather data (past events)?
- Should weather warnings persist after event starts or auto-hide?

## Next Steps

1. Test PR #74 in garden scene
2. Add Heavy Rain full implementation (currently scaffolded)
3. Consider weather forecast UI (3-day outlook for advanced planning)
