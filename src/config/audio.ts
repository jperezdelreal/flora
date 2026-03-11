/** Audio configuration and constants */

export const AUDIO = {
  // Volume levels (0.0 to 1.0)
  VOLUMES: {
    MASTER: 1.0,
    AMBIENT: 0.3,
    SFX: 0.5,
    MUSIC: 0.4,
  },

  // Ambient loop settings
  AMBIENT: {
    LOOP_DURATION: 90, // seconds
    BASE_FREQUENCY: 200, // Hz for filtered noise
    OSCILLATOR_FREQ_1: 220, // A3
    OSCILLATOR_FREQ_2: 330, // E4
    NOISE_CUTOFF: 300, // Hz for lowpass
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
  },
} as const;

export type SFXType = keyof typeof AUDIO.SFX;
