/**
 * Factory functions for creating nodes with default parameters
 */

import type { Node, NodeType, ConnectionPoint, NodeData } from '../types/nodeGraph';

// Node dimensions
const NODE_WIDTH = 120;
const NODE_HEIGHT = 80;

// Node colors by type
const NODE_COLORS: Record<NodeType, string> = {
  oscillator: '#4CAF50',
  filter: '#2196F3',
  envelope: '#FF9800',
  lfo: '#9C27B0',
  effect: '#F44336',
  output: '#607D8B',
};

// Default connection points
const createConnectionPoints = (type: NodeType): { inputs: ConnectionPoint[]; outputs: ConnectionPoint[] } => {
  const inputs: ConnectionPoint[] = [];
  const outputs: ConnectionPoint[] = [];

  // Output node only has inputs
  if (type === 'output') {
    inputs.push({ id: 'in-0', x: 0, y: NODE_HEIGHT / 2 });
    return { inputs, outputs };
  }

  // All other nodes have at least one output
  outputs.push({ id: 'out-0', x: NODE_WIDTH, y: NODE_HEIGHT / 2 });

  // Filter, envelope, LFO, and effect nodes have inputs
  if (type === 'filter' || type === 'envelope' || type === 'lfo' || type === 'effect') {
    inputs.push({ id: 'in-0', x: 0, y: NODE_HEIGHT / 2 });
  }

  return { inputs, outputs };
};

// Default parameters by node type
const getDefaultData = (type: NodeType): NodeData => {
  switch (type) {
    case 'oscillator':
      return {
        waveform: 'sine',
        frequency: 440,
        detune: 0,
      };
    case 'filter':
      return {
        filterType: 'lowpass',
        cutoff: 1000,
        resonance: 1,
      };
    case 'envelope':
      return {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.7,
        release: 0.3,
      };
    case 'lfo':
      return {
        lfoWaveform: 'sine',
        lfoFrequency: 5,
        lfoDepth: 0.5,
        lfoTarget: 'pitch',
      };
    case 'effect':
      return {
        effectType: 'reverb',
        effectParams: {
          mix: 0.3,
          decay: 2.0,
        },
      };
    case 'output':
      return {};
    default:
      return {};
  }
};

let nodeIdCounter = 0;

/**
 * Generate a unique node ID
 */
export const generateNodeId = (type: NodeType): string => {
  return `${type}-${nodeIdCounter++}`;
};

/**
 * Reset the node ID counter (useful for testing)
 */
export const resetNodeIdCounter = (): void => {
  nodeIdCounter = 0;
};

/**
 * Create a new node with default parameters
 */
export const createNode = (type: NodeType, x: number = 100, y: number = 100): Node => {
  const id = generateNodeId(type);
  const { inputs, outputs } = createConnectionPoints(type);
  
  return {
    id,
    type,
    x,
    y,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    color: NODE_COLORS[type],
    data: getDefaultData(type),
    inputs,
    outputs,
  };
};

/**
 * Create an oscillator node
 */
export const createOscillatorNode = (x?: number, y?: number): Node => {
  return createNode('oscillator', x, y);
};

/**
 * Create a filter node
 */
export const createFilterNode = (x?: number, y?: number): Node => {
  return createNode('filter', x, y);
};

/**
 * Create an envelope node
 */
export const createEnvelopeNode = (x?: number, y?: number): Node => {
  return createNode('envelope', x, y);
};

/**
 * Create an LFO node
 */
export const createLFONode = (x?: number, y?: number): Node => {
  return createNode('lfo', x, y);
};

/**
 * Create an effect node
 */
export const createEffectNode = (x?: number, y?: number): Node => {
  return createNode('effect', x, y);
};

/**
 * Create an output node
 */
export const createOutputNode = (x?: number, y?: number): Node => {
  return createNode('output', x, y);
};
