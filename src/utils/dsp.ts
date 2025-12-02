/** Downmixes multi-channel audio buffer to mono */
export const downmixToMono = (buffer: AudioBuffer): Float32Array => {
  const length = buffer.length;
  const mono = new Float32Array(length);
  const channels = buffer.numberOfChannels;
  
  for (let ch = 0; ch < channels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      mono[i] += data[i];
    }
  }
  
  for (let i = 0; i < length; i++) {
    mono[i] /= channels;
  }
  
  return mono;
};

/** Normalizes audio buffer to peak amplitude of 1.0 */
export const normalizeBuffer = (data: Float32Array): Float32Array => {
  let peak = 0;
  for (let i = 0; i < data.length; i++) {
    const v = Math.abs(data[i]);
    if (v > peak) peak = v;
  }
  
  if (peak === 0) return data.slice(0);
  
  const norm = new Float32Array(data.length);
  const scale = 1 / peak;
  for (let i = 0; i < data.length; i++) {
    norm[i] = data[i] * scale;
  }
  
  return norm;
};

/** Trims silence from start and end of audio buffer */
export const trimSilence = (data: Float32Array, thresholdDb: number): Float32Array => {
  const threshold = Math.pow(10, thresholdDb / 20);
  let start = 0;
  let end = data.length - 1;

  while (start < data.length && Math.abs(data[start]) < threshold) start++;
  while (end > start && Math.abs(data[end]) < threshold) end--;

  return data.slice(start, end + 1);
};

/** Computes RMS (root mean square) of audio buffer */
export const computeRMS = (buffer: Float32Array): number => {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  return buffer.length > 0 ? Math.sqrt(sum / buffer.length) : 0;
};
