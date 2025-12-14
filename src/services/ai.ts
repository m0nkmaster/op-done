import { GoogleGenAI } from '@google/genai';
import type { SoundConfig } from '../types/soundConfig';

export type AIProvider = 'openai' | 'gemini';

// System prompt for general synthesis (/synthesizer page)
const SYSTEM_PROMPT = `You are a synthesizer programmer. Return a JSON synthesis config.

COMPLETE SCHEMA:
{
  "synthesis": {
    "layers": [{
      "type": "oscillator" | "fm" | "noise" | "karplus-strong",
      "gain": number (0-1),
      "envelope": { "attack": number, "decay": number, "sustain": number (0-1), "release": number },
      "filter": {
        "type": "lowpass"|"highpass"|"bandpass"|"notch",
        "frequency": number (20-20000 Hz),
        "q": number (0.1-20),
        "envelope": { "amount": number, "attack": number, "decay": number, "sustain": number (0-1), "release": number }
      },
      "saturation": { "type": "soft"|"hard"|"tube"|"tape", "drive": number (0-10), "mix": number (0-1) },
      "oscillator": {
        "waveform": "sine"|"square"|"sawtooth"|"triangle",
        "frequency": number (20-20000 Hz),
        "detune": number (-1200 to 1200 cents),
        "unison": { "voices": number (1-8), "detune": number (cents spread), "spread": number (0-1 stereo width) },
        "sub": { "level": number (0-1), "octave": -1 | -2, "waveform": "sine"|"square"|"triangle" }
      },
      "fm": { "carrier": number, "modulator": number, "modulationIndex": number (0-20) },
      "noise": { "type": "white"|"pink"|"brown" },
      "karplus": { "frequency": number (50-2000 Hz), "damping": number (0-1), "pluckLocation": number (0-1) }
    }]
  },
  "envelope": { "attack": number (0.001-2 sec), "decay": number (0.01-5 sec), "sustain": number (0-1), "release": number (0.01-5 sec) },
  "filter": {
    "type": "lowpass"|"highpass"|"bandpass"|"notch"|"allpass"|"peaking",
    "frequency": number (20-20000 Hz),
    "q": number (0.0001-1000),
    "gain": number (dB, for peaking),
    "envelope": { "amount": number (Hz), "attack": number, "decay": number, "sustain": number (0-1), "release": number }
  },
  "lfo": {
    "waveform": "sine"|"square"|"sawtooth"|"triangle"|"random",
    "frequency": number (0.1-20 Hz),
    "depth": number (0-1),
    "target": "pitch"|"filter"|"amplitude"|"pan",
    "delay": number (seconds before start),
    "fade": number (seconds to fade in)
  },
  "effects": {
    "distortion": { "type": "soft"|"hard"|"fuzz"|"bitcrush"|"waveshaper", "amount": number (0-1), "mix": number (0-1) },
    "reverb": { "decay": number (0.5-10 sec), "damping": number (0-1), "mix": number (0-1) },
    "delay": { "time": number (0.01-2 sec), "feedback": number (0-0.9), "mix": number (0-1) },
    "compressor": { "threshold": number (-60 to 0 dB), "ratio": number (1-20), "attack": number, "release": number, "knee": number (dB) },
    "gate": { "attack": number, "hold": number, "release": number }
  },
  "timing": { "duration": number (0.1-12 sec) },
  "dynamics": { "velocity": number (0-1), "normalize": boolean },
  "metadata": { "name": string, "category": string, "description": string, "tags": string[] }
}

RULES:
- Include layer-specific object (oscillator/fm/noise/karplus) matching the layer type
- All fields except synthesis, envelope, timing, dynamics, metadata are optional
- Return raw JSON only, no markdown`;

// System prompt for percussive sound batch generation (/ai-kit-generator page)
const BATCH_SYSTEM_PROMPT = `You are a percussive sound designer. Return JSON: { "configs": [...] }

SCHEMA for each config:
{
  "synthesis": {
    "layers": [{
      "type": "oscillator" | "fm" | "noise",
      "gain": number (0-1),
      "envelope": { "attack": number, "decay": number, "sustain": number (0-1), "release": number },
      "filter": { "type": "lowpass"|"highpass"|"bandpass"|"notch", "frequency": number, "q": number },
      "saturation": { "type": "soft"|"hard"|"tube"|"tape", "drive": number (0-10), "mix": number (0-1) },
      "oscillator": { "waveform": "sine"|"square"|"sawtooth"|"triangle", "frequency": number, "detune": number },
      "fm": { "carrier": number, "modulator": number, "modulationIndex": number },
      "noise": { "type": "white"|"pink"|"brown" }
    }]
  },
  "envelope": { "attack": number, "decay": number, "sustain": number (0-1), "release": number },
  "filter": { "type": "lowpass"|"highpass"|"bandpass"|"notch", "frequency": number, "q": number },
  "effects": {
    "distortion": { "type": "soft"|"hard"|"fuzz"|"bitcrush"|"waveshaper", "amount": number (0-1), "mix": number (0-1) },
    "compressor": { "threshold": number (dB), "ratio": number, "attack": number, "release": number, "knee": number },
    "gate": { "attack": number, "hold": number, "release": number }
  },
  "timing": { "duration": number (0.1-1 sec) },
  "dynamics": { "velocity": number (0-1), "normalize": boolean },
  "metadata": { "name": string, "category": string, "description": string, "tags": string[] }
}

GUIDELINES:
- Match envelope to sound type: kicks/snares need instant attack; cymbals/textures can have longer decay
- NO delay or reverb effects (causes bleed in samplers)
- Return raw JSON only, no markdown`;

// Extract JSON from text that may have extra content before/after
function extractJSON(text: string): Record<string, unknown> {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {
    // Find JSON object boundaries
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error('No valid JSON found in response');
  }
}

function validateConfig(config: SoundConfig): void {
  config.synthesis.layers.forEach(layer => {
    if (layer.oscillator?.frequency) {
      layer.oscillator.frequency = Math.max(20, Math.min(20000, layer.oscillator.frequency));
    }
    if (layer.filter?.frequency) {
      layer.filter.frequency = Math.max(20, Math.min(20000, layer.filter.frequency));
    }
  });

  if (config.filter?.frequency) {
    config.filter.frequency = Math.max(20, Math.min(20000, config.filter.frequency));
  }

  if (config.effects.delay?.feedback) {
    config.effects.delay.feedback = Math.min(0.5, config.effects.delay.feedback);
  }

  const totalEnv = config.envelope.attack + config.envelope.decay + config.envelope.release;
  if (totalEnv > config.timing.duration) {
    const scale = config.timing.duration / totalEnv;
    config.envelope.attack *= scale;
    config.envelope.decay *= scale;
    config.envelope.release *= scale;
  }
}

// Parse stringified nested objects (Gemini sometimes returns these as strings)
function parseStringifiedObjects(obj: Record<string, unknown>): void {
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
      try {
        obj[key] = JSON.parse(value);
      } catch {
        // Keep as string if parse fails
      }
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      parseStringifiedObjects(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      value.forEach(item => {
        if (item && typeof item === 'object') {
          parseStringifiedObjects(item as Record<string, unknown>);
        }
      });
    }
  }
}

// Ensure a value is a finite number, return default if not
function ensureNumber(value: unknown, defaultValue: number): number {
  if (typeof value === 'number' && isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (isFinite(parsed)) return parsed;
  }
  return defaultValue;
}

function ensureDefaults(config: SoundConfig): void {
  // First, parse any stringified nested objects
  parseStringifiedObjects(config as unknown as Record<string, unknown>);
  
  const configAny = config as Record<string, unknown>;
  const synthesisAny = config.synthesis as Record<string, unknown> | undefined;
  
  // Move synthesis.filter to top-level filter if present
  if (synthesisAny?.filter && !config.filter) {
    config.filter = synthesisAny.filter as typeof config.filter;
    delete synthesisAny.filter;
  }
  
  // Fix filter field names
  if (config.filter) {
    const filterAny = config.filter as Record<string, unknown>;
    // cutoff -> frequency
    if (filterAny.cutoff !== undefined && filterAny.frequency === undefined) {
      filterAny.frequency = filterAny.cutoff;
      delete filterAny.cutoff;
    }
    // resonance -> q
    if (filterAny.resonance !== undefined && filterAny.q === undefined) {
      filterAny.q = filterAny.resonance;
      delete filterAny.resonance;
    }
    // Q (uppercase) -> q (lowercase)
    if (filterAny.Q !== undefined) {
      if (filterAny.q === undefined) filterAny.q = filterAny.Q;
      delete filterAny.Q;
    }
    // Remove unsupported filter fields
    delete filterAny.envelopeAmount;
    delete filterAny.envelope;
    delete filterAny.gain; // Filter gain not used in our implementation
  }
  
  // Metadata
  if (!config.metadata) config.metadata = { name: 'Generated Sound', category: 'other', description: '', tags: [] };
  
  // Effects - remove unknown effect types and validate numeric fields
  if (!config.effects) config.effects = {};
  const effectsAny = config.effects as Record<string, unknown>;
  const knownEffects = ['reverb', 'delay', 'distortion', 'compressor'];
  for (const key of Object.keys(effectsAny)) {
    if (!knownEffects.includes(key)) {
      delete effectsAny[key];
    }
  }
  
  // Validate reverb fields
  if (config.effects.reverb) {
    const reverbAny = config.effects.reverb as Record<string, unknown>;
    // size -> decay
    if (reverbAny.size !== undefined && reverbAny.decay === undefined) {
      reverbAny.decay = reverbAny.size;
      delete reverbAny.size;
    }
    config.effects.reverb.decay = ensureNumber(reverbAny.decay, 1.5);
    config.effects.reverb.mix = ensureNumber(reverbAny.mix, 0.3);
    if (reverbAny.damping !== undefined) {
      config.effects.reverb.damping = ensureNumber(reverbAny.damping, 0.5);
    }
    // Remove unsupported reverb fields
    delete reverbAny.tone;
    delete reverbAny.roomSize;
    delete reverbAny.preDelay;
  }
  
  // Validate delay fields
  if (config.effects.delay) {
    const delayAny = config.effects.delay as Record<string, unknown>;
    config.effects.delay.time = ensureNumber(delayAny.time, 0.3);
    config.effects.delay.feedback = ensureNumber(delayAny.feedback, 0.3);
    config.effects.delay.mix = ensureNumber(delayAny.mix, 0.3);
  }
  
  // Validate compressor fields - MUST have attack and release
  if (config.effects.compressor) {
    const compAny = config.effects.compressor as Record<string, unknown>;
    config.effects.compressor.threshold = ensureNumber(compAny.threshold, -12);
    config.effects.compressor.ratio = ensureNumber(compAny.ratio, 4);
    config.effects.compressor.attack = ensureNumber(compAny.attack, 0.003);
    config.effects.compressor.release = ensureNumber(compAny.release, 0.25);
  }
  
  // Validate distortion fields
  if (config.effects.distortion) {
    const distAny = config.effects.distortion as Record<string, unknown>;
    config.effects.distortion.amount = ensureNumber(distAny.amount, 0.5);
    config.effects.distortion.mix = ensureNumber(distAny.mix, 0.5);
  }
  
  // Validate filter numeric fields
  if (config.filter) {
    const filterAny = config.filter as Record<string, unknown>;
    config.filter.frequency = ensureNumber(filterAny.frequency, 2000);
    config.filter.q = ensureNumber(filterAny.q, 1);
  }
  
  // Validate LFO numeric fields
  if (config.lfo) {
    const lfoAny = config.lfo as Record<string, unknown>;
    config.lfo.frequency = ensureNumber(lfoAny.frequency, 1);
    config.lfo.depth = ensureNumber(lfoAny.depth, 0.5);
  }
  
  // Envelope - ensure all fields are numbers
  if (!config.envelope) config.envelope = { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.3 };
  config.envelope.attack = ensureNumber(config.envelope.attack, 0.01);
  config.envelope.decay = ensureNumber(config.envelope.decay, 0.1);
  config.envelope.sustain = ensureNumber(config.envelope.sustain, 0.5);
  config.envelope.release = ensureNumber(config.envelope.release, 0.3);
  
  // Timing - ensure duration is a number
  if (!config.timing) config.timing = { duration: 1 };
  config.timing.duration = ensureNumber(config.timing.duration, 1);
  
  // Dynamics - ensure velocity is a number
  if (!config.dynamics) config.dynamics = { velocity: 0.8, normalize: true };
  config.dynamics.velocity = ensureNumber(config.dynamics.velocity, 0.8);
  if (typeof config.dynamics.normalize !== 'boolean') config.dynamics.normalize = true;
  
  // Synthesis layers
  if (!config.synthesis?.layers || config.synthesis.layers.length === 0) {
    config.synthesis = { layers: [{ type: 'oscillator', gain: 1, oscillator: { waveform: 'sine', frequency: 440, detune: 0 } }] };
  }
  
  // Ensure each layer has required fields
  config.synthesis.layers.forEach(layer => {
    if (typeof layer.gain !== 'number' || !isFinite(layer.gain)) layer.gain = 1;
    
    const layerAny = layer as Record<string, unknown>;
    
    // Handle FM fields at layer level (should be inside layer.fm)
    if (layer.type === 'fm' && !layer.fm) {
      // FM fields are at layer level - move them into fm object
      layer.fm = {
        carrier: 440,
        modulator: 440,
        modulationIndex: typeof layerAny.modulationIndex === 'number' ? layerAny.modulationIndex : 1
      };
      // Extract carrier frequency
      if (typeof layerAny.carrier === 'object' && layerAny.carrier !== null) {
        const c = layerAny.carrier as Record<string, unknown>;
        layer.fm.carrier = typeof c.frequency === 'number' ? c.frequency : 440;
      } else if (typeof layerAny.carrier === 'number') {
        layer.fm.carrier = layerAny.carrier;
      }
      // Extract modulator frequency
      if (typeof layerAny.modulator === 'object' && layerAny.modulator !== null) {
        const m = layerAny.modulator as Record<string, unknown>;
        layer.fm.modulator = typeof m.frequency === 'number' ? m.frequency : 440;
      } else if (typeof layerAny.modulator === 'number') {
        layer.fm.modulator = layerAny.modulator;
      }
      // Clean up layer-level FM fields
      delete layerAny.carrier;
      delete layerAny.modulator;
      delete layerAny.modulationIndex;
    }
    
    // Handle "karplus-strong" key (should be "karplus" internally)
    if (layerAny['karplus-strong'] && !layer.karplus) {
      layer.karplus = layerAny['karplus-strong'] as typeof layer.karplus;
      delete layerAny['karplus-strong'];
    }
    
    // Fix noise field name variations
    if (layer.noise) {
      const noiseAny = layer.noise as Record<string, unknown>;
      // noiseType -> type
      if (noiseAny.noiseType !== undefined && noiseAny.type === undefined) {
        noiseAny.type = noiseAny.noiseType;
        delete noiseAny.noiseType;
      }
      // color -> type
      if (noiseAny.color !== undefined && noiseAny.type === undefined) {
        noiseAny.type = noiseAny.color;
        delete noiseAny.color;
      }
      // Ensure valid noise type
      if (!['white', 'pink', 'brown'].includes(noiseAny.type as string)) {
        noiseAny.type = 'white';
      }
    }
    
    // Fix FM structure - expects { carrier: number, modulator: number, modulationIndex: number }
    // where carrier and modulator are frequency ratios (e.g., 1, 2, 3 for harmonic ratios)
    if (layer.fm) {
      const fmAny = layer.fm as Record<string, unknown>;
      
      // Handle nested carrier object -> extract frequency
      let carrierFreq = 440;
      if (typeof fmAny.carrier === 'object' && fmAny.carrier !== null) {
        const carrier = fmAny.carrier as Record<string, unknown>;
        carrierFreq = typeof carrier.frequency === 'number' ? carrier.frequency : 440;
      } else if (typeof fmAny.carrier === 'number') {
        carrierFreq = fmAny.carrier;
      } else if (typeof fmAny.carrierFrequency === 'number') {
        carrierFreq = fmAny.carrierFrequency;
      }
      
      // Handle nested modulator object -> extract frequency
      let modFreq = 440;
      if (typeof fmAny.modulator === 'object' && fmAny.modulator !== null) {
        const mod = fmAny.modulator as Record<string, unknown>;
        modFreq = typeof mod.frequency === 'number' ? mod.frequency : 440;
        // modulationIndex might be inside modulator
        if (typeof mod.modulationIndex === 'number') {
          fmAny.modulationIndex = mod.modulationIndex;
        }
      } else if (typeof fmAny.modulator === 'number') {
        modFreq = fmAny.modulator;
      } else if (typeof fmAny.modulatorFrequency === 'number') {
        modFreq = fmAny.modulatorFrequency;
      }
      
      // Set carrier and modulator as frequency values (synthCore uses ratio)
      fmAny.carrier = carrierFreq > 0 ? carrierFreq : 440;
      fmAny.modulator = modFreq > 0 ? modFreq : 440;
      
      // Clean up extra fields
      delete fmAny.carrierFrequency;
      delete fmAny.modulatorFrequency;
      delete fmAny.carrierWaveform;
      delete fmAny.modulatorWaveform;
      
      // Ensure modulationIndex is a number
      if (typeof fmAny.modulationIndex !== 'number' || !isFinite(fmAny.modulationIndex as number)) {
        fmAny.modulationIndex = 1;
      }
    }
    
    // Ensure oscillator frequency is finite
    if (layer.oscillator) {
      if (typeof layer.oscillator.frequency !== 'number' || !isFinite(layer.oscillator.frequency)) {
        layer.oscillator.frequency = 440;
      }
      if (typeof layer.oscillator.detune !== 'number' || !isFinite(layer.oscillator.detune)) {
        layer.oscillator.detune = 0;
      }
    }
    
    // Ensure FM params are finite
    if (layer.fm) {
      const fmAny = layer.fm as Record<string, unknown>;
      if (typeof fmAny.modulationIndex !== 'number' || !isFinite(fmAny.modulationIndex as number)) {
        fmAny.modulationIndex = 1;
      }
    }
    
    // Ensure karplus params are finite
    if (layer.karplus) {
      if (typeof layer.karplus.frequency !== 'number' || !isFinite(layer.karplus.frequency)) {
        layer.karplus.frequency = 440;
      }
      if (typeof layer.karplus.damping !== 'number' || !isFinite(layer.karplus.damping)) {
        layer.karplus.damping = 0.5;
      }
    }
  });
  
  // Remove unknown top-level properties
  const knownProps = ['synthesis', 'envelope', 'filter', 'lfo', 'effects', 'timing', 'dynamics', 'metadata'];
  for (const key of Object.keys(configAny)) {
    if (!knownProps.includes(key)) {
      delete configAny[key];
    }
  }
}

async function generateWithOpenAI(description: string): Promise<SoundConfig> {
  const apiKey = import.meta.env.VITE_OPENAI_KEY;
  if (!apiKey) throw new Error('VITE_OPENAI_KEY not set');

  const input = `${description}\n\nReturn JSON.`;

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-5.2-pro',
      instructions: SYSTEM_PROMPT,
      input,
      text: {
        format: { type: 'json_object' },
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenAI: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  console.log('OpenAI generateWithOpenAI response:', JSON.stringify(data, null, 2));
  type OutputItem = { type: string; content?: { type: string; text?: string }[] };
  const outputText = data.output?.find((item: OutputItem) => item.type === 'message')
    ?.content?.find((c: { type: string; text?: string }) => c.type === 'output_text')?.text;
  
  if (!outputText) {
    console.error('OpenAI Raw Response:', JSON.stringify(data, null, 2));
    throw new Error('OpenAI: No text generated');
  }
  
  const parsed = extractJSON(outputText) as SoundConfig;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('OpenAI: Invalid response format');
  }
  return parsed;
}

async function generateWithGemini(description: string): Promise<SoundConfig> {
  const apiKey = import.meta.env.VITE_GEMINI_KEY;
  if (!apiKey) throw new Error('VITE_GEMINI_KEY not set');

  const ai = new GoogleGenAI({ apiKey });

  const prompt = description;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      // Note: Not using responseJsonSchema - Gemini has nesting depth limits
      // The prompt provides structure guidance instead
    },
  });

  let text: string | undefined;
  if (typeof (response as unknown as { text: () => string }).text === 'function') {
    text = (response as unknown as { text: () => string }).text();
  } else if (typeof response.text === 'string') {
    text = response.text;
  } else if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
    text = response.candidates[0].content.parts[0].text;
  }

  if (!text) {
    console.error('Gemini Raw Response:', JSON.stringify(response, null, 2));
    throw new Error('Gemini: No text generated. Content may be blocked by safety settings.');
  }

  const parsed = extractJSON(text.trim()) as SoundConfig;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Gemini: Invalid response format');
  }
  return parsed;
}

export async function generateSoundConfig(
  description: string,
  provider: AIProvider
): Promise<SoundConfig> {
  const config = provider === 'openai'
    ? await generateWithOpenAI(description)
    : await generateWithGemini(description);

  ensureDefaults(config);
  validateConfig(config);
  return config;
}

// Batch generation types
export interface SoundIdea {
  name: string;
  description: string;
  category: string;
}

async function batchGenerateWithOpenAI(ideas: SoundIdea[]): Promise<SoundConfig[]> {
  const apiKey = import.meta.env.VITE_OPENAI_KEY;
  if (!apiKey) throw new Error('VITE_OPENAI_KEY not set');

  const soundsList = ideas.map((idea, i) => 
    `${i + 1}. ${idea.category}: "${idea.name}" - ${idea.description}`
  ).join('\n');

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-5.2-pro',
      instructions: BATCH_SYSTEM_PROMPT,
      input: `Generate synthesis configs for these ${ideas.length} drum sounds:\n\n${soundsList}\n\nReturn JSON: { "configs": [...] }`,
      text: {
        format: { type: 'json_object' },
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenAI: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  console.log('OpenAI batchGenerateWithOpenAI response:', JSON.stringify(data, null, 2));
  type OutputItem = { type: string; content?: { type: string; text?: string }[] };
  const outputText = data.output?.find((item: OutputItem) => item.type === 'message')
    ?.content?.find((c: { type: string; text?: string }) => c.type === 'output_text')?.text;
  
  if (!outputText) {
    console.error('OpenAI Batch Raw Response:', JSON.stringify(data, null, 2));
    throw new Error('OpenAI: No batch response generated');
  }
  
  const parsed = extractJSON(outputText);
  const configs = (parsed.configs || []) as SoundConfig[];
  return configs.filter((c: unknown) => c !== null && typeof c === 'object');
}

async function batchGenerateWithGemini(ideas: SoundIdea[]): Promise<SoundConfig[]> {
  const apiKey = import.meta.env.VITE_GEMINI_KEY;
  if (!apiKey) throw new Error('VITE_GEMINI_KEY not set');

  const ai = new GoogleGenAI({ apiKey });

  const soundsList = ideas.map((idea, i) => 
    `${i + 1}. ${idea.category}: "${idea.name}" - ${idea.description}`
  ).join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Generate synthesis configs for these ${ideas.length} drum sounds:\n\n${soundsList}`,
    config: {
      systemInstruction: BATCH_SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      // Note: Not using responseJsonSchema - Gemini has nesting depth limits
    },
  });

  let text: string | undefined;
  if (typeof (response as unknown as { text: () => string }).text === 'function') {
    text = (response as unknown as { text: () => string }).text();
  } else if (typeof response.text === 'string') {
    text = response.text;
  } else if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
    text = response.candidates[0].content.parts[0].text;
  }

  if (!text) {
    throw new Error('Gemini: No text generated');
  }

  const parsed = extractJSON(text.trim());
  const configs = (parsed.configs || []) as SoundConfig[];
  return configs.filter((c: unknown) => c !== null && typeof c === 'object');
}

export async function generateBatchSoundConfigs(
  ideas: SoundIdea[],
  provider: AIProvider
): Promise<SoundConfig[]> {
  const configs = provider === 'openai'
    ? await batchGenerateWithOpenAI(ideas)
    : await batchGenerateWithGemini(ideas);

  // Apply defaults and validation to each config
  return configs.map((config, i) => {
    ensureDefaults(config);
    
    // Sync metadata with ideas
    config.metadata.name = ideas[i].name;
    config.metadata.category = ideas[i].category as SoundConfig['metadata']['category'];
    config.metadata.description = ideas[i].description;
    
    // Clamp duration to pack constraints
    config.timing.duration = Math.max(0.3, Math.min(config.timing.duration, 0.6));
    
    // Remove delay to prevent tail bleed between slices
    if (config.effects.delay) {
      delete config.effects.delay;
    }
    
    validateConfig(config);
    return config;
  });
}

// Kit planning schema
const KIT_PLAN_JSON_SCHEMA = {
  type: 'object',
  properties: {
    kitName: { type: 'string' },
    sounds: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string', enum: ['kick', 'snare', 'hihat', 'tom', 'perc', 'fx'] },
        },
        required: ['name', 'description', 'category'],
      },
    },
  },
  required: ['kitName', 'sounds'],
};

// System prompt for kit planning (/ai-kit-generator page)
// OP-Z limits: 24 sounds, each <4s, total <12s
const KIT_PLANNER_PROMPT = `You are a sound designer specializing in percussive and rhythmic sounds. You create sample packs for producers across all genres.

Design a collection of exactly 24 sounds based on the user's theme. This could be a full drum kit, or a focused collection (all kicks, all cymbals, all textures, etc.) - follow what the user asks for. Each sound must be under 4 seconds. The total of all sounds must be under 12 seconds - plan for ~0.4-0.5s per sound on average.`;

export interface KitPlan {
  kitName: string;
  sounds: SoundIdea[];
}

export async function planDrumKit(
  userPrompt: string,
  provider: AIProvider
): Promise<KitPlan> {
  if (provider === 'gemini') {
    const apiKey = import.meta.env.VITE_GEMINI_KEY;
    if (!apiKey) throw new Error('VITE_GEMINI_KEY not set');

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: userPrompt,
      config: {
        systemInstruction: KIT_PLANNER_PROMPT,
        responseMimeType: 'application/json',
        responseJsonSchema: KIT_PLAN_JSON_SCHEMA,
      },
    });

    let text: string | undefined;
    if (typeof (response as unknown as { text: () => string }).text === 'function') {
      text = (response as unknown as { text: () => string }).text();
    } else if (typeof response.text === 'string') {
      text = response.text;
    } else if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
      text = response.candidates[0].content.parts[0].text;
    }

    if (!text) throw new Error('Gemini: No response generated');
    const parsed = extractJSON(text.trim());
    return { kitName: parsed.kitName as string, sounds: (parsed.sounds as SoundIdea[]).slice(0, 24) };
  } else {
    const apiKey = import.meta.env.VITE_OPENAI_KEY;
    if (!apiKey) throw new Error('VITE_OPENAI_KEY not set');

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.2-pro',
        instructions: KIT_PLANNER_PROMPT,
        input: `${userPrompt}\n\nReturn JSON.`,
        text: {
          format: { type: 'json_object' },
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`OpenAI: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI planDrumKit response:', JSON.stringify(data, null, 2));
    type OutputItem = { type: string; content?: { type: string; text?: string }[] };
    const outputText = data.output?.find((item: OutputItem) => item.type === 'message')
      ?.content?.find((c: { type: string; text?: string }) => c.type === 'output_text')?.text;
    if (!outputText) throw new Error('OpenAI: No response generated');
    const parsed = extractJSON(outputText);
    return { kitName: parsed.kitName as string, sounds: (parsed.sounds as SoundIdea[]).slice(0, 24) };
  }
}
