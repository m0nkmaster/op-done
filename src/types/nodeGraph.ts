/**
 * Core data structures for the visual node-based synthesizer
 */

export type NodeType = 'oscillator' | 'filter' | 'envelope' | 'lfo' | 'effect' | 'output';

export interface ConnectionPoint {
  id: string;
  x: number;  // Relative to node
  y: number;  // Relative to node
}

export interface NodeData {
  // Oscillator
  waveform?: 'sine' | 'square' | 'sawtooth' | 'triangle' | 'custom';
  frequency?: number;
  detune?: number;
  customWaveform?: number[];  // Array of amplitude values
  
  // Filter
  filterType?: 'lowpass' | 'highpass' | 'bandpass' | 'notch';
  cutoff?: number;
  resonance?: number;
  
  // Envelope
  attack?: number;
  decay?: number;
  sustain?: number;
  release?: number;
  
  // LFO
  lfoWaveform?: 'sine' | 'square' | 'sawtooth' | 'triangle';
  lfoFrequency?: number;
  lfoDepth?: number;
  lfoTarget?: 'pitch' | 'filter' | 'amplitude';
  
  // Effect (reverb, delay, distortion)
  effectType?: 'reverb' | 'delay' | 'distortion' | 'compressor';
  effectParams?: Record<string, number>;
}

export interface Node {
  id: string;                    // Unique identifier
  type: NodeType;                // Node type
  x: number;                     // Canvas X position
  y: number;                     // Canvas Y position
  width: number;                 // Node width in pixels
  height: number;                // Node height in pixels
  color: string;                 // Visual color (hex)
  data: NodeData;                // Type-specific parameters
  inputs: ConnectionPoint[];     // Input connection points
  outputs: ConnectionPoint[];    // Output connection points
}

export interface Connection {
  id: string;
  from: string;      // Source node ID
  fromPoint: string; // Source connection point ID
  to: string;        // Destination node ID
  toPoint: string;   // Destination connection point ID
  active: boolean;   // Whether audio is currently flowing
}

export interface CanvasState {
  nodes: Node[];
  connections: Connection[];
  selectedNodeId: string | null;
  draggingNodeId: string | null;
  connectingFrom: { nodeId: string; pointId: string } | null;
  zoom: number;
  panX: number;
  panY: number;
}

export interface NodeGraph {
  nodes: Map<string, Node>;
  adjacencyList: Map<string, string[]>;  // nodeId -> [connectedNodeIds]
  reverseAdjacencyList: Map<string, string[]>;  // For backward traversal
}
