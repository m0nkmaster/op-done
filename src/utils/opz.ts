import { OP1_SCALE, MAX_POSITION, MAX_SLICES } from '../constants';

/** Encodes frame positions for OP-Z metadata (scaled × 4096) */
export const encodePositions = (frames: number[]): number[] =>
  frames.map((frame) => {
    const scaled = Math.max(0, Math.round(frame * OP1_SCALE));
    return Math.min(MAX_POSITION, scaled);
  });

/** Calculates slice boundaries from durations and total frames */
export const calculateSliceBoundaries = (
  durations: number[],
  sampleRate: number,
  totalFrames: number
): { start: number[]; end: number[] } => {
  const lengths = durations.map((d) => Math.max(0, Math.round(d * sampleRate)));
  const start: number[] = [];
  const end: number[] = [];

  let cursor = 0;
  for (let i = 0; i < MAX_SLICES; i++) {
    const len = lengths[i] ?? 0;
    const sliceLen = Math.max(0, Math.min(len, Math.max(0, totalFrames - cursor)));
    const startFrame = cursor;
    const endFrame = sliceLen > 0 ? startFrame + sliceLen - 1 : startFrame;
    start.push(startFrame);
    end.push(endFrame);
    cursor += sliceLen;
  }

  return { start, end };
};
