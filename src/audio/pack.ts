import { transcodeAndConcat } from './ffmpeg';
import { injectDrumMetadata, parseAiff } from './aiff';
import type { DrumMetadata, NormalizeMode, Slice } from '../types';

export type BuildPackOptions = {
  normalizeMode: NormalizeMode;
  silenceThreshold: number;
  maxDuration: number;
  metadata: DrumMetadata;
};

const TARGET_SR = 44100;

export async function buildDrumPack(
  slices: Slice[],
  options: BuildPackOptions
): Promise<Blob> {
  const files = slices.map((s) => s.file);
  const data = await transcodeAndConcat(files, options);

  // Derive start/end frame positions from durations we probed, capped to total frames.
  const lengths = slices.map((s) =>
    Math.max(0, Math.round((s.duration || 0) * TARGET_SR))
  );

  const { numFrames } = parseAiff(data);
  const startFrames: number[] = [];
  const endFrames: number[] = [];

  let cursor = 0;
  for (let i = 0; i < 24; i++) {
    const len = lengths[i] ?? 0;
    const sliceLen = Math.max(0, Math.min(len, Math.max(0, numFrames - cursor)));
    const start = cursor;
    const end = sliceLen > 0 ? start + sliceLen - 1 : start;
    startFrames.push(start);
    endFrames.push(end);
    cursor += sliceLen;
  }

  const annotated = injectDrumMetadata(
    data,
    startFrames,
    endFrames,
    options.metadata
  );
  return new Blob([annotated.buffer], { type: 'audio/aiff' });
}
