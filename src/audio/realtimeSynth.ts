/**
 * Real-time synthesizer for live MIDI input
 * Uses AudioContext (not OfflineAudioContext) for immediate playback
 */

import type { SoundConfig } from '../types/soundConfig';

interface VoiceNode {
  sources: OscillatorNode[];
  noiseSource?: AudioBufferSourceNode;
  gainNode: GainNode;
  filterNode?: BiquadFilterNode;
  releaseTime: number;
}

interface ActiveVoice {
  note: number;
  voice: VoiceNode;
  startTime: number;
}

export class RealtimeSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeVoices: Map<number, ActiveVoice> = new Map();
  private config: SoundConfig;
  private maxPolyphony = 16;
  
  constructor(config: SoundConfig) {
    this.config = config;
  }

  private ensureContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.7;
      this.masterGain.connect(this.ctx.destination);
    }
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    return this.ctx;
  }

  updateConfig(config: SoundConfig): void {
    this.config = config;
  }

  noteOn(note: number, velocity: number): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;
    
    // Steal oldest voice if at max polyphony
    if (this.activeVoices.size >= this.maxPolyphony) {
      const oldest = Array.from(this.activeVoices.entries())
        .sort((a, b) => a[1].startTime - b[1].startTime)[0];
      if (oldest) {
        this.releaseVoice(oldest[0], true);
      }
    }
    
    // Release any existing voice on this note
    if (this.activeVoices.has(note)) {
      this.releaseVoice(note, true);
    }
    
    const baseFreq = 440 * Math.pow(2, (note - 69) / 12);
    const velocityGain = (velocity / 127) * this.config.dynamics.velocity;
    const { attack, decay, sustain } = this.config.envelope;
    
    const voice = this.createVoice(ctx, baseFreq, velocityGain, now, attack, decay, sustain);
    
    this.activeVoices.set(note, {
      note,
      voice,
      startTime: now,
    });
  }

  noteOff(note: number): void {
    this.releaseVoice(note, false);
  }

  private createVoice(
    ctx: AudioContext,
    frequency: number,
    velocity: number,
    startTime: number,
    attack: number,
    decay: number,
    sustain: number
  ): VoiceNode {
    const gainNode = ctx.createGain();
    const sources: OscillatorNode[] = [];
    let noiseSource: AudioBufferSourceNode | undefined;
    let filterNode: BiquadFilterNode | undefined;
    
    // Create layer mix node
    const layerMix = ctx.createGain();
    
    for (const layer of this.config.synthesis.layers) {
      const layerGain = ctx.createGain();
      layerGain.gain.value = layer.gain;
      
      if (layer.type === 'oscillator' && layer.oscillator) {
        const osc = layer.oscillator;
        const unison = osc.unison || { voices: 1, detune: 0, spread: 0 };
        const voices = Math.max(1, Math.min(8, unison.voices));
        const gainPerVoice = 1 / Math.sqrt(voices);
        
        for (let i = 0; i < voices; i++) {
          const oscillator = ctx.createOscillator();
          oscillator.type = osc.waveform;
          oscillator.frequency.value = frequency;
          
          const voiceDetune = voices > 1 
            ? (i / (voices - 1) - 0.5) * 2 * unison.detune 
            : 0;
          oscillator.detune.value = osc.detune + voiceDetune;
          
          const voiceGain = ctx.createGain();
          voiceGain.gain.value = gainPerVoice;
          
          if (voices > 1 && unison.spread > 0) {
            const panner = ctx.createStereoPanner();
            panner.pan.value = (i / (voices - 1) - 0.5) * 2 * unison.spread;
            oscillator.connect(panner);
            panner.connect(voiceGain);
          } else {
            oscillator.connect(voiceGain);
          }
          
          voiceGain.connect(layerGain);
          oscillator.start(startTime);
          sources.push(oscillator);
        }
        
        // Sub oscillator
        if (osc.sub) {
          const sub = ctx.createOscillator();
          sub.type = osc.sub.waveform || 'sine';
          sub.frequency.value = frequency / Math.pow(2, Math.abs(osc.sub.octave));
          
          const subGain = ctx.createGain();
          subGain.gain.value = osc.sub.level;
          
          sub.connect(subGain);
          subGain.connect(layerGain);
          sub.start(startTime);
          sources.push(sub);
        }
      }
      
      if (layer.type === 'fm' && layer.fm) {
        const fm = layer.fm;
        const ratio = fm.modulator / fm.carrier;
        
        const carrier = ctx.createOscillator();
        const modulator = ctx.createOscillator();
        const modGain = ctx.createGain();
        
        carrier.frequency.value = frequency;
        modulator.frequency.value = frequency * ratio;
        modGain.gain.value = fm.modulationIndex;
        
        modulator.connect(modGain);
        modGain.connect(carrier.frequency);
        carrier.connect(layerGain);
        
        carrier.start(startTime);
        modulator.start(startTime);
        sources.push(carrier, modulator);
      }
      
      if (layer.type === 'noise' && layer.noise) {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        if (layer.noise.type === 'pink') {
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
        } else if (layer.noise.type === 'brown') {
          let last = 0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (last + white * 0.02) / 1.02;
            last = data[i];
            data[i] *= 3.5;
          }
        } else {
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;
        noise.connect(layerGain);
        noise.start(startTime);
        noiseSource = noise;
      }
      
      // Layer filter
      if (layer.filter) {
        const lf = ctx.createBiquadFilter();
        lf.type = layer.filter.type;
        lf.frequency.value = layer.filter.frequency;
        lf.Q.value = layer.filter.q;
        layerGain.connect(lf);
        lf.connect(layerMix);
      } else {
        layerGain.connect(layerMix);
      }
    }
    
    // Global filter
    if (this.config.filter) {
      filterNode = ctx.createBiquadFilter();
      filterNode.type = this.config.filter.type as BiquadFilterType;
      filterNode.frequency.value = this.config.filter.frequency;
      filterNode.Q.value = this.config.filter.q;
      layerMix.connect(filterNode);
      filterNode.connect(gainNode);
    } else {
      layerMix.connect(gainNode);
    }
    
    // Apply envelope
    const safeAttack = Math.max(0.001, attack);
    const safeDecay = Math.max(0.001, decay);
    const sustainLevel = Math.max(0.0001, sustain * velocity);
    
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(velocity, startTime + safeAttack);
    gainNode.gain.exponentialRampToValueAtTime(sustainLevel, startTime + safeAttack + safeDecay);
    
    gainNode.connect(this.masterGain!);
    
    return {
      sources,
      noiseSource,
      gainNode,
      filterNode,
      releaseTime: this.config.envelope.release,
    };
  }

  private releaseVoice(note: number, immediate: boolean): void {
    const active = this.activeVoices.get(note);
    if (!active) return;
    
    const ctx = this.ctx;
    if (!ctx) return;
    
    const { voice } = active;
    const now = ctx.currentTime;
    const releaseTime = immediate ? 0.01 : Math.max(0.001, voice.releaseTime);
    
    // Cancel scheduled values and apply release
    voice.gainNode.gain.cancelScheduledValues(now);
    voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
    voice.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + releaseTime);
    
    // Stop sources after release
    const stopTime = now + releaseTime + 0.01;
    voice.sources.forEach(src => {
      try {
        src.stop(stopTime);
      } catch {
        // Source already stopped
      }
    });
    
    if (voice.noiseSource) {
      try {
        voice.noiseSource.stop(stopTime);
      } catch {
        // Source already stopped
      }
    }
    
    // Clean up after release
    setTimeout(() => {
      try {
        voice.gainNode.disconnect();
        voice.filterNode?.disconnect();
      } catch {
        // Already disconnected
      }
    }, (releaseTime + 0.1) * 1000);
    
    this.activeVoices.delete(note);
  }

  allNotesOff(): void {
    for (const note of this.activeVoices.keys()) {
      this.releaseVoice(note, true);
    }
  }

  dispose(): void {
    this.allNotesOff();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.masterGain = null;
  }

  getActiveNoteCount(): number {
    return this.activeVoices.size;
  }
}


