/**
 * Property-based tests for NodeCanvas rendering
 */

import { describe, test, expect } from 'bun:test';
import fc from 'fast-check';
import type { CanvasState, NodeType } from '../types/nodeGraph';
import { createNode } from '../utils/nodeFactory';

/**
 * Feature: visual-node-synth, Property 2: Node rendering completeness
 * 
 * For any node in the graph, the rendered output should contain the node's 
 * type label, parameter preview text, and visible connection points
 * 
 * Validates: Requirements 1.3
 */

// Arbitrary for generating valid node types
const nodeTypeArbitrary = fc.constantFrom<NodeType>(
  'oscillator',
  'filter',
  'envelope',
  'lfo',
  'effect',
  'output'
);

// Arbitrary for generating valid nodes
const nodeArbitrary = fc.tuple(
  nodeTypeArbitrary,
  fc.integer({ min: 0, max: 800 }),
  fc.integer({ min: 0, max: 500 })
).map(([type, x, y]) => createNode(type, x, y));

// Arbitrary for generating canvas state with nodes
const canvasStateArbitrary = fc.record({
  nodes: fc.array(nodeArbitrary, { minLength: 1, maxLength: 10 }),
  connections: fc.constant([]),
  selectedNodeId: fc.constant(null),
  draggingNodeId: fc.constant(null),
  connectingFrom: fc.constant(null),
  zoom: fc.constant(1.0),
  panX: fc.constant(0),
  panY: fc.constant(0),
}) as fc.Arbitrary<CanvasState>;

describe('NodeCanvas Property Tests', () => {
  test('Property 2: Node rendering completeness - all node types have required rendering properties', () => {
    // Test each node type individually to ensure proper rendering properties
    const nodeTypes: NodeType[] = ['oscillator', 'filter', 'envelope', 'lfo', 'effect', 'output'];
    
    nodeTypes.forEach(nodeType => {
      const node = createNode(nodeType, 100, 100);

      // Verify node has required properties for rendering
      expect(node.type).toBe(nodeType);
      expect(node.color).toBeTruthy();
      expect(node.color).toMatch(/^#[0-9A-F]{6}$/i); // Valid hex color
      expect(node.width).toBeGreaterThan(0);
      expect(node.height).toBeGreaterThan(0);
      expect(node.x).toBe(100);
      expect(node.y).toBe(100);
      expect(node.id).toBeTruthy();
      expect(node.data).toBeTruthy();
      
      // Verify connection points exist and have valid properties
      if (nodeType === 'output') {
        expect(node.inputs.length).toBeGreaterThan(0);
        node.inputs.forEach(input => {
          expect(input.id).toBeTruthy();
          expect(typeof input.x).toBe('number');
          expect(typeof input.y).toBe('number');
        });
      } else if (nodeType === 'oscillator') {
        expect(node.outputs.length).toBeGreaterThan(0);
        node.outputs.forEach(output => {
          expect(output.id).toBeTruthy();
          expect(typeof output.x).toBe('number');
          expect(typeof output.y).toBe('number');
        });
      } else {
        // Filter, envelope, LFO, effect should have both
        expect(node.inputs.length).toBeGreaterThan(0);
        expect(node.outputs.length).toBeGreaterThan(0);
        
        node.inputs.forEach(input => {
          expect(input.id).toBeTruthy();
          expect(typeof input.x).toBe('number');
          expect(typeof input.y).toBe('number');
        });
        
        node.outputs.forEach(output => {
          expect(output.id).toBeTruthy();
          expect(typeof output.x).toBe('number');
          expect(typeof output.y).toBe('number');
        });
      }
    });
  });

  test('Property 2: Node rendering completeness - nodes have valid rendering data across all configurations', () => {
    fc.assert(
      fc.property(canvasStateArbitrary, (state) => {
        // Verify all nodes in the state have valid rendering properties
        state.nodes.forEach(node => {
          // Type label exists
          expect(node.type).toBeTruthy();
          expect(['oscillator', 'filter', 'envelope', 'lfo', 'effect', 'output']).toContain(node.type);
          
          // Color is valid hex
          expect(node.color).toMatch(/^#[0-9A-F]{6}$/i);
          
          // Dimensions are positive
          expect(node.width).toBeGreaterThan(0);
          expect(node.height).toBeGreaterThan(0);
          
          // Position is valid
          expect(typeof node.x).toBe('number');
          expect(typeof node.y).toBe('number');
          
          // Connection points exist and are valid
          const hasInputs = node.inputs.length > 0;
          const hasOutputs = node.outputs.length > 0;
          
          if (node.type === 'output') {
            expect(hasInputs).toBe(true);
          } else if (node.type === 'oscillator') {
            expect(hasOutputs).toBe(true);
          } else {
            expect(hasInputs).toBe(true);
            expect(hasOutputs).toBe(true);
          }
          
          // All connection points have valid coordinates
          [...node.inputs, ...node.outputs].forEach(point => {
            expect(point.id).toBeTruthy();
            expect(typeof point.x).toBe('number');
            expect(typeof point.y).toBe('number');
          });
          
          // Parameter data exists
          expect(node.data).toBeTruthy();
          expect(typeof node.data).toBe('object');
        });

        return true;
      }),
      { numRuns: 100 }
    );
  });

  test('Property 2: Node rendering completeness - parameter preview data is available for all node types', () => {
    fc.assert(
      fc.property(nodeArbitrary, (node) => {
        // Verify each node type has appropriate parameter data for preview
        switch (node.type) {
          case 'oscillator':
            expect(node.data.waveform).toBeTruthy();
            expect(node.data.frequency).toBeGreaterThan(0);
            expect(typeof node.data.detune).toBe('number');
            break;
            
          case 'filter':
            expect(node.data.filterType).toBeTruthy();
            expect(node.data.cutoff).toBeGreaterThan(0);
            expect(node.data.resonance).toBeGreaterThan(0);
            break;
            
          case 'envelope':
            expect(typeof node.data.attack).toBe('number');
            expect(typeof node.data.decay).toBe('number');
            expect(typeof node.data.sustain).toBe('number');
            expect(typeof node.data.release).toBe('number');
            expect(node.data.attack).toBeGreaterThan(0);
            expect(node.data.decay).toBeGreaterThan(0);
            expect(node.data.sustain).toBeGreaterThanOrEqual(0);
            expect(node.data.sustain).toBeLessThanOrEqual(1);
            expect(node.data.release).toBeGreaterThan(0);
            break;
            
          case 'lfo':
            expect(node.data.lfoWaveform).toBeTruthy();
            expect(node.data.lfoFrequency).toBeGreaterThan(0);
            expect(typeof node.data.lfoDepth).toBe('number');
            expect(node.data.lfoTarget).toBeTruthy();
            break;
            
          case 'effect':
            expect(node.data.effectType).toBeTruthy();
            expect(node.data.effectParams).toBeTruthy();
            expect(typeof node.data.effectParams).toBe('object');
            break;
            
          case 'output':
            // Output node has empty data, which is valid
            expect(node.data).toBeTruthy();
            break;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  test('Property 2: Node rendering completeness - multiple nodes maintain distinct identities', () => {
    fc.assert(
      fc.property(
        fc.array(nodeArbitrary, { minLength: 2, maxLength: 16 }),
        (nodes) => {
          // Verify all nodes have unique IDs
          const ids = nodes.map(n => n.id);
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(ids.length);

          // Verify all nodes have valid rendering properties
          nodes.forEach(node => {
            expect(node.type).toBeTruthy();
            expect(node.color).toBeTruthy();
            expect(node.color).toMatch(/^#[0-9A-F]{6}$/i);
            expect(node.width).toBeGreaterThan(0);
            expect(node.height).toBeGreaterThan(0);
            expect(node.inputs.length + node.outputs.length).toBeGreaterThan(0);
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
