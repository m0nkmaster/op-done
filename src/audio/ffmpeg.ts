import { FFmpeg } from '@ffmpeg/ffmpeg';
import type { NormalizeMode } from '../types';

let ffmpegInstance: FFmpeg | null = null;

export async function ensureFFmpeg(): Promise<FFmpeg> {
  if (!ffmpegInstance) {
    ffmpegInstance = new FFmpeg();
  }

  if (!ffmpegInstance.loaded) {
    await ffmpegInstance.load();
  }

  return ffmpegInstance;
}

function buildNormalizationFilter(mode: NormalizeMode): string {
  if (mode === 'peak') {
    return 'acompressor=threshold=-18dB:ratio=2:attack=5:release=50,alimiter=limit=-1dB';
  }
  if (mode === 'off') {
    return 'alimiter=limit=-1dB';
  }
  // default loudnorm + limiter
  return 'loudnorm=I=-14:TP=-1.2:LRA=11:linear=true:dual_mono=true,alimiter=limit=-1.2dB';
}

export async function transcodeAndConcat(
  files: File[],
  options: { normalizeMode: NormalizeMode; silenceThreshold: number; maxDuration: number }
): Promise<Uint8Array> {
  const ffmpeg = await ensureFFmpeg();
  const inputNames: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const name = `input_${i}`;
    inputNames.push(name);
    const data = new Uint8Array(await files[i].arrayBuffer());
    await ffmpeg.writeFile(name, data);
  }

  const formatFilters = inputNames
    .map(
      (_, idx) =>
        `[${idx}:a]silenceremove=start_periods=1:start_duration=0:start_threshold=${options.silenceThreshold}dB,aformat=sample_fmts=s16:sample_rates=44100:channel_layouts=mono[a${idx}]`
    )
    .join(';');

  const concatInputs = inputNames.map((_, idx) => `[a${idx}]`).join('');
  const normalize = buildNormalizationFilter(options.normalizeMode);
  const filterComplex =
    (formatFilters ? `${formatFilters};` : '') +
    `${concatInputs}concat=n=${inputNames.length}:v=0:a=1,${normalize},atrim=0:${options.maxDuration},asetpts=N/SR/TB[out]`;

  const args = [
    ...inputNames.flatMap((name) => ['-i', name]),
    '-y',
    '-filter_complex',
    filterComplex,
    '-map',
    '[out]',
    '-ar',
    '44100',
    '-ac',
    '1',
    '-sample_fmt',
    's16',
    'output.aif'
  ];

  await ffmpeg.exec(args);
  const data = await ffmpeg.readFile('output.aif');

  // Cleanup inputs
  await Promise.all(
    inputNames.map(async (name) => {
      try {
        await ffmpeg.deleteFile(name);
      } catch {
        // ignore cleanup errors
      }
    })
  );
  try {
    await ffmpeg.deleteFile('output.aif');
  } catch {
    // ignore cleanup errors
  }

  return data as Uint8Array;
}
