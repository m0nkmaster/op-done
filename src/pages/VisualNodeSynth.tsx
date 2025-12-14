/**
 * VisualNodeSynth - Visual node-based synthesizer page
 * Demonstrates the canvas rendering system
 */

import { useRef, useEffect } from 'react';
import { useNodeGraph } from '../hooks/useNodeGraph';
import { NodeCanvas } from '../components/NodeCanvas';

export default function VisualNodeSynth() {
  const { state, actions } = useNodeGraph();
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize with some default nodes
  useEffect(() => {
    if (state.nodes.length === 0) {
      actions.addNode('oscillator', 100, 200);
      actions.addNode('filter', 300, 200);
      actions.addNode('envelope', 500, 200);
      actions.addNode('output', 700, 200);
    }
  }, [state.nodes.length, actions]);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - state.panX) / state.zoom;
    const y = (e.clientY - rect.top - state.panY) / state.zoom;

    // Check if clicking on a node
    const clickedNode = state.nodes.find(node => 
      x >= node.x && x <= node.x + node.width &&
      y >= node.y && y <= node.y + node.height
    );

    if (clickedNode) {
      actions.selectNode(clickedNode.id);
      actions.startDrag(clickedNode.id);
    } else {
      actions.selectNode(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!state.draggingNodeId) return;

    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - state.panX) / state.zoom;
    const y = (e.clientY - rect.top - state.panY) / state.zoom;

    // Find the node being dragged
    const node = state.nodes.find(n => n.id === state.draggingNodeId);
    if (!node) return;

    // Constrain to canvas boundaries
    const constrainedX = Math.max(0, Math.min(x, 1000 - node.width));
    const constrainedY = Math.max(0, Math.min(y, 600 - node.height));

    actions.moveNode(state.draggingNodeId, constrainedX, constrainedY);
  };

  const handleCanvasMouseUp = () => {
    actions.endDrag();
  };

  return (
    <div style={styles.container}>
      {/* Top toolbar */}
      <header style={styles.header}>
        <h1 style={styles.title}>🎨 Visual Node Synthesizer</h1>
        <div style={styles.toolbar}>
          <button 
            onClick={() => actions.addNode('oscillator', 100, 100)} 
            style={styles.toolBtn}
            disabled={state.nodes.length >= 16}
          >
            + Oscillator
          </button>
          <button 
            onClick={() => actions.addNode('filter', 150, 100)} 
            style={styles.toolBtn}
            disabled={state.nodes.length >= 16}
          >
            + Filter
          </button>
          <button 
            onClick={() => actions.addNode('envelope', 200, 100)} 
            style={styles.toolBtn}
            disabled={state.nodes.length >= 16}
          >
            + Envelope
          </button>
          <button 
            onClick={() => actions.addNode('lfo', 250, 100)} 
            style={styles.toolBtn}
            disabled={state.nodes.length >= 16}
          >
            + LFO
          </button>
          <button 
            onClick={() => actions.addNode('effect', 300, 100)} 
            style={styles.toolBtn}
            disabled={state.nodes.length >= 16}
          >
            + Effect
          </button>
          <div style={styles.spacer} />
          <button onClick={actions.resetView} style={styles.btnReset}>
            Reset View
          </button>
        </div>
      </header>

      {state.nodes.length >= 16 && (
        <div style={styles.warning}>
          ⚠️ Maximum of 16 nodes reached. Delete some nodes to add more.
        </div>
      )}

      <div style={styles.mainLayout} ref={containerRef}>
        {/* Canvas */}
        <div style={styles.canvasContainer}>
          <NodeCanvas
            state={state}
            width={1000}
            height={600}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          />
          <div style={styles.canvasHint}>
            💡 Drag nodes to rearrange • Click to select • Nodes: {state.nodes.length}/16
          </div>
        </div>

        {/* Right panel - Node editor */}
        <div style={styles.rightPanel}>
          {state.selectedNodeId ? (
            <>
              <div style={styles.panelHeader}>
                <h2 style={styles.panelTitle}>
                  {state.nodes.find(n => n.id === state.selectedNodeId)?.type.toUpperCase()}
                </h2>
                {state.nodes.find(n => n.id === state.selectedNodeId)?.type !== 'output' && (
                  <button 
                    onClick={() => {
                      if (state.selectedNodeId) {
                        actions.removeNode(state.selectedNodeId);
                      }
                    }}
                    style={styles.deleteBtn}
                  >
                    Delete
                  </button>
                )}
              </div>
              <div style={styles.panelContent}>
                <p style={styles.infoText}>
                  Node ID: {state.selectedNodeId}
                </p>
                <p style={styles.infoText}>
                  Position: ({Math.round(state.nodes.find(n => n.id === state.selectedNodeId)?.x || 0)}, {Math.round(state.nodes.find(n => n.id === state.selectedNodeId)?.y || 0)})
                </p>
                <p style={styles.infoText}>
                  Parameter editing coming in next task...
                </p>
              </div>
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
  btnReset: {
    padding: '8px 20px',
    background: 'rgba(107, 114, 128, 0.2)',
    border: '1px solid rgba(107, 114, 128, 0.4)',
    borderRadius: '6px',
    color: '#9ca3af',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  warning: {
    margin: '12px 20px',
    padding: '12px',
    background: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: '6px',
    color: '#fbbf24',
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
    justifyContent: 'space-between',
  },
  panelTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 700,
  },
  deleteBtn: {
    padding: '6px 12px',
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    borderRadius: '4px',
    color: '#fca5a5',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  panelContent: {
    padding: '16px',
  },
  infoText: {
    margin: '8px 0',
    fontSize: '13px',
    color: '#9ca3af',
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
};
