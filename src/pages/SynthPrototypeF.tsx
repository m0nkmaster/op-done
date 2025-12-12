/**
 * SynthPrototypeF - Visual Synthesis Canvas
 * Concept: Node-based visual synthesis with real-time waveform drawing
 */

import { useState, useRef, useEffect } from 'react';
import { useSynthState } from '../components/synth-prototypes/shared';

interface Node {
  id: string;
  type: 'oscillator' | 'filter' | 'envelope' | 'effect' | 'output';
  x: number;
  y: number;
  data: any;
  color: string;
}

interface Connection {
  from: string;
  to: string;
}

export default function SynthPrototypeF() {
  const {
    config,
    playing,
    exporting,
    error,
    play,
    exportWav,
  } = useSynthState();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([
    { id: 'osc1', type: 'oscillator', x: 100, y: 200, data: { waveform: 'sine', freq: 440 }, color: '#3b82f6' },
    { id: 'filter1', type: 'filter', x: 300, y: 200, data: { type: 'lowpass', cutoff: 1000 }, color: '#f59e0b' },
    { id: 'env1', type: 'envelope', x: 500, y: 200, data: { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.3 }, color: '#10b981' },
    { id: 'output', type: 'output', x: 700, y: 200, data: {}, color: '#a855f7' },
  ]);
  const [connections, setConnections] = useState<Connection[]>([
    { from: 'osc1', to: 'filter1' },
    { from: 'filter1', to: 'env1' },
    { from: 'env1', to: 'output' },
  ]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>('osc1');
  const [waveformDrawing, setWaveformDrawing] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw connections
    connections.forEach(conn => {
      const fromNode = nodes.find(n => n.id === conn.from);
      const toNode = nodes.find(n => n.id === conn.to);
      if (!fromNode || !toNode) return;

      const gradient = ctx.createLinearGradient(fromNode.x + 40, fromNode.y + 40, toNode.x + 40, toNode.y + 40);
      gradient.addColorStop(0, fromNode.color);
      gradient.addColorStop(1, toNode.color);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = fromNode.color;
      
      // Curved connection
      ctx.beginPath();
      ctx.moveTo(fromNode.x + 80, fromNode.y + 40);
      const midX = (fromNode.x + toNode.x) / 2 + 40;
      ctx.bezierCurveTo(
        midX, fromNode.y + 40,
        midX, toNode.y + 40,
        toNode.x, toNode.y + 40
      );
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // Draw nodes
    nodes.forEach(node => {
      const isSelected = selectedNode === node.id;
      
      // Node glow
      if (isSelected) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = node.color;
      }

      // Node body
      ctx.fillStyle = isSelected ? node.color : `${node.color}88`;
      ctx.strokeStyle = node.color;
      ctx.lineWidth = isSelected ? 3 : 2;
      
      ctx.beginPath();
      ctx.roundRect(node.x, node.y, 80, 80, 12);
      ctx.fill();
      ctx.stroke();
      
      ctx.shadowBlur = 0;

      // Node icon/text
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(node.type.toUpperCase(), node.x + 40, node.y + 10);

      // Node data preview
      ctx.font = '9px monospace';
      ctx.fillStyle = '#ddd';
      if (node.type === 'oscillator') {
        ctx.fillText(node.data.waveform, node.x + 40, node.y + 30);
        ctx.fillText(`${node.data.freq}Hz`, node.x + 40, node.y + 45);
      } else if (node.type === 'filter') {
        ctx.fillText(node.data.type, node.x + 40, node.y + 30);
        ctx.fillText(`${node.data.cutoff}Hz`, node.x + 40, node.y + 45);
      } else if (node.type === 'envelope') {
        ctx.fillText('ADSR', node.x + 40, node.y + 35);
      }

      // Connection points
      ctx.fillStyle = node.color;
      ctx.beginPath();
      ctx.arc(node.x, node.y + 40, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(node.x + 80, node.y + 40, 5, 0, Math.PI * 2);
      ctx.fill();
    });

  }, [nodes, connections, selectedNode]);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on a node
    const clickedNode = nodes.find(node => 
      x >= node.x && x <= node.x + 80 &&
      y >= node.y && y <= node.y + 80
    );

    if (clickedNode) {
      setDragging(clickedNode.id);
      setDragOffset({ x: x - clickedNode.x, y: y - clickedNode.y });
      setSelectedNode(clickedNode.id);
    } else {
      setSelectedNode(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    setNodes(prev => prev.map(node => 
      node.id === dragging ? { ...node, x, y } : node
    ));
  };

  const handleCanvasMouseUp = () => {
    setDragging(null);
  };

  const selectedNodeData = nodes.find(n => n.id === selectedNode);

  return (
    <div style={styles.container}>
      {/* Top toolbar */}
      <header style={styles.header}>
        <h1 style={styles.title}>🎨 Visual Synthesis Canvas</h1>
        <div style={styles.toolbar}>
          <button onClick={() => {
            const newNode: Node = {
              id: `osc${Date.now()}`,
              type: 'oscillator',
              x: 100,
              y: 100,
              data: { waveform: 'sine', freq: 440 },
              color: '#3b82f6'
            };
            setNodes([...nodes, newNode]);
          }} style={styles.toolBtn}>
            + Oscillator
          </button>
          <button onClick={() => {
            const newNode: Node = {
              id: `filt${Date.now()}`,
              type: 'filter',
              x: 150,
              y: 100,
              data: { type: 'lowpass', cutoff: 1000 },
              color: '#f59e0b'
            };
            setNodes([...nodes, newNode]);
          }} style={styles.toolBtn}>
            + Filter
          </button>
          <button onClick={() => {
            const newNode: Node = {
              id: `env${Date.now()}`,
              type: 'envelope',
              x: 200,
              y: 100,
              data: { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.3 },
              color: '#10b981'
            };
            setNodes([...nodes, newNode]);
          }} style={styles.toolBtn}>
            + Envelope
          </button>
          <div style={styles.spacer} />
          <button onClick={play} disabled={playing} style={playing ? styles.btnDisabled : styles.btnPlay}>
            {playing ? '▶ Playing' : '▶ Play'}
          </button>
          <button onClick={exportWav} disabled={exporting} style={exporting ? styles.btnDisabled : styles.btnExport}>
            {exporting ? '⬇ Export' : '⬇ Export'}
          </button>
        </div>
      </header>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.mainLayout}>
        {/* Canvas */}
        <div style={styles.canvasContainer}>
          <canvas
            ref={canvasRef}
            width={1000}
            height={600}
            style={styles.canvas}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          />
          <div style={styles.canvasHint}>
            💡 Drag nodes to rearrange • Click to select • Draw waveforms in the panel →
          </div>
        </div>

        {/* Right panel - Node editor */}
        <div style={styles.rightPanel}>
          {selectedNodeData ? (
            <>
              <div style={styles.panelHeader}>
                <div style={{ ...styles.colorDot, background: selectedNodeData.color }} />
                <h2 style={styles.panelTitle}>{selectedNodeData.type.toUpperCase()}</h2>
                {selectedNodeData.type !== 'output' && (
                  <button 
                    onClick={() => {
                      setNodes(nodes.filter(n => n.id !== selectedNode));
                      setConnections(connections.filter(c => c.from !== selectedNode && c.to !== selectedNode));
                      setSelectedNode(null);
                    }}
                    style={styles.deleteBtn}
                  >
                    ✕
                  </button>
                )}
              </div>

              {selectedNodeData.type === 'oscillator' && (
                <div style={styles.panelContent}>
                  <div style={styles.waveformDrawArea}>
                    <div style={styles.waveformLabel}>Draw Waveform</div>
                    <svg 
                      width="100%" 
                      height="120" 
                      style={styles.waveformSvg}
                      onMouseDown={(e) => {
                        setIsDrawing(true);
                        setWaveformDrawing([]);
                      }}
                      onMouseMove={(e) => {
                        if (!isDrawing) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const y = (e.clientY - rect.top) / rect.height;
                        setWaveformDrawing(prev => [...prev, y]);
                      }}
                      onMouseUp={() => setIsDrawing(false)}
                      onMouseLeave={() => setIsDrawing(false)}
                    >
                      <rect width="100%" height="100%" fill="#1a1a1a" />
                      <line x1="0" y1="60" x2="100%" y2="60" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                      
                      {/* Draw waveform */}
                      {waveformDrawing.length > 1 && (
                        <polyline
                          points={waveformDrawing.map((y, i) => 
                            `${(i / waveformDrawing.length) * 100}%,${y * 120}`
                          ).join(' ')}
                          fill="none"
                          stroke={selectedNodeData.color}
                          strokeWidth="2"
                        />
                      )}
                      
                      {/* Default waveform preview */}
                      {waveformDrawing.length === 0 && (
                        <path
                          d={selectedNodeData.data.waveform === 'sine' 
                            ? 'M 0 60 Q 25 20, 50 60 T 100 60'
                            : selectedNodeData.data.waveform === 'square'
                            ? 'M 0 20 L 25 20 L 25 100 L 50 100 L 50 20 L 75 20 L 75 100 L 100 100'
                            : selectedNodeData.data.waveform === 'sawtooth'
                            ? 'M 0 100 L 50 20 L 50 100 L 100 20'
                            : 'M 0 60 L 25 20 L 75 100 L 100 60'
                          }
                          fill="none"
                          stroke={selectedNodeData.color}
                          strokeWidth="2"
                          vectorEffect="non-scaling-stroke"
                        />
                      )}
                    </svg>
                  </div>

                  <div style={styles.controlSection}>
                    <label style={styles.label}>
                      Waveform
                      <select 
                        value={selectedNodeData.data.waveform}
                        onChange={(e) => {
                          setNodes(nodes.map(n => 
                            n.id === selectedNode 
                              ? { ...n, data: { ...n.data, waveform: e.target.value } }
                              : n
                          ));
                        }}
                        style={styles.select}
                      >
                        <option value="sine">Sine</option>
                        <option value="square">Square</option>
                        <option value="sawtooth">Sawtooth</option>
                        <option value="triangle">Triangle</option>
                      </select>
                    </label>

                    <label style={styles.label}>
                      Frequency: {selectedNodeData.data.freq} Hz
                      <input 
                        type="range" 
                        min={20} 
                        max={20000} 
                        value={selectedNodeData.data.freq}
                        onChange={(e) => {
                          setNodes(nodes.map(n => 
                            n.id === selectedNode 
                              ? { ...n, data: { ...n.data, freq: parseInt(e.target.value) } }
                              : n
                          ));
                        }}
                        style={styles.slider}
                      />
                    </label>
                  </div>
                </div>
              )}

              {selectedNodeData.type === 'filter' && (
                <div style={styles.panelContent}>
                  <label style={styles.label}>
                    Filter Type
                    <select 
                      value={selectedNodeData.data.type}
                      onChange={(e) => {
                        setNodes(nodes.map(n => 
                          n.id === selectedNode 
                            ? { ...n, data: { ...n.data, type: e.target.value } }
                            : n
                        ));
                      }}
                      style={styles.select}
                    >
                      <option value="lowpass">Low Pass</option>
                      <option value="highpass">High Pass</option>
                      <option value="bandpass">Band Pass</option>
                      <option value="notch">Notch</option>
                    </select>
                  </label>

                  <label style={styles.label}>
                    Cutoff: {selectedNodeData.data.cutoff} Hz
                    <input 
                      type="range" 
                      min={20} 
                      max={20000} 
                      value={selectedNodeData.data.cutoff}
                      onChange={(e) => {
                        setNodes(nodes.map(n => 
                          n.id === selectedNode 
                            ? { ...n, data: { ...n.data, cutoff: parseInt(e.target.value) } }
                            : n
                        ));
                      }}
                      style={styles.slider}
                    />
                  </label>
                </div>
              )}

              {selectedNodeData.type === 'envelope' && (
                <div style={styles.panelContent}>
                  <div style={styles.envelopeVisual}>
                    <svg width="100%" height="100" style={styles.envelopeSvg}>
                      <rect width="100%" height="100%" fill="#1a1a1a" />
                      <polyline
                        points={`
                          0,100
                          ${selectedNodeData.data.attack * 50},0
                          ${(selectedNodeData.data.attack + selectedNodeData.data.decay) * 50},${(1 - selectedNodeData.data.sustain) * 100}
                          ${(selectedNodeData.data.attack + selectedNodeData.data.decay + 0.5) * 50},${(1 - selectedNodeData.data.sustain) * 100}
                          ${(selectedNodeData.data.attack + selectedNodeData.data.decay + 0.5 + selectedNodeData.data.release) * 50},100
                        `}
                        fill="none"
                        stroke={selectedNodeData.color}
                        strokeWidth="2"
                      />
                    </svg>
                  </div>

                  <label style={styles.label}>
                    Attack: {(selectedNodeData.data.attack * 1000).toFixed(0)}ms
                    <input 
                      type="range" 
                      min={0.001} 
                      max={2} 
                      step={0.001}
                      value={selectedNodeData.data.attack}
                      onChange={(e) => {
                        setNodes(nodes.map(n => 
                          n.id === selectedNode 
                            ? { ...n, data: { ...n.data, attack: parseFloat(e.target.value) } }
                            : n
                        ));
                      }}
                      style={styles.slider}
                    />
                  </label>

                  <label style={styles.label}>
                    Decay: {(selectedNodeData.data.decay * 1000).toFixed(0)}ms
                    <input 
                      type="range" 
                      min={0.001} 
                      max={2} 
                      step={0.001}
                      value={selectedNodeData.data.decay}
                      onChange={(e) => {
                        setNodes(nodes.map(n => 
                          n.id === selectedNode 
                            ? { ...n, data: { ...n.data, decay: parseFloat(e.target.value) } }
                            : n
                        ));
                      }}
                      style={styles.slider}
                    />
                  </label>

                  <label style={styles.label}>
                    Sustain: {(selectedNodeData.data.sustain * 100).toFixed(0)}%
                    <input 
                      type="range" 
                      min={0} 
                      max={1} 
                      step={0.01}
                      value={selectedNodeData.data.sustain}
                      onChange={(e) => {
                        setNodes(nodes.map(n => 
                          n.id === selectedNode 
                            ? { ...n, data: { ...n.data, sustain: parseFloat(e.target.value) } }
                            : n
                        ));
                      }}
                      style={styles.slider}
                    />
                  </label>

                  <label style={styles.label}>
                    Release: {(selectedNodeData.data.release * 1000).toFixed(0)}ms
                    <input 
                      type="range" 
                      min={0.001} 
                      max={5} 
                      step={0.001}
                      value={selectedNodeData.data.release}
                      onChange={(e) => {
                        setNodes(nodes.map(n => 
                          n.id === selectedNode 
                            ? { ...n, data: { ...n.data, release: parseFloat(e.target.value) } }
                            : n
                        ));
                      }}
                      style={styles.slider}
                    />
                  </label>
                </div>
              )}

              {selectedNodeData.type === 'output' && (
                <div style={styles.panelContent}>
                  <div style={styles.outputInfo}>
                    <div style={styles.outputIcon}>🔊</div>
                    <p style={styles.outputText}>
                      This is the final output node. Connect your signal chain here to hear the result.
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={styles.panelEmpty}>
              <div style={styles.emptyIcon}>👆</div>
              <p style={styles.emptyText}>Select a node to edit its parameters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#0a0a0a',
    color: '#e0e0e0',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: {
    padding: '12px 20px',
    background: '#1a1a1a',
    borderBottom: '2px solid #2a2a2a',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  toolbar: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  toolBtn: {
    padding: '8px 16px',
    background: 'rgba(99, 102, 241, 0.2)',
    border: '1px solid rgba(99, 102, 241, 0.4)',
    borderRadius: '6px',
    color: '#818cf8',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  spacer: {
    width: '20px',
  },
  btnPlay: {
    padding: '8px 20px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
  },
  btnExport: {
    padding: '8px 20px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
  },
  btnDisabled: {
    padding: '8px 20px',
    background: '#374151',
    border: 'none',
    borderRadius: '6px',
    color: '#9ca3af',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  error: {
    margin: '12px 20px',
    padding: '12px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '6px',
    color: '#fca5a5',
    fontSize: '13px',
  },
  mainLayout: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  canvasContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    position: 'relative' as const,
  },
  canvas: {
    border: '2px solid #2a2a2a',
    borderRadius: '12px',
    cursor: 'grab',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
  },
  canvasHint: {
    marginTop: '16px',
    fontSize: '12px',
    color: '#6b7280',
    textAlign: 'center' as const,
  },
  rightPanel: {
    width: '320px',
    background: '#1a1a1a',
    borderLeft: '2px solid #2a2a2a',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'auto',
  },
  panelHeader: {
    padding: '16px',
    borderBottom: '1px solid #2a2a2a',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  colorDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    boxShadow: '0 0 8px currentColor',
  },
  panelTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 700,
    flex: 1,
  },
  deleteBtn: {
    padding: '4px 8px',
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    borderRadius: '4px',
    color: '#fca5a5',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    lineHeight: 1,
  },
  panelContent: {
    padding: '16px',
  },
  panelEmpty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    textAlign: 'center' as const,
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyText: {
    margin: 0,
    fontSize: '14px',
    color: '#6b7280',
  },
  waveformDrawArea: {
    marginBottom: '20px',
  },
  waveformLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#9ca3af',
    marginBottom: '8px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  waveformSvg: {
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    cursor: 'crosshair',
  },
  envelopeVisual: {
    marginBottom: '20px',
  },
  envelopeSvg: {
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
  },
  controlSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  label: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#d1d5db',
  },
  select: {
    padding: '8px 12px',
    background: '#0a0a0a',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    color: '#e0e0e0',
    fontSize: '13px',
    cursor: 'pointer',
    outline: 'none',
  },
  slider: {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    background: 'rgba(255, 255, 255, 0.1)',
    outline: 'none',
    cursor: 'pointer',
  },
  outputInfo: {
    textAlign: 'center' as const,
    padding: '20px',
  },
  outputIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  outputText: {
    margin: 0,
    fontSize: '13px',
    color: '#9ca3af',
    lineHeight: 1.6,
  },
};
