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

/** Read frame count from AIFF COMM chunk */
function readAiffFrames(data: Uint8Array): number {
  if (data.length < 12) return 0;
  
  const formId = String.fromCharCode(data[0], data[1], data[2], data[3]);
  if (formId !== 'FORM') return 0;
  
  const formType = String.fromCharCode(data[8], data[9], data[10], data[11]);
  if (formType !== 'AIFF' && formType !== 'AIFC') return 0;
  
  let pos = 12;
  while (pos + 8 < data.length) {
    const chunkId = String.fromCharCode(data[pos], data[pos+1], data[pos+2], data[pos+3]);
    const chunkSize = (data[pos+4] << 24) | (data[pos+5] << 16) | (data[pos+6] << 8) | data[pos+7];
    
    if (chunkId === 'COMM') {
      return (data[pos+10] << 24) | (data[pos+11] << 16) | (data[pos+12] << 8) | data[pos+13];
    }
    
    pos += 8 + chunkSize;
    if (chunkSize % 2 === 1) pos++;
  }
  
  return 0;
}

/** Parse AIFF chunks */
interface ChunkInfo {
  id: string;
  offset: number;
  size: number;
  data: Uint8Array;
}

function parseAiffChunks(data: Uint8Array): ChunkInfo[] {
  const chunks: ChunkInfo[] = [];
  let pos = 12;
  
  while (pos + 8 <= data.length) {
    const id = String.fromCharCode(data[pos], data[pos+1], data[pos+2], data[pos+3]);
    const size = (data[pos+4] << 24) | (data[pos+5] << 16) | (data[pos+6] << 8) | data[pos+7];
    
    if (size < 0 || size > 100000000) break;
    
    chunks.push({ id, offset: pos, size, data: data.slice(pos + 8, pos + 8 + size) });
    pos += 8 + size;
    if (size % 2 === 1) pos++;
  }
  
  return chunks;
}

/** Convert AIFF to AIFF-C format with sowt compression */
function convertAiffToAifc(aiffData: Uint8Array): Uint8Array {
  const formId = String.fromCharCode(aiffData[0], aiffData[1], aiffData[2], aiffData[3]);
  if (formId !== 'FORM') throw new Error('Invalid AIFF file format');
  
  const chunks = parseAiffChunks(aiffData);
  const commChunk = chunks.find(c => c.id === 'COMM');
  const ssndChunk = chunks.find(c => c.id === 'SSND');
  const applChunk = chunks.find(c => c.id === 'APPL');
  
  if (!commChunk || !ssndChunk) {
    throw new Error('Missing required AIFF chunks');
  }
  
  // Build AIFC COMM chunk with sowt compression
  const compressionName = "Signed integer (little-endian) linear PCM";
  const commDataSize = 22 + 1 + compressionName.length;
  const paddedCommDataSize = commDataSize + (commDataSize % 2);
  
  const aifcComm = new Uint8Array(8 + paddedCommDataSize);
  aifcComm.set([0x43, 0x4F, 0x4D, 0x4D]); // 'COMM'
  aifcComm[4] = (commDataSize >> 24) & 0xFF;
  aifcComm[5] = (commDataSize >> 16) & 0xFF;
  aifcComm[6] = (commDataSize >> 8) & 0xFF;
  aifcComm[7] = commDataSize & 0xFF;
  
  // Copy original COMM data (18 bytes)
  for (let i = 0; i < Math.min(commChunk.data.length, 18); i++) {
    aifcComm[8 + i] = commChunk.data[i];
  }
  
  // Add 'sowt' compression type
  aifcComm.set([0x73, 0x6F, 0x77, 0x74], 8 + 18);
  
  // Add compression name (Pascal string)
  aifcComm[8 + 22] = compressionName.length;
  for (let i = 0; i < compressionName.length; i++) {
    aifcComm[8 + 23 + i] = compressionName.charCodeAt(i);
  }
  
  // Build FVER chunk
  const fverChunk = new Uint8Array(12);
  fverChunk.set([0x46, 0x56, 0x45, 0x52, 0x00, 0x00, 0x00, 0x04, 0xA2, 0x80, 0x51, 0x40]);
  
  // Build SSND chunk
  const aifcSsnd = new Uint8Array(8 + ssndChunk.size);
  aifcSsnd.set([0x53, 0x53, 0x4E, 0x44]);
  aifcSsnd[4] = (ssndChunk.size >> 24) & 0xFF;
  aifcSsnd[5] = (ssndChunk.size >> 16) & 0xFF;
  aifcSsnd[6] = (ssndChunk.size >> 8) & 0xFF;
  aifcSsnd[7] = ssndChunk.size & 0xFF;
  aifcSsnd.set(ssndChunk.data, 8);
  
  // Build APPL chunk if present
  let aifcAppl: Uint8Array | null = null;
  if (applChunk) {
    aifcAppl = new Uint8Array(8 + applChunk.size);
    aifcAppl.set([0x41, 0x50, 0x50, 0x4C]);
    aifcAppl[4] = (applChunk.size >> 24) & 0xFF;
    aifcAppl[5] = (applChunk.size >> 16) & 0xFF;
    aifcAppl[6] = (applChunk.size >> 8) & 0xFF;
    aifcAppl[7] = applChunk.size & 0xFF;
    aifcAppl.set(applChunk.data, 8);
  }
  
  // Calculate total size
  const contentSize = 4 + fverChunk.length + aifcComm.length + 
                      (aifcAppl?.length ?? 0) + aifcSsnd.length;
  
  // Build final file
  const result = new Uint8Array(8 + contentSize);
  let pos = 0;
  
  // FORM header
  result.set([0x46, 0x4F, 0x52, 0x4D], pos); pos += 4;
  result[pos++] = (contentSize >> 24) & 0xFF;
  result[pos++] = (contentSize >> 16) & 0xFF;
  result[pos++] = (contentSize >> 8) & 0xFF;
  result[pos++] = contentSize & 0xFF;
  result.set([0x41, 0x49, 0x46, 0x43], pos); pos += 4; // 'AIFC'
  
  // Chunks
  result.set(fverChunk, pos); pos += fverChunk.length;
  result.set(aifcComm, pos); pos += aifcComm.length;
  if (aifcAppl) { result.set(aifcAppl, pos); pos += aifcAppl.length; }
  result.set(aifcSsnd, pos);
  
  return result;
}

/**
 * Transcode and concatenate audio files into a single AIFF/AIFC
 * Returns the concatenated audio data and frame counts per file
 */
export async function transcodeAndConcat(
  files: File[],
  options?: { format?: 'aiff' | 'aifc' }
): Promise<{ data: Uint8Array; frames: number[] }> {
  const ffmpeg = await ensureFFmpeg();
  const sliceFrames: number[] = [];

  // Convert each file to AIFF and collect frame counts
  for (let i = 0; i < files.length; i++) {
    const originalData = new Uint8Array(await files[i].arrayBuffer());
    await ffmpeg.writeFile(`input_${i}.wav`, originalData);
    
    await ffmpeg.exec([
      '-i', `input_${i}.wav`,
      '-f', 'aiff',
      '-acodec', 'pcm_s16be',
      '-ar', '44100',
      '-ac', '1',
      '-y',
      `slice_${i}.aif`
    ]);
    
    const aifData = await ffmpeg.readFile(`slice_${i}.aif`) as Uint8Array;
    sliceFrames.push(readAiffFrames(aifData));
  }

  // Concatenate all files
  const inputs = files.map((_, i) => ['-i', `slice_${i}.aif`]).flat();
  const filterInputs = files.map((_, idx) => `[${idx}:0]`).join('');
  const filterComplex = `${filterInputs}concat=n=${files.length}:v=0:a=1[out]`;
  const useAIFC = options?.format === 'aifc';
  
  // Generate concatenated output
  await ffmpeg.exec([
    ...inputs,
    '-filter_complex', filterComplex,
    '-map', '[out]',
    '-f', 'aiff',
    '-acodec', useAIFC ? 'pcm_s16le' : 'pcm_s16be',
    '-ar', '44100',
    '-ac', '1',
    '-y',
    'output.aif'
  ]);

  let data = await ffmpeg.readFile('output.aif') as Uint8Array;
  
  // Convert to AIFC if requested
  if (useAIFC) {
    try {
      data = convertAiffToAifc(data);
    } catch (e) {
      console.error('AIFC conversion failed, using AIFF:', e);
    }
  }

  // Cleanup temp files
  for (let i = 0; i < files.length; i++) {
    try { await ffmpeg.deleteFile(`input_${i}.wav`); } catch { /* ignore */ }
    try { await ffmpeg.deleteFile(`slice_${i}.aif`); } catch { /* ignore */ }
  }
  try { await ffmpeg.deleteFile('output.aif'); } catch { /* ignore */ }

  return { data, frames: sliceFrames };
}
