import { System } from './index';
import { Season, SEASON_CONFIG } from '../config/seasons';
import { Plant } from '../entities/Plant';
import { eventBus } from '../core/EventBus';
import {
  getDifficultyScaling,
  scaleDroughtConfig,
  DroughtConfig,
  DROUGHT_CONFIG,
} from '../config/hazards';

export enum WeatherEventType {
  DROUGHT = 'drought',
  FROST = 'frost',
  HEAVY_RAIN = 'heavy_rain',
}

export interface WeatherEvent {
  type: WeatherEventType;
  warningDay: number;
  startDay: number;
  endDay: number;
  isActive: boolean;
  data: DroughtEventData | FrostEventData | HeavyRainEventData;
}

export interface DroughtEventData {
  waterNeedMultiplier: number;
  soilDryingMultiplier: number;
}

export interface FrostEventData {
  damagePerDay: number;
}

export interface HeavyRainEventData {
  overWateringRisk: boolean;
  soilMoistureLocked: boolean;
}

export interface WeatherSystemConfig {
  seasonCount: number;
  season: Season;
}

/**
 * TLDR: WeatherSystem manages weather events with 2-day advance warnings
 * - Drought: soil dries 2x faster, water need increases
 * - Frost: vulnerable plants show warnings, must harvest or protect
 * - Heavy Rain: overwatering risk, soil moisture locked at 100% for 1 day
 */
export class WeatherSystem implements System {
  readonly name = 'WeatherSystem';
  private currentDay = 0;
  private config: WeatherSystemConfig;
  private droughtConfig: DroughtConfig;
  private activeEvents: Map<string, WeatherEvent> = new Map();
  private upcomingEvents: WeatherEvent[] = [];

  private enableDrought: boolean;
  private frostEnabled: boolean;
  private frostDamagePerDay: number;

  constructor(config: WeatherSystemConfig) {
    this.config = config;

    const scaling = getDifficultyScaling(config.seasonCount);
    this.droughtConfig = scaleDroughtConfig(DROUGHT_CONFIG, scaling);

    const seasonCfg = SEASON_CONFIG[config.season];
    this.enableDrought = seasonCfg.droughtEnabled;
    this.frostEnabled = seasonCfg.frostEnabled;
    this.frostDamagePerDay = seasonCfg.frostDamagePerDay;

    this.scheduleWeatherEvents();
  }

  /**
   * TLDR: Schedule weather events for the season with 2-day telegraph
   */
  private scheduleWeatherEvents(): void {
    if (this.enableDrought) {
      const warningDay = this.droughtConfig.warningDay - 2;
      const startDay = this.droughtConfig.warningDay;
      const duration =
        this.droughtConfig.duration[0] +
        Math.floor(
          Math.random() *
            (this.droughtConfig.duration[1] - this.droughtConfig.duration[0] + 1),
        );

      const droughtEvent: WeatherEvent = {
        type: WeatherEventType.DROUGHT,
        warningDay,
        startDay,
        endDay: startDay + duration,
        isActive: false,
        data: {
          waterNeedMultiplier: this.droughtConfig.waterNeedMultiplier,
          soilDryingMultiplier: 2.0,
        } as DroughtEventData,
      };
      this.upcomingEvents.push(droughtEvent);
    }

    if (this.frostEnabled) {
      const warningDay = 2;
      const startDay = 4;
      const frostEvent: WeatherEvent = {
        type: WeatherEventType.FROST,
        warningDay,
        startDay,
        endDay: 12,
        isActive: false,
        data: {
          damagePerDay: this.frostDamagePerDay,
        } as FrostEventData,
      };
      this.upcomingEvents.push(frostEvent);
    }
  }

  /**
   * TLDR: Advance day and trigger warnings/events
   */
  onDayAdvance(day: number): void {
    this.currentDay = day;

    for (const event of this.upcomingEvents) {
      if (day === event.warningDay) {
        this.emitWarning(event);
      }

      if (day === event.startDay) {
        this.activateEvent(event);
      }

      if (day === event.endDay) {
        this.deactivateEvent(event);
      }
    }
  }

  /**
   * TLDR: Emit 2-day advance warning for weather event
   */
  private emitWarning(event: WeatherEvent): void {
    const daysUntil = event.startDay - this.currentDay;
    eventBus.emit('weather:warning', {
      type: event.type,
      daysUntil,
      startDay: event.startDay,
      data: event.data,
    });
  }

  /**
   * TLDR: Activate weather event
   */
  private activateEvent(event: WeatherEvent): void {
    event.isActive = true;
    const eventId = `${event.type}_${event.startDay}`;
    this.activeEvents.set(eventId, event);

    if (event.type === WeatherEventType.DROUGHT) {
      eventBus.emit('drought:started', { duration: event.endDay - event.startDay });
    } else if (event.type === WeatherEventType.FROST) {
      eventBus.emit('frost:started', {
        damagePerDay: (event.data as FrostEventData).damagePerDay,
      });
    } else if (event.type === WeatherEventType.HEAVY_RAIN) {
      eventBus.emit('heavy_rain:started', {});
    }
  }

  /**
   * TLDR: Deactivate weather event
   */
  private deactivateEvent(event: WeatherEvent): void {
    event.isActive = false;
    const eventId = `${event.type}_${event.startDay}`;
    this.activeEvents.delete(eventId);

    if (event.type === WeatherEventType.DROUGHT) {
      eventBus.emit('drought:ended', { duration: event.endDay - event.startDay });
    } else if (event.type === WeatherEventType.FROST) {
      eventBus.emit('frost:ended', {});
    } else if (event.type === WeatherEventType.HEAVY_RAIN) {
      eventBus.emit('heavy_rain:ended', {});
    }
  }

  /**
   * TLDR: Apply frost damage to non-frost-resistant plants
   */
  applyFrostDamage(plants: Plant[]): void {
    if (!this.isFrostActive()) return;

    const frostEvent = this.getActiveFrostEvent();
    if (!frostEvent) return;

    const frostData = frostEvent.data as FrostEventData;

    for (const plant of plants) {
      if (!plant.active) continue;
      const config = plant.getConfig();
      if (!config.availableSeasons.includes(Season.WINTER)) {
        plant.takeDamage(frostData.damagePerDay);
      }
    }
  }

  /**
   * TLDR: Get drought water need multiplier
   */
  getDroughtMultiplier(): number {
    const droughtEvent = this.getActiveDroughtEvent();
    if (!droughtEvent) return 1.0;
    return (droughtEvent.data as DroughtEventData).waterNeedMultiplier;
  }

  /**
   * TLDR: Get drought soil drying multiplier
   */
  getDroughtSoilDryingMultiplier(): number {
    const droughtEvent = this.getActiveDroughtEvent();
    if (!droughtEvent) return 1.0;
    return (droughtEvent.data as DroughtEventData).soilDryingMultiplier;
  }

  /**
   * TLDR: Check if drought is active
   */
  isDroughtActive(): boolean {
    return this.getActiveDroughtEvent() !== null;
  }

  /**
   * TLDR: Check if frost is active
   */
  isFrostActive(): boolean {
    return this.getActiveFrostEvent() !== null;
  }

  /**
   * TLDR: Check if heavy rain is active
   */
  isHeavyRainActive(): boolean {
    return this.getActiveHeavyRainEvent() !== null;
  }

  /**
   * TLDR: Get active drought event
   */
  private getActiveDroughtEvent(): WeatherEvent | null {
    for (const event of this.activeEvents.values()) {
      if (event.type === WeatherEventType.DROUGHT && event.isActive) {
        return event;
      }
    }
    return null;
  }

  /**
   * TLDR: Get active frost event
   */
  private getActiveFrostEvent(): WeatherEvent | null {
    for (const event of this.activeEvents.values()) {
      if (event.type === WeatherEventType.FROST && event.isActive) {
        return event;
      }
    }
    return null;
  }

  /**
   * TLDR: Get active heavy rain event
   */
  private getActiveHeavyRainEvent(): WeatherEvent | null {
    for (const event of this.activeEvents.values()) {
      if (event.type === WeatherEventType.HEAVY_RAIN && event.isActive) {
        return event;
      }
    }
    return null;
  }

  /**
   * TLDR: Get drought info for UI display
   */
  getDroughtInfo():
    | { active: true; daysRemaining: number; multiplier: number }
    | { active: false } {
    const event = this.getActiveDroughtEvent();
    if (!event) return { active: false };

    return {
      active: true,
      daysRemaining: event.endDay - this.currentDay,
      multiplier: (event.data as DroughtEventData).waterNeedMultiplier,
    };
  }

  /**
   * TLDR: Get frost info for UI display
   */
  getFrostInfo(): { active: boolean; damagePerDay: number } {
    const event = this.getActiveFrostEvent();
    if (!event) return { active: false, damagePerDay: 0 };

    return {
      active: true,
      damagePerDay: (event.data as FrostEventData).damagePerDay,
    };
  }

  /**
   * TLDR: Get all active weather events
   */
  getActiveEvents(): WeatherEvent[] {
    return Array.from(this.activeEvents.values());
  }

  /**
   * TLDR: Get all upcoming warnings (within 2 days)
   */
  getUpcomingWarnings(): Array<{
    type: WeatherEventType;
    daysUntil: number;
    startDay: number;
  }> {
    const warnings: Array<{
      type: WeatherEventType;
      daysUntil: number;
      startDay: number;
    }> = [];

    for (const event of this.upcomingEvents) {
      const daysUntil = event.startDay - this.currentDay;
      if (daysUntil > 0 && daysUntil <= 2) {
        warnings.push({
          type: event.type,
          daysUntil,
          startDay: event.startDay,
        });
      }
    }

    return warnings;
  }

  /**
   * TLDR: Reset system for new season
   */
  reset(seasonCount?: number, season?: Season): void {
    this.activeEvents.clear();
    this.upcomingEvents = [];
    this.currentDay = 0;

    if (seasonCount !== undefined) {
      this.config.seasonCount = seasonCount;
      const scaling = getDifficultyScaling(seasonCount);
      this.droughtConfig = scaleDroughtConfig(DROUGHT_CONFIG, scaling);
    }

    if (season !== undefined) {
      this.config.season = season;
      const seasonCfg = SEASON_CONFIG[season];
      this.enableDrought = seasonCfg.droughtEnabled;
      this.frostEnabled = seasonCfg.frostEnabled;
      this.frostDamagePerDay = seasonCfg.frostDamagePerDay;
    }

    this.scheduleWeatherEvents();
  }

  update(delta: number): void {
    // Weather updates on day advance, not frame-by-frame
  }

  destroy(): void {
    this.activeEvents.clear();
    this.upcomingEvents = [];
  }
}
