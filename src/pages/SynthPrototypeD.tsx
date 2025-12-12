/**
 * SynthPrototypeD - Ultra-compact single-screen design
 * Everything visible, clearly organized: Layers | Global | Effects
 */

import { useSynthState } from '../components/synth-prototypes/shared';
import { DialC } from '../components/synth-prototypes/prototype-c/DialC';
import { WaveformSelector } from '../components/synth-prototypes/prototype-c/WaveformSelector';

export default function SynthPrototypeD() {
  const {
    config,
    playing,
    exporting,
    error,
    updateLayer,
    addLayer,
    removeLayer,
    updateEnvelope,
    updateFilter,
    updateLFO,
    updateEffects,
    updateDuration,
    play,
    exportWav,
  } = useSynthState();

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>Prototype D</h1>
        <div style={styles.headerControls}>
          <button onClick={play} disabled={playing} style={playing ? styles.playButtonDisabled : styles.playButton}>
            {playing ? '▶ Playing' : '▶ Play'}
          </button>
          <button onClick={exportWav} disabled={exporting} style={exporting ? styles.exportButtonDisabled : styles.exportButton}>
            {exporting ? '⬇ Export' : '⬇ Export'}
          </button>
        </div>
      </header>

      {error && <div style={styles.error}>{error}</div>}

      {/* Main Grid: Layers | Global | Effects */}
      <main style={styles.main}>
        {/* LEFT: LAYERS */}
        <section style={styles.column}>
          <h2 style={styles.columnTitle}>LAYERS</h2>
          <div style={styles.layersContainer}>
            {config.synthesis.layers.map((layer, index) => (
              <div key={index} style={styles.layer}>
                {/* Layer Header */}
                <div style={styles.layerHeader}>
                  <span style={styles.layerLabel}>
                    {layer.type === 'oscillator' ? 'OSC' : layer.type === 'fm' ? 'FM' : layer.type === 'karplus-strong' ? 'KS' : 'NOISE'}
                  </span>
                  <DialC label="Gain" value={layer.gain} min={0} max={1} step={0.01}
                    onChange={(val) => updateLayer(index, { ...layer, gain: val })} />
                  {config.synthesis.layers.length > 1 && (
                    <button onClick={() => removeLayer(index)} style={styles.removeBtn}>×</button>
                  )}
                </div>

                {/* Layer Content: Source + Env + Filt + Sat */}
                <div style={styles.layerGrid}>
                  {/* Source */}
                  {layer.type === 'oscillator' && layer.oscillator && (
                    <>
                      <WaveformSelector value={layer.oscillator.waveform}
                        onChange={(waveform) => updateLayer(index, { ...layer, oscillator: { ...layer.oscillator!, waveform } })} />
                      <DialC label="Freq" value={layer.oscillator.frequency} min={20} max={20000} step={1} unit="Hz"
                        onChange={(val) => updateLayer(index, { ...layer, oscillator: { ...layer.oscillator!, frequency: val } })} />
                      <DialC label="Det" value={layer.oscillator.detune} min={-100} max={100} step={1} unit="¢"
                        onChange={(val) => updateLayer(index, { ...layer, oscillator: { ...layer.oscillator!, detune: val } })} />
                    </>
                  )}
                  {layer.type === 'fm' && layer.fm && (
                    <>
                      <DialC label="Car" value={layer.fm.carrier} min={20} max={20000} step={1} unit="Hz"
                        onChange={(val) => updateLayer(index, { ...layer, fm: { ...layer.fm!, carrier: val } })} />
                      <DialC label="Mod" value={layer.fm.modulator} min={20} max={20000} step={1} unit="Hz"
                        onChange={(val) => updateLayer(index, { ...layer, fm: { ...layer.fm!, modulator: val } })} />
                      <DialC label="Idx" value={layer.fm.modulationIndex} min={0} max={1000} step={1}
                        onChange={(val) => updateLayer(index, { ...layer, fm: { ...layer.fm!, modulationIndex: val } })} />
                    </>
                  )}
                  {layer.type === 'karplus-strong' && layer.karplus && (
                    <>
                      <DialC label="Freq" value={layer.karplus.frequency} min={20} max={20000} step={1} unit="Hz"
                        onChange={(val) => updateLayer(index, { ...layer, karplus: { ...layer.karplus!, frequency: val } })} />
                      <DialC label="Damp" value={layer.karplus.damping} min={0} max={1} step={0.01}
                        onChange={(val) => updateLayer(index, { ...layer, karplus: { ...layer.karplus!, damping: val } })} />
                    </>
                  )}
                  {layer.type === 'noise' && layer.noise && (
                    <select value={layer.noise.type}
                      onChange={(e) => updateLayer(index, { ...layer, noise: { type: e.target.value as any } })}
                      style={styles.select}>
                      <option value="white">White</option>
                      <option value="pink">Pink</option>
                      <option value="brown">Brown</option>
                    </select>
                  )}

                  {/* Envelope */}
                  <DialC label="A" value={layer.envelope?.attack || 0.01} min={0.001} max={2} step={0.001} unit="s"
                    onChange={(val) => updateLayer(index, { ...layer, envelope: { ...(layer.envelope || { decay: 0.1, sustain: 0.5, release: 0.3 }), attack: val } })} />
                  <DialC label="D" value={layer.envelope?.decay || 0.1} min={0.001} max={2} step={0.001} unit="s"
                    onChange={(val) => updateLayer(index, { ...layer, envelope: { ...(layer.envelope || { attack: 0.01, sustain: 0.5, release: 0.3 }), decay: val } })} />
                  <DialC label="S" value={layer.envelope?.sustain || 0.5} min={0} max={1} step={0.01}
                    onChange={(val) => updateLayer(index, { ...layer, envelope: { ...(layer.envelope || { attack: 0.01, decay: 0.1, release: 0.3 }), sustain: val } })} />
                  <DialC label="R" value={layer.envelope?.release || 0.3} min={0.001} max={5} step={0.001} unit="s"
                    onChange={(val) => updateLayer(index, { ...layer, envelope: { ...(layer.envelope || { attack: 0.01, decay: 0.1, sustain: 0.5 }), release: val } })} />

                  {/* Filter */}
                  <select value={layer.filter?.type || 'lowpass'}
                    onChange={(e) => updateLayer(index, { ...layer, filter: { ...(layer.filter || { frequency: 20000, q: 1 }), type: e.target.value as any } })}
                    style={styles.select}>
                    <option value="lowpass">LP</option>
                    <option value="highpass">HP</option>
                    <option value="bandpass">BP</option>
                    <option value="notch">Notch</option>
                  </select>
                  <DialC label="Cut" value={layer.filter?.frequency || 20000} min={20} max={20000} step={1} unit="Hz"
                    onChange={(val) => updateLayer(index, { ...layer, filter: { ...(layer.filter || { type: 'lowpass', q: 1 }), frequency: val } })} />
                  <DialC label="Q" value={layer.filter?.q || 1} min={0.0001} max={100} step={0.1}
                    onChange={(val) => updateLayer(index, { ...layer, filter: { ...(layer.filter || { type: 'lowpass', frequency: 20000 }), q: val } })} />

                  {/* Saturation */}
                  <select value={layer.saturation?.type || 'soft'}
                    onChange={(e) => updateLayer(index, { ...layer, saturation: { ...(layer.saturation || { drive: 0, mix: 0 }), type: e.target.value as any } })}
                    style={styles.select}>
                    <option value="soft">Soft</option>
                    <option value="hard">Hard</option>
                    <option value="tube">Tube</option>
                    <option value="tape">Tape</option>
                  </select>
                  <DialC label="Drive" value={layer.saturation?.drive || 0} min={0} max={10} step={0.1}
                    onChange={(val) => updateLayer(index, { ...layer, saturation: { ...(layer.saturation || { type: 'soft', mix: 0 }), drive: val } })} />
                  <DialC label="Mix" value={layer.saturation?.mix || 0} min={0} max={1} step={0.01}
                    onChange={(val) => updateLayer(index, { ...layer, saturation: { ...(layer.saturation || { type: 'soft', drive: 0 }), mix: val } })} />
                </div>

                {/* Layer LFO */}
                <div style={styles.layerLfo}>
                  <div style={styles.lfoHeader}>
                    <span style={styles.lfoLabel}>LFO</span>
                    <button onClick={() => updateLayer(index, { ...layer, lfo: layer.lfo ? undefined : { waveform: 'sine', frequency: 5, depth: 0.5, target: 'pitch' } })}
                      style={layer.lfo ? styles.lfoOnBtn : styles.lfoOffBtn}>{layer.lfo ? 'ON' : 'OFF'}</button>
                  </div>
                  {layer.lfo && (
                    <div style={styles.lfoGrid}>
                      <select value={layer.lfo.waveform} onChange={(e) => updateLayer(index, { ...layer, lfo: { ...layer.lfo!, waveform: e.target.value as any } })} style={styles.select}>
                        <option value="sine">~</option>
                        <option value="square">⊓</option>
                        <option value="sawtooth">/</option>
                        <option value="triangle">△</option>
                      </select>
                      <select value={layer.lfo.target} onChange={(e) => updateLayer(index, { ...layer, lfo: { ...layer.lfo!, target: e.target.value as any } })} style={styles.select}>
                        <option value="pitch">Pitch</option>
                        <option value="filter">Filt</option>
                        <option value="amplitude">Amp</option>
                        <option value="pan">Pan</option>
                      </select>
                      <DialC label="Rate" value={layer.lfo.frequency} min={0.01} max={20} step={0.01} unit="Hz"
                        onChange={(val) => updateLayer(index, { ...layer, lfo: { ...layer.lfo!, frequency: val } })} />
                      <DialC label="Depth" value={layer.lfo.depth} min={0} max={1} step={0.01}
                        onChange={(val) => updateLayer(index, { ...layer, lfo: { ...layer.lfo!, depth: val } })} />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Add Layer Buttons */}
            {config.synthesis.layers.length < 8 && (
              <div style={styles.addButtons}>
                <button onClick={() => addLayer('oscillator')} style={styles.addBtn}>+OSC</button>
                <button onClick={() => addLayer('noise')} style={styles.addBtn}>+NOISE</button>
                <button onClick={() => addLayer('fm')} style={styles.addBtn}>+FM</button>
                <button onClick={() => addLayer('karplus-strong')} style={styles.addBtn}>+KS</button>
              </div>
            )}
          </div>
        </section>

        {/* CENTER: GLOBAL */}
        <section style={styles.column}>
          <h2 style={styles.columnTitle}>GLOBAL</h2>
          <div style={styles.globalContainer}>
            {/* Duration */}
            <div style={styles.box}>
              <span style={styles.boxLabel}>TIMING</span>
              <DialC label="Dur" value={config.timing.duration} min={0.1} max={10} step={0.1} unit="s" onChange={updateDuration} />
            </div>

            {/* Envelope */}
            <div style={styles.box}>
              <span style={styles.boxLabel}>ENVELOPE</span>
              <div style={styles.boxGrid}>
                <DialC label="A" value={config.envelope.attack} min={0.001} max={2} step={0.001} unit="s"
                  onChange={(val) => updateEnvelope({ ...config.envelope, attack: val })} />
                <DialC label="D" value={config.envelope.decay} min={0.001} max={2} step={0.001} unit="s"
                  onChange={(val) => updateEnvelope({ ...config.envelope, decay: val })} />
                <DialC label="S" value={config.envelope.sustain} min={0} max={1} step={0.01}
                  onChange={(val) => updateEnvelope({ ...config.envelope, sustain: val })} />
                <DialC label="R" value={config.envelope.release} min={0.001} max={5} step={0.001} unit="s"
                  onChange={(val) => updateEnvelope({ ...config.envelope, release: val })} />
              </div>
            </div>

            {/* Filter */}
            <div style={styles.box}>
              <div style={styles.boxHeader}>
                <span style={styles.boxLabel}>FILTER</span>
                <button onClick={() => config.filter ? updateFilter(undefined) : updateFilter({ type: 'lowpass', frequency: 1000, q: 1 })}
                  style={config.filter ? styles.onBtn : styles.offBtn}>{config.filter ? 'ON' : 'OFF'}</button>
              </div>
              {config.filter && (
                <div style={styles.boxGrid}>
                  <select value={config.filter.type} onChange={(e) => updateFilter({ ...config.filter!, type: e.target.value as any })} style={styles.select}>
                    <option value="lowpass">LP</option>
                    <option value="highpass">HP</option>
                    <option value="bandpass">BP</option>
                    <option value="notch">Notch</option>
                  </select>
                  <DialC label="Cut" value={config.filter.frequency} min={20} max={20000} step={1} unit="Hz"
                    onChange={(val) => updateFilter({ ...config.filter!, frequency: val })} />
                  <DialC label="Q" value={config.filter.q} min={0.0001} max={100} step={0.1}
                    onChange={(val) => updateFilter({ ...config.filter!, q: val })} />
                </div>
              )}
            </div>

            {/* Dynamics */}
            <div style={styles.box}>
              <span style={styles.boxLabel}>DYNAMICS</span>
              <div style={styles.boxGrid}>
                <DialC label="Vel" value={config.dynamics.velocity} min={0} max={1} step={0.01}
                  onChange={(val) => { const newConfig = { ...config }; newConfig.dynamics.velocity = val; updateLayer(0, config.synthesis.layers[0]); }} />
                <label style={styles.checkbox}>
                  <input type="checkbox" checked={config.dynamics.normalize}
                    onChange={(e) => { const newConfig = { ...config }; newConfig.dynamics.normalize = e.target.checked; updateLayer(0, config.synthesis.layers[0]); }} />
                  <span style={styles.checkboxText}>Norm</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT: EFFECTS */}
        <section style={styles.column}>
          <h2 style={styles.columnTitle}>EFFECTS</h2>
          <div style={styles.effectsContainer}>
            {/* LFO */}
            <div style={styles.box}>
              <div style={styles.boxHeader}>
                <span style={styles.boxLabel}>LFO</span>
                <button onClick={() => config.lfo ? updateLFO(undefined) : updateLFO({ waveform: 'sine', frequency: 5, depth: 0.5, target: 'pitch' })}
                  style={config.lfo ? styles.onBtn : styles.offBtn}>{config.lfo ? 'ON' : 'OFF'}</button>
              </div>
              {config.lfo && (
                <div style={styles.boxGrid}>
                  <select value={config.lfo.waveform} onChange={(e) => updateLFO({ ...config.lfo!, waveform: e.target.value as any })} style={styles.select}>
                    <option value="sine">Sine</option>
                    <option value="square">Square</option>
                    <option value="sawtooth">Saw</option>
                    <option value="triangle">Tri</option>
                  </select>
                  <select value={config.lfo.target} onChange={(e) => updateLFO({ ...config.lfo!, target: e.target.value as any })} style={styles.select}>
                    <option value="pitch">Pitch</option>
                    <option value="filter">Filter</option>
                    <option value="amplitude">Amp</option>
                    <option value="pan">Pan</option>
                  </select>
                  <DialC label="Rate" value={config.lfo.frequency} min={0.01} max={20} step={0.01} unit="Hz"
                    onChange={(val) => updateLFO({ ...config.lfo!, frequency: val })} />
                  <DialC label="Depth" value={config.lfo.depth} min={0} max={1} step={0.01}
                    onChange={(val) => updateLFO({ ...config.lfo!, depth: val })} />
                </div>
              )}
            </div>

            {/* Reverb */}
            <div style={styles.box}>
              <div style={styles.boxHeader}>
                <span style={styles.boxLabel}>REVERB</span>
                <button onClick={() => config.effects.reverb ? updateEffects({ ...config.effects, reverb: undefined }) : updateEffects({ ...config.effects, reverb: { decay: 2, damping: 0.5, mix: 0.3 } })}
                  style={config.effects.reverb ? styles.onBtn : styles.offBtn}>{config.effects.reverb ? 'ON' : 'OFF'}</button>
              </div>
              {config.effects.reverb && (
                <div style={styles.boxGrid}>
                  <DialC label="Decay" value={config.effects.reverb.decay} min={0.1} max={10} step={0.1} unit="s"
                    onChange={(val) => updateEffects({ ...config.effects, reverb: { ...config.effects.reverb!, decay: val } })} />
                  <DialC label="Damp" value={config.effects.reverb.damping} min={0} max={1} step={0.01}
                    onChange={(val) => updateEffects({ ...config.effects, reverb: { ...config.effects.reverb!, damping: val } })} />
                  <DialC label="Mix" value={config.effects.reverb.mix} min={0} max={1} step={0.01}
                    onChange={(val) => updateEffects({ ...config.effects, reverb: { ...config.effects.reverb!, mix: val } })} />
                </div>
              )}
            </div>

            {/* Delay */}
            <div style={styles.box}>
              <div style={styles.boxHeader}>
                <span style={styles.boxLabel}>DELAY</span>
                <button onClick={() => config.effects.delay ? updateEffects({ ...config.effects, delay: undefined }) : updateEffects({ ...config.effects, delay: { time: 0.25, feedback: 0.5, mix: 0.3 } })}
                  style={config.effects.delay ? styles.onBtn : styles.offBtn}>{config.effects.delay ? 'ON' : 'OFF'}</button>
              </div>
              {config.effects.delay && (
                <div style={styles.boxGrid}>
                  <DialC label="Time" value={config.effects.delay.time} min={0.01} max={2} step={0.01} unit="s"
                    onChange={(val) => updateEffects({ ...config.effects, delay: { ...config.effects.delay!, time: val } })} />
                  <DialC label="Fdbk" value={config.effects.delay.feedback} min={0} max={0.95} step={0.01}
                    onChange={(val) => updateEffects({ ...config.effects, delay: { ...config.effects.delay!, feedback: val } })} />
                  <DialC label="Mix" value={config.effects.delay.mix} min={0} max={1} step={0.01}
                    onChange={(val) => updateEffects({ ...config.effects, delay: { ...config.effects.delay!, mix: val } })} />
                </div>
              )}
            </div>

            {/* Distortion */}
            <div style={styles.box}>
              <div style={styles.boxHeader}>
                <span style={styles.boxLabel}>DISTORTION</span>
                <button onClick={() => config.effects.distortion ? updateEffects({ ...config.effects, distortion: undefined }) : updateEffects({ ...config.effects, distortion: { type: 'soft', amount: 0.5, mix: 0.5 } })}
                  style={config.effects.distortion ? styles.onBtn : styles.offBtn}>{config.effects.distortion ? 'ON' : 'OFF'}</button>
              </div>
              {config.effects.distortion && (
                <div style={styles.boxGrid}>
                  <select value={config.effects.distortion.type} onChange={(e) => updateEffects({ ...config.effects, distortion: { ...config.effects.distortion!, type: e.target.value as any } })} style={styles.select}>
                    <option value="soft">Soft</option>
                    <option value="hard">Hard</option>
                    <option value="fuzz">Fuzz</option>
                  </select>
                  <DialC label="Amt" value={config.effects.distortion.amount} min={0} max={1} step={0.01}
                    onChange={(val) => updateEffects({ ...config.effects, distortion: { ...config.effects.distortion!, amount: val } })} />
                  <DialC label="Mix" value={config.effects.distortion.mix} min={0} max={1} step={0.01}
                    onChange={(val) => updateEffects({ ...config.effects, distortion: { ...config.effects.distortion!, mix: val } })} />
                </div>
              )}
            </div>

            {/* Compressor */}
            <div style={styles.box}>
              <div style={styles.boxHeader}>
                <span style={styles.boxLabel}>COMPRESSOR</span>
                <button onClick={() => config.effects.compressor ? updateEffects({ ...config.effects, compressor: undefined }) : updateEffects({ ...config.effects, compressor: { threshold: -20, ratio: 4, attack: 0.003, release: 0.25, knee: 30 } })}
                  style={config.effects.compressor ? styles.onBtn : styles.offBtn}>{config.effects.compressor ? 'ON' : 'OFF'}</button>
              </div>
              {config.effects.compressor && (
                <div style={styles.boxGrid}>
                  <DialC label="Thr" value={config.effects.compressor.threshold} min={-60} max={0} step={1} unit="dB"
                    onChange={(val) => updateEffects({ ...config.effects, compressor: { ...config.effects.compressor!, threshold: val } })} />
                  <DialC label="Ratio" value={config.effects.compressor.ratio} min={1} max={20} step={0.1}
                    onChange={(val) => updateEffects({ ...config.effects, compressor: { ...config.effects.compressor!, ratio: val } })} />
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: '#0a0a0a', color: '#e0e0e0' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#1a1a1a', borderBottom: '1px solid #ff8c42' },
  title: { margin: 0, fontSize: '12px', fontWeight: 700, color: '#ff8c42', letterSpacing: '1px' },
  headerControls: { display: 'flex', gap: '8px' },
  playButton: { padding: '4px 12px', background: '#ff8c42', border: '1px solid #ff8c42', borderRadius: '2px', color: '#0a0a0a', fontSize: '9px', fontWeight: 700, cursor: 'pointer' },
  playButtonDisabled: { padding: '4px 12px', background: '#ff8c42', border: '1px solid #ff8c42', borderRadius: '2px', color: '#0a0a0a', fontSize: '9px', fontWeight: 700, cursor: 'not-allowed', opacity: 0.5 },
  exportButton: { padding: '4px 12px', background: '#2a2a2a', border: '1px solid #4a4a4a', borderRadius: '2px', color: '#e0e0e0', fontSize: '9px', fontWeight: 700, cursor: 'pointer' },
  exportButtonDisabled: { padding: '4px 12px', background: '#2a2a2a', border: '1px solid #4a4a4a', borderRadius: '2px', color: '#e0e0e0', fontSize: '9px', fontWeight: 700, cursor: 'not-allowed', opacity: 0.5 },
  error: { margin: '6px', padding: '4px 8px', background: '#3a1a1a', color: '#ff6b6b', borderRadius: '2px', fontSize: '9px' },
  main: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '6px', padding: '6px' },
  column: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '3px', padding: '6px' },
  columnTitle: { margin: '0 0 6px 0', fontSize: '9px', fontWeight: 700, color: '#ff8c42', letterSpacing: '0.5px', textAlign: 'center' as const },
  layersContainer: { display: 'flex', flexDirection: 'column' as const, gap: '4px' },
  layer: { background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: '2px', padding: '4px' },
  layerHeader: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', paddingBottom: '4px', borderBottom: '1px solid #2a2a2a' },
  layerLabel: { fontSize: '8px', fontWeight: 700, color: '#ff8c42', minWidth: '35px' },
  removeBtn: { marginLeft: 'auto', padding: '2px 5px', background: '#3a1a1a', border: '1px solid #5a2a2a', borderRadius: '2px', color: '#ff6b6b', fontSize: '10px', fontWeight: 700, cursor: 'pointer', lineHeight: 1 },
  layerGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(45px, 1fr))', gap: '3px', alignItems: 'center' },
  addButtons: { display: 'flex', gap: '3px', marginTop: '4px' },
  addBtn: { flex: 1, padding: '3px 6px', background: '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: '2px', color: '#e0e0e0', fontSize: '7px', fontWeight: 700, cursor: 'pointer' },
  globalContainer: { display: 'flex', flexDirection: 'column' as const, gap: '6px' },
  effectsContainer: { display: 'flex', flexDirection: 'column' as const, gap: '6px' },
  box: { background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: '2px', padding: '4px' },
  boxHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
  boxLabel: { fontSize: '7px', fontWeight: 700, color: '#ff8c42', letterSpacing: '0.5px' },
  boxGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(45px, 1fr))', gap: '3px', alignItems: 'center' },
  onBtn: { padding: '2px 6px', background: '#2a5a2a', border: '1px solid #4ade80', borderRadius: '2px', color: '#fff', fontSize: '7px', fontWeight: 700, cursor: 'pointer' },
  offBtn: { padding: '2px 6px', background: '#1a3a1a', border: '1px solid #2a5a2a', borderRadius: '2px', color: '#4ade80', fontSize: '7px', fontWeight: 700, cursor: 'pointer' },
  select: { padding: '2px 3px', background: '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: '2px', color: '#aaa', fontSize: '7px', fontWeight: 600, cursor: 'pointer', outline: 'none' },
  checkbox: { display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' },
  checkboxText: { fontSize: '7px', fontWeight: 600, color: '#e0e0e0' },
  layerLfo: { marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #2a2a2a' },
  lfoHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' },
  lfoLabel: { fontSize: '7px', fontWeight: 700, color: '#888', letterSpacing: '0.5px' },
  lfoOnBtn: { padding: '1px 4px', background: '#2a5a2a', border: '1px solid #4ade80', borderRadius: '2px', color: '#fff', fontSize: '6px', fontWeight: 700, cursor: 'pointer' },
  lfoOffBtn: { padding: '1px 4px', background: '#1a3a1a', border: '1px solid #2a5a2a', borderRadius: '2px', color: '#4ade80', fontSize: '6px', fontWeight: 700, cursor: 'pointer' },
  lfoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(45px, 1fr))', gap: '3px', alignItems: 'center' },
};
