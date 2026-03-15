/** Audio configuration and constants */

export const AUDIO = {
  // Volume levels (0.0 to 1.0)
  VOLUMES: {
    MASTER: 1.0,
    AMBIENT: 0.3,
    SFX: 0.5,
    MUSIC: 0.4,
  },

  // Crossfade timing for season transitions
  CROSSFADE: {
    DURATION: 2.0,
    OVERLAP: 0.5,
  },

  // Default ambient loop settings (used when no season specified)
  AMBIENT: {
    LOOP_DURATION: 90, // seconds
    BASE_FREQUENCY: 200, // Hz for filtered noise
    OSCILLATOR_FREQ_1: 220, // A3
    OSCILLATOR_FREQ_2: 330, // E4
    NOISE_CUTOFF: 300, // Hz for lowpass
  },

  // Seasonal ambient profiles
  SEASONAL_AMBIENT: {
    spring: {
      noiseCutoff: 400,
      noiseGain: 0.10,
      oscFreq1: 261.63,
      oscFreq2: 392.00,
      oscGain: 0.05,
      lfoRate: 0.15,
      lfoDepth: 0.025,
      chirpEnabled: true,
      chirpMinDelay: 3000,
      chirpMaxDelay: 6000,
      chirpBaseFreq: 3400,
      chirpVolume: 0.18,
      rainEnabled: true,
      rainMinDelay: 200,
      rainMaxDelay: 800,
      rainFreq: 4800,
      rainVolume: 0.06,
    },
    summer: {
      noiseCutoff: 250,
      noiseGain: 0.07,
      oscFreq1: 293.66,
      oscFreq2: 440.00,
      oscGain: 0.04,
      lfoRate: 0.1,
      lfoDepth: 0.02,
      chirpEnabled: false,
      chirpMinDelay: 0,
      chirpMaxDelay: 0,
      chirpBaseFreq: 0,
      chirpVolume: 0,
      rainEnabled: false,
      rainMinDelay: 0,
      rainMaxDelay: 0,
      rainFreq: 0,
      rainVolume: 0,
      cricketEnabled: true,
      cricketMinDelay: 400,
      cricketMaxDelay: 1200,
      cricketFreq: 5200,
      cricketVolume: 0.08,
    },
    fall: {
      noiseCutoff: 500,
      noiseGain: 0.14,
      oscFreq1: 220.00,
      oscFreq2: 293.66,
      oscGain: 0.035,
      lfoRate: 0.25,
      lfoDepth: 0.04,
      chirpEnabled: false,
      chirpMinDelay: 0,
      chirpMaxDelay: 0,
      chirpBaseFreq: 0,
      chirpVolume: 0,
      rainEnabled: false,
      rainMinDelay: 0,
      rainMaxDelay: 0,
      rainFreq: 0,
      rainVolume: 0,
      rustleEnabled: true,
      rustleMinDelay: 2000,
      rustleMaxDelay: 5000,
      rustleFilterFreq: 1200,
      rustleVolume: 0.10,
    },
    winter: {
      noiseCutoff: 150,
      noiseGain: 0.04,
      oscFreq1: 174.61,
      oscFreq2: 261.63,
      oscGain: 0.025,
      lfoRate: 0.08,
      lfoDepth: 0.015,
      chirpEnabled: false,
      chirpMinDelay: 0,
      chirpMaxDelay: 0,
      chirpBaseFreq: 0,
      chirpVolume: 0,
      rainEnabled: false,
      rainMinDelay: 0,
      rainMaxDelay: 0,
      rainFreq: 0,
      rainVolume: 0,
      crackleEnabled: true,
      crackleMinDelay: 4000,
      crackleMaxDelay: 10000,
      crackleVolume: 0.07,
    },
  },

  // SFX definitions
  SFX: {
    PLANT: {
      type: 'plant' as const,
      duration: 0.15,
      frequencies: [600, 800], // soil tap + chime
    },
    WATER: {
      type: 'water' as const,
      duration: 0.4,
      noiseCutoff: 1200, // bandpass center for pour sound
      noiseBandwidth: 400,
    },
    HARVEST: {
      type: 'harvest' as const,
      duration: 0.6,
      popFreq: 800,
      chimeFreqs: [1046.5, 1318.5, 1568], // C6, E6, G6
      chimeDuration: 0.15,
      chimeStagger: 0.08,
    },
    WILT: {
      type: 'wilt' as const,
      duration: 0.8,
      startFreq: 600,
      endFreq: 200, // descending sad tone
    },
    PEST_APPEAR: {
      type: 'pest' as const,
      duration: 0.2,
      alertFreq: 1800,
      whooshFreq: 400,
    },
    WEED_PULL: {
      type: 'weed_pull' as const,
      duration: 0.15,
      noiseFilterFreq: 800,
    },
    COMPOST_SPREAD: {
      type: 'compost_spread' as const,
      duration: 0.2,
      noiseFilterFreq: 600,
      sineFreq: 120,
    },
    TOOL_UPGRADE: {
      type: 'tool_upgrade' as const,
      duration: 0.4,
      frequencies: [523.25, 659.25, 783.99], // C5, E5, G5
      noteSpacing: 0.12,
    },
    TOOL_UNLOCK: {
      type: 'tool_unlock' as const,
      duration: 0.5,
      frequencies: [523.25, 659.25, 783.99, 1046.5], // C5, E5, G5, C6
      noteSpacing: 0.1,
    },
    MATURE: {
      type: 'mature' as const,
      duration: 0.4,
      chimeFreqs: [440, 523.25], // A4, C5 — gentle two-note chime
      chimeDuration: 0.2,
      chimeStagger: 0.1,
    },
    MOVE: {
      type: 'move' as const,
      duration: 0.12,
      frequency: 220,
      noiseFilterFreq: 600,
    },
    DAY_ADVANCE: {
      type: 'day_advance' as const,
      duration: 0.35,
      bellFreq: 880,
      shimmerFreq: 1760,
    },
    DISCOVERY: {
      type: 'discovery' as const,
      duration: 0.7,
      frequencies: [659.25, 783.99, 1046.5, 1318.5],
      noteSpacing: 0.08,
      shimmerDuration: 0.3,
    },
    ACHIEVEMENT: {
      type: 'achievement' as const,
      duration: 0.8,
      frequencies: [523.25, 659.25, 783.99, 1046.5, 1318.5],
      noteSpacing: 0.1,
    },
    FROST_CRACK: {
      type: 'frost_crack' as const,
      duration: 0.25,
      crackleFreq: 6000,
      tinkleFreqs: [2400, 3200],
    },
    SYNERGY: {
      type: 'synergy' as const,
      duration: 0.5,
      chimeFreqs: [523.25, 783.99, 1046.5],
      chimeDuration: 0.18,
      chimeStagger: 0.06,
    },
  },
} as const;

export type SFXType = keyof typeof AUDIO.SFX;
export type SeasonKey = keyof typeof AUDIO.SEASONAL_AMBIENT;
