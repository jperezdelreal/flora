/**
 * AudioManager — Central audio system for Flora
 * 
 * Features:
 * - Web Audio API routing: sfxBus + ambientBus + musicBus → masterGain → compressor → destination
 * - Procedural ambient loop generation with seasonal ambient support
 * - Crossfade transitions between seasonal ambient profiles
 * - Procedural SFX synthesis (plant, water, harvest, wilt, pest, day advance,
 *   discovery, achievement, frost crack, synergy)
 * - Volume control per channel
 * - Mute/unmute support
 * 
 * Based on patterns from ComeRosquillas and firstPunch audio systems.
 */

import { AUDIO, type SFXType, type SeasonKey } from '../config/audio';
import type { SaveManager } from './SaveManager';
import { eventBus } from '../core/EventBus';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  
  // Mix buses
  private sfxBus: GainNode | null = null;
  private ambientBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  
  // Ambient loop state
  private ambientNodes: AudioNode[] = [];
  private ambientIntervals: number[] = [];
  private ambientPlaying = false;
  
  private currentSeason: SeasonKey | null = null;
  // Crossfade state
  private crossfading = false;
  private outgoingAmbientBus: GainNode | null = null;
  private outgoingAmbientNodes: AudioNode[] = [];
  private outgoingAmbientIntervals: number[] = [];
  
  // Mute state
  private muted = {
    master: false,
    sfx: false,
    ambient: false,
    music: false,
  };

  // User volume preferences (persisted)
  private volumePreferences: {
    master: number;
    sfx: number;
    ambient: number;
    music: number;
  } = {
    master: AUDIO.VOLUMES.MASTER,
    sfx: AUDIO.VOLUMES.SFX,
    ambient: AUDIO.VOLUMES.AMBIENT,
    music: AUDIO.VOLUMES.MUSIC,
  };

  private readonly STORAGE_KEY = 'flora:audio:preferences';
  
  // SFX debounce tracking (50ms per type to prevent stacking)
  private lastPlayTimes: Map<SFXType, number> = new Map();
  private readonly DEBOUNCE_MS = 50;
  private saveManager?: SaveManager;

  // TLDR: Store bound listeners for cleanup
  private boundPlantCreated!: () => void;
  private boundPlantWatered!: () => void;
  private boundPlantHarvested!: () => void;
  private boundPlantDied!: () => void;
  private boundPestSpawned!: () => void;
  private boundWeedRemoved!: () => void;
  private boundCompostApplied!: () => void;
  private boundToolUpgraded!: () => void;
  private boundToolUnlocked!: () => void;
  private boundPlantMatured!: () => void;
  private boundPlayerMoved!: () => void;
  private boundDayAdvanced!: () => void;
  private boundDiscovery!: () => void;
  private boundAchievement!: () => void;
  private boundFrostStarted!: () => void;
  private boundSynergy!: () => void;
  private boundSeasonTransition!: (data: { fromSeason: string; toSeason: string }) => void;
  
  /**
   * Initialize audio context and routing graph
   */
  init(saveManager?: SaveManager): void {
    if (this.ctx) return; // Already initialized
    
    // TLDR: Store SaveManager reference for delegated save/load
    this.saveManager = saveManager;
    
    // Load saved volume preferences
    this._loadPreferences();
    
    this.ctx = new AudioContext();
    
    // Build routing graph: buses → masterGain → compressor → destination
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;
    this.compressor.connect(this.ctx.destination);
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.volumePreferences.master;
    this.masterGain.connect(this.compressor);
    
    // Create mix buses
    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = this.volumePreferences.sfx;
    this.sfxBus.connect(this.masterGain);
    
    this.ambientBus = this.ctx.createGain();
    this.ambientBus.gain.value = this.volumePreferences.ambient;
    this.ambientBus.connect(this.masterGain);
    
    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = this.volumePreferences.music;
    this.musicBus.connect(this.masterGain);
  }
  
  /**
   * Set up EventBus listeners for game events
   */
  setupEventListeners(): void {
    // Plant lifecycle events
    this.boundPlantCreated = () => this.playSFX('PLANT');
    eventBus.on('plant:created', this.boundPlantCreated);
    
    this.boundPlantWatered = () => this.playSFX('WATER');
    eventBus.on('plant:watered', this.boundPlantWatered);
    
    this.boundPlantHarvested = () => this.playSFX('HARVEST');
    eventBus.on('plant:harvested', this.boundPlantHarvested);
    
    this.boundPlantDied = () => this.playSFX('WILT');
    eventBus.on('plant:died', this.boundPlantDied);
    
    // Hazard events
    this.boundPestSpawned = () => this.playSFX('PEST_APPEAR');
    eventBus.on('pest:spawned', this.boundPestSpawned);
    
    // Weed & compost events
    this.boundWeedRemoved = () => this.playSFX('WEED_PULL');
    eventBus.on('weed:removed', this.boundWeedRemoved);
    
    this.boundCompostApplied = () => this.playSFX('COMPOST_SPREAD');
    eventBus.on('compost:applied', this.boundCompostApplied);
    
    // Tool progression events
    this.boundToolUpgraded = () => this.playSFX('TOOL_UPGRADE');
    eventBus.on('tool:upgraded', this.boundToolUpgraded);
    
    this.boundToolUnlocked = () => this.playSFX('TOOL_UNLOCK');
    eventBus.on('tool:unlocked', this.boundToolUnlocked);
    
    this.boundPlantMatured = () => this.playSFX('MATURE');
    eventBus.on('plant:matured', this.boundPlantMatured);

    // Player movement event
    this.boundPlayerMoved = () => this.playSFX('MOVE');
    eventBus.on('player:moved', this.boundPlayerMoved);

    // Day advance bell
    this.boundDayAdvanced = () => this.playSFX('DAY_ADVANCE');
    eventBus.on('day:advanced', this.boundDayAdvanced);
    // Discovery chime
    this.boundDiscovery = () => this.playSFX('DISCOVERY');
    eventBus.on('discovery:new', this.boundDiscovery);
    // Achievement fanfare
    this.boundAchievement = () => this.playSFX('ACHIEVEMENT');
    eventBus.on('achievement:unlocked', this.boundAchievement);
    // Frost crackle
    this.boundFrostStarted = () => this.playSFX('FROST_CRACK');
    eventBus.on('frost:started', this.boundFrostStarted);
    // Synergy harmonic
    this.boundSynergy = () => this.playSFX('SYNERGY');
    eventBus.on('synergy:activated', this.boundSynergy);
    // Season crossfade
    this.boundSeasonTransition = (data) => {
      const toSeason = data.toSeason as SeasonKey;
      if (toSeason in AUDIO.SEASONAL_AMBIENT) {
        this.crossfadeToSeason(toSeason);
      }
    };
    eventBus.on('multiseason:transition', this.boundSeasonTransition);
  }
  
  /**
   * Resume audio context (required after user interaction)
   */
  async resume(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }
  
  /**
   * Start ambient audio loop (optionally seasonal)
   */
  startAmbient(season?: SeasonKey): void {
    if (!this.ctx || !this.ambientBus || this.ambientPlaying) return;
    this.ambientPlaying = true;
    this.currentSeason = season ?? null;
    if (season && season in AUDIO.SEASONAL_AMBIENT) {
      this._startSeasonalAmbient(season, this.ambientBus, this.ambientNodes, this.ambientIntervals);
    } else {
      this._startGenericAmbient(this.ambientBus, this.ambientNodes, this.ambientIntervals);
    }
  }

  /**
   * Crossfade ambient audio to a new season
   */
  crossfadeToSeason(newSeason: SeasonKey): void {
    if (!this.ctx || !this.ambientBus || !this.masterGain) return;
    if (this.crossfading || this.currentSeason === newSeason) return;
    this.crossfading = true;
    const fadeDuration = AUDIO.CROSSFADE.DURATION;
    const now = this.ctx.currentTime;
    // Fade out current ambient
    this.ambientBus.gain.cancelScheduledValues(now);
    this.ambientBus.gain.setValueAtTime(this.ambientBus.gain.value, now);
    this.ambientBus.gain.linearRampToValueAtTime(0, now + fadeDuration);
    // Stash outgoing state
    this.outgoingAmbientNodes = [...this.ambientNodes];
    this.outgoingAmbientIntervals = [...this.ambientIntervals];
    this.ambientNodes = [];
    this.ambientIntervals = [];
    // Create incoming bus with fade in
    const incomingBus = this.ctx.createGain();
    incomingBus.gain.setValueAtTime(0, now);
    incomingBus.gain.linearRampToValueAtTime(this.volumePreferences.ambient, now + fadeDuration);
    incomingBus.connect(this.masterGain);
    // Start new seasonal ambient
    this.currentSeason = newSeason;
    this._startSeasonalAmbient(newSeason, incomingBus, this.ambientNodes, this.ambientIntervals);
    // After crossfade: cleanup outgoing, rebuild on real bus
    setTimeout(() => {
      for (const id of this.outgoingAmbientIntervals) clearTimeout(id);
      this.outgoingAmbientIntervals = [];
      for (const node of this.outgoingAmbientNodes) {
        try { if (node instanceof AudioScheduledSourceNode) node.stop(); node.disconnect(); } catch { /* ok */ }
      }
      this.outgoingAmbientNodes = [];
      // Rebuild on the real ambient bus
      if (this.ambientBus && this.ctx) {
        for (const node of this.ambientNodes) { try { node.disconnect(); } catch { /* ok */ } }
        const tempIntervals = [...this.ambientIntervals];
        this.ambientNodes = [];
        this.ambientIntervals = [];
        for (const id of tempIntervals) clearTimeout(id);
        this.ambientBus.gain.cancelScheduledValues(this.ctx.currentTime);
        this.ambientBus.gain.setValueAtTime(this.volumePreferences.ambient, this.ctx.currentTime);
        this._startSeasonalAmbient(newSeason, this.ambientBus, this.ambientNodes, this.ambientIntervals);
      }
      incomingBus.disconnect();
      this.crossfading = false;
    }, fadeDuration * 1000 + 100);
  }

  /**
   * Get the current seasonal ambient profile in use
   */
  getCurrentAmbientSeason(): SeasonKey | null { return this.currentSeason; }
  
  /**
   * Stop ambient audio loop
   */
  stopAmbient(): void {
    if (!this.ctx || !this.ambientBus || !this.ambientPlaying) return;
    
    this.ambientPlaying = false;
    
    // Clear intervals
    for (const id of this.ambientIntervals) {
      clearTimeout(id);
    }
    this.ambientIntervals = [];
    
    this.currentSeason = null;
    // Cleanup crossfade state
    for (const id of this.outgoingAmbientIntervals) clearTimeout(id);
    this.outgoingAmbientIntervals = [];
    for (const node of this.outgoingAmbientNodes) {
      try { if (node instanceof AudioScheduledSourceNode) node.stop(); node.disconnect(); } catch { /* ok */ }
    }
    this.outgoingAmbientNodes = [];
    if (this.outgoingAmbientBus) { this.outgoingAmbientBus.disconnect(); this.outgoingAmbientBus = null; }
    this.crossfading = false;
    
    // Fade out and disconnect nodes
    const now = this.ctx.currentTime;
    this.ambientBus.gain.cancelScheduledValues(now);
    this.ambientBus.gain.setValueAtTime(this.ambientBus.gain.value, now);
    this.ambientBus.gain.linearRampToValueAtTime(0, now + 1.0);
    
    setTimeout(() => {
      for (const node of this.ambientNodes) {
        try {
          if (node instanceof AudioScheduledSourceNode) {
            node.stop();
          }
          node.disconnect();
        } catch (e) {
          // Node may already be stopped/disconnected
        }
      }
      this.ambientNodes = [];
      
      // Restore bus gain
      if (this.ambientBus && this.ctx) {
        this.ambientBus.gain.value = this.volumePreferences.ambient;
      }
    }, 1100);
  }
  
  /**
   * Play a procedural SFX
   */
  playSFX(type: SFXType): void {
    if (!this.ctx || !this.sfxBus) return;
    
    // Debounce check: prevent same sound from playing within 50ms
    const now = this.ctx.currentTime;
    const nowMs = now * 1000;
    const lastPlayMs = this.lastPlayTimes.get(type);
    
    if (lastPlayMs !== undefined && (nowMs - lastPlayMs) < this.DEBOUNCE_MS) {
      return; // Skip - too soon since last play
    }
    
    // Update last play time
    this.lastPlayTimes.set(type, nowMs);
    
    switch (type) {
      case 'PLANT':
        this._playPlantSFX(now);
        break;
      case 'WATER':
        this._playWaterSFX(now);
        break;
      case 'HARVEST':
        this._playHarvestSFX(now);
        break;
      case 'WILT':
        this._playWiltSFX(now);
        break;
      case 'PEST_APPEAR':
        this._playPestSFX(now);
        break;
      case 'WEED_PULL':
        this._playWeedPullSFX(now);
        break;
      case 'COMPOST_SPREAD':
        this._playCompostSpreadSFX(now);
        break;
      case 'TOOL_UPGRADE':
        this._playToolUpgradeSFX(now);
        break;
      case 'TOOL_UNLOCK':
        this._playToolUnlockSFX(now);
        break;
      case 'MATURE':
        this._playMatureSFX(now);
        break;
      case 'MOVE':
        this._playMoveSFX(now);
        break;
      case 'DAY_ADVANCE':
        this._playDayAdvanceSFX(now);
        break;
      case 'DISCOVERY':
        this._playDiscoverySFX(now);
        break;
      case 'ACHIEVEMENT':
        this._playAchievementSFX(now);
        break;
      case 'FROST_CRACK':
        this._playFrostCrackSFX(now);
        break;
      case 'SYNERGY':
        this._playSynergySFX(now);
        break;
    }
  }
  
  /**
   * Set master volume (0.0 to 1.0)
   */
  setMasterVolume(volume: number): void {
    if (!this.masterGain) return;
    const clamped = Math.max(0, Math.min(1, volume));
    this.volumePreferences.master = clamped;
    this.masterGain.gain.value = clamped;
    this._savePreferences();
  }
  
  /**
   * Set SFX volume (0.0 to 1.0)
   */
  setSFXVolume(volume: number): void {
    if (!this.sfxBus) return;
    const clamped = Math.max(0, Math.min(1, volume));
    this.volumePreferences.sfx = clamped;
    this.sfxBus.gain.value = clamped;
    this._savePreferences();
  }
  
  /**
   * Set ambient volume (0.0 to 1.0)
   */
  setAmbientVolume(volume: number): void {
    if (!this.ambientBus) return;
    const clamped = Math.max(0, Math.min(1, volume));
    this.volumePreferences.ambient = clamped;
    this.ambientBus.gain.value = clamped;
    this._savePreferences();
  }
  
  /**
   * Set music volume (0.0 to 1.0)
   */
  setMusicVolume(volume: number): void {
    if (!this.musicBus) return;
    const clamped = Math.max(0, Math.min(1, volume));
    this.volumePreferences.music = clamped;
    this.musicBus.gain.value = clamped;
    this._savePreferences();
  }
  
  /**
   * Mute/unmute master output
   */
  setMasterMute(muted: boolean): void {
    this.muted.master = muted;
    if (!this.masterGain || !this.ctx) return;
    
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(
      muted ? 0 : this.volumePreferences.master,
      now + 0.1
    );
    this._savePreferences();
  }
  
  /**
   * Mute/unmute SFX
   */
  setSFXMute(muted: boolean): void {
    this.muted.sfx = muted;
    if (!this.sfxBus || !this.ctx) return;
    
    const now = this.ctx.currentTime;
    this.sfxBus.gain.cancelScheduledValues(now);
    this.sfxBus.gain.setValueAtTime(this.sfxBus.gain.value, now);
    this.sfxBus.gain.linearRampToValueAtTime(
      muted ? 0 : this.volumePreferences.sfx,
      now + 0.1
    );
    this._savePreferences();
  }
  
  /**
   * Mute/unmute ambient
   */
  setAmbientMute(muted: boolean): void {
    this.muted.ambient = muted;
    if (!this.ambientBus || !this.ctx) return;
    
    const now = this.ctx.currentTime;
    this.ambientBus.gain.cancelScheduledValues(now);
    this.ambientBus.gain.setValueAtTime(this.ambientBus.gain.value, now);
    this.ambientBus.gain.linearRampToValueAtTime(
      muted ? 0 : this.volumePreferences.ambient,
      now + 0.1
    );
    this._savePreferences();
  }
  
  /**
   * Mute/unmute music
   */
  setMusicMute(muted: boolean): void {
    this.muted.music = muted;
    if (!this.musicBus || !this.ctx) return;
    
    const now = this.ctx.currentTime;
    this.musicBus.gain.cancelScheduledValues(now);
    this.musicBus.gain.setValueAtTime(this.musicBus.gain.value, now);
    this.musicBus.gain.linearRampToValueAtTime(
      muted ? 0 : this.volumePreferences.music,
      now + 0.1
    );
    this._savePreferences();
  }
  
  /**
   * Get mute state
   */
  getMuteState(): Readonly<typeof this.muted> {
    return { ...this.muted };
  }

  /**
   * TLDR: Get current volume levels for all channels
   */
  getVolumes(): Readonly<{ master: number; sfx: number; ambient: number; music: number }> {
    return { ...this.volumePreferences };
  }
  
  /**
   * Cleanup and disconnect audio graph
   */
  destroy(): void {
    // TLDR: Clear all ambient timers to prevent background chirps after destroy
    for (const intervalId of this.ambientIntervals) {
      clearTimeout(intervalId);
    }
    this.ambientIntervals = [];
    
    // TLDR: Cleanup all EventBus subscriptions to prevent memory leaks
    eventBus.off('plant:created', this.boundPlantCreated);
    eventBus.off('plant:watered', this.boundPlantWatered);
    eventBus.off('plant:harvested', this.boundPlantHarvested);
    eventBus.off('plant:died', this.boundPlantDied);
    eventBus.off('pest:spawned', this.boundPestSpawned);
    eventBus.off('weed:removed', this.boundWeedRemoved);
    eventBus.off('compost:applied', this.boundCompostApplied);
    eventBus.off('tool:upgraded', this.boundToolUpgraded);
    eventBus.off('tool:unlocked', this.boundToolUnlocked);
    eventBus.off('plant:matured', this.boundPlantMatured);
    eventBus.off('player:moved', this.boundPlayerMoved);
    eventBus.off('day:advanced', this.boundDayAdvanced);
    eventBus.off('discovery:new', this.boundDiscovery);
    eventBus.off('achievement:unlocked', this.boundAchievement);
    eventBus.off('frost:started', this.boundFrostStarted);
    eventBus.off('synergy:activated', this.boundSynergy);
    eventBus.off('multiseason:transition', this.boundSeasonTransition);
    
    this.stopAmbient();
    
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    
    this.masterGain = null;
    this.compressor = null;
    this.sfxBus = null;
    this.ambientBus = null;
    this.musicBus = null;
  }
  
  // ===== Private SFX Methods =====
  
  private _playPlantSFX(startTime: number): void {
    if (!this.ctx || !this.sfxBus) return;
    
    const config = AUDIO.SFX.PLANT;
    
    // Soil tap (low thud)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(config.frequencies[0], startTime);
    osc1.frequency.exponentialRampToValueAtTime(
      config.frequencies[0] * 0.5,
      startTime + config.duration
    );
    
    const gain1 = this.ctx.createGain();
    gain1.gain.setValueAtTime(0.3, startTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, startTime + config.duration);
    
    osc1.connect(gain1);
    gain1.connect(this.sfxBus);
    osc1.start(startTime);
    osc1.stop(startTime + config.duration);
    
    // Hopeful chime (bright overtone)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = config.frequencies[1];
    
    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0.2, startTime + 0.03);
    gain2.gain.exponentialRampToValueAtTime(0.01, startTime + config.duration);
    
    osc2.connect(gain2);
    gain2.connect(this.sfxBus);
    osc2.start(startTime + 0.03);
    osc2.stop(startTime + config.duration);
  }
  
  private _playWaterSFX(startTime: number): void {
    if (!this.ctx || !this.sfxBus) return;
    
    const config = AUDIO.SFX.WATER;
    
    // Create noise buffer for water pour
    const noise = this._createNoiseBuffer();
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noise;
    
    // Bandpass filter for water-like sound
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = config.noiseCutoff;
    bandpass.Q.value = config.noiseBandwidth / config.noiseCutoff;
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, startTime);
    gain.gain.linearRampToValueAtTime(0.3, startTime + config.duration * 0.5);
    gain.gain.linearRampToValueAtTime(0, startTime + config.duration);
    
    noiseSource.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.sfxBus);
    noiseSource.start(startTime);
    noiseSource.stop(startTime + config.duration);
  }
  
  private _playHarvestSFX(startTime: number): void {
    if (!this.ctx || !this.sfxBus) return;
    
    const config = AUDIO.SFX.HARVEST;
    
    // Pop sound (quick sweep down)
    const popOsc = this.ctx.createOscillator();
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(config.popFreq, startTime);
    popOsc.frequency.exponentialRampToValueAtTime(
      config.popFreq * 0.3,
      startTime + 0.08
    );
    
    const popGain = this.ctx.createGain();
    popGain.gain.setValueAtTime(0.4, startTime);
    popGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.08);
    
    popOsc.connect(popGain);
    popGain.connect(this.sfxBus);
    popOsc.start(startTime);
    popOsc.stop(startTime + 0.08);
    
    // Joyful chime sequence (C6 → E6 → G6)
    for (let i = 0; i < config.chimeFreqs.length; i++) {
      const chimeStart = startTime + 0.1 + i * config.chimeStagger;
      
      const chimeOsc = this.ctx.createOscillator();
      chimeOsc.type = 'triangle';
      chimeOsc.frequency.value = config.chimeFreqs[i];
      
      const chimeGain = this.ctx.createGain();
      chimeGain.gain.setValueAtTime(0.25, chimeStart);
      chimeGain.gain.exponentialRampToValueAtTime(
        0.01,
        chimeStart + config.chimeDuration
      );
      
      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.sfxBus);
      chimeOsc.start(chimeStart);
      chimeOsc.stop(chimeStart + config.chimeDuration);
    }
  }
  
  /**
   * TLDR: Gentle two-note chime for plant maturity — cozy, not jarring
   */
  private _playMatureSFX(startTime: number): void {
    if (!this.ctx || !this.sfxBus) return;
    
    const config = AUDIO.SFX.MATURE;
    
    for (let i = 0; i < config.chimeFreqs.length; i++) {
      const chimeStart = startTime + i * config.chimeStagger;
      
      const chimeOsc = this.ctx.createOscillator();
      chimeOsc.type = 'sine';
      chimeOsc.frequency.value = config.chimeFreqs[i];
      
      const chimeGain = this.ctx.createGain();
      chimeGain.gain.setValueAtTime(0.2, chimeStart);
      chimeGain.gain.exponentialRampToValueAtTime(
        0.01,
        chimeStart + config.chimeDuration
      );
      
      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.sfxBus);
      chimeOsc.start(chimeStart);
      chimeOsc.stop(chimeStart + config.chimeDuration);
    }
  }
  
  /**
   * TLDR: Subtle footstep sound for tile movement — soft filtered noise tap (#306)
   */
  private _playMoveSFX(startTime: number): void {
    if (!this.ctx || !this.sfxBus) return;
    
    const config = AUDIO.SFX.MOVE;
    
    // Soft noise tap (grass crunch)
    const noise = this._createNoiseBuffer();
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noise;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = config.noiseFilterFreq;
    filter.Q.value = 1;
    
    const gain = this.ctx.createGain();
    // Volume at 40% of action layer (subtle, not distracting)
    gain.gain.setValueAtTime(0.12, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + config.duration);
    
    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxBus);
    noiseSource.start(startTime);
    noiseSource.stop(startTime + config.duration);
  }
  
  private _playWiltSFX(startTime: number): void {
    if (!this.ctx || !this.sfxBus) return;
    
    const config = AUDIO.SFX.WILT;
    
    // Descending sad tone (xylophone-like)
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(config.startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(
      config.endFreq,
      startTime + config.duration
    );
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, startTime);
    gain.gain.linearRampToValueAtTime(0.25, startTime + config.duration * 0.7);
    gain.gain.linearRampToValueAtTime(0, startTime + config.duration);
    
    osc.connect(gain);
    gain.connect(this.sfxBus);
    osc.start(startTime);
    osc.stop(startTime + config.duration);
  }
  
  private _playPestSFX(startTime: number): void {
    if (!this.ctx || !this.sfxBus) return;
    
    const config = AUDIO.SFX.PEST_APPEAR;
    
    // Alert chirp (quick high frequency)
    const alertOsc = this.ctx.createOscillator();
    alertOsc.type = 'sine';
    alertOsc.frequency.setValueAtTime(config.alertFreq, startTime);
    alertOsc.frequency.linearRampToValueAtTime(
      config.alertFreq * 1.2,
      startTime + config.duration * 0.5
    );
    
    const alertGain = this.ctx.createGain();
    alertGain.gain.setValueAtTime(0.3, startTime);
    alertGain.gain.linearRampToValueAtTime(0, startTime + config.duration);
    
    alertOsc.connect(alertGain);
    alertGain.connect(this.sfxBus);
    alertOsc.start(startTime);
    alertOsc.stop(startTime + config.duration);
    
    // Whoosh (low sweep)
    const whooshOsc = this.ctx.createOscillator();
    whooshOsc.type = 'sawtooth';
    whooshOsc.frequency.setValueAtTime(config.whooshFreq, startTime);
    whooshOsc.frequency.exponentialRampToValueAtTime(
      config.whooshFreq * 0.5,
      startTime + config.duration
    );
    
    const whooshGain = this.ctx.createGain();
    whooshGain.gain.setValueAtTime(0.15, startTime);
    whooshGain.gain.exponentialRampToValueAtTime(0.01, startTime + config.duration);
    
    whooshOsc.connect(whooshGain);
    whooshGain.connect(this.sfxBus);
    whooshOsc.start(startTime);
    whooshOsc.stop(startTime + config.duration);
  }
  
  // ===== Private Helper Methods =====
  
  private _playWeedPullSFX(startTime: number): void {
    if (!this.ctx || !this.sfxBus) return;
    
    const config = AUDIO.SFX.WEED_PULL;
    
    // Short earthy pop — filtered noise burst
    const noise = this._createNoiseBuffer();
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noise;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(config.noiseFilterFreq, startTime);
    filter.frequency.exponentialRampToValueAtTime(200, startTime + config.duration);
    filter.Q.value = 2;
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + config.duration);
    
    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxBus);
    noiseSource.start(startTime);
    noiseSource.stop(startTime + config.duration);
  }
  
  private _playCompostSpreadSFX(startTime: number): void {
    if (!this.ctx || !this.sfxBus) return;
    
    const config = AUDIO.SFX.COMPOST_SPREAD;
    
    // Soft crumble — noise + low sine
    const noise = this._createNoiseBuffer();
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noise;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = config.noiseFilterFreq;
    filter.Q.value = 1;
    
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, startTime);
    noiseGain.gain.linearRampToValueAtTime(0.15, startTime + config.duration * 0.6);
    noiseGain.gain.linearRampToValueAtTime(0, startTime + config.duration);
    
    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxBus);
    noiseSource.start(startTime);
    noiseSource.stop(startTime + config.duration);
    
    // Low sine for body
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = config.sineFreq;
    
    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.15, startTime);
    oscGain.gain.exponentialRampToValueAtTime(0.01, startTime + config.duration);
    
    osc.connect(oscGain);
    oscGain.connect(this.sfxBus);
    osc.start(startTime);
    osc.stop(startTime + config.duration);
  }
  
  private _playToolUpgradeSFX(startTime: number): void {
    if (!this.ctx || !this.sfxBus) return;
    
    const config = AUDIO.SFX.TOOL_UPGRADE;
    
    // Ascending chime — 3-note sine sweep up
    for (let i = 0; i < config.frequencies.length; i++) {
      const noteStart = startTime + i * config.noteSpacing;
      
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = config.frequencies[i];
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.01, noteStart + 0.15);
      
      osc.connect(gain);
      gain.connect(this.sfxBus);
      osc.start(noteStart);
      osc.stop(noteStart + 0.15);
    }
  }
  
  private _playToolUnlockSFX(startTime: number): void {
    if (!this.ctx || !this.sfxBus) return;
    
    const config = AUDIO.SFX.TOOL_UNLOCK;
    
    // Discovery jingle — 4-note melody
    for (let i = 0; i < config.frequencies.length; i++) {
      const noteStart = startTime + i * config.noteSpacing;
      const noteDuration = 0.18;
      
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = config.frequencies[i];
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.28, noteStart);
      gain.gain.setValueAtTime(0.28, noteStart + noteDuration * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.01, noteStart + noteDuration);
      
      osc.connect(gain);
      gain.connect(this.sfxBus);
      osc.start(noteStart);
      osc.stop(noteStart + noteDuration);
    }
    
    // Shimmer overlay on last note
    const shimmerStart = startTime + (config.frequencies.length - 1) * config.noteSpacing;
    const shimmerOsc = this.ctx.createOscillator();
    shimmerOsc.type = 'sine';
    shimmerOsc.frequency.value = config.frequencies[config.frequencies.length - 1] * 2;
    
    const shimmerGain = this.ctx.createGain();
    shimmerGain.gain.setValueAtTime(0.12, shimmerStart);
    shimmerGain.gain.exponentialRampToValueAtTime(0.01, shimmerStart + 0.25);
    
    shimmerOsc.connect(shimmerGain);
    shimmerGain.connect(this.sfxBus);
    shimmerOsc.start(shimmerStart);
    shimmerOsc.stop(shimmerStart + 0.25);
  }
  
  private _startGenericAmbient(bus: GainNode, nodes: AudioNode[], intervals: number[]): void {
    if (!this.ctx) return;

    // Layer 1: Continuous filtered noise (wind/rustling)
    const noise = this._createNoiseBuffer();
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noise;
    noiseSource.loop = true;

    const noiseLowpass = this.ctx.createBiquadFilter();
    noiseLowpass.type = 'lowpass';
    noiseLowpass.frequency.value = AUDIO.AMBIENT.NOISE_CUTOFF;
    noiseLowpass.Q.value = 1;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.value = 0.08;

    noiseSource.connect(noiseLowpass);
    noiseLowpass.connect(noiseGain);
    noiseGain.connect(bus);
    noiseSource.start();

    nodes.push(noiseSource, noiseLowpass, noiseGain);

    // Layer 2: Soft oscillator pads (220Hz + 330Hz sine waves with LFO)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = AUDIO.AMBIENT.OSCILLATOR_FREQ_1;

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = AUDIO.AMBIENT.OSCILLATOR_FREQ_2;

    const oscGain = this.ctx.createGain();
    oscGain.gain.value = 0.04;

    // LFO for slow amplitude modulation
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.2; // 0.2 Hz = 5 second cycle

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.02; // Modulation depth

    lfo.connect(lfoGain);
    lfoGain.connect(oscGain.gain);

    osc1.connect(oscGain);
    osc2.connect(oscGain);
    oscGain.connect(bus);

    osc1.start();
    osc2.start();
    lfo.start();

    nodes.push(osc1, osc2, oscGain, lfo, lfoGain);

    // Layer 3: Random bird chirps (every 5-8 seconds)
    this._scheduleRandomChirp(bus, intervals);
  }

  private _startSeasonalAmbient(season: SeasonKey, bus: GainNode, nodes: AudioNode[], intervals: number[]): void {
    if (!this.ctx) return;
    const profile = AUDIO.SEASONAL_AMBIENT[season];

    // Layer 1: Filtered noise with season-specific cutoff/gain
    const noise = this._createNoiseBuffer();
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noise;
    noiseSource.loop = true;

    const noiseLowpass = this.ctx.createBiquadFilter();
    noiseLowpass.type = 'lowpass';
    noiseLowpass.frequency.value = profile.noiseCutoff;
    noiseLowpass.Q.value = 1;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.value = profile.noiseGain;

    noiseSource.connect(noiseLowpass);
    noiseLowpass.connect(noiseGain);
    noiseGain.connect(bus);
    noiseSource.start();

    nodes.push(noiseSource, noiseLowpass, noiseGain);

    // Layer 2: Oscillator pads with season-specific frequencies and LFO
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = profile.oscFreq1;

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = profile.oscFreq2;

    const oscGain = this.ctx.createGain();
    oscGain.gain.value = profile.oscGain;

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = profile.lfoRate;

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = profile.lfoDepth;

    lfo.connect(lfoGain);
    lfoGain.connect(oscGain.gain);

    osc1.connect(oscGain);
    osc2.connect(oscGain);
    oscGain.connect(bus);

    osc1.start();
    osc2.start();
    lfo.start();

    nodes.push(osc1, osc2, oscGain, lfo, lfoGain);

    // Layer 3: Season-specific nature sounds
    if (profile.chirpEnabled) {
      this._scheduleSeasonalChirp(bus, intervals, profile.chirpMinDelay, profile.chirpMaxDelay, profile.chirpBaseFreq, profile.chirpVolume);
    }
    if (profile.rainEnabled) {
      this._scheduleRainDrops(bus, intervals, profile.rainMinDelay, profile.rainMaxDelay, profile.rainFreq, profile.rainVolume);
    }
    if ('cricketEnabled' in profile && profile.cricketEnabled) {
      this._scheduleCrickets(bus, intervals, profile.cricketMinDelay, profile.cricketMaxDelay, profile.cricketFreq, profile.cricketVolume);
    }
    if ('rustleEnabled' in profile && profile.rustleEnabled) {
      this._scheduleRustling(bus, intervals, profile.rustleMinDelay, profile.rustleMaxDelay, profile.rustleFilterFreq, profile.rustleVolume);
    }
    if ('crackleEnabled' in profile && profile.crackleEnabled) {
      this._scheduleFrostCrackle(bus, intervals, profile.crackleMinDelay, profile.crackleMaxDelay, profile.crackleVolume);
    }
  }

  // ===== Seasonal Nature Sound Schedulers =====

  private _scheduleSeasonalChirp(bus: GainNode, intervals: number[], minDelay: number, maxDelay: number, baseFreq: number, volume: number): void {
    if (!this.ambientPlaying) return;
    const delay = minDelay + Math.random() * (maxDelay - minDelay);
    const timerId = window.setTimeout(() => {
      this._playSeasonalChirpNote(bus, baseFreq, volume);
      this._scheduleSeasonalChirp(bus, intervals, minDelay, maxDelay, baseFreq, volume);
    }, delay);
    intervals.push(timerId);
  }

  private _playSeasonalChirpNote(bus: GainNode, baseFreq: number, volume: number): void {
    if (!this.ctx || !this.ambientPlaying) return;
    const now = this.ctx.currentTime;
    const variation = 0.7 + Math.random() * 0.6;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq * variation, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * variation * 1.2, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * variation * 0.9, now + 0.12);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.connect(gain);
    gain.connect(bus);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  private _scheduleRainDrops(bus: GainNode, intervals: number[], minDelay: number, maxDelay: number, freq: number, volume: number): void {
    if (!this.ambientPlaying) return;
    const delay = minDelay + Math.random() * (maxDelay - minDelay);
    const timerId = window.setTimeout(() => {
      if (this.ctx && this.ambientPlaying) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * (0.9 + Math.random() * 0.2), now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.06);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.connect(gain);
        gain.connect(bus);
        osc.start(now);
        osc.stop(now + 0.06);
      }
      this._scheduleRainDrops(bus, intervals, minDelay, maxDelay, freq, volume);
    }, delay);
    intervals.push(timerId);
  }

  private _scheduleCrickets(bus: GainNode, intervals: number[], minDelay: number, maxDelay: number, freq: number, volume: number): void {
    if (!this.ambientPlaying) return;
    const delay = minDelay + Math.random() * (maxDelay - minDelay);
    const timerId = window.setTimeout(() => {
      if (this.ctx && this.ambientPlaying) {
        const now = this.ctx.currentTime;
        // Rapid chirp burst (2-3 quick pulses)
        const pulses = 2 + Math.floor(Math.random() * 2);
        for (let p = 0; p < pulses; p++) {
          const t = now + p * 0.04;
          const osc = this.ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = freq * (0.95 + Math.random() * 0.1);
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(volume, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
          osc.connect(gain);
          gain.connect(bus);
          osc.start(t);
          osc.stop(t + 0.03);
        }
      }
      this._scheduleCrickets(bus, intervals, minDelay, maxDelay, freq, volume);
    }, delay);
    intervals.push(timerId);
  }

  private _scheduleRustling(bus: GainNode, intervals: number[], minDelay: number, maxDelay: number, filterFreq: number, volume: number): void {
    if (!this.ambientPlaying) return;
    const delay = minDelay + Math.random() * (maxDelay - minDelay);
    const timerId = window.setTimeout(() => {
      if (this.ctx && this.ambientPlaying) {
        const now = this.ctx.currentTime;
        const noise = this._createNoiseBuffer();
        const src = this.ctx.createBufferSource();
        src.buffer = noise;
        const bp = this.ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = filterFreq;
        bp.Q.value = 0.8;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume, now + 0.1);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);
        src.connect(bp);
        bp.connect(gain);
        gain.connect(bus);
        src.start(now);
        src.stop(now + 0.4);
      }
      this._scheduleRustling(bus, intervals, minDelay, maxDelay, filterFreq, volume);
    }, delay);
    intervals.push(timerId);
  }

  private _scheduleFrostCrackle(bus: GainNode, intervals: number[], minDelay: number, maxDelay: number, volume: number): void {
    if (!this.ambientPlaying) return;
    const delay = minDelay + Math.random() * (maxDelay - minDelay);
    const timerId = window.setTimeout(() => {
      if (this.ctx && this.ambientPlaying) {
        const now = this.ctx.currentTime;
        // Tiny high-freq noise burst
        const noise = this._createNoiseBuffer();
        const src = this.ctx.createBufferSource();
        src.buffer = noise;
        const hp = this.ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 6000;
        hp.Q.value = 1;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        src.connect(hp);
        hp.connect(gain);
        gain.connect(bus);
        src.start(now);
        src.stop(now + 0.08);
      }
      this._scheduleFrostCrackle(bus, intervals, minDelay, maxDelay, volume);
    }, delay);
    intervals.push(timerId);
  }

  private _scheduleRandomChirp(bus: GainNode, intervals: number[]): void {
    if (!this.ambientPlaying) return;
    
    const randomDelay = 5000 + Math.random() * 3000; // 5-8 seconds
    
    const timerId = window.setTimeout(() => {
      this._playChirp(bus);
      this._scheduleRandomChirp(bus, intervals); // Schedule next chirp
    }, randomDelay);
    
    intervals.push(timerId);
  }
  
  private _playChirp(bus: GainNode): void {
    if (!this.ctx || !this.ambientPlaying) return;
    
    const now = this.ctx.currentTime;
    const baseFreq = 3200;
    const variation = 0.7 + Math.random() * 0.6; // ±30% variation
    
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq * variation, now);
    osc.frequency.exponentialRampToValueAtTime(
      baseFreq * variation * 1.2,
      now + 0.08
    );
    osc.frequency.exponentialRampToValueAtTime(
      baseFreq * variation * 0.9,
      now + 0.12
    );
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    
    osc.connect(gain);
    gain.connect(bus);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  // ===== New SFX Methods =====

  private _playDayAdvanceSFX(startTime: number): void {
    if (!this.ctx || !this.sfxBus) return;
    const config = AUDIO.SFX.DAY_ADVANCE;
    // Soft bell
    const bell = this.ctx.createOscillator();
    bell.type = 'sine';
    bell.frequency.value = config.bellFreq;
    const bellGain = this.ctx.createGain();
    bellGain.gain.setValueAtTime(0.25, startTime);
    bellGain.gain.exponentialRampToValueAtTime(0.01, startTime + config.duration);
    bell.connect(bellGain);
    bellGain.connect(this.sfxBus);
    bell.start(startTime);
    bell.stop(startTime + config.duration);
    // Shimmer overtone
    const shimmer = this.ctx.createOscillator();
    shimmer.type = 'sine';
    shimmer.frequency.value = config.shimmerFreq;
    const shimmerGain = this.ctx.createGain();
    shimmerGain.gain.setValueAtTime(0.1, startTime + 0.02);
    shimmerGain.gain.exponentialRampToValueAtTime(0.01, startTime + config.duration);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(this.sfxBus);
    shimmer.start(startTime + 0.02);
    shimmer.stop(startTime + config.duration);
  }

  private _playDiscoverySFX(startTime: number): void {
    if (!this.ctx || !this.sfxBus) return;
    const config = AUDIO.SFX.DISCOVERY;
    // Ascending 4-note triangle melody
    for (let i = 0; i < config.frequencies.length; i++) {
      const noteStart = startTime + i * config.noteSpacing;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = config.frequencies[i];
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.01, noteStart + 0.15);
      osc.connect(gain);
      gain.connect(this.sfxBus);
      osc.start(noteStart);
      osc.stop(noteStart + 0.15);
    }
    // Sparkle overlay on last note
    const sparkleStart = startTime + (config.frequencies.length - 1) * config.noteSpacing;
    const sparkle = this.ctx.createOscillator();
    sparkle.type = 'sine';
    sparkle.frequency.value = config.frequencies[config.frequencies.length - 1] * 2;
    const sparkleGain = this.ctx.createGain();
    sparkleGain.gain.setValueAtTime(0.1, sparkleStart);
    sparkleGain.gain.exponentialRampToValueAtTime(0.01, sparkleStart + config.shimmerDuration);
    sparkle.connect(sparkleGain);
    sparkleGain.connect(this.sfxBus);
    sparkle.start(sparkleStart);
    sparkle.stop(sparkleStart + config.shimmerDuration);
  }

  private _playAchievementSFX(startTime: number): void {
    if (!this.ctx || !this.sfxBus) return;
    const config = AUDIO.SFX.ACHIEVEMENT;
    // 5-note ascending fanfare
    for (let i = 0; i < config.frequencies.length; i++) {
      const noteStart = startTime + i * config.noteSpacing;
      const noteDuration = 0.18;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = config.frequencies[i];
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.28, noteStart);
      gain.gain.setValueAtTime(0.28, noteStart + noteDuration * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.01, noteStart + noteDuration);
      osc.connect(gain);
      gain.connect(this.sfxBus);
      osc.start(noteStart);
      osc.stop(noteStart + noteDuration);
    }
  }

  private _playFrostCrackSFX(startTime: number): void {
    if (!this.ctx || !this.sfxBus) return;
    const config = AUDIO.SFX.FROST_CRACK;
    // Highpass noise burst
    const noise = this._createNoiseBuffer();
    const noiseSrc = this.ctx.createBufferSource();
    noiseSrc.buffer = noise;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = config.crackleFreq;
    hp.Q.value = 1;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, startTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, startTime + config.duration);
    noiseSrc.connect(hp);
    hp.connect(noiseGain);
    noiseGain.connect(this.sfxBus);
    noiseSrc.start(startTime);
    noiseSrc.stop(startTime + config.duration);
    // Icy tinkle tones
    for (let i = 0; i < config.tinkleFreqs.length; i++) {
      const t = startTime + i * 0.04;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = config.tinkleFreqs[i];
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      osc.connect(gain);
      gain.connect(this.sfxBus);
      osc.start(t);
      osc.stop(t + 0.1);
    }
  }

  private _playSynergySFX(startTime: number): void {
    if (!this.ctx || !this.sfxBus) return;
    const config = AUDIO.SFX.SYNERGY;
    // 3-note harmonic sine chime
    for (let i = 0; i < config.chimeFreqs.length; i++) {
      const chimeStart = startTime + i * config.chimeStagger;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = config.chimeFreqs[i];
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.22, chimeStart);
      gain.gain.exponentialRampToValueAtTime(0.01, chimeStart + config.chimeDuration);
      osc.connect(gain);
      gain.connect(this.sfxBus);
      osc.start(chimeStart);
      osc.stop(chimeStart + config.chimeDuration);
    }
  }
  
  private _createNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext not initialized');
    
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    return buffer;
  }

  /**
   * Load volume preferences from SaveManager or direct localStorage
   */
  private _loadPreferences(): void {
    // TLDR: Prefer SaveManager when available, fall back to direct localStorage
    if (this.saveManager) {
      const data = this.saveManager.loadAudio();
      if (data) {
        this.volumePreferences = {
          master: data.master ?? AUDIO.VOLUMES.MASTER,
          sfx: data.sfx ?? AUDIO.VOLUMES.SFX,
          ambient: data.ambient ?? AUDIO.VOLUMES.AMBIENT,
          music: data.music ?? AUDIO.VOLUMES.MUSIC,
        };
        this.muted = {
          master: data.muted?.master ?? false,
          sfx: data.muted?.sfx ?? false,
          ambient: data.muted?.ambient ?? false,
          music: data.muted?.music ?? false,
        };
      }
      return;
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          this.volumePreferences = {
            master: parsed.master ?? AUDIO.VOLUMES.MASTER,
            sfx: parsed.sfx ?? AUDIO.VOLUMES.SFX,
            ambient: parsed.ambient ?? AUDIO.VOLUMES.AMBIENT,
            music: parsed.music ?? AUDIO.VOLUMES.MUSIC,
          };
          this.muted = {
            master: parsed.muted?.master ?? false,
            sfx: parsed.muted?.sfx ?? false,
            ambient: parsed.muted?.ambient ?? false,
            music: parsed.muted?.music ?? false,
          };
        }
      }
    } catch (e) {
      // localStorage unavailable or parse error - use defaults
      console.warn('Failed to load audio preferences:', e);
    }
  }

  /**
   * Save volume preferences via SaveManager or direct localStorage
   */
  private _savePreferences(): void {
    const data = {
      master: this.volumePreferences.master,
      sfx: this.volumePreferences.sfx,
      ambient: this.volumePreferences.ambient,
      music: this.volumePreferences.music,
      muted: { ...this.muted },
    };

    // TLDR: Delegate to SaveManager when available (triggers save indicator)
    if (this.saveManager) {
      this.saveManager.saveAudio(data);
      return;
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // localStorage unavailable - fail silently
      console.warn('Failed to save audio preferences:', e);
    }
  }
}

// Export singleton instance
export const audioManager = new AudioManager();
