/**
 * AudioManager — Central audio system for Flora
 * 
 * Features:
 * - Web Audio API routing: sfxBus + ambientBus + musicBus → masterGain → compressor → destination
 * - Procedural ambient loop generation
 * - Procedural SFX synthesis (plant, water, harvest, wilt, pest)
 * - Volume control per channel
 * - Mute/unmute support
 * 
 * Based on patterns from ComeRosquillas and firstPunch audio systems.
 */

import { AUDIO, type SFXType } from '../config/audio';

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
  
  // Mute state
  private muted = {
    master: false,
    sfx: false,
    ambient: false,
    music: false,
  };

  // User volume preferences (persisted)
  private volumePreferences = {
    master: AUDIO.VOLUMES.MASTER,
    sfx: AUDIO.VOLUMES.SFX,
    ambient: AUDIO.VOLUMES.AMBIENT,
    music: AUDIO.VOLUMES.MUSIC,
  };

  private readonly STORAGE_KEY = 'flora:audio:preferences';
  
  // SFX debounce tracking (50ms per type to prevent stacking)
  private lastPlayTimes: Map<SFXType, number> = new Map();
  private readonly DEBOUNCE_MS = 50;
  
  /**
   * Initialize audio context and routing graph
   */
  init(): void {
    if (this.ctx) return; // Already initialized
    
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
   * Resume audio context (required after user interaction)
   */
  async resume(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }
  
  /**
   * Start ambient audio loop
   */
  startAmbient(): void {
    if (!this.ctx || !this.ambientBus || this.ambientPlaying) return;
    
    this.ambientPlaying = true;
    
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
    noiseGain.connect(this.ambientBus);
    noiseSource.start();
    
    this.ambientNodes.push(noiseSource, noiseLowpass, noiseGain);
    
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
    oscGain.connect(this.ambientBus);
    
    osc1.start();
    osc2.start();
    lfo.start();
    
    this.ambientNodes.push(osc1, osc2, oscGain, lfo, lfoGain);
    
    // Layer 3: Random bird chirps (every 5-8 seconds)
    this._scheduleRandomChirp();
  }
  
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
   * Cleanup and disconnect audio graph
   */
  destroy(): void {
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
  
  private _scheduleRandomChirp(): void {
    if (!this.ambientPlaying) return;
    
    const randomDelay = 5000 + Math.random() * 3000; // 5-8 seconds
    
    const timerId = window.setTimeout(() => {
      this._playChirp();
      this._scheduleRandomChirp(); // Schedule next chirp
    }, randomDelay);
    
    this.ambientIntervals.push(timerId);
  }
  
  private _playChirp(): void {
    if (!this.ctx || !this.ambientBus || !this.ambientPlaying) return;
    
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
    gain.connect(this.ambientBus);
    osc.start(now);
    osc.stop(now + 0.12);
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
   * Load volume preferences from localStorage
   */
  private _loadPreferences(): void {
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
   * Save volume preferences to localStorage
   */
  private _savePreferences(): void {
    try {
      const data = {
        master: this.volumePreferences.master,
        sfx: this.volumePreferences.sfx,
        ambient: this.volumePreferences.ambient,
        music: this.volumePreferences.music,
        muted: { ...this.muted },
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // localStorage unavailable - fail silently
      console.warn('Failed to save audio preferences:', e);
    }
  }
}

// Export singleton instance
export const audioManager = new AudioManager();
