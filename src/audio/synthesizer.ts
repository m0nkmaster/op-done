import type { SoundConfig } from '../types/soundConfig';

export async function synthesizeSound(config: SoundConfig): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(
    2,
    Math.ceil(config.timing.duration * 44100),
    44100
  );

  const mixer = ctx.createGain();
  const sources: AudioScheduledSourceNode[] = [];

  // Create all layers
  for (const layer of config.synthesis.layers) {
    const source = createLayerSource(ctx, layer);
    const layerGain = ctx.createGain();
    layerGain.gain.value = layer.gain;
    
    source.connect(layerGain);
    layerGain.connect(mixer);
    sources.push(source);
  }

  const filter = config.filter ? createFilter(ctx, config) : null;
  let chain: AudioNode = mixer;
  
  if (filter) {
    mixer.connect(filter);
    chain = filter;
  }
  
  const masterGain = ctx.createGain();
  chain.connect(masterGain);
  
  applyEnvelope(masterGain.gain, createEnvelope(ctx, config), config);
  
  const effectsChain = createEffects(ctx, config);
  masterGain.connect(effectsChain);
  effectsChain.connect(ctx.destination);
  
  sources.forEach(s => {
    s.start(0);
    s.stop(config.timing.duration);
  });
  
  return await ctx.startRendering();
}

function createLayerSource(ctx: OfflineAudioContext, layer: SoundConfig['synthesis']['layers'][0]): AudioScheduledSourceNode {
  if (layer.type === 'noise' && layer.noise) {
    return createNoiseSource(ctx, layer.noise.type);
  }
  
  if (layer.type === 'fm' && layer.fm) {
    return createFMSource(ctx, layer.fm);
  }
  
  if (layer.type === 'oscillator' && layer.oscillator) {
    const osc = ctx.createOscillator();
    osc.type = layer.oscillator.waveform;
    osc.frequency.value = layer.oscillator.frequency;
    osc.detune.value = layer.oscillator.detune;
    return osc;
  }
  
  const osc = ctx.createOscillator();
  osc.frequency.value = 440;
  return osc;
}

function createNoiseSource(ctx: OfflineAudioContext, type: string): AudioBufferSourceNode {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  if (type === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  }
  
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

function createFMSource(ctx: OfflineAudioContext, fm: { carrier: number; modulator: number; modulationIndex: number }): OscillatorNode {
  const carrier = ctx.createOscillator();
  const modulator = ctx.createOscillator();
  const modulatorGain = ctx.createGain();
  
  carrier.frequency.value = fm.carrier;
  modulator.frequency.value = fm.modulator;
  modulatorGain.gain.value = fm.modulationIndex;
  
  modulator.connect(modulatorGain);
  modulatorGain.connect(carrier.frequency);
  modulator.start(0);
  
  return carrier;
}

function createFilter(ctx: OfflineAudioContext, config: SoundConfig): BiquadFilterNode {
  const filter = ctx.createBiquadFilter();
  filter.type = config.filter!.type;
  filter.frequency.value = config.filter!.frequency;
  filter.Q.value = config.filter!.q;
  if (config.filter!.gain !== undefined) {
    filter.gain.value = config.filter!.gain;
  }
  return filter;
}

function createLFO(ctx: OfflineAudioContext, config: SoundConfig): OscillatorNode {
  const lfo = ctx.createOscillator();
  lfo.type = config.lfo!.waveform;
  lfo.frequency.value = config.lfo!.frequency;
  lfo.start(0);
  return lfo;
}

function createEnvelope(ctx: OfflineAudioContext, config: SoundConfig) {
  return {
    attack: config.envelope.attack,
    decay: config.envelope.decay,
    sustain: config.envelope.sustain,
    release: config.envelope.release,
  };
}

function applyEnvelope(param: AudioParam, envelope: ReturnType<typeof createEnvelope>, config: SoundConfig) {
  const { attack, decay, sustain, release } = envelope;
  const velocity = config.dynamics.velocity;
  
  param.setValueAtTime(0, 0);
  param.linearRampToValueAtTime(velocity, attack);
  param.linearRampToValueAtTime(velocity * sustain, attack + decay);
  param.setValueAtTime(velocity * sustain, config.timing.duration - release);
  param.linearRampToValueAtTime(0, config.timing.duration);
}

function applyLFO(
  lfo: OscillatorNode,
  lfoConfig: NonNullable<SoundConfig['lfo']>,
  gain: GainNode,
  filter: BiquadFilterNode | null
) {
  const lfoGain = lfo.context.createGain();
  lfoGain.gain.value = lfoConfig.depth;
  lfo.connect(lfoGain);
  
  if (lfoConfig.target === 'amplitude') {
    lfoGain.connect(gain.gain);
  } else if (lfoConfig.target === 'filter' && filter) {
    lfoGain.connect(filter.frequency);
  }
}

function createEffects(ctx: OfflineAudioContext, config: SoundConfig): AudioNode {
  let chain: AudioNode = ctx.createGain();
  const input = chain;
  
  if (config.effects.distortion) {
    const dist = createDistortion(ctx, config.effects.distortion);
    chain.connect(dist);
    chain = dist;
  }
  
  if (config.effects.reverb) {
    const reverb = createReverb(ctx, config.effects.reverb);
    chain.connect(reverb);
    chain = reverb;
  }
  
  if (config.effects.delay) {
    const delay = createDelay(ctx, config.effects.delay);
    chain.connect(delay);
    chain = delay;
  }
  
  if (config.effects.compressor) {
    const comp = createCompressor(ctx, config.effects.compressor);
    chain.connect(comp);
    chain = comp;
  }
  
  return input;
}

function createDistortion(ctx: OfflineAudioContext, config: NonNullable<SoundConfig['effects']['distortion']>): WaveShaperNode {
  const distortion = ctx.createWaveShaper();
  const curve = new Float32Array(256);
  const amount = config.amount * 100;
  
  for (let i = 0; i < 256; i++) {
    const x = (i - 128) / 128;
    curve[i] = Math.tanh(x * amount);
  }
  
  distortion.curve = curve;
  return distortion;
}

function createReverb(ctx: OfflineAudioContext, config: NonNullable<SoundConfig['effects']['reverb']>): ConvolverNode {
  const convolver = ctx.createConvolver();
  const length = ctx.sampleRate * config.decay;
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, config.damping * 3);
    }
  }
  
  convolver.buffer = impulse;
  return convolver;
}

function createDelay(ctx: OfflineAudioContext, config: NonNullable<SoundConfig['effects']['delay']>): DelayNode {
  const delay = ctx.createDelay(5);
  const feedback = ctx.createGain();
  
  delay.delayTime.value = config.time;
  feedback.gain.value = config.feedback;
  
  delay.connect(feedback);
  feedback.connect(delay);
  
  return delay;
}

function createCompressor(ctx: OfflineAudioContext, config: NonNullable<SoundConfig['effects']['compressor']>): DynamicsCompressorNode {
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = config.threshold;
  comp.ratio.value = config.ratio;
  comp.attack.value = config.attack;
  comp.release.value = config.release;
  comp.knee.value = config.knee;
  return comp;
}
