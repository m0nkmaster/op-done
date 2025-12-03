import { OP1_SCALE, MAX_POSITION, MAX_SLICES } from '../constants';

/** Encodes frame positions for OP-Z metadata (scaled × 4096) */
export const encodePositions = (frames: number[]): number[] =>
  frames.map((frame) => {
    const scaled = Math.max(0, frame * OP1_SCALE);
    return Math.min(MAX_POSITION, Math.round(scaled));
  });

/** Decodes frame positions from OP-Z metadata (scaled ÷ 4096) */
export const decodePositions = (encoded: number[]): number[] =>
  encoded.map((val) => Math.round(val / OP1_SCALE));

/** Calculates slice boundaries from durations and total frames */
export const calculateSliceBoundaries = (
  durations: number[],
  totalFrames: number
): { start: number[]; end: number[] } => {
  const gapDuration = 0.01;
  const totalDuration = durations.reduce((sum, d) => sum + (d > 0 ? d + gapDuration : 0), 0);
  const sampleRate = totalDuration > 0 ? totalFrames / totalDuration : 44100;
  const start: number[] = [];
  const end: number[] = [];

  let cursor = 0;
  for (let i = 0; i < MAX_SLICES; i++) {
    const duration = durations[i] ?? 0;
    if (duration === 0) {
      start.push(cursor);
      end.push(cursor);
      continue;
    }
    const sliceLen = duration * sampleRate;
    const gapLen = gapDuration * sampleRate;
    const totalLen = sliceLen + gapLen;
    const clampedLen = Math.max(0, Math.min(totalLen, totalFrames - cursor));
    start.push(cursor);
    end.push(cursor + Math.min(sliceLen, clampedLen) - 1);
    cursor += clampedLen;
  }

  return { start, end };
};
