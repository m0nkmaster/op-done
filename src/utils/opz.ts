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

/**
 * Calculates slice boundaries from frame counts.
 *
 * OP-Z/OP-1 slice format uses EXCLUSIVE end positions:
 * - Slice plays frames from start to end-1 (like Python range)
 * - End of slice N equals start of slice N+1 (no gaps)
 * - Total coverage: sum of all slice frame counts
 *
 * Example: sliceFrames = [2200, 3460]
 * - Slice 1: start=0, end=2200 → plays frames 0..2199
 * - Slice 2: start=2200, end=5660 → plays frames 2200..5659
 */
export const calculateSliceBoundaries = (
  sliceFrames: number[]
): { start: number[]; end: number[] } => {
  const start: number[] = [];
  const end: number[] = [];

  let cursor = 0;
  for (let i = 0; i < MAX_SLICES; i++) {
    const frames = sliceFrames[i] ?? 0;

    if (frames === 0) {
      // Empty slice: TE uses 0,0 for unused slices
      start.push(0);
      end.push(0);
    } else {
      start.push(cursor);
      // End is EXCLUSIVE (like Python range)
      // No safety buffer - match TE format exactly
      end.push(cursor + frames);
      cursor += frames;
    }
  }

  return { start, end };
};
