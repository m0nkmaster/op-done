/**
 * SynthPrototypeA - Minimalist design prototype
 * Features: large prominent dials, horizontal tabs, monochrome with blue accent
 */

import { useSynthState } from '../components/synth-prototypes/shared';
import { DialA } from '../components/synth-prototypes/prototype-a/DialA';
import { TabsA } from '../components/synth-prototypes/prototype-a/TabsA';

export default function SynthPrototypeA() {
  const {
    config,
    activeTab,
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
    setActiveTab,
    play,
    exportWav,
  } = useSynthState();

  const tabs = [
    { id: 'synthesis', label: 'Synthesis' },
    { id: 'envelope', label: 'Envelope' },
    { id: 'filter', label: 'Filter' },
    { id: 'modulation', label: 'Modulation' },
    { id: 'effects', label: 'Effects' },
    { id: 'playback', label: 'Playback' },
  ];

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Prototype A - Minimalist</h1>
      </header>

      <TabsA tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <main style={styles.content}>
        {error && <div style={styles.error}>{error}</div>}

        {activeTab === 'synthesis' && (
          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>Layers</h2>
            <div style={styles.layerControls}>
              {config.synthesis.layers.map((layer, index) => (
                <div key={index} style={styles.layer}>
                  <div style={styles.layerHeader}>
                    <span style={styles.layerType}>{layer.type}</span>
                    {config.synthesis.layers.length > 1 && (
                      <button
                        onClick={() => removeLayer(index)}
                        style={styles.removeButton}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div style={styles.dialGrid}>
                    <DialA
                      label="Gain"
                      value={layer.gain}
                      min={0}
                      max={1}
                      step={0.01}
                      onChange={(val) => updateLayer(index, { ...layer, gain: val })}
                    />

                    {layer.type === 'oscillator' && layer.oscillator && (
                      <>
                        <DialA
                          label="Frequency"
                          value={layer.oscillator.frequency}
                          min={20}
                          max={20000}
                          step={1}
                          unit="Hz"
                          onChange={(val) =>
                            updateLayer(index, {
                              ...layer,
                              oscillator: { ...layer.oscillator!, frequency: val },
                            })
                          }
                        />
                        <DialA
                          label="Detune"
                          value={layer.oscillator.detune}
                          min={-100}
                          max={100}
                          step={1}
                          unit="¢"
                          onChange={(val) =>
                            updateLayer(index, {
                              ...layer,
                              oscillator: { ...layer.oscillator!, detune: val },
                            })
                          }
                        />
                      </>
                    )}

                    {layer.type === 'fm' && layer.fm && (
                      <>
                        <DialA
                          label="Carrier"
                          value={layer.fm.carrier}
                          min={20}
                          max={20000}
                          step={1}
                          unit="Hz"
                          onChange={(val) =>
                            updateLayer(index, {
                              ...layer,
                              fm: { ...layer.fm!, carrier: val },
                            })
                          }
                        />
                        <DialA
                          label="Modulator"
                          value={layer.fm.modulator}
                          min={20}
                          max={20000}
                          step={1}
                          unit="Hz"
                          onChange={(val) =>
                            updateLayer(index, {
                              ...layer,
                              fm: { ...layer.fm!, modulator: val },
                            })
                          }
                        />
                        <DialA
                          label="Mod Index"
                          value={layer.fm.modulationIndex}
                          min={0}
                          max={1000}
                          step={1}
                          onChange={(val) =>
                            updateLayer(index, {
                              ...layer,
                              fm: { ...layer.fm!, modulationIndex: val },
                            })
                          }
                        />
                      </>
                    )}

                    {layer.type === 'karplus-strong' && layer.karplus && (
                      <>
                        <DialA
                          label="Frequency"
                          value={layer.karplus.frequency}
                          min={20}
                          max={20000}
                          step={1}
                          unit="Hz"
                          onChange={(val) =>
                            updateLayer(index, {
                              ...layer,
                              karplus: { ...layer.karplus!, frequency: val },
                            })
                          }
                        />
                        <DialA
                          label="Damping"
                          value={layer.karplus.damping}
                          min={0}
                          max={1}
                          step={0.01}
                          onChange={(val) =>
                            updateLayer(index, {
                              ...layer,
                              karplus: { ...layer.karplus!, damping: val },
                            })
                          }
                        />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {config.synthesis.layers.length < 8 && (
              <div style={styles.addLayerButtons}>
                <button onClick={() => addLayer('oscillator')} style={styles.addButton}>
                  + Oscillator
                </button>
                <button onClick={() => addLayer('noise')} style={styles.addButton}>
                  + Noise
                </button>
                <button onClick={() => addLayer('fm')} style={styles.addButton}>
                  + FM
                </button>
                <button onClick={() => addLayer('karplus-strong')} style={styles.addButton}>
                  + Karplus-Strong
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'envelope' && (
          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>ADSR Envelope</h2>
            <div style={styles.dialGrid}>
              <DialA
                label="Attack"
                value={config.envelope.attack}
                min={0.001}
                max={2}
                step={0.001}
                unit="s"
                onChange={(val) =>
                  updateEnvelope({ ...config.envelope, attack: val })
                }
              />
              <DialA
                label="Decay"
                value={config.envelope.decay}
                min={0.001}
                max={2}
                step={0.001}
                unit="s"
                onChange={(val) =>
                  updateEnvelope({ ...config.envelope, decay: val })
                }
              />
              <DialA
                label="Sustain"
                value={config.envelope.sustain}
                min={0}
                max={1}
                step={0.01}
                onChange={(val) =>
                  updateEnvelope({ ...config.envelope, sustain: val })
                }
              />
              <DialA
                label="Release"
                value={config.envelope.release}
                min={0.001}
                max={5}
                step={0.001}
                unit="s"
                onChange={(val) =>
                  updateEnvelope({ ...config.envelope, release: val })
                }
              />
            </div>
          </div>
        )}

        {activeTab === 'filter' && (
          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>Filter</h2>
            {config.filter ? (
              <div style={styles.dialGrid}>
                <DialA
                  label="Cutoff"
                  value={config.filter.frequency}
                  min={20}
                  max={20000}
                  step={1}
                  unit="Hz"
                  onChange={(val) =>
                    updateFilter({ ...config.filter!, frequency: val })
                  }
                />
                <DialA
                  label="Resonance"
                  value={config.filter.q}
                  min={0.0001}
                  max={100}
                  step={0.1}
                  onChange={(val) =>
                    updateFilter({ ...config.filter!, q: val })
                  }
                />
              </div>
            ) : (
              <button
                onClick={() =>
                  updateFilter({
                    type: 'lowpass',
                    frequency: 1000,
                    q: 1,
                  })
                }
                style={styles.addButton}
              >
                Enable Filter
              </button>
            )}
          </div>
        )}

        {activeTab === 'modulation' && (
          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>LFO</h2>
            {config.lfo ? (
              <div style={styles.dialGrid}>
                <DialA
                  label="Frequency"
                  value={config.lfo.frequency}
                  min={0.01}
                  max={20}
                  step={0.01}
                  unit="Hz"
                  onChange={(val) =>
                    updateLFO({ ...config.lfo!, frequency: val })
                  }
                />
                <DialA
                  label="Depth"
                  value={config.lfo.depth}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(val) =>
                    updateLFO({ ...config.lfo!, depth: val })
                  }
                />
              </div>
            ) : (
              <button
                onClick={() =>
                  updateLFO({
                    waveform: 'sine',
                    frequency: 5,
                    depth: 0.5,
                    target: 'pitch',
                  })
                }
                style={styles.addButton}
              >
                Enable LFO
              </button>
            )}
          </div>
        )}

        {activeTab === 'effects' && (
          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>Effects</h2>
            
            <div style={styles.effectSection}>
              <h3 style={styles.effectTitle}>Reverb</h3>
              {config.effects.reverb ? (
                <div style={styles.dialGrid}>
                  <DialA
                    label="Decay"
                    value={config.effects.reverb.decay}
                    min={0.1}
                    max={10}
                    step={0.1}
                    unit="s"
                    onChange={(val) =>
                      updateEffects({
                        ...config.effects,
                        reverb: { ...config.effects.reverb!, decay: val },
                      })
                    }
                  />
                  <DialA
                    label="Damping"
                    value={config.effects.reverb.damping}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(val) =>
                      updateEffects({
                        ...config.effects,
                        reverb: { ...config.effects.reverb!, damping: val },
                      })
                    }
                  />
                  <DialA
                    label="Mix"
                    value={config.effects.reverb.mix}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(val) =>
                      updateEffects({
                        ...config.effects,
                        reverb: { ...config.effects.reverb!, mix: val },
                      })
                    }
                  />
                </div>
              ) : (
                <button
                  onClick={() =>
                    updateEffects({
                      ...config.effects,
                      reverb: { decay: 2, damping: 0.5, mix: 0.3 },
                    })
                  }
                  style={styles.addButton}
                >
                  Enable Reverb
                </button>
              )}
            </div>

            <div style={styles.effectSection}>
              <h3 style={styles.effectTitle}>Delay</h3>
              {config.effects.delay ? (
                <div style={styles.dialGrid}>
                  <DialA
                    label="Time"
                    value={config.effects.delay.time}
                    min={0.01}
                    max={2}
                    step={0.01}
                    unit="s"
                    onChange={(val) =>
                      updateEffects({
                        ...config.effects,
                        delay: { ...config.effects.delay!, time: val },
                      })
                    }
                  />
                  <DialA
                    label="Feedback"
                    value={config.effects.delay.feedback}
                    min={0}
                    max={0.95}
                    step={0.01}
                    onChange={(val) =>
                      updateEffects({
                        ...config.effects,
                        delay: { ...config.effects.delay!, feedback: val },
                      })
                    }
                  />
                  <DialA
                    label="Mix"
                    value={config.effects.delay.mix}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(val) =>
                      updateEffects({
                        ...config.effects,
                        delay: { ...config.effects.delay!, mix: val },
                      })
                    }
                  />
                </div>
              ) : (
                <button
                  onClick={() =>
                    updateEffects({
                      ...config.effects,
                      delay: { time: 0.25, feedback: 0.5, mix: 0.3 },
                    })
                  }
                  style={styles.addButton}
                >
                  Enable Delay
                </button>
              )}
            </div>

            <div style={styles.effectSection}>
              <h3 style={styles.effectTitle}>Distortion</h3>
              {config.effects.distortion ? (
                <div style={styles.dialGrid}>
                  <DialA
                    label="Amount"
                    value={config.effects.distortion.amount}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(val) =>
                      updateEffects({
                        ...config.effects,
                        distortion: { ...config.effects.distortion!, amount: val },
                      })
                    }
                  />
                  <DialA
                    label="Mix"
                    value={config.effects.distortion.mix}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(val) =>
                      updateEffects({
                        ...config.effects,
                        distortion: { ...config.effects.distortion!, mix: val },
                      })
                    }
                  />
                </div>
              ) : (
                <button
                  onClick={() =>
                    updateEffects({
                      ...config.effects,
                      distortion: { type: 'soft', amount: 0.5, mix: 0.5 },
                    })
                  }
                  style={styles.addButton}
                >
                  Enable Distortion
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'playback' && (
          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>Playback</h2>
            <div style={styles.dialGrid}>
              <DialA
                label="Duration"
                value={config.timing.duration}
                min={0.1}
                max={10}
                step={0.1}
                unit="s"
                onChange={updateDuration}
              />
            </div>
            <div style={styles.playbackButtons}>
              <button
                onClick={play}
                disabled={playing}
                style={{
                  ...styles.playButton,
                  ...(playing ? styles.playButtonDisabled : {}),
                }}
              >
                {playing ? 'Playing...' : 'Play'}
              </button>
              <button
                onClick={exportWav}
                disabled={exporting}
                style={{
                  ...styles.exportButton,
                  ...(exporting ? styles.exportButtonDisabled : {}),
                }}
              >
                {exporting ? 'Exporting...' : 'Export WAV'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: '24px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e0e0e0',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 600,
    color: '#000',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 24px',
  },
  error: {
    padding: '16px',
    marginBottom: '24px',
    backgroundColor: '#fee',
    color: '#c00',
    borderRadius: '4px',
    fontSize: '14px',
  },
  panel: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  panelTitle: {
    margin: '0 0 24px 0',
    fontSize: '18px',
    fontWeight: 600,
    color: '#000',
  },
  dialGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '24px',
    marginBottom: '24px',
  },
  layerControls: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  layer: {
    padding: '24px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
  },
  layerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  layerType: {
    fontSize: '14px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    color: '#0066ff',
    letterSpacing: '0.5px',
  },
  removeButton: {
    padding: '6px 12px',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    backgroundColor: '#fff',
    color: '#666',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    ':hover': {
      borderColor: '#c00',
      color: '#c00',
    },
  },
  addLayerButtons: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },
  addButton: {
    padding: '12px 24px',
    border: '2px solid #0066ff',
    borderRadius: '4px',
    backgroundColor: '#fff',
    color: '#0066ff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 150ms ease',
    ':hover': {
      backgroundColor: '#0066ff',
      color: '#fff',
    },
  },
  effectSection: {
    marginBottom: '32px',
  },
  effectTitle: {
    margin: '0 0 16px 0',
    fontSize: '14px',
    fontWeight: 600,
    color: '#666',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  playbackButtons: {
    display: 'flex',
    gap: '16px',
    marginTop: '24px',
  },
  playButton: {
    padding: '16px 48px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#0066ff',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 150ms ease',
    ':hover': {
      backgroundColor: '#0052cc',
      boxShadow: '0 4px 12px rgba(0, 102, 255, 0.3)',
    },
  },
  playButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  exportButton: {
    padding: '16px 48px',
    border: '2px solid #0066ff',
    borderRadius: '4px',
    backgroundColor: '#fff',
    color: '#0066ff',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 150ms ease',
    ':hover': {
      backgroundColor: '#0066ff',
      color: '#fff',
    },
  },
  exportButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};
