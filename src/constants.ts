/** Maximum number of slices in an OP-Z drum pack */
export const MAX_SLICES = 24;

/** Maximum duration in seconds for OP-Z drum pack */
export const MAX_DURATION_SECONDS = 12;

/** Target sample rate for OP-Z */
export const TARGET_SAMPLE_RATE = 44100;

/** OP-Z position scaling factor */
export const OP1_SCALE = 4096;

/** Maximum position value for OP-Z metadata */
export const MAX_POSITION = 0x7ffffffe;

/** Default OP-Z parameter values */
export const OPZ_DEFAULTS = {
  VOLUME: 8192,
  PITCH: 0,
  PLAYMODE: 8192,
  REVERSE: 8192
} as const;

/** Default silence threshold in dB */
export const DEFAULT_SILENCE_THRESHOLD = -35;

/** Supported audio file extensions */
export const SUPPORTED_AUDIO_FORMATS = [
  '.wav',
  '.aif',
  '.aiff',
  '.mp3',
  '.m4a',
  '.flac'
] as const;
