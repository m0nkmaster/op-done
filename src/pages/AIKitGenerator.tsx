/**
 * AIKitGenerator - AI-powered OP-Z drum kit generator
 * Generate complete 24-sound drum kits from text prompts
 */

import { useState, useRef, useCallback } from 'react';
import { generateSoundConfig, type AIProvider } from '../services/ai';
import { synthesizeSound } from '../audio/synthesizer';
import { buildDrumPack } from '../audio/pack';
import type { SoundConfig } from '../types/soundConfig';
import type { Slice } from '../types';
import { OPZ } from '../config';

// Design tokens
const TE = {
  bg: '#0a0a0f',
  surface: '#14141f',
  panel: '#1a1a2a',
  accent: '#ff5500',
  accentDim: '#ff550040',
  cyan: '#00d4ff',
  green: '#00ff88',
  pink: '#ff3399',
  yellow: '#ffd500',
  text: '#ffffff',
  textDim: '#888899',
  border: '#2a2a3a',
};

type GenerationPhase = 'idle' | 'planning' | 'generating' | 'synthesizing' | 'building' | 'complete' | 'error';

interface SoundIdea {
  name: string;
  description: string;
  category: string;
}

interface GeneratedSound {
  idea: SoundIdea;
  config: SoundConfig | null;
  buffer: AudioBuffer | null;
  status: 'pending' | 'configuring' | 'synthesizing' | 'ready' | 'error';
  error?: string;
}

// System prompt for generating kit ideas
const KIT_PLANNER_PROMPT = `You are a drum kit designer for the OP-Z synthesizer. Generate exactly 24 unique drum sound ideas for a kit.

Return a JSON object with this structure:
{
  "kitName": "Short descriptive name for the kit",
  "sounds": [
    { "name": "Sound Name", "description": "Brief synthesis description", "category": "kick|snare|hihat|tom|perc|fx" }
  ]
}

CRITICAL CONSTRAINTS:
- Generate 24-30 sounds (we will use as many as fit in 12 seconds)
- Duration range: 0.3-0.6 seconds per sound (allows for natural decay)
- Focus on PUNCHY, LOUD, IMMEDIATE sounds with INSTANT attacks (attack time 0.001s or less)
- No ambient textures, long reverbs, or evolving sounds
- Sounds must start IMMEDIATELY - no silence at the beginning

CATEGORIES TO INCLUDE (vary the quantities based on the theme):
- kicks (punchy, short decay, 50-100Hz)
- snares (crisp, snappy, noise bursts)
- hihats (tight, bright, high frequency)
- toms (quick, tonal, pitched)
- percussion (clicks, pops, hits, claps)
- fx (short blips, zaps, impacts)

DESCRIPTIONS should specify:
- Exact frequencies (e.g., "60Hz sine", "3kHz noise burst")
- Short decay times (e.g., "50ms decay", "0.1s")
- INSTANT attack (e.g., "immediate attack", "0ms attack", "instant transient")

Example for "80s kicks":
{"kitName":"80s Boom","sounds":[{"name":"808 Sub","description":"50Hz sine, 80ms decay, instant attack","category":"kick"},{"name":"Gated Thump","description":"65Hz with 100ms gated decay, immediate transient","category":"kick"},...]}

REMEMBER: These are drum HITS, not sustained sounds. Every sound must start INSTANTLY with zero silence at the beginning.`;

export default function AIKitGenerator() {
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<AIProvider>('gemini');
  const [phase, setPhase] = useState<GenerationPhase>('idle');
  const [kitName, setKitName] = useState('');
  const [sounds, setSounds] = useState<GeneratedSound[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 24 });
  const [error, setError] = useState<string | null>(null);
  const [finalBlob, setFinalBlob] = useState<Blob | null>(null);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const abortRef = useRef(false);

  // Play a single sound
  const playSound = useCallback(async (buffer: AudioBuffer) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    
    // Resume context if suspended (required by browser autoplay policy)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  }, []);

  // Generate kit ideas from prompt
  const planKit = async (userPrompt: string): Promise<{ kitName: string; sounds: SoundIdea[] }> => {
    const apiKey = provider === 'openai' 
      ? import.meta.env.VITE_OPENAI_KEY 
      : import.meta.env.VITE_GEMINI_KEY;
    
    if (!apiKey) {
      throw new Error(`${provider.toUpperCase()} API key not set`);
    }

    if (provider === 'gemini') {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${userPrompt}\n\nReturn ONLY the JSON, no markdown or explanation.`,
        config: {
          systemInstruction: KIT_PLANNER_PROMPT,
          responseMimeType: 'application/json',
        },
      });
      
      let text: string | undefined;
      if (typeof (response as any).text === 'function') {
        text = (response as any).text();
      } else if (typeof response.text === 'string') {
        text = response.text;
      } else if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
        text = response.candidates[0].content.parts[0].text;
      }
      
      if (!text) throw new Error('No response from Gemini');
      const parsed = JSON.parse(text.trim());
      return { kitName: parsed.kitName, sounds: parsed.sounds.slice(0, 24) };
    } else {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          instructions: KIT_PLANNER_PROMPT,
          input: `${userPrompt}\n\nReturn ONLY the JSON.`,
          text: { format: { type: 'json_object' } },
        }),
      });
      
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || response.statusText);
      }
      
      const data = await response.json();
      const outputText = data.output?.find((item: any) => item.type === 'message')?.content?.find((c: any) => c.type === 'output_text')?.text;
      if (!outputText) throw new Error('No response from OpenAI');
      const parsed = JSON.parse(outputText);
      return { kitName: parsed.kitName, sounds: parsed.sounds.slice(0, 24) };
    }
  };

  // Generate config for a single sound
  // Let the AI decide naturally - we use actual resulting audio length for slices
  const generateConfig = async (idea: SoundIdea): Promise<SoundConfig> => {
    const prompt = `Create a ${idea.category} drum sound: "${idea.name}" - ${idea.description}. 
Make it LOUD, punchy, with instant attack (no silence at start). Duration should be 0.3-0.6 seconds.`;
    
    const config = await generateSoundConfig(prompt, provider);
    config.metadata.name = idea.name;
    config.metadata.category = idea.category as any;
    config.metadata.description = idea.description;
    
    // Enforce instant attack
    config.envelope.attack = Math.min(config.envelope.attack, 0.001);
    
    // Enforce minimum duration (0.3s) so sounds have proper tail
    config.timing.duration = Math.max(0.3, Math.min(config.timing.duration, 0.6));
    
    // Ensure envelope fits within duration
    const envTotal = config.envelope.attack + config.envelope.decay + config.envelope.release;
    if (envTotal > config.timing.duration) {
      const scale = config.timing.duration / envTotal;
      config.envelope.decay *= scale;
      config.envelope.release *= scale;
    }
    
    // Ensure loud output
    config.dynamics.velocity = 1.0;
    config.dynamics.normalize = true;
    
    // Remove delay to avoid timing issues
    if (config.effects.delay) {
      delete config.effects.delay;
    }
    
    return config;
  };

  // Main generation flow
  const generate = async () => {
    if (!prompt.trim()) return;
    
    abortRef.current = false;
    setError(null);
    setFinalBlob(null);
    setPhase('planning');
    setSounds([]);
    
    try {
      // Phase 1: Plan the kit
      const plan = await planKit(prompt);
      setKitName(plan.kitName);
      
      // Initialize sound list
      const initialSounds: GeneratedSound[] = plan.sounds.map(idea => ({
        idea,
        config: null,
        buffer: null,
        status: 'pending',
      }));
      setSounds(initialSounds);
      setProgress({ current: 0, total: plan.sounds.length });
      
      if (abortRef.current) return;
      setPhase('generating');
      
      // Phase 2: Generate configs in batches of 4 (to avoid rate limits)
      const BATCH_SIZE = 4;
      for (let i = 0; i < initialSounds.length; i += BATCH_SIZE) {
        if (abortRef.current) return;
        
        const batch = initialSounds.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(async (sound, batchIdx) => {
          const globalIdx = i + batchIdx;
          
          setSounds(prev => prev.map((s, idx) => 
            idx === globalIdx ? { ...s, status: 'configuring' } : s
          ));
          
          try {
            const config = await generateConfig(sound.idea);
            setSounds(prev => prev.map((s, idx) => 
              idx === globalIdx ? { ...s, config, status: 'synthesizing' } : s
            ));
            return { idx: globalIdx, config };
          } catch (err) {
            setSounds(prev => prev.map((s, idx) => 
              idx === globalIdx ? { ...s, status: 'error', error: String(err) } : s
            ));
            return { idx: globalIdx, config: null };
          }
        });
        
        await Promise.all(batchPromises);
        setProgress(prev => ({ ...prev, current: Math.min(i + BATCH_SIZE, initialSounds.length) }));
      }
      
      if (abortRef.current) return;
      setPhase('synthesizing');
      
      // Phase 3: Synthesize all sounds
      const currentSounds = await new Promise<GeneratedSound[]>(resolve => {
        setSounds(prev => {
          resolve(prev);
          return prev;
        });
      });
      
      for (let i = 0; i < currentSounds.length; i++) {
        if (abortRef.current) return;
        
        const sound = currentSounds[i];
        if (!sound.config) continue;
        
        try {
          const buffer = await synthesizeSound(sound.config);
          setSounds(prev => prev.map((s, idx) => 
            idx === i ? { ...s, buffer, status: 'ready' } : s
          ));
        } catch (err) {
          setSounds(prev => prev.map((s, idx) => 
            idx === i ? { ...s, status: 'error', error: String(err) } : s
          ));
        }
        
        setProgress(prev => ({ ...prev, current: i + 1 }));
      }
      
      if (abortRef.current) return;
      setPhase('building');
      
      // Phase 4: Build the pack
      const finalSounds = await new Promise<GeneratedSound[]>(resolve => {
        setSounds(prev => {
          resolve(prev);
          return prev;
        });
      });
      
      const validBuffers = finalSounds.filter(s => s.buffer).map(s => s.buffer!);
      if (validBuffers.length === 0) {
        throw new Error('No sounds were generated successfully');
      }
      
      const blob = await buildPack(validBuffers, kitName);
      setFinalBlob(blob);
      setPhase('complete');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase('error');
    }
  };

  // Convert AudioBuffer to WAV File for use with buildDrumPack
  const audioBufferToWavFile = (buffer: AudioBuffer, name: string): File => {
    const numChannels = 1; // Force mono
    const sampleRate = buffer.sampleRate;
    const bitsPerSample = 16;
    
    // Convert stereo to mono if needed
    let rawMono: Float32Array;
    if (buffer.numberOfChannels === 1) {
      rawMono = buffer.getChannelData(0);
    } else {
      rawMono = new Float32Array(buffer.length);
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);
      for (let i = 0; i < buffer.length; i++) {
        rawMono[i] = (left[i] + right[i]) * 0.5;
      }
    }
    
    // Only trim leading silence (keep full tail for natural decay)
    // Use a more generous threshold to catch the actual sound start
    const silenceThreshold = 0.01; // 1% of full scale
    let startSample = 0;
    for (let i = 0; i < rawMono.length; i++) {
      if (Math.abs(rawMono[i]) > silenceThreshold) {
        // Back up a tiny bit to catch the attack transient
        startSample = Math.max(0, i - 10);
        break;
      }
    }
    
    // Keep the full tail - don't trim trailing silence
    // The natural decay is part of the sound
    const endSample = rawMono.length;
    
    // Extract audio (only trimming leading silence)
    const mono = rawMono.slice(startSample, endSample);
    const numFrames = mono.length;
    
    // ALWAYS normalize to ensure maximum volume
    let maxPeak = 0;
    for (let i = 0; i < mono.length; i++) {
      maxPeak = Math.max(maxPeak, Math.abs(mono[i]));
    }
    if (maxPeak > 0) {
      const scale = 0.95 / maxPeak;
      for (let i = 0; i < mono.length; i++) {
        mono[i] *= scale;
      }
    }
    
    // Build WAV file
    const bytesPerSample = bitsPerSample / 8;
    const dataSize = numFrames * numChannels * bytesPerSample;
    const wavSize = 44 + dataSize;
    
    const wavBuffer = new ArrayBuffer(wavSize);
    const view = new DataView(wavBuffer);
    
    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, wavSize - 8, true);
    writeString(view, 8, 'WAVE');
    
    // fmt chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
    view.setUint16(32, numChannels * bytesPerSample, true);
    view.setUint16(34, bitsPerSample, true);
    
    // data chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Audio data
    let offset = 44;
    for (let i = 0; i < numFrames; i++) {
      const sample = Math.max(-1, Math.min(1, mono[i]));
      view.setInt16(offset, Math.round(sample * 32767), true);
      offset += 2;
    }
    
    return new File([wavBuffer], `${name}.wav`, { type: 'audio/wav' });
  };
  
  const writeString = (view: DataView, offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // Get actual duration from WAV file (16-bit mono at 44100 Hz)
  const getWavDuration = (file: File): number => {
    // WAV: 44-byte header + audio data
    // 16-bit mono: 2 bytes per sample, 44100 samples per second
    const dataBytes = file.size - 44;
    const frames = dataBytes / 2;
    return frames / 44100;
  };

  // Build the OP-Z pack from audio buffers using the proven buildDrumPack function
  // Fits as many sounds as possible within 12 seconds (max 24 slices)
  const buildPack = async (buffers: AudioBuffer[], name: string): Promise<Blob> => {
    // Convert AudioBuffers to WAV files, fitting as many as possible in 12 seconds
    const slices: Slice[] = [];
    let totalDuration = 0;
    const maxDuration = OPZ.MAX_DURATION_SECONDS;
    
    for (let i = 0; i < Math.min(buffers.length, OPZ.MAX_SLICES); i++) {
      const buffer = buffers[i];
      const sound = sounds[i];
      const soundName = sound?.idea.name || `Sound ${i + 1}`;
      const file = audioBufferToWavFile(buffer, soundName);
      
      // Get ACTUAL duration from the WAV file (after trimming)
      const sliceDuration = getWavDuration(file);
      
      // Check if adding this slice would exceed max duration
      if (totalDuration + sliceDuration > maxDuration && slices.length > 0) {
        console.log(`[buildPack] Stopping at ${slices.length} slices (would exceed ${maxDuration}s)`);
        break;
      }
      
      slices.push({
        id: `slice-${i}`,
        file,
        name: soundName,
        duration: sliceDuration,
        status: 'ready',
      });
      
      totalDuration += sliceDuration;
    }
    
    console.log(`[buildPack] Using ${slices.length} slices, ${totalDuration.toFixed(2)}s total`);
    
    // Use the proven buildDrumPack function
    // Match teenage-engineering-official.aif format exactly
    return buildDrumPack(slices, {
      maxDuration: OPZ.MAX_DURATION_SECONDS,
      format: 'aifc', // Use AIFF-C format like TE files
      metadata: {
        name: name.slice(0, 32),
        octave: 0,
        drumVersion: 2, // Version 2 (matches TE official files)
        pitch: new Array(OPZ.MAX_SLICES).fill(0),
        playmode: new Array(OPZ.MAX_SLICES).fill(4096), // Use 4096 to match TE official files
        reverse: new Array(OPZ.MAX_SLICES).fill(8192),
        volume: new Array(OPZ.MAX_SLICES).fill(8192),
      },
    });
  };

  // Download the pack
  const download = () => {
    if (!finalBlob) return;
    const url = URL.createObjectURL(finalBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${kitName.replace(/[^a-zA-Z0-9]/g, '_')}.aif`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Cancel generation
  const cancel = () => {
    abortRef.current = true;
    setPhase('idle');
  };

  const isGenerating = phase !== 'idle' && phase !== 'complete' && phase !== 'error';

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: TE.bg,
      fontFamily: '"JetBrains Mono", "SF Mono", Monaco, monospace',
      color: TE.text,
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: `1px solid ${TE.border}`,
        background: TE.surface,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40,
            background: `linear-gradient(135deg, ${TE.accent}, ${TE.pink})`,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 800,
          }}>AI</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>AI KIT GENERATOR</div>
            <div style={{ fontSize: 11, color: TE.textDim }}>OP-Z Drum Pack Builder</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            value={provider}
            onChange={e => setProvider(e.target.value as AIProvider)}
            disabled={isGenerating}
            style={{
              padding: '8px 12px',
              background: TE.panel,
              border: `1px solid ${TE.border}`,
              borderRadius: 4,
              color: TE.text,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            <option value="gemini">Gemini</option>
            <option value="openai">OpenAI</option>
          </select>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
        {/* Input Section */}
        <div style={{
          background: TE.panel,
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
          border: `1px solid ${TE.border}`,
        }}>
          <label style={{ 
            display: 'block', 
            fontSize: 11, 
            color: TE.textDim, 
            marginBottom: 8,
            letterSpacing: 1,
          }}>
            DESCRIBE YOUR DRUM KIT
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              type="text"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !isGenerating && generate()}
              placeholder="e.g., 80s inspired kick drums, industrial metal percussion, lo-fi hip hop kit..."
              disabled={isGenerating}
              style={{
                flex: 1,
                padding: '14px 18px',
                background: TE.surface,
                border: `2px solid ${TE.border}`,
                borderRadius: 8,
                color: TE.text,
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
            {isGenerating ? (
              <button
                onClick={cancel}
                style={{
                  padding: '14px 28px',
                  background: TE.pink,
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: 1,
                }}
              >
                CANCEL
              </button>
            ) : (
              <button
                onClick={generate}
                disabled={!prompt.trim()}
                style={{
                  padding: '14px 28px',
                  background: prompt.trim() ? TE.accent : TE.border,
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: prompt.trim() ? 'pointer' : 'not-allowed',
                  letterSpacing: 1,
                }}
              >
                GENERATE
              </button>
            )}
          </div>
        </div>

        {/* Progress */}
        {isGenerating && (
          <div style={{
            background: TE.panel,
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
            border: `1px solid ${TE.border}`,
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: 12,
            }}>
              <span style={{ fontSize: 12, color: TE.textDim, letterSpacing: 1 }}>
                {phase === 'planning' && '🧠 PLANNING KIT...'}
                {phase === 'generating' && '⚙️ GENERATING CONFIGS...'}
                {phase === 'synthesizing' && '🔊 SYNTHESIZING SOUNDS...'}
                {phase === 'building' && '📦 BUILDING PACK...'}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: TE.cyan }}>
                {progress.current} / {progress.total}
              </span>
            </div>
            <div style={{
              height: 6,
              background: TE.surface,
              borderRadius: 3,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${(progress.current / progress.total) * 100}%`,
                background: `linear-gradient(90deg, ${TE.accent}, ${TE.cyan})`,
                borderRadius: 3,
                transition: 'width 0.3s',
              }} />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: `${TE.pink}20`,
            border: `1px solid ${TE.pink}`,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            color: TE.pink,
            fontSize: 13,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Complete */}
        {phase === 'complete' && finalBlob && (
          <div style={{
            background: `${TE.green}10`,
            border: `1px solid ${TE.green}40`,
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: TE.green, marginBottom: 8 }}>
              {kitName}
            </div>
            <div style={{ fontSize: 13, color: TE.textDim, marginBottom: 16 }}>
              {sounds.filter(s => s.status === 'ready').length} sounds • Ready for OP-Z
            </div>
            <button
              onClick={download}
              style={{
                padding: '14px 32px',
                background: TE.green,
                border: 'none',
                borderRadius: 8,
                color: '#000',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: 1,
              }}
            >
              ⬇ DOWNLOAD .AIF
            </button>
          </div>
        )}

        {/* Sound Grid */}
        {sounds.length > 0 && (
          <div style={{
            background: TE.panel,
            borderRadius: 12,
            padding: 16,
            border: `1px solid ${TE.border}`,
          }}>
            <div style={{ 
              fontSize: 11, 
              color: TE.textDim, 
              marginBottom: 12,
              letterSpacing: 1,
            }}>
              SOUNDS ({sounds.filter(s => s.status === 'ready').length}/{sounds.length})
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 8,
            }}>
              {sounds.map((sound, idx) => (
                <div
                  key={idx}
                  onClick={() => sound.buffer && playSound(sound.buffer)}
                  style={{
                    padding: 12,
                    background: sound.status === 'ready' 
                      ? `${TE.green}10` 
                      : sound.status === 'error' 
                        ? `${TE.pink}10`
                        : TE.surface,
                    border: `1px solid ${
                      sound.status === 'ready' 
                        ? `${TE.green}40` 
                        : sound.status === 'error' 
                          ? `${TE.pink}40`
                          : TE.border
                    }`,
                    borderRadius: 8,
                    cursor: sound.buffer ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}>
                    <span style={{ 
                      fontSize: 9, 
                      color: TE.textDim,
                      textTransform: 'uppercase',
                    }}>
                      {sound.idea.category}
                    </span>
                    <span style={{ fontSize: 10 }}>
                      {sound.status === 'pending' && '⏳'}
                      {sound.status === 'configuring' && '⚙️'}
                      {sound.status === 'synthesizing' && '🔊'}
                      {sound.status === 'ready' && '▶'}
                      {sound.status === 'error' && '❌'}
                    </span>
                  </div>
                  <div style={{ 
                    fontSize: 12, 
                    fontWeight: 600,
                    color: sound.status === 'error' ? TE.pink : TE.text,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {sound.idea.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {phase === 'idle' && sounds.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: TE.textDim,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>🥁</div>
            <div style={{ fontSize: 14, marginBottom: 8 }}>
              Enter a prompt above to generate a complete drum kit
            </div>
            <div style={{ fontSize: 12 }}>
              24 unique sounds • OP-Z compatible • AI-powered synthesis
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

