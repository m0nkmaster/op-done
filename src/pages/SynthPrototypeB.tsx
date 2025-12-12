/**
 * SynthPrototypeB - Hardware-inspired design prototype
 * Features: 3D dials, vertical tabs, dark metallic color palette
 */

import { useSynthState } from '../components/synth-prototypes/shared';
import { DialB } from '../components/synth-prototypes/prototype-b/DialB';
import { TabsB } from '../components/synth-prototypes/prototype-b/TabsB';

export default function SynthPrototypeB() {
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
        <h1 style={styles.title}>PROTOTYPE B - HARDWARE</h1>
      </header>

      <div style={styles.mainLayout}>
        <TabsB tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        <main style={styles.content}>
          {error && <div style={styles.error}>{error}</div>}

          {activeTab === 'synthesis' && (
            <div style={styles.panel}>
              <h2 style={styles.panelTitle}>LAYERS</h2>
              <div style={styles.layerControls}>
                {config.synthesis.layers.map((layer, index) => (
                  <div key={index} style={styles.layer}>
                    <div style={styles.layerHeader}>
                      <span style={styles.layerType}>{layer.type.toUpperCase()}</span>
                      {config.synthesis.layers.length > 1 && (
                        <button
                          onClick={() => removeLayer(index)}
                          style={styles.removeButton}
                        >
                          REMOVE
                        </button>
                      )}
                    </div>
                    
                    <div style={styles.dialGrid}>
                      <DialB
                        label="Gain"
                        value={layer.gain}
                        min={0}
                        max={1}
                        step={0.01}
                        onChange={(val) => updateLayer(index, { ...layer, gain: val })}
                      />

                      {layer.type === 'oscillator' && layer.oscillator && (
                        <>
                          <DialB
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
                          <DialB
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
                          <DialB
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
                          <DialB
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
                          <DialB
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
                          <DialB
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
                          <DialB
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
                    + OSCILLATOR
                  </button>
                  <button onClick={() => addLayer('noise')} style={styles.addButton}>
                    + NOISE
                  </button>
                  <button onClick={() => addLayer('fm')} style={styles.addButton}>
                    + FM
                  </button>
                  <button onClick={() => addLayer('karplus-strong')} style={styles.addButton}>
                    + KARPLUS-STRONG
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'envelope' && (
            <div style={styles.panel}>
              <h2 style={styles.panelTitle}>ADSR ENVELOPE</h2>
              <div style={styles.dialGrid}>
                <DialB
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
                <DialB
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
                <DialB
                  label="Sustain"
                  value={config.envelope.sustain}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(val) =>
                    updateEnvelope({ ...config.envelope, sustain: val })
                  }
                />
                <DialB
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
              <h2 style={styles.panelTitle}>FILTER</h2>
              {config.filter ? (
                <div style={styles.dialGrid}>
                  <DialB
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
                  <DialB
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
                  ENABLE FILTER
                </button>
              )}
            </div>
          )}

          {activeTab === 'modulation' && (
            <div style={styles.panel}>
              <h2 style={styles.panelTitle}>LFO</h2>
              {config.lfo ? (
                <div style={styles.dialGrid}>
                  <DialB
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
                  <DialB
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
                  ENABLE LFO
                </button>
              )}
            </div>
          )}

          {activeTab === 'effects' && (
            <div style={styles.panel}>
              <h2 style={styles.panelTitle}>EFFECTS</h2>
              
              <div style={styles.effectSection}>
                <h3 style={styles.effectTitle}>REVERB</h3>
                {config.effects.reverb ? (
                  <div style={styles.dialGrid}>
                    <DialB
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
                    <DialB
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
                    <DialB
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
                    ENABLE REVERB
                  </button>
                )}
              </div>

              <div style={styles.effectSection}>
                <h3 style={styles.effectTitle}>DELAY</h3>
                {config.effects.delay ? (
                  <div style={styles.dialGrid}>
                    <DialB
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
                    <DialB
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
                    <DialB
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
                    ENABLE DELAY
                  </button>
                )}
              </div>

              <div style={styles.effectSection}>
                <h3 style={styles.effectTitle}>DISTORTION</h3>
                {config.effects.distortion ? (
                  <div style={styles.dialGrid}>
                    <DialB
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
                    <DialB
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
                    ENABLE DISTORTION
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'playback' && (
            <div style={styles.panel}>
              <h2 style={styles.panelTitle}>PLAYBACK</h2>
              <div style={styles.dialGrid}>
                <DialB
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
                  {playing ? 'PLAYING...' : 'PLAY'}
                </button>
                <button
                  onClick={exportWav}
                  disabled={exporting}
                  style={{
                    ...styles.exportButton,
                    ...(exporting ? styles.exportButtonDisabled : {}),
                  }}
                >
                  {exporting ? 'EXPORTING...' : 'EXPORT WAV'}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
  },
  header: {
    padding: '20px 24px',
    backgroundColor: '#1a1a1a',
    borderBottom: '2px solid #333',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 700,
    color: '#ff6b35',
    fontFamily: 'monospace',
    letterSpacing: '2px',
    textShadow: '0 0 10px rgba(255, 107, 53, 0.5)',
  },
  mainLayout: {
    display: 'flex',
    minHeight: 'calc(100vh - 64px)',
  },
  content: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto' as const,
  },
  error: {
    padding: '16px',
    marginBottom: '24px',
    backgroundColor: '#2a0a0a',
    color: '#ff6b35',
    borderRadius: '4px',
    border: '1px solid #ff6b35',
    fontSize: '13px',
    fontFamily: 'monospace',
  },
  panel: {
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    padding: '32px',
    border: '1px solid #2a2a2a',
    boxShadow: `
      0 4px 8px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.05)
    `,
  },
  panelTitle: {
    margin: '0 0 24px 0',
    fontSize: '16px',
    fontWeight: 700,
    color: '#ff6b35',
    fontFamily: 'monospace',
    letterSpacing: '1.5px',
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
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    backgroundColor: '#151515',
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
  },
  layerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  layerType: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#ff6b35',
    letterSpacing: '1px',
    fontFamily: 'monospace',
  },
  removeButton: {
    padding: '6px 12px',
    border: '1px solid #3a3a3a',
    borderRadius: '4px',
    backgroundColor: '#1a1a1a',
    color: '#888',
    fontSize: '11px',
    fontFamily: 'monospace',
    cursor: 'pointer',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    fontWeight: 600,
  },
  addLayerButtons: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },
  addButton: {
    padding: '12px 24px',
    border: '2px solid #ff6b35',
    borderRadius: '4px',
    backgroundColor: '#1a1a1a',
    color: '#ff6b35',
    fontSize: '12px',
    fontWeight: 700,
    fontFamily: 'monospace',
    cursor: 'pointer',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
  },
  effectSection: {
    marginBottom: '32px',
  },
  effectTitle: {
    margin: '0 0 16px 0',
    fontSize: '13px',
    fontWeight: 700,
    color: '#888',
    letterSpacing: '1px',
    fontFamily: 'monospace',
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
    backgroundColor: '#ff6b35',
    color: '#0a0a0a',
    fontSize: '14px',
    fontWeight: 700,
    fontFamily: 'monospace',
    cursor: 'pointer',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: `
      0 4px 8px rgba(255, 107, 53, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.2)
    `,
  },
  playButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  exportButton: {
    padding: '16px 48px',
    border: '2px solid #ff6b35',
    borderRadius: '4px',
    backgroundColor: '#1a1a1a',
    color: '#ff6b35',
    fontSize: '14px',
    fontWeight: 700,
    fontFamily: 'monospace',
    cursor: 'pointer',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
  },
  exportButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};
