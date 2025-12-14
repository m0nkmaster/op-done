/**
 * Property-based tests for node creation
 */

import { describe, test, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import {
  createNode,
  createOscillatorNode,
  createFilterNode,
  createEnvelopeNode,
  createLFONode,
  createEffectNode,
  createOutputNode,
  resetNodeIdCounter,
} from './nodeFactory';
import type { NodeType } from '../types/nodeGraph';

// Arbitrary for generating node types
const nodeTypeArbitrary = fc.constantFrom<NodeType>(
  'oscillator',
  'filter',
  'envelope',
  'lfo',
  'effect',
  'output'
);

// Arbitrary for generating positions
const positionArbitrary = fc.integer({ min: -10000, max: 10000 });

describe('Node Creation', () => {
  beforeEach(() => {
    // Reset counter before each test to ensure consistent IDs
    resetNodeIdCounter();
  });

  /**
   * Feature: visual-node-synth, Property 1: Node creation produces valid nodes
   * For any node type, creating a node should result in a new node with a unique ID,
   * correct type, appropriate default parameters, and type-specific color
   * Validates: Requirements 1.1, 1.2, 1.5
   */
  test('node creation produces valid nodes with unique IDs, correct type, defaults, and color', () => {
    fc.assert(
      fc.property(
        nodeTypeArbitrary,
        positionArbitrary,
        positionArbitrary,
        (nodeType, x, y) => {
          const node = createNode(nodeType, x, y);

          // Node should have a unique ID that includes the type
          expect(node.id).toBeTruthy();
          expect(node.id).toContain(nodeType);

          // Node should have the correct type
          expect(node.type).toBe(nodeType);

          // Node should have the specified position
          expect(node.x).toBe(x);
          expect(node.y).toBe(y);

          // Node should have dimensions
          expect(node.width).toBeGreaterThan(0);
          expect(node.height).toBeGreaterThan(0);

          // Node should have a color (hex format)
          expect(node.color).toMatch(/^#[0-9A-F]{6}$/i);

          // Node should have data object
          expect(node.data).toBeDefined();
          expect(typeof node.data).toBe('object');

          // Node should have connection points
          expect(Array.isArray(node.inputs)).toBe(true);
          expect(Array.isArray(node.outputs)).toBe(true);

          // Verify type-specific default parameters
          switch (nodeType) {
            case 'oscillator':
              expect(node.data.waveform).toBeDefined();
              expect(['sine', 'square', 'sawtooth', 'triangle', 'custom']).toContain(
                node.data.waveform
              );
              expect(node.data.frequency).toBeGreaterThan(0);
              expect(node.data.detune).toBeDefined();
              // Oscillators should have outputs but no inputs
              expect(node.outputs.length).toBeGreaterThan(0);
              expect(node.inputs.length).toBe(0);
              break;

            case 'filter':
              expect(node.data.filterType).toBeDefined();
              expect(['lowpass', 'highpass', 'bandpass', 'notch']).toContain(
                node.data.filterType
              );
              expect(node.data.cutoff).toBeGreaterThan(0);
              expect(node.data.resonance).toBeGreaterThan(0);
              // Filters should have both inputs and outputs
              expect(node.inputs.length).toBeGreaterThan(0);
              expect(node.outputs.length).toBeGreaterThan(0);
              break;

            case 'envelope':
              expect(node.data.attack).toBeGreaterThan(0);
              expect(node.data.decay).toBeGreaterThan(0);
              expect(node.data.sustain).toBeGreaterThanOrEqual(0);
              expect(node.data.sustain).toBeLessThanOrEqual(1);
              expect(node.data.release).toBeGreaterThan(0);
              // Envelopes should have both inputs and outputs
              expect(node.inputs.length).toBeGreaterThan(0);
              expect(node.outputs.length).toBeGreaterThan(0);
              break;

            case 'lfo':
              expect(node.data.lfoWaveform).toBeDefined();
              expect(['sine', 'square', 'sawtooth', 'triangle']).toContain(
                node.data.lfoWaveform
              );
              expect(node.data.lfoFrequency).toBeGreaterThan(0);
              expect(node.data.lfoDepth).toBeGreaterThanOrEqual(0);
              expect(node.data.lfoDepth).toBeLessThanOrEqual(1);
              expect(node.data.lfoTarget).toBeDefined();
              expect(['pitch', 'filter', 'amplitude']).toContain(node.data.lfoTarget);
              // LFOs should have both inputs and outputs
              expect(node.inputs.length).toBeGreaterThan(0);
              expect(node.outputs.length).toBeGreaterThan(0);
              break;

            case 'effect':
              expect(node.data.effectType).toBeDefined();
              expect(['reverb', 'delay', 'distortion', 'compressor']).toContain(
                node.data.effectType
              );
              expect(node.data.effectParams).toBeDefined();
              expect(typeof node.data.effectParams).toBe('object');
              // Effects should have both inputs and outputs
              expect(node.inputs.length).toBeGreaterThan(0);
              expect(node.outputs.length).toBeGreaterThan(0);
              break;

            case 'output':
              // Output node should have minimal data
              expect(Object.keys(node.data).length).toBe(0);
              // Output should have inputs but no outputs
              expect(node.inputs.length).toBeGreaterThan(0);
              expect(node.outputs.length).toBe(0);
              break;
          }

          // Verify connection points have proper structure
          [...node.inputs, ...node.outputs].forEach((point) => {
            expect(point.id).toBeTruthy();
            expect(typeof point.x).toBe('number');
            expect(typeof point.y).toBe('number');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: visual-node-synth, Property 1: Node creation produces valid nodes
   * Multiple nodes created in sequence should have unique IDs
   * Validates: Requirements 1.2
   */
  test('multiple nodes created in sequence have unique IDs', () => {
    fc.assert(
      fc.property(
        fc.array(nodeTypeArbitrary, { minLength: 2, maxLength: 20 }),
        (nodeTypes) => {
          resetNodeIdCounter();
          const nodes = nodeTypes.map((type) => createNode(type));
          const ids = nodes.map((node) => node.id);

          // All IDs should be unique
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(ids.length);

          // Each node should have the correct type
          nodes.forEach((node, index) => {
            expect(node.type).toBe(nodeTypes[index]);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: visual-node-synth, Property 1: Node creation produces valid nodes
   * Type-specific factory functions should create nodes of the correct type
   * Validates: Requirements 1.1, 1.2
   */
  test('type-specific factory functions create correct node types', () => {
    fc.assert(
      fc.property(positionArbitrary, positionArbitrary, (x, y) => {
        resetNodeIdCounter();

        const oscillator = createOscillatorNode(x, y);
        expect(oscillator.type).toBe('oscillator');
        expect(oscillator.x).toBe(x);
        expect(oscillator.y).toBe(y);

        const filter = createFilterNode(x, y);
        expect(filter.type).toBe('filter');
        expect(filter.x).toBe(x);
        expect(filter.y).toBe(y);

        const envelope = createEnvelopeNode(x, y);
        expect(envelope.type).toBe('envelope');
        expect(envelope.x).toBe(x);
        expect(envelope.y).toBe(y);

        const lfo = createLFONode(x, y);
        expect(lfo.type).toBe('lfo');
        expect(lfo.x).toBe(x);
        expect(lfo.y).toBe(y);

        const effect = createEffectNode(x, y);
        expect(effect.type).toBe('effect');
        expect(effect.x).toBe(x);
        expect(effect.y).toBe(y);

        const output = createOutputNode(x, y);
        expect(output.type).toBe('output');
        expect(output.x).toBe(x);
        expect(output.y).toBe(y);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: visual-node-synth, Property 1: Node creation produces valid nodes
   * Nodes created without position arguments should use default positions
   * Validates: Requirements 1.1
   */
  test('nodes created without position arguments use defaults', () => {
    fc.assert(
      fc.property(nodeTypeArbitrary, (nodeType) => {
        resetNodeIdCounter();
        const node = createNode(nodeType);

        // Should have default position (100, 100)
        expect(node.x).toBe(100);
        expect(node.y).toBe(100);

        // Should still have all other valid properties
        expect(node.id).toBeTruthy();
        expect(node.type).toBe(nodeType);
        expect(node.color).toMatch(/^#[0-9A-F]{6}$/i);
        expect(node.data).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: visual-node-synth, Property 1: Node creation produces valid nodes
   * Each node type should have a distinct color
   * Validates: Requirements 1.2
   */
  test('each node type has a distinct color', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        resetNodeIdCounter();

        const oscillator = createOscillatorNode();
        const filter = createFilterNode();
        const envelope = createEnvelopeNode();
        const lfo = createLFONode();
        const effect = createEffectNode();
        const output = createOutputNode();

        const colors = [
          oscillator.color,
          filter.color,
          envelope.color,
          lfo.color,
          effect.color,
          output.color,
        ];

        // All colors should be unique
        const uniqueColors = new Set(colors);
        expect(uniqueColors.size).toBe(colors.length);

        // All colors should be valid hex colors
        colors.forEach((color) => {
          expect(color).toMatch(/^#[0-9A-F]{6}$/i);
        });
      }),
      { numRuns: 100 }
    );
  });
});
