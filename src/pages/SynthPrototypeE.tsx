/**
 * SynthPrototypeE - Teenage Engineering Inspired
 * Aesthetic: Light, playful, dense, orange accents, utilitarian charm
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSynthState } from '../components/synth-prototypes/shared';
import { synthesizeSound } from '../audio/synthesizer';

// ═══════════════════════════════════════════════════════════════════════════════
// TE-INSPIRED DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════════

const TE = {
  // Backgrounds - warm, light
  bg: '#f4f2ef',
  surface: '#eae7e3',
  panel: '#ffffff',
  
  // Text
  black: '#1a1a1a',
  dark: '#3a3a3a',
  grey: '#888888',
  light: '#c0c0c0',
  
  // TE signature colors
  orange: '#ff5500',
  yellow: '#ffd500',
  cyan: '#00c8ff',
  green: '#00cc66',
  pink: '#ff3399',
  
  // UI elements
  border: '#d0d0d0',
  borderDark: '#a0a0a0',
};

// ═══════════════════════════════════════════════════════════════════════════════
// MINI KNOB (TE-style small rotary)
// ═══════════════════════════════════════════════════════════════════════════════

interface MiniKnobProps {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  label: string;
  color?: string;
  logarithmic?: boolean;
}

function MiniKnob({ value, min, max, onChange, label, color = TE.orange, logarithmic }: MiniKnobProps) {
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ y: 0, value: 0 });

  const normalized = logarithmic
    ? Math.log(value / min) / Math.log(max / min)
    : (value - min) / (max - min);
  
  const rotation = normalized * 270 - 135;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    dragStart.current = { y: e.clientY, value };
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => {
      const delta = dragStart.current.y - e.clientY;
      const sensitivity = (max - min) / 100;
      let newVal: number;
      if (logarithmic) {
        const logMin = Math.log(min);
        const logMax = Math.log(max);
        const logCurr = Math.log(dragStart.current.value);
        const logSens = (logMax - logMin) / 100;
        newVal = Math.exp(Math.max(logMin, Math.min(logMax, logCurr + delta * logSens)));
      } else {
        newVal = dragStart.current.value + delta * sensitivity;
      }
      onChange(Math.max(min, Math.min(max, newVal)));
    };
    const up = () => setDragging(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [dragging, min, max, onChange, logarithmic]);

  const display = value >= 1000 ? `${(value/1000).toFixed(1)}k` 
    : value >= 100 ? value.toFixed(0)
    : value >= 1 ? value.toFixed(1)
    : value.toFixed(2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, userSelect: 'none' }}>
      <div
        onMouseDown={handleMouseDown}
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: TE.surface,
          border: `2px solid ${TE.borderDark}`,
          position: 'relative',
          cursor: dragging ? 'grabbing' : 'grab',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
        }}
      >
        {/* Indicator dot */}
        <div style={{
          position: 'absolute',
          width: 4,
          height: 4,
          background: color,
          borderRadius: '50%',
          top: 4,
          left: '50%',
          transformOrigin: '0 10px',
          transform: `translateX(-50%) rotate(${rotation}deg)`,
        }} />
      </div>
      <span style={{ fontSize: 8, color: TE.grey, fontWeight: 700, letterSpacing: 0.5 }}>{label}</span>
      <span style={{ fontSize: 9, color: TE.black, fontWeight: 700 }}>{display}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LED INDICATOR
// ═══════════════════════════════════════════════════════════════════════════════

function LED({ on, color = TE.orange }: { on: boolean; color?: string }) {
  return (
    <div style={{
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: on ? color : TE.light,
      boxShadow: on ? `0 0 4px ${color}` : 'none',
    }} />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCOPE DISPLAY (OP-1 style pixel-ish)
// ═══════════════════════════════════════════════════════════════════════════════

function ScopeDisplay({ audioBuffer }: { audioBuffer: AudioBuffer | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = 60;

    // Set canvas size accounting for DPR
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    
    // Scale context for DPR
    ctx.scale(dpr, dpr);

    // TE-style display background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, w, h);

    // Grid lines (subtle)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, h);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(0, h / 2 + 0.5);
    ctx.lineTo(w, h / 2 + 0.5);
    ctx.stroke();

    if (audioBuffer) {
      const data = audioBuffer.getChannelData(0);
      const step = Math.ceil(data.length / w);
      
      ctx.strokeStyle = TE.orange;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const y = (1 - (data[x * step] + 1) / 2) * h;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    } else {
      // Idle - center line
      ctx.strokeStyle = TE.orange;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [audioBuffer]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: 60 }}>
      <canvas 
        ref={canvasRef}
        style={{ borderRadius: 4, display: 'block' }} 
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENVELOPE MINI DISPLAY
// ═══════════════════════════════════════════════════════════════════════════════

function EnvelopeMini({ attack, decay, sustain, release }: { attack: number; decay: number; sustain: number; release: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cssW = 100;
  const cssH = 30;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    ctx.scale(dpr, dpr);

    const w = cssW;
    const h = cssH;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, w, h);

    const total = attack + decay + release + 0.2;
    const scale = w / total;

    ctx.strokeStyle = TE.green;
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(0, h - 2);
    ctx.lineTo(attack * scale, 2);
    ctx.lineTo((attack + decay) * scale, 2 + (1 - sustain) * (h - 4));
    ctx.lineTo((attack + decay + 0.2) * scale, 2 + (1 - sustain) * (h - 4));
    ctx.lineTo(w, h - 2);
    ctx.stroke();
  }, [attack, decay, sustain, release]);

  return <canvas ref={canvasRef} style={{ width: cssW, height: cssH, borderRadius: 2, display: 'block' }} />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUTTON (TE style)
// ═══════════════════════════════════════════════════════════════════════════════

interface TEButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  color?: string;
  small?: boolean;
}

function TEButton({ children, onClick, active, color = TE.orange, small }: TEButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: small ? '4px 8px' : '6px 12px',
        background: active ? color : TE.panel,
        border: `1px solid ${active ? color : TE.border}`,
        borderRadius: 3,
        color: active ? '#fff' : TE.dark,
        fontSize: small ? 9 : 10,
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: active ? 'none' : '0 1px 2px rgba(0,0,0,0.08)',
      }}
    >
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER STRIP
// ═══════════════════════════════════════════════════════════════════════════════

const LAYER_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  oscillator: { icon: '◐', color: TE.orange, label: 'OSC' },
  noise: { icon: '▒', color: TE.pink, label: 'NSE' },
  fm: { icon: '◎', color: TE.cyan, label: 'FM' },
  'karplus-strong': { icon: '◉', color: TE.green, label: 'KS' },
};

interface LayerStripProps {
  layer: any;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (l: any) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function LayerStrip({ layer, index, selected, onSelect, onUpdate, onRemove, canRemove }: LayerStripProps) {
  const cfg = LAYER_CONFIG[layer.type] || LAYER_CONFIG.oscillator;

  return (
    <div 
      onClick={onSelect}
      style={{
        background: selected ? TE.panel : TE.surface,
        border: `1px solid ${selected ? cfg.color : TE.border}`,
        borderRadius: 4,
        padding: 8,
        cursor: 'pointer',
        boxShadow: selected ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: selected ? 10 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ 
            fontSize: 14, 
            color: cfg.color,
            width: 20,
            textAlign: 'center',
          }}>{cfg.icon}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: TE.black }}>{index + 1}</span>
          <span style={{ fontSize: 9, color: TE.grey, fontWeight: 600 }}>{cfg.label}</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={e => e.stopPropagation()}>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={layer.gain}
            onChange={e => onUpdate({ ...layer, gain: parseFloat(e.target.value) })}
            style={{ width: 50, height: 3, accentColor: cfg.color }}
          />
          <span style={{ fontSize: 9, color: TE.dark, width: 28 }}>{(layer.gain * 100).toFixed(0)}%</span>
          {canRemove && (
            <button onClick={onRemove} style={{
              width: 16, height: 16, border: `1px solid ${TE.border}`,
              background: TE.panel, borderRadius: 2, fontSize: 10, color: TE.grey, cursor: 'pointer',
            }}>×</button>
          )}
        </div>
      </div>

      {/* Expanded */}
      {selected && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingTop: 8, borderTop: `1px solid ${TE.border}` }}>
          {layer.type === 'oscillator' && layer.oscillator && (
            <>
              <div>
                <div style={{ fontSize: 8, color: TE.grey, marginBottom: 4, fontWeight: 700 }}>WAVE</div>
                <div style={{ display: 'flex', gap: 2 }}>
                  {['sine', 'square', 'sawtooth', 'triangle'].map(wf => (
                    <TEButton 
                      key={wf} 
                      onClick={() => onUpdate({ ...layer, oscillator: { ...layer.oscillator!, waveform: wf } })}
                      active={layer.oscillator!.waveform === wf}
                      color={cfg.color}
                      small
                    >
                      {wf === 'sine' ? '∿' : wf === 'square' ? '⊓' : wf === 'sawtooth' ? '⋰' : '△'}
                    </TEButton>
                  ))}
                </div>
              </div>
              <MiniKnob value={layer.oscillator!.frequency} min={20} max={20000} onChange={v => onUpdate({ ...layer, oscillator: { ...layer.oscillator!, frequency: v } })} label="FREQ" color={cfg.color} logarithmic />
              <MiniKnob value={layer.oscillator!.detune} min={-100} max={100} onChange={v => onUpdate({ ...layer, oscillator: { ...layer.oscillator!, detune: v } })} label="DETUNE" color={cfg.color} />
            </>
          )}
          {layer.type === 'fm' && layer.fm && (
            <>
              <MiniKnob value={layer.fm!.carrier} min={20} max={20000} onChange={v => onUpdate({ ...layer, fm: { ...layer.fm!, carrier: v } })} label="CARRIER" color={cfg.color} logarithmic />
              <MiniKnob value={layer.fm!.modulator} min={20} max={20000} onChange={v => onUpdate({ ...layer, fm: { ...layer.fm!, modulator: v } })} label="MOD" color={cfg.color} logarithmic />
              <MiniKnob value={layer.fm!.modulationIndex} min={0} max={1000} onChange={v => onUpdate({ ...layer, fm: { ...layer.fm!, modulationIndex: v } })} label="INDEX" color={cfg.color} />
            </>
          )}
          {layer.type === 'karplus-strong' && layer.karplus && (
            <>
              <MiniKnob value={layer.karplus!.frequency} min={20} max={20000} onChange={v => onUpdate({ ...layer, karplus: { ...layer.karplus!, frequency: v } })} label="FREQ" color={cfg.color} logarithmic />
              <MiniKnob value={layer.karplus!.damping} min={0} max={1} onChange={v => onUpdate({ ...layer, karplus: { ...layer.karplus!, damping: v } })} label="DAMP" color={cfg.color} />
            </>
          )}
          {layer.type === 'noise' && layer.noise && (
            <div>
              <div style={{ fontSize: 8, color: TE.grey, marginBottom: 4, fontWeight: 700 }}>TYPE</div>
              <div style={{ display: 'flex', gap: 2 }}>
                {['white', 'pink', 'brown'].map(t => (
                  <TEButton key={t} onClick={() => onUpdate({ ...layer, noise: { type: t } })} active={layer.noise!.type === t} color={cfg.color} small>
                    {t.charAt(0).toUpperCase()}
                  </TEButton>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EFFECT MODULE
// ═══════════════════════════════════════════════════════════════════════════════

interface EffectModuleProps {
  name: string;
  enabled: boolean;
  onToggle: () => void;
  color: string;
  children: React.ReactNode;
}

function EffectModule({ name, enabled, onToggle, color, children }: EffectModuleProps) {
  return (
    <div style={{
      background: TE.panel,
      border: `1px solid ${enabled ? color : TE.border}`,
      borderRadius: 4,
      padding: 8,
      opacity: enabled ? 1 : 0.5,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: enabled ? 8 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <LED on={enabled} color={color} />
          <span style={{ fontSize: 9, fontWeight: 700, color: enabled ? TE.black : TE.grey }}>{name}</span>
        </div>
        <button
          onClick={onToggle}
          style={{
            width: 32,
            height: 16,
            background: enabled ? color : TE.surface,
            border: `1px solid ${enabled ? color : TE.border}`,
            borderRadius: 8,
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          <div style={{
            width: 12,
            height: 12,
            background: '#fff',
            borderRadius: '50%',
            position: 'absolute',
            top: 1,
            left: enabled ? 17 : 1,
            transition: 'left 0.15s',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }} />
        </button>
      </div>
      {enabled && <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>{children}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

export default function SynthPrototypeE() {
  const {
    config, playing, exporting, error,
    updateLayer, addLayer, removeLayer,
    updateEnvelope, updateFilter, updateEffects, updateDuration,
    play, exportWav,
  } = useSynthState();

  const [selectedLayer, setSelectedLayer] = useState(0);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  useEffect(() => {
    const gen = async () => {
      try { setAudioBuffer(await synthesizeSound(config)); } catch {}
    };
    const t = setTimeout(gen, 200);
    return () => clearTimeout(t);
  }, [config]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: TE.bg,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
    }}>
      {/* HEADER */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        background: TE.panel,
        borderBottom: `1px solid ${TE.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ 
            width: 32, height: 32, 
            background: TE.orange, 
            borderRadius: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 900, fontSize: 14,
          }}>
            SE
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: TE.black, letterSpacing: 1 }}>SYNTH ENGINE</div>
            <div style={{ fontSize: 9, color: TE.grey }}>prototype e</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={play}
            disabled={playing}
            style={{
              padding: '8px 16px',
              background: playing ? TE.surface : TE.orange,
              border: 'none',
              borderRadius: 4,
              color: playing ? TE.grey : '#fff',
              fontSize: 10,
              fontWeight: 700,
              cursor: playing ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span style={{ fontSize: 8 }}>{playing ? '■' : '▶'}</span>
            {playing ? 'PLAYING' : 'PLAY'}
          </button>
          <button
            onClick={exportWav}
            disabled={exporting}
            style={{
              padding: '8px 16px',
              background: TE.panel,
              border: `1px solid ${TE.green}`,
              borderRadius: 4,
              color: TE.green,
              fontSize: 10,
              fontWeight: 700,
              cursor: exporting ? 'not-allowed' : 'pointer',
              opacity: exporting ? 0.5 : 1,
            }}
          >
            ↓ EXPORT
          </button>
        </div>
      </header>

      {error && (
        <div style={{ padding: '8px 16px', background: '#fff3f3', borderBottom: `1px solid #ffcccc`, color: '#cc0000', fontSize: 10 }}>
          {error}
        </div>
      )}

      {/* MAIN CONTENT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, padding: 16, maxWidth: 1100, margin: '0 auto' }}>
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* DISPLAY PANEL */}
          <div style={{ 
            background: TE.panel, 
            borderRadius: 6, 
            padding: 12,
            border: `1px solid ${TE.border}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 9, color: TE.grey, fontWeight: 700, letterSpacing: 1 }}>WAVEFORM</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 9, color: TE.grey }}>DUR</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: TE.orange }}>{config.timing.duration.toFixed(2)}s</span>
              </div>
            </div>
            <ScopeDisplay audioBuffer={audioBuffer} />
            <input
              type="range"
              min={0.1}
              max={10}
              step={0.1}
              value={config.timing.duration}
              onChange={e => updateDuration(parseFloat(e.target.value))}
              style={{ width: '100%', height: 4, marginTop: 8, accentColor: TE.orange }}
            />
          </div>

          {/* LAYERS */}
          <div style={{ background: TE.panel, borderRadius: 6, padding: 12, border: `1px solid ${TE.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 9, color: TE.grey, fontWeight: 700, letterSpacing: 1 }}>LAYERS</span>
              {config.synthesis.layers.length < 8 && (
                <div style={{ display: 'flex', gap: 4 }}>
                  {Object.entries(LAYER_CONFIG).map(([type, cfg]) => (
                    <button
                      key={type}
                      onClick={() => addLayer(type as any)}
                      style={{
                        width: 22, height: 22,
                        background: TE.surface,
                        border: `1px solid ${cfg.color}40`,
                        borderRadius: 3,
                        color: cfg.color,
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                      title={`Add ${cfg.label}`}
                    >
                      +
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {config.synthesis.layers.map((layer, i) => (
                <LayerStrip
                  key={i}
                  layer={layer}
                  index={i}
                  selected={selectedLayer === i}
                  onSelect={() => setSelectedLayer(i)}
                  onUpdate={l => updateLayer(i, l)}
                  onRemove={() => removeLayer(i)}
                  canRemove={config.synthesis.layers.length > 1}
                />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* ENVELOPE */}
          <div style={{ background: TE.panel, borderRadius: 6, padding: 12, border: `1px solid ${TE.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 9, color: TE.grey, fontWeight: 700, letterSpacing: 1 }}>ENVELOPE</span>
              <EnvelopeMini {...config.envelope} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <MiniKnob value={config.envelope.attack * 1000} min={1} max={2000} onChange={v => updateEnvelope({ ...config.envelope, attack: v / 1000 })} label="ATK" color={TE.green} />
              <MiniKnob value={config.envelope.decay * 1000} min={1} max={2000} onChange={v => updateEnvelope({ ...config.envelope, decay: v / 1000 })} label="DEC" color={TE.green} />
              <MiniKnob value={config.envelope.sustain} min={0} max={1} onChange={v => updateEnvelope({ ...config.envelope, sustain: v })} label="SUS" color={TE.green} />
              <MiniKnob value={config.envelope.release * 1000} min={1} max={5000} onChange={v => updateEnvelope({ ...config.envelope, release: v / 1000 })} label="REL" color={TE.green} />
            </div>
          </div>

          {/* FILTER */}
          <div style={{ 
            background: TE.panel, 
            borderRadius: 6, 
            padding: 12, 
            border: `1px solid ${config.filter ? TE.cyan : TE.border}`,
            opacity: config.filter ? 1 : 0.6,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: config.filter ? 10 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <LED on={!!config.filter} color={TE.cyan} />
                <span style={{ fontSize: 9, color: TE.grey, fontWeight: 700, letterSpacing: 1 }}>FILTER</span>
              </div>
              <button
                onClick={() => config.filter ? updateFilter(undefined) : updateFilter({ type: 'lowpass', frequency: 2000, q: 1 })}
                style={{
                  width: 32, height: 16,
                  background: config.filter ? TE.cyan : TE.surface,
                  border: `1px solid ${config.filter ? TE.cyan : TE.border}`,
                  borderRadius: 8, cursor: 'pointer', position: 'relative',
                }}
              >
                <div style={{
                  width: 12, height: 12, background: '#fff', borderRadius: '50%',
                  position: 'absolute', top: 1, left: config.filter ? 17 : 1,
                  transition: 'left 0.15s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                }} />
              </button>
            </div>
            {config.filter && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {['lowpass', 'highpass', 'bandpass', 'notch'].map(t => (
                    <TEButton key={t} onClick={() => updateFilter({ ...config.filter!, type: t as any })} active={config.filter!.type === t} color={TE.cyan} small>
                      {t.slice(0, 2).toUpperCase()}
                    </TEButton>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 12, flex: 1, justifyContent: 'center' }}>
                  <MiniKnob value={config.filter.frequency} min={20} max={20000} onChange={v => updateFilter({ ...config.filter!, frequency: v })} label="CUTOFF" color={TE.cyan} logarithmic />
                  <MiniKnob value={config.filter.q} min={0.1} max={20} onChange={v => updateFilter({ ...config.filter!, q: v })} label="RES" color={TE.cyan} />
                </div>
              </div>
            )}
          </div>

          {/* EFFECTS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 9, color: TE.grey, fontWeight: 700, letterSpacing: 1 }}>EFFECTS</span>
            
            <EffectModule name="REVERB" enabled={!!config.effects.reverb} onToggle={() => config.effects.reverb ? updateEffects({ ...config.effects, reverb: undefined }) : updateEffects({ ...config.effects, reverb: { decay: 2, damping: 0.5, mix: 0.3 } })} color={TE.pink}>
              <MiniKnob value={config.effects.reverb?.decay || 2} min={0.1} max={10} onChange={v => updateEffects({ ...config.effects, reverb: { ...config.effects.reverb!, decay: v } })} label="DECAY" color={TE.pink} />
              <MiniKnob value={config.effects.reverb?.mix || 0.3} min={0} max={1} onChange={v => updateEffects({ ...config.effects, reverb: { ...config.effects.reverb!, mix: v } })} label="MIX" color={TE.pink} />
            </EffectModule>

            <EffectModule name="DELAY" enabled={!!config.effects.delay} onToggle={() => config.effects.delay ? updateEffects({ ...config.effects, delay: undefined }) : updateEffects({ ...config.effects, delay: { time: 0.25, feedback: 0.5, mix: 0.3 } })} color={TE.cyan}>
              <MiniKnob value={(config.effects.delay?.time || 0.25) * 1000} min={10} max={2000} onChange={v => updateEffects({ ...config.effects, delay: { ...config.effects.delay!, time: v / 1000 } })} label="TIME" color={TE.cyan} />
              <MiniKnob value={config.effects.delay?.feedback || 0.5} min={0} max={0.95} onChange={v => updateEffects({ ...config.effects, delay: { ...config.effects.delay!, feedback: v } })} label="FB" color={TE.cyan} />
            </EffectModule>

            <EffectModule name="DISTORT" enabled={!!config.effects.distortion} onToggle={() => config.effects.distortion ? updateEffects({ ...config.effects, distortion: undefined }) : updateEffects({ ...config.effects, distortion: { type: 'soft', amount: 0.5, mix: 0.5 } })} color={TE.orange}>
              <MiniKnob value={config.effects.distortion?.amount || 0.5} min={0} max={1} onChange={v => updateEffects({ ...config.effects, distortion: { ...config.effects.distortion!, amount: v } })} label="DRIVE" color={TE.orange} />
              <MiniKnob value={config.effects.distortion?.mix || 0.5} min={0} max={1} onChange={v => updateEffects({ ...config.effects, distortion: { ...config.effects.distortion!, mix: v } })} label="MIX" color={TE.orange} />
            </EffectModule>

            <EffectModule name="COMPRESS" enabled={!!config.effects.compressor} onToggle={() => config.effects.compressor ? updateEffects({ ...config.effects, compressor: undefined }) : updateEffects({ ...config.effects, compressor: { threshold: -20, ratio: 4, attack: 0.003, release: 0.25, knee: 30 } })} color={TE.yellow}>
              <MiniKnob value={config.effects.compressor?.threshold || -20} min={-60} max={0} onChange={v => updateEffects({ ...config.effects, compressor: { ...config.effects.compressor!, threshold: v } })} label="THRS" color={TE.yellow} />
              <MiniKnob value={config.effects.compressor?.ratio || 4} min={1} max={20} onChange={v => updateEffects({ ...config.effects, compressor: { ...config.effects.compressor!, ratio: v } })} label="RATIO" color={TE.yellow} />
            </EffectModule>
          </div>
        </div>
      </div>
    </div>
  );
}
