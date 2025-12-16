import type { DrumMetadata } from '../types';
import { padArray } from './array';
import { MAX_SLICES, OPZ_DEFAULTS } from '../constants';

/** Creates default drum metadata */
export const createDefaultMetadata = (): DrumMetadata => ({
  name: 'synth-tools',
  octave: 0,
  drumVersion: 3,
  pitch: new Array(MAX_SLICES).fill(OPZ_DEFAULTS.PITCH),
  playmode: new Array(MAX_SLICES).fill(OPZ_DEFAULTS.PLAYMODE),
  reverse: new Array(MAX_SLICES).fill(OPZ_DEFAULTS.REVERSE),
  volume: new Array(MAX_SLICES).fill(OPZ_DEFAULTS.VOLUME)
});

/** Updates metadata array at index */
export const updateMetadataArray = <K extends keyof DrumMetadata>(
  metadata: DrumMetadata,
  key: K,
  index: number,
  value: number
): DrumMetadata => {
  const arr = metadata[key] as number[];
  const next = [...arr];
  next[index] = value;
  return { ...metadata, [key]: next };
};

/** Ensures metadata arrays are padded to slice count */
export const ensureMetadataLength = (
  metadata: DrumMetadata,
  sliceCount: number
): DrumMetadata => {
  const targetLength = Math.min(MAX_SLICES, sliceCount || MAX_SLICES);
  return {
    ...metadata,
    pitch: padArray(metadata.pitch, targetLength, OPZ_DEFAULTS.PITCH),
    playmode: padArray(metadata.playmode, targetLength, OPZ_DEFAULTS.PLAYMODE),
    reverse: padArray(metadata.reverse, targetLength, OPZ_DEFAULTS.REVERSE),
    volume: padArray(metadata.volume, targetLength, OPZ_DEFAULTS.VOLUME)
  };
};
