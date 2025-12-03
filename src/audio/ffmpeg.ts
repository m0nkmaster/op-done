import { FFmpeg } from '@ffmpeg/ffmpeg';

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

export async function transcodeAndConcat(
  files: File[],
  options: { silenceThreshold: number; maxDuration: number }
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
        `[${idx}:a]silenceremove=start_periods=1:start_duration=0:start_threshold=${options.silenceThreshold}dB,aformat=sample_fmts=s16:sample_rates=44100:channel_layouts=mono,apad=pad_dur=0.01[a${idx}]`
    )
    .join(';');

  const concatInputs = inputNames.map((_, idx) => `[a${idx}]`).join('');
  const filterComplex =
    `${formatFilters};${concatInputs}concat=n=${inputNames.length}:v=0:a=1,atrim=0:${options.maxDuration},asetpts=N/SR/TB[out]`;

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
