/**
 * SynthPrototypeC - Hardware-inspired single-screen layout
 * Features: all controls visible, grouped panels, no tabs, workflow-optimized
 */

import { useSynthState } from '../components/synth-prototypes/shared';
import { DialC } from '../components/synth-prototypes/prototype-c/DialC';
import { WaveformSelector } from '../components/synth-prototypes/prototype-c/WaveformSelector';

export default function SynthPrototypeC() {
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
      <header style={styles.header}>
        <h1 style={styles.title}>Prototype C</h1>
        <div style={styles.headerControls}>
          <button
            onClick={play}
            disabled={playing}
            style={{
              ...styles.playButton,
              ...(playing ? styles.playButtonDisabled : {}),
            }}
          >
            {playing ? '▶ Playing' : '▶ Play'}
          </button>
          <button
            onClick={exportWav}
            disabled={exporting}
            style={{
              ...styles.exportButton,
              ...(exporting ? styles.exportButtonDisabled : {}),
            }}
          >
            {exporting ? '⬇ Exporting' : '⬇ Export'}
          </button>
        </div>
      </header>

      {error && <div style={styles.error}>{error}</div>}

      <main style={styles.content}>
        {/* Top Row: Oscillators + Envelope + Filter */}
        <div style={styles.topRow}>
          {/* Oscillators Section */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Layers</h2>
            {config.synthesis.layers.map((layer, index) => (
              <div key={index} style={styles.layerPanel}>
                {/* Type Label */}
                <div style={styles.layerSidebar}>
                  <span style={styles.layerType}>{layer.type}</span>
                  {config.synthesis.layers.length > 1 && (
                    <button onClick={() => removeLayer(index)} style={styles.removeButton}>×</button>
                  )}
                </div>

                {/* Gain */}
                <div style={styles.layerGainSection}>
                  <DialC label="Gain" value={layer.gain} min={0} max={1} step={0.01}
                    onChange={(val) => updateLayer(index, { ...layer, gain: val })} />
                </div>

                {/* Main Content */}
                <div style={styles.layerContent}>
                  {/* Main Controls (Oscillator/FM/Karplus/Noise) */}
                  <div style={styles.controlGroup}>
                    <span style={styles.groupLabel}>
                      {layer.type === 'oscillator' ? 'OSC' : 
                       layer.type === 'fm' ? 'FM' : 
                       layer.type === 'karplus-strong' ? 'KS' : 'NOISE'}
                    </span>
                    <div style={styles.groupContent}>
                      {/* Oscillator */}
                      {layer.type === 'oscillator' && layer.oscillator && (
                        <>
                          <WaveformSelector
                            value={layer.oscillator.waveform}
                            onChange={(waveform) => updateLayer(index, { ...layer, oscillator: { ...layer.oscillator!, waveform } })}
                          />
                          <DialC label="Freq" value={layer.oscillator.frequency} min={20} max={20000} step={1} unit="Hz"
                            onChange={(val) => updateLayer(index, { ...layer, oscillator: { ...layer.oscillator!, frequency: val } })} />
                          <DialC label="Detune" value={layer.oscillator.detune} min={-100} max={100} step={1} unit="¢"
                            onChange={(val) => updateLayer(index, { ...layer, oscillator: { ...layer.oscillator!, detune: val } })} />
                          
                          {/* Unison inline */}
                          {(layer.oscillator.unison?.voices || 1) > 1 && (
                            <>
                              <DialC label="Voices" value={layer.oscillator.unison?.voices || 1} min={1} max={8} step={1}
                                onChange={(val) => updateLayer(index, { ...layer, oscillator: { ...layer.oscillator!, unison: { ...layer.oscillator!.unison!, voices: Math.round(val) } } })} />
                              <DialC label="UniDet" value={layer.oscillator.unison?.detune || 0} min={0} max={50} step={1} unit="¢"
                                onChange={(val) => updateLayer(index, { ...layer, oscillator: { ...layer.oscillator!, unison: { ...layer.oscillator!.unison!, detune: val } } })} />
                              <DialC label="Spread" value={layer.oscillator.unison?.spread || 0} min={0} max={1} step={0.01}
                                onChange={(val) => updateLayer(index, { ...layer, oscillator: { ...layer.oscillator!, unison: { ...layer.oscillator!.unison!, spread: val } } })} />
                            </>
                          )}
                          <button
                            onClick={() => {
                              const unison = layer.oscillator!.unison;
                              if (unison && unison.voices > 1) {
                                updateLayer(index, { ...layer, oscillator: { ...layer.oscillator!, unison: { voices: 1, detune: 0, spread: 0 } } });
                              } else {
                                updateLayer(index, { ...layer, oscillator: { ...layer.oscillator!, unison: { voices: 3, detune: 10, spread: 0.5 } } });
                              }
                            }}
                            style={(layer.oscillator.unison?.voices || 1) > 1 ? styles.disableButton : styles.enableButton}
                          >
                            UNI
                          </button>
                        </>
                      )}

                      {/* FM */}
                      {layer.type === 'fm' && layer.fm && (
                        <>
                          <DialC label="Carrier" value={layer.fm.carrier} min={20} max={20000} step={1} unit="Hz"
                            onChange={(val) => updateLayer(index, { ...layer, fm: { ...layer.fm!, carrier: val } })} />
                          <DialC label="Mod" value={layer.fm.modulator} min={20} max={20000} step={1} unit="Hz"
                            onChange={(val) => updateLayer(index, { ...layer, fm: { ...layer.fm!, modulator: val } })} />
                          <DialC label="Index" value={layer.fm.modulationIndex} min={0} max={1000} step={1}
                            onChange={(val) => updateLayer(index, { ...layer, fm: { ...layer.fm!, modulationIndex: val } })} />
                        </>
                      )}

                      {/* Karplus-Strong */}
                      {layer.type === 'karplus-strong' && layer.karplus && (
                        <>
                          <DialC label="Freq" value={layer.karplus.frequency} min={20} max={20000} step={1} unit="Hz"
                            onChange={(val) => updateLayer(index, { ...layer, karplus: { ...layer.karplus!, frequency: val } })} />
                          <DialC label="Damp" value={layer.karplus.damping} min={0} max={1} step={0.01}
                            onChange={(val) => updateLayer(index, { ...layer, karplus: { ...layer.karplus!, damping: val } })} />
                        </>
                      )}

                      {/* Noise */}
                      {layer.type === 'noise' && layer.noise && (
                        <select value={layer.noise.type}
                          onChange={(e) => updateLayer(index, { ...layer, noise: { type: e.target.value as any } })}
                          style={styles.miniSelect}>
                          <option value="white">White</option>
                          <option value="pink">Pink</option>
                          <option value="brown">Brown</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {/* ENV */}
                  <div style={styles.controlGroup}>
                    <span style={styles.groupLabel}>ENV</span>
                    <div style={styles.groupContent}>
                      <DialC label="A" value={layer.envelope?.attack || 0.01} min={0.001} max={2} step={0.001} unit="s"
                        onChange={(val) => updateLayer(index, { ...layer, envelope: { ...(layer.envelope || { decay: 0.1, sustain: 0.5, release: 0.3 }), attack: val } })} />
                      <DialC label="D" value={layer.envelope?.decay || 0.1} min={0.001} max={2} step={0.001} unit="s"
                        onChange={(val) => updateLayer(index, { ...layer, envelope: { ...(layer.envelope || { attack: 0.01, sustain: 0.5, release: 0.3 }), decay: val } })} />
                      <DialC label="S" value={layer.envelope?.sustain || 0.5} min={0} max={1} step={0.01}
                        onChange={(val) => updateLayer(index, { ...layer, envelope: { ...(layer.envelope || { attack: 0.01, decay: 0.1, release: 0.3 }), sustain: val } })} />
                      <DialC label="R" value={layer.envelope?.release || 0.3} min={0.001} max={5} step={0.001} unit="s"
                        onChange={(val) => updateLayer(index, { ...layer, envelope: { ...(layer.envelope || { attack: 0.01, decay: 0.1, sustain: 0.5 }), release: val } })} />
                    </div>
                  </div>

                  {/* FILT */}
                  <div style={styles.controlGroup}>
                    <span style={styles.groupLabel}>FILT</span>
                    <div style={styles.groupContent}>
                      <select value={layer.filter?.type || 'lowpass'}
                        onChange={(e) => updateLayer(index, { ...layer, filter: { ...(layer.filter || { frequency: 20000, q: 1 }), type: e.target.value as any } })}
                        style={styles.miniSelect}>
                        <option value="lowpass">LP</option>
                        <option value="highpass">HP</option>
                        <option value="bandpass">BP</option>
                        <option value="notch">Notch</option>
                      </select>
                      <DialC label="Cut" value={layer.filter?.frequency || 20000} min={20} max={20000} step={1} unit="Hz"
                        onChange={(val) => updateLayer(index, { ...layer, filter: { ...(layer.filter || { type: 'lowpass', q: 1 }), frequency: val } })} />
                      <DialC label="Q" value={layer.filter?.q || 1} min={0.0001} max={100} step={0.1}
                        onChange={(val) => updateLayer(index, { ...layer, filter: { ...(layer.filter || { type: 'lowpass', frequency: 20000 }), q: val } })} />
                    </div>
                  </div>

                  {/* SAT */}
                  <div style={styles.controlGroup}>
                    <span style={styles.groupLabel}>SAT</span>
                    <div style={styles.groupContent}>
                      <select value={layer.saturation?.type || 'soft'}
                        onChange={(e) => updateLayer(index, { ...layer, saturation: { ...(layer.saturation || { drive: 0, mix: 0 }), type: e.target.value as any } })}
                        style={styles.miniSelect}>
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
                  </div>
                </div>
              </div>
            ))}
            {config.synthesis.layers.length < 8 && (
              <div style={styles.addButtons}>
                <button onClick={() => addLayer('oscillator')} style={styles.addButton}>+OSC</button>
                <button onClick={() => addLayer('noise')} style={styles.addButton}>+NOISE</button>
                <button onClick={() => addLayer('fm')} style={styles.addButton}>+FM</button>
                <button onClick={() => addLayer('karplus-strong')} style={styles.addButton}>+KS</button>
              </div>
            )}
          </div>

          {/* Global Controls: Duration + Envelope + Filter */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Global</h2>
            
            {/* Duration */}
            <div style={styles.controlGroup}>
              <span style={styles.groupLabel}>TIMING</span>
              <div style={styles.groupContent}>
                <DialC
                  label="Duration"
                  value={config.timing.duration}
                  min={0.1}
                  max={10}
                  step={0.1}
                  unit="s"
                  onChange={updateDuration}
                />
              </div>
            </div>

            {/* Envelope */}
            <div style={styles.controlGroup}>
              <span style={styles.groupLabel}>ENVELOPE</span>
              <div style={styles.groupContent}>
                <DialC
                  label="A"
                  value={config.envelope.attack}
                  min={0.001}
                  max={2}
                  step={0.001}
                  unit="s"
                  onChange={(val) => updateEnvelope({ ...config.envelope, attack: val })}
                />
                <DialC
                  label="D"
                  value={config.envelope.decay}
                  min={0.001}
                  max={2}
                  step={0.001}
                  unit="s"
                  onChange={(val) => updateEnvelope({ ...config.envelope, decay: val })}
                />
                <DialC
                  label="S"
                  value={config.envelope.sustain}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(val) => updateEnvelope({ ...config.envelope, sustain: val })}
                />
                <DialC
                  label="R"
                  value={config.envelope.release}
                  min={0.001}
                  max={5}
                  step={0.001}
                  unit="s"
                  onChange={(val) => updateEnvelope({ ...config.envelope, release: val })}
                />
              </div>
            </div>

            {/* Filter */}
            <div style={styles.controlGroup}>
              <div style={styles.groupHeader}>
                <span style={styles.groupLabel}>FILTER</span>
                <button
                  onClick={() => config.filter ? updateFilter(undefined) : updateFilter({ type: 'lowpass', frequency: 1000, q: 1 })}
                  style={config.filter ? styles.disableButton : styles.enableButton}
                >
                  {config.filter ? 'OFF' : 'ON'}
                </button>
              </div>
              {config.filter && (
                <div style={styles.groupContent}>
                  <select
                    value={config.filter.type}
                    onChange={(e) => updateFilter({ ...config.filter!, type: e.target.value as any })}
                    style={styles.miniSelect}
                  >
                    <option value="lowpass">LP</option>
                    <option value="highpass">HP</option>
                    <option value="bandpass">BP</option>
                    <option value="notch">Notch</option>
                    <option value="allpass">AP</option>
                    <option value="peaking">Peak</option>
                  </select>
                  <DialC
                    label="Cut"
                    value={config.filter.frequency}
                    min={20}
                    max={20000}
                    step={1}
                    unit="Hz"
                    onChange={(val) => updateFilter({ ...config.filter!, frequency: val })}
                  />
                  <DialC
                    label="Q"
                    value={config.filter.q}
                    min={0.0001}
                    max={100}
                    step={0.1}
                    onChange={(val) => updateFilter({ ...config.filter!, q: val })}
                  />
                  
                  {/* Filter Envelope Toggle */}
                  <button
                    onClick={() => {
                      if (config.filter!.envelope) {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { envelope, ...rest } = config.filter!;
                        updateFilter(rest);
                      } else {
                        updateFilter({ ...config.filter!, envelope: { amount: 2000, attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.5 } });
                      }
                    }}
                    style={config.filter!.envelope ? styles.disableButton : styles.enableButton}
                    title="Filter Envelope"
                  >
                    ENV
                  </button>
                  
                  {/* Filter Envelope Controls */}
                  {config.filter!.envelope && (
                    <>
                      <DialC label="Amt" value={config.filter!.envelope.amount} min={-10000} max={10000} step={10} unit="Hz"
                        onChange={(val) => updateFilter({ ...config.filter!, envelope: { ...config.filter!.envelope!, amount: val } })} />
                      <DialC label="A" value={config.filter!.envelope.attack} min={0.001} max={2} step={0.001} unit="s"
                        onChange={(val) => updateFilter({ ...config.filter!, envelope: { ...config.filter!.envelope!, attack: val } })} />
                      <DialC label="D" value={config.filter!.envelope.decay} min={0.001} max={2} step={0.001} unit="s"
                        onChange={(val) => updateFilter({ ...config.filter!, envelope: { ...config.filter!.envelope!, decay: val } })} />
                      <DialC label="S" value={config.filter!.envelope.sustain} min={0} max={1} step={0.01}
                        onChange={(val) => updateFilter({ ...config.filter!, envelope: { ...config.filter!.envelope!, sustain: val } })} />
                      <DialC label="R" value={config.filter!.envelope.release} min={0.001} max={5} step={0.001} unit="s"
                        onChange={(val) => updateFilter({ ...config.filter!, envelope: { ...config.filter!.envelope!, release: val } })} />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row: LFO + Effects + Dynamics */}
        <div style={styles.bottomRow}>
          {/* Dynamics Section */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Dynamics</h2>
            <div style={styles.dialRow}>
              <DialC
                label="Velocity"
                value={config.dynamics.velocity}
                min={0}
                max={1}
                step={0.01}
                onChange={(val) => {
                  const newConfig = { ...config };
                  newConfig.dynamics.velocity = val;
                  updateLayer(0, config.synthesis.layers[0]); // Trigger update
                }}
              />
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={config.dynamics.normalize}
                  onChange={(e) => {
                    const newConfig = { ...config };
                    newConfig.dynamics.normalize = e.target.checked;
                    updateLayer(0, config.synthesis.layers[0]); // Trigger update
                  }}
                  style={styles.checkbox}
                />
                <span style={styles.checkboxText}>Normalize</span>
              </label>
            </div>
          </div>
          {/* LFO Section */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>
                LFO {config.lfo && <span style={styles.targetIndicator}>→ {config.lfo.target.toUpperCase()}</span>}
              </h2>
              <button
                onClick={() => config.lfo ? updateLFO(undefined) : updateLFO({ waveform: 'sine', frequency: 5, depth: 0.5, target: 'pitch' })}
                style={config.lfo ? styles.disableButton : styles.enableButton}
              >
                {config.lfo ? 'OFF' : 'ON'}
              </button>
            </div>
            {config.lfo && (
              <>
                <div style={styles.dialRow}>
                  <select
                    value={config.lfo.waveform}
                    onChange={(e) => updateLFO({ ...config.lfo!, waveform: e.target.value as any })}
                    style={styles.select}
                    title="LFO Waveform"
                  >
                    <option value="sine">Sine</option>
                    <option value="square">Square</option>
                    <option value="sawtooth">Saw</option>
                    <option value="triangle">Triangle</option>
                    <option value="random">Random</option>
                  </select>
                  <select
                    value={config.lfo.target}
                    onChange={(e) => updateLFO({ ...config.lfo!, target: e.target.value as any })}
                    style={{...styles.select, ...styles.targetSelect}}
                    title="What the LFO modulates"
                  >
                    <option value="pitch">→ Pitch</option>
                    <option value="filter">→ Filter</option>
                    <option value="amplitude">→ Amplitude</option>
                    <option value="pan">→ Pan</option>
                  </select>
                </div>
                <div style={styles.dialRow}>
                  <DialC
                    label="Rate"
                    value={config.lfo.frequency}
                    min={0.01}
                    max={20}
                    step={0.01}
                    unit="Hz"
                    onChange={(val) => updateLFO({ ...config.lfo!, frequency: val })}
                  />
                  <DialC
                    label="Depth"
                    value={config.lfo.depth}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(val) => updateLFO({ ...config.lfo!, depth: val })}
                  />
                  <DialC
                    label="Delay"
                    value={config.lfo.delay || 0}
                    min={0}
                    max={2}
                    step={0.01}
                    unit="s"
                    onChange={(val) => updateLFO({ ...config.lfo!, delay: val })}
                  />
                  <DialC
                    label="Fade"
                    value={config.lfo.fade || 0}
                    min={0}
                    max={2}
                    step={0.01}
                    unit="s"
                    onChange={(val) => updateLFO({ ...config.lfo!, fade: val })}
                  />
                </div>
              </>
            )}
          </div>

          {/* Reverb Section */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Reverb</h2>
              <button
                onClick={() => config.effects.reverb 
                  ? updateEffects({ ...config.effects, reverb: undefined })
                  : updateEffects({ ...config.effects, reverb: { decay: 2, damping: 0.5, mix: 0.3 } })
                }
                style={config.effects.reverb ? styles.disableButton : styles.enableButton}
              >
                {config.effects.reverb ? 'OFF' : 'ON'}
              </button>
            </div>
            {config.effects.reverb && (
              <div style={styles.dialRow}>
                <DialC
                  label="Decay"
                  value={config.effects.reverb.decay}
                  min={0.1}
                  max={10}
                  step={0.1}
                  unit="s"
                  onChange={(val) =>
                    updateEffects({ ...config.effects, reverb: { ...config.effects.reverb!, decay: val } })
                  }
                />
                <DialC
                  label="Damp"
                  value={config.effects.reverb.damping}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(val) =>
                    updateEffects({ ...config.effects, reverb: { ...config.effects.reverb!, damping: val } })
                  }
                />
                <DialC
                  label="Mix"
                  value={config.effects.reverb.mix}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(val) =>
                    updateEffects({ ...config.effects, reverb: { ...config.effects.reverb!, mix: val } })
                  }
                />
              </div>
            )}
          </div>

          {/* Delay Section */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Delay</h2>
              <button
                onClick={() => config.effects.delay
                  ? updateEffects({ ...config.effects, delay: undefined })
                  : updateEffects({ ...config.effects, delay: { time: 0.25, feedback: 0.5, mix: 0.3 } })
                }
                style={config.effects.delay ? styles.disableButton : styles.enableButton}
              >
                {config.effects.delay ? 'OFF' : 'ON'}
              </button>
            </div>
            {config.effects.delay && (
              <div style={styles.dialRow}>
                <DialC
                  label="Time"
                  value={config.effects.delay.time}
                  min={0.01}
                  max={2}
                  step={0.01}
                  unit="s"
                  onChange={(val) =>
                    updateEffects({ ...config.effects, delay: { ...config.effects.delay!, time: val } })
                  }
                />
                <DialC
                  label="Fdbk"
                  value={config.effects.delay.feedback}
                  min={0}
                  max={0.95}
                  step={0.01}
                  onChange={(val) =>
                    updateEffects({ ...config.effects, delay: { ...config.effects.delay!, feedback: val } })
                  }
                />
                <DialC
                  label="Mix"
                  value={config.effects.delay.mix}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(val) =>
                    updateEffects({ ...config.effects, delay: { ...config.effects.delay!, mix: val } })
                  }
                />
              </div>
            )}
          </div>

          {/* Distortion Section */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Distortion</h2>
              <button
                onClick={() => config.effects.distortion
                  ? updateEffects({ ...config.effects, distortion: undefined })
                  : updateEffects({ ...config.effects, distortion: { type: 'soft', amount: 0.5, mix: 0.5 } })
                }
                style={config.effects.distortion ? styles.disableButton : styles.enableButton}
              >
                {config.effects.distortion ? 'OFF' : 'ON'}
              </button>
            </div>
            {config.effects.distortion && (
              <>
                <div style={styles.dialRow}>
                  <select
                    value={config.effects.distortion.type}
                    onChange={(e) => updateEffects({ ...config.effects, distortion: { ...config.effects.distortion!, type: e.target.value as any } })}
                    style={styles.select}
                  >
                    <option value="soft">Soft</option>
                    <option value="hard">Hard</option>
                    <option value="fuzz">Fuzz</option>
                    <option value="bitcrush">Bitcrush</option>
                    <option value="waveshaper">Waveshaper</option>
                  </select>
                </div>
                <div style={styles.dialRow}>
                  <DialC
                    label="Amount"
                    value={config.effects.distortion.amount}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(val) =>
                      updateEffects({ ...config.effects, distortion: { ...config.effects.distortion!, amount: val } })
                    }
                  />
                  <DialC
                    label="Mix"
                    value={config.effects.distortion.mix}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(val) =>
                      updateEffects({ ...config.effects, distortion: { ...config.effects.distortion!, mix: val } })
                    }
                  />
                </div>
              </>
            )}
          </div>

          {/* Compressor Section */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Compressor</h2>
              <button
                onClick={() => config.effects.compressor
                  ? updateEffects({ ...config.effects, compressor: undefined })
                  : updateEffects({ ...config.effects, compressor: { threshold: -20, ratio: 4, attack: 0.003, release: 0.25, knee: 30 } })
                }
                style={config.effects.compressor ? styles.disableButton : styles.enableButton}
              >
                {config.effects.compressor ? 'OFF' : 'ON'}
              </button>
            </div>
            {config.effects.compressor && (
              <div style={styles.dialRow}>
                <DialC
                  label="Thresh"
                  value={config.effects.compressor.threshold}
                  min={-60}
                  max={0}
                  step={1}
                  unit="dB"
                  onChange={(val) =>
                    updateEffects({ ...config.effects, compressor: { ...config.effects.compressor!, threshold: val } })
                  }
                />
                <DialC
                  label="Ratio"
                  value={config.effects.compressor.ratio}
                  min={1}
                  max={20}
                  step={0.1}
                  onChange={(val) =>
                    updateEffects({ ...config.effects, compressor: { ...config.effects.compressor!, ratio: val } })
                  }
                />
                <DialC
                  label="Attack"
                  value={config.effects.compressor.attack}
                  min={0.001}
                  max={0.1}
                  step={0.001}
                  unit="s"
                  onChange={(val) =>
                    updateEffects({ ...config.effects, compressor: { ...config.effects.compressor!, attack: val } })
                  }
                />
                <DialC
                  label="Release"
                  value={config.effects.compressor.release}
                  min={0.01}
                  max={1}
                  step={0.01}
                  unit="s"
                  onChange={(val) =>
                    updateEffects({ ...config.effects, compressor: { ...config.effects.compressor!, release: val } })
                  }
                />
              </div>
            )}
          </div>

          {/* Gate Section */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Gate</h2>
              <button
                onClick={() => config.effects.gate
                  ? updateEffects({ ...config.effects, gate: undefined })
                  : updateEffects({ ...config.effects, gate: { attack: 0.001, hold: 0.1, release: 0.05 } })
                }
                style={config.effects.gate ? styles.disableButton : styles.enableButton}
              >
                {config.effects.gate ? 'OFF' : 'ON'}
              </button>
            </div>
            {config.effects.gate && (
              <div style={styles.dialRow}>
                <DialC
                  label="Attack"
                  value={config.effects.gate.attack}
                  min={0.001}
                  max={0.1}
                  step={0.001}
                  unit="s"
                  onChange={(val) =>
                    updateEffects({ ...config.effects, gate: { ...config.effects.gate!, attack: val } })
                  }
                />
                <DialC
                  label="Hold"
                  value={config.effects.gate.hold}
                  min={0.001}
                  max={1}
                  step={0.001}
                  unit="s"
                  onChange={(val) =>
                    updateEffects({ ...config.effects, gate: { ...config.effects.gate!, hold: val } })
                  }
                />
                <DialC
                  label="Release"
                  value={config.effects.gate.release}
                  min={0.001}
                  max={1}
                  step={0.001}
                  unit="s"
                  onChange={(val) =>
                    updateEffects({ ...config.effects, gate: { ...config.effects.gate!, release: val } })
                  }
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#1a1a1a',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: '#2a2a2a',
    borderBottom: '1px solid #ff8c42',
  },
  title: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
    color: '#ff8c42',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
  },
  headerControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  content: {
    padding: '8px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  topRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '8px',
  },
  bottomRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '8px',
  },
  section: {
    backgroundColor: '#2a2a2a',
    border: '1px solid #3a3a3a',
    borderRadius: '4px',
    padding: '8px',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.3)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '10px',
    fontWeight: 600,
    color: '#ff8c42',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  dialRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  enableButton: {
    padding: '2px 6px',
    border: '1px solid #2a5a2a',
    borderRadius: '2px',
    background: '#1a3a1a',
    color: '#4ade80',
    fontSize: '7px',
    fontWeight: 700,
    cursor: 'pointer',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px',
  },
  disableButton: {
    padding: '2px 6px',
    border: '1px solid #4ade80',
    borderRadius: '2px',
    background: '#2a5a2a',
    color: '#fff',
    fontSize: '7px',
    fontWeight: 700,
    cursor: 'pointer',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px',
  },
  layerRow: {
    marginBottom: '8px',
    paddingBottom: '8px',
    borderBottom: '1px solid #333',
  },
  layerLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  layerType: {
    fontSize: '6px',
    fontWeight: 700,
    color: '#ff8c42',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px',
    writingMode: 'vertical-rl' as const,
    textOrientation: 'mixed' as const,
    padding: '4px 2px',
    background: '#2a2a2a',
    borderRadius: '2px',
    border: '1px solid #3a3a3a',
  },
  removeButton: {
    padding: '2px 4px',
    border: '1px solid #5a2a2a',
    borderRadius: '2px',
    backgroundColor: '#3a1a1a',
    color: '#ff6b6b',
    fontSize: '8px',
    fontWeight: 700,
    cursor: 'pointer',
    lineHeight: 1,
    transition: 'all 150ms ease',
  },
  addButtons: {
    display: 'flex',
    gap: '4px',
    marginTop: '6px',
  },
  addButton: {
    padding: '4px 8px',
    border: '1px solid #4a4a4a',
    borderRadius: '2px',
    background: '#3a3a3a',
    color: '#e0e0e0',
    fontSize: '9px',
    fontWeight: 600,
    cursor: 'pointer',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px',
  },
  error: {
    margin: '8px',
    padding: '6px 10px',
    backgroundColor: '#3a1a1a',
    color: '#ff6b6b',
    borderRadius: '3px',
    border: '1px solid #5a2a2a',
    fontSize: '10px',
    fontWeight: 500,
  },
  playButton: {
    padding: '6px 16px',
    border: '1px solid #ff8c42',
    borderRadius: '3px',
    background: '#ff8c42',
    color: '#1a1a1a',
    fontSize: '10px',
    fontWeight: 700,
    cursor: 'pointer',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  playButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  exportButton: {
    padding: '6px 16px',
    border: '1px solid #4a4a4a',
    borderRadius: '3px',
    backgroundColor: '#3a3a3a',
    color: '#e0e0e0',
    fontSize: '10px',
    fontWeight: 700,
    cursor: 'pointer',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  exportButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  select: {
    padding: '3px 4px',
    background: '#3a3a3a',
    border: '1px solid #4a4a4a',
    borderRadius: '2px',
    color: '#e0e0e0',
    fontSize: '8px',
    fontWeight: 600,
    cursor: 'pointer',
    textTransform: 'uppercase' as const,
    outline: 'none',
  },
  miniSelect: {
    padding: '2px 3px',
    background: '#2a2a2a',
    border: '1px solid #3a3a3a',
    borderRadius: '2px',
    color: '#aaa',
    fontSize: '7px',
    fontWeight: 600,
    cursor: 'pointer',
    outline: 'none',
    minWidth: '45px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
  },
  checkbox: {
    cursor: 'pointer',
  },
  checkboxText: {
    fontSize: '9px',
    fontWeight: 600,
    color: '#e0e0e0',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px',
  },
  targetIndicator: {
    fontSize: '8px',
    fontWeight: 700,
    color: '#4ade80',
    marginLeft: '6px',
    letterSpacing: '0.5px',
  },
  targetSelect: {
    color: '#4ade80',
    fontWeight: 700,
  },
  subSection: {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid #333',
  },
  subSectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  subSectionTitle: {
    fontSize: '8px',
    fontWeight: 600,
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  layerPanel: {
    display: 'grid',
    gridTemplateColumns: '18px 50px 1fr',
    gap: '4px',
    padding: '4px',
    background: 'linear-gradient(135deg, #252525 0%, #1f1f1f 100%)',
    border: '1px solid #3a3a3a',
    borderRadius: '2px',
    marginBottom: '3px',
    alignItems: 'stretch',
  },
  layerSidebar: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  layerGainSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layerContent: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '3px',
    alignItems: 'stretch',
  },
  controlGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
    padding: '3px',
    background: '#1a1a1a',
    borderRadius: '2px',
    border: '1px solid #2a2a2a',
  },
  groupLabel: {
    fontSize: '7px',
    fontWeight: 700,
    color: '#ff8c42',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    textAlign: 'center' as const,
    marginBottom: '1px',
  },
  groupContent: {
    display: 'flex',
    gap: '2px',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2px',
  },
};
