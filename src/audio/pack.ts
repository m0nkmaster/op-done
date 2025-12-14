import { transcodeAndConcat } from './ffmpeg';
import { injectDrumMetadata, parseAiff } from './aiff';
import { calculateSliceBoundaries } from '../utils/opz';
import type { DrumMetadata, Slice } from '../types';

export type BuildPackOptions = {
  maxDuration: number;
  metadata: DrumMetadata;
  format?: 'aiff' | 'aifc'; // Optional format parameter (defaults to aiff)
};

export async function buildDrumPack(
  slices: Slice[],
  options: BuildPackOptions
): Promise<Blob> {
  const files = slices.map((s) => s.file);
  // frames are the actual frame counts of each input WAV file
  const { data, frames: sliceFrames } = await transcodeAndConcat(files, { 
    format: options.format 
  });

  // Validate output file structure
  parseAiff(data);

  // Calculate slice boundaries from frame counts
  // Uses TE format: exclusive end positions, no gaps
  const { start: startFrames, end: endFrames } = calculateSliceBoundaries(
    sliceFrames
  );

  const annotated = injectDrumMetadata(
    data,
    startFrames,
    endFrames,
    options.metadata,
    options.format
  );
  const buffer = annotated.buffer as ArrayBuffer;
  // Use the appropriate MIME type based on the format
  const mimeType = options.format === 'aifc' ? 'audio/x-aifc' : 'audio/aiff';
  return new Blob([buffer], { type: mimeType });
}
