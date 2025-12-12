# Visual Node-Based Synthesizer - Design Document

## Overview

The Visual Node-Based Synthesizer is a web-based audio synthesis application that uses a node-graph paradigm to make complex audio synthesis intuitive and visual. Users interact with a canvas where they can create, position, and connect synthesis nodes (oscillators, filters, envelopes, effects) to build custom audio signal chains. The interface emphasizes direct manipulation, real-time visual feedback, and spatial organization.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React UI Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Canvas     │  │  Node Editor │  │   Toolbar    │     │
│  │  Component   │  │    Panel     │  │  Component   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   State Management Layer                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Node Graph State (nodes, connections, selection)   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Audio Processing Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Graph        │  │  Audio       │  │  Synthesis   │     │
│  │ Traversal    │  │  Context     │  │  Engine      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Component Breakdown

1. **Canvas Component**: Renders the node graph using HTML5 Canvas API, handles mouse interactions for dragging and connecting nodes
2. **Node Editor Panel**: Displays and allows editing of selected node parameters with type-specific controls
3. **Toolbar Component**: Provides buttons for adding nodes, playing audio, exporting, and managing the canvas
4. **Node Graph State**: Manages the data structure representing nodes, connections, and UI state
5. **Graph Traversal**: Analyzes the node graph to determine audio processing order and detect cycles
6. **Audio Context**: Manages Web Audio API context and node creation
7. **Synthesis Engine**: Converts the visual node graph into Web Audio API nodes and processes audio

## Components and Interfaces

### Node Interface

```typescript
interface Node {
  id: string;                    // Unique identifier
  type: NodeType;                // 'oscillator' | 'filter' | 'envelope' | 'effect' | 'output'
  x: number;                     // Canvas X position
  y: number;                     // Canvas Y position
  width: number;                 // Node width in pixels
  height: number;                // Node height in pixels
  color: string;                 // Visual color (hex)
  data: NodeData;                // Type-specific parameters
  inputs: ConnectionPoint[];     // Input connection points
  outputs: ConnectionPoint[];    // Output connection points
}

type NodeType = 'oscillator' | 'filter' | 'envelope' | 'lfo' | 'effect' | 'output';

interface ConnectionPoint {
  id: string;
  x: number;  // Relative to node
  y: number;  // Relative to node
}

interface NodeData {
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
```

### Connection Interface

```typescript
interface Connection {
  id: string;
  from: string;      // Source node ID
  fromPoint: string; // Source connection point ID
  to: string;        // Destination node ID
  toPoint: string;   // Destination connection point ID
  active: boolean;   // Whether audio is currently flowing
}
```

### Canvas State Interface

```typescript
interface CanvasState {
  nodes: Node[];
  connections: Connection[];
  selectedNodeId: string | null;
  draggingNodeId: string | null;
  connectingFrom: { nodeId: string; pointId: string } | null;
  zoom: number;
  panX: number;
  panY: number;
}
```

## Data Models

### Node Graph Data Structure

The node graph is represented as an adjacency list for efficient traversal:

```typescript
interface NodeGraph {
  nodes: Map<string, Node>;
  adjacencyList: Map<string, string[]>;  // nodeId -> [connectedNodeIds]
  reverseAdjacencyList: Map<string, string[]>;  // For backward traversal
}
```

### Serialization Format

Patches are saved as JSON:

```json
{
  "version": "1.0",
  "nodes": [
    {
      "id": "osc1",
      "type": "oscillator",
      "x": 100,
      "y": 200,
      "data": {
        "waveform": "sine",
        "frequency": 440
      }
    }
  ],
  "connections": [
    {
      "id": "conn1",
      "from": "osc1",
      "to": "filter1"
    }
  ]
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptence Criteria Testing Prework

1.1 WHEN a user clicks an "Add Node" button THEN the system SHALL create a new node of the specified type and place it on the canvas
Thoughts: This is about all node creation operations, not specific instances. We can generate random node types and verify that clicking the add button results in a new node appearing in the state with the correct type.
Testable: yes - property

1.2 WHEN a node is created THEN the system SHALL assign it a unique identifier, default parameters, and a color based on its type
Thoughts: This applies to all node creation. We can create multiple nodes and verify each has a unique ID, has default parameters, and has the correct color for its type.
Testable: yes - property

1.3 WHEN the canvas displays nodes THEN the system SHALL render each node with its type label, parameter preview, and connection points
Thoughts: This is about the rendering function. We can generate random nodes and verify the rendered output contains the required elements.
Testable: yes - property

1.4 WHEN a user creates more than 16 nodes THEN the system SHALL prevent additional node creation and display a warning message
Thoughts: This is testing a specific boundary condition - the 16 node limit.
Testable: yes - edge case

1.5 WHERE a node type is oscillator, filter, envelope, or effect THEN the system SHALL initialize it with sensible default parameter values
Thoughts: This applies to all nodes of these types. We can verify that creating any node of these types results in valid default parameters.
Testable: yes - property

2.1 WHEN a user clicks and holds on a node THEN the system SHALL enter drag mode for that node
Thoughts: This is about the interaction model for all nodes. We can test that clicking any node enters drag mode.
Testable: yes - property

2.2 WHILE in drag mode THEN the system SHALL update the node position to follow the mouse cursor
Thoughts: This is about the behavior during dragging for all nodes. We can simulate drag events and verify position updates.
Testable: yes - property

2.3 WHEN the user releases the mouse button THEN the system SHALL exit drag mode and fix the node at its current position
Thoughts: This applies to all drag operations. We can test that releasing always exits drag mode.
Testable: yes - property

2.4 WHEN a node is being dragged THEN the system SHALL update all connected lines in real-time to maintain visual connections
Thoughts: This is about maintaining visual consistency during drag. We can test that connections remain attached to nodes during drag.
Testable: yes - property

2.5 WHEN a node is moved THEN the system SHALL constrain its position to remain within canvas boundaries
Thoughts: This is a boundary constraint that should apply to all node movements. We can test that no node position ever exceeds canvas bounds.
Testable: yes - property

3.1 WHEN a user clicks on a node's output connection point THEN the system SHALL enter connection mode
Thoughts: This applies to all nodes with output points. We can test that clicking any output point enters connection mode.
Testable: yes - property

3.2 WHILE in connection mode THEN the system SHALL display a temporary line from the source node to the mouse cursor
Thoughts: This is about the visual feedback during connection creation. We can verify the temporary line exists and updates.
Testable: yes - property

3.3 WHEN the user clicks on another node's input connection point THEN the system SHALL create a connection between the two nodes
Thoughts: This applies to all valid connection attempts. We can test that connecting any two compatible points creates a connection.
Testable: yes - property

3.4 WHEN a connection is created THEN the system SHALL render it as a curved line with a gradient from source to destination color
Thoughts: This is about the visual rendering of connections. We can verify the rendering output contains the expected visual elements.
Testable: yes - property

3.5 WHEN a user clicks on an existing connection THEN the system SHALL allow deletion of that connection
Thoughts: This applies to all connections. We can test that clicking any connection allows deletion.
Testable: yes - property

3.6 WHEN the system detects a connection cycle THEN the system SHALL prevent the connection and display an error message
Thoughts: This is about cycle detection in the graph. We can create various graph configurations and verify cycles are detected.
Testable: yes - property

4.1 WHEN a user clicks on a node THEN the system SHALL select that node and display its parameters in the editor panel
Thoughts: This applies to all nodes. We can test that clicking any node selects it and shows parameters.
Testable: yes - property

4.2 WHEN a node is selected THEN the system SHALL highlight it with a glow effect and thicker border
Thoughts: This is about visual feedback for selection. We can verify the rendering changes when a node is selected.
Testable: yes - property

4.3 WHEN the editor panel displays parameters THEN the system SHALL show controls appropriate to the node type
Thoughts: This is about the parameter editor showing type-specific controls. We can verify each node type shows the correct controls.
Testable: yes - property

4.4 WHEN a user adjusts a parameter THEN the system SHALL update the node's internal state immediately
Thoughts: This applies to all parameter adjustments. We can test that changing any parameter updates the node state.
Testable: yes - property

4.5 WHEN a parameter changes THEN the system SHALL update any visual representations (waveforms, envelopes) in real-time
Thoughts: This is about visual feedback updating with parameter changes. We can verify visual updates occur.
Testable: yes - property

5.1 WHEN an oscillator node is selected THEN the system SHALL display a waveform drawing area in the editor panel
Thoughts: This is specific to oscillator nodes. We can test that selecting any oscillator shows the drawing area.
Testable: yes - property

5.2 WHEN a user clicks and drags in the drawing area THEN the system SHALL capture the drawn path as a custom waveform
Thoughts: This is about the drawing interaction. We can simulate drawing and verify the waveform data is captured.
Testable: yes - property

5.3 WHEN a custom waveform is drawn THEN the system SHALL store the waveform data points with the oscillator node
Thoughts: This is about data persistence. We can verify drawn waveforms are stored in the node data.
Testable: yes - property

5.4 WHEN no custom waveform is drawn THEN the system SHALL display a preview of the selected standard waveform
Thoughts: This is about the default display state. We can verify standard waveforms are previewed.
Testable: yes - property

5.5 WHEN a user clears the drawing area THEN the system SHALL revert to using the selected standard waveform
Thoughts: This is about resetting to defaults. We can test that clearing removes custom waveform data.
Testable: yes - property

6.1 WHEN an envelope node is selected THEN the system SHALL display a visual representation of the ADSR curve
Thoughts: This applies to all envelope nodes. We can test that selecting any envelope shows the curve.
Testable: yes - property

6.2 WHEN a user adjusts attack, decay, sustain, or release parameters THEN the system SHALL update the visual curve in real-time
Thoughts: This is about visual feedback for parameter changes. We can verify the curve updates with parameter changes.
Testable: yes - property

6.3 WHEN the envelope curve is displayed THEN the system SHALL clearly show the attack ramp, decay slope, sustain level, and release tail
Thoughts: This is about the visual representation containing all ADSR components. We can verify the rendered curve has all parts.
Testable: yes - property

6.4 WHEN envelope parameters are at extreme values THEN the system SHALL render the curve accurately without visual artifacts
Thoughts: This is testing edge cases with extreme parameter values.
Testable: yes - edge case

7.1 WHEN a user clicks a delete button on a selected node THEN the system SHALL remove that node from the canvas
Thoughts: This applies to all deletable nodes. We can test that deleting any node removes it from state.
Testable: yes - property

7.2 WHEN a node is deleted THEN the system SHALL remove all connections to and from that node
Thoughts: This is about maintaining graph consistency. We can verify deleting a node removes its connections.
Testable: yes - property

7.3 WHEN the output node is selected THEN the system SHALL not display a delete button
Thoughts: This is a specific constraint on the output node.
Testable: yes - example

7.4 WHEN a connection is deleted THEN the system SHALL update the visual display to remove the connection line
Thoughts: This applies to all connection deletions. We can verify visual updates occur.
Testable: yes - property

7.5 WHEN the last oscillator node is deleted THEN the system SHALL warn the user that no audio source remains
Thoughts: This is a specific edge case about having no audio sources.
Testable: yes - edge case

9.1 WHEN a user clicks a save button THEN the system SHALL serialize the current node graph to JSON format
Thoughts: This is about serialization working for all graph states. We can test various graphs serialize correctly.
Testable: yes - property

9.2 WHEN saving a configuration THEN the system SHALL include all node positions, parameters, and connections
Thoughts: This is about completeness of serialization. We can verify all data is included.
Testable: yes - property

9.3 WHEN a user loads a saved configuration THEN the system SHALL recreate all nodes and connections exactly as saved
Thoughts: This is a round-trip property - save then load should produce the same state.
Testable: yes - property

9.4 WHEN loading fails due to invalid data THEN the system SHALL display an error message and maintain the current state
Thoughts: This is about error handling with invalid input.
Testable: yes - edge case

9.5 WHEN a configuration is loaded THEN the system SHALL validate that all node types and parameters are supported
Thoughts: This is about validation during loading. We can test that unsupported data is rejected.
Testable: yes - property

10.1 WHEN a user clicks the play button THEN the system SHALL traverse the node graph from output to sources and generate audio
Thoughts: This is about the graph traversal algorithm working for all valid graphs.
Testable: yes - property

10.2 WHEN generating audio THEN the system SHALL apply each node's processing in the correct order based on connections
Thoughts: This is about topological ordering being correct for all graphs.
Testable: yes - property

10.3 WHEN the play button is clicked while audio is playing THEN the system SHALL stop the current playback
Thoughts: This is about the play/stop toggle behavior.
Testable: yes - property

10.4 WHEN a user clicks the export button THEN the system SHALL render the audio to a WAV file and trigger download
Thoughts: This is about the export functionality working for all graphs.
Testable: yes - property

10.5 WHEN the node graph has no path from source to output THEN the system SHALL display an error and prevent playback
Thoughts: This is about detecting disconnected graphs.
Testable: yes - property

12.1 WHEN a user scrolls the mouse wheel THEN the system SHALL zoom the canvas in or out centered on the cursor position
Thoughts: This applies to all zoom operations. We can test that zooming maintains cursor position.
Testable: yes - property

12.2 WHEN a user middle-clicks and drags THEN the system SHALL pan the canvas view
Thoughts: This is about panning behavior for all pan operations.
Testable: yes - property

12.3 WHEN zooming or panning THEN the system SHALL maintain the relative positions of all nodes
Thoughts: This is an invariant - node relative positions don't change with view transforms.
Testable: yes - property

12.4 WHEN the canvas is zoomed THEN the system SHALL scale node sizes and connection lines proportionally
Thoughts: This is about visual consistency during zoom.
Testable: yes - property

12.5 WHEN the user presses a reset view button THEN the system SHALL return to default zoom and center position
Thoughts: This is about the reset function working correctly.
Testable: yes - property

### Property Reflection

After reviewing all properties, I've identified the following redundancies:

- Properties 2.1, 2.2, 2.3 can be combined into a single comprehensive "drag operation" property
- Properties 4.1 and 4.2 can be combined into a single "node selection" property
- Properties 5.1, 5.4 can be combined into "oscillator editor display" property
- Properties 7.1 and 7.4 can be combined into "deletion updates state and view" property

The remaining properties provide unique validation value and should be kept separate.

### Correctness Properties

Property 1: Node creation produces valid nodes
*For any* node type, creating a node should result in a new node with a unique ID, correct type, appropriate default parameters, and type-specific color
**Validates: Requirements 1.1, 1.2, 1.5**

Property 2: Node rendering completeness
*For any* node in the graph, the rendered output should contain the node's type label, parameter preview text, and visible connection points
**Validates: Requirements 1.3**

Property 3: Drag operation maintains consistency
*For any* node, performing a complete drag operation (mousedown, mousemove, mouseup) should update the node position, keep it within canvas bounds, and maintain all connection visual attachments
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 4: Connection creation is valid
*For any* two compatible nodes, creating a connection should result in a new connection in the graph, a visual curved line with gradient, and no cycles in the graph
**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.6**

Property 5: Connection deletion maintains consistency
*For any* existing connection, deleting it should remove it from the graph state and remove its visual representation
**Validates: Requirements 3.5**

Property 6: Node selection updates UI
*For any* node, selecting it should set it as the selected node, highlight it visually, and display its type-appropriate parameters in the editor panel
**Validates: Requirements 4.1, 4.2, 4.3**

Property 7: Parameter changes update state and visuals
*For any* node parameter, changing its value should immediately update the node's internal state and any associated visual representations (waveforms, envelopes)
**Validates: Requirements 4.4, 4.5**

Property 8: Custom waveform round-trip
*For any* oscillator node, drawing a custom waveform, saving the patch, and loading it should preserve the custom waveform data
**Validates: Requirements 5.2, 5.3**

Property 9: Oscillator editor displays appropriate content
*For any* oscillator node, selecting it should display the waveform drawing area, and the area should show either the custom waveform or a preview of the selected standard waveform
**Validates: Requirements 5.1, 5.4, 5.5**

Property 10: Envelope visualization accuracy
*For any* envelope node with any valid ADSR parameters, the visual curve should contain distinct attack, decay, sustain, and release segments that accurately represent the parameter values
**Validates: Requirements 6.1, 6.2, 6.3**

Property 11: Node deletion maintains graph integrity
*For any* deletable node, deleting it should remove the node from state, remove all its connections, and update the visual display
**Validates: Requirements 7.1, 7.2, 7.4**

Property 12: Save/load round-trip preserves state
*For any* valid node graph, saving it to JSON and then loading that JSON should produce a graph with identical nodes (same IDs, types, positions, parameters) and identical connections
**Validates: Requirements 9.1, 9.2, 9.3, 9.5**

Property 13: Graph traversal produces valid audio order
*For any* connected node graph with a path from source to output, traversing the graph should produce a topologically sorted list of nodes where each node appears after all its dependencies
**Validates: Requirements 10.1, 10.2**

Property 14: Disconnected graph detection
*For any* node graph, if there is no path from any oscillator node to the output node, the playback validation should return false and provide an error message
**Validates: Requirements 10.5**

Property 15: Zoom maintains cursor position
*For any* zoom operation at a given cursor position, the canvas point under the cursor before zoom should remain under the cursor after zoom
**Validates: Requirements 12.1**

Property 16: View transforms preserve node relationships
*For any* node graph, applying zoom or pan transformations should not change the relative positions between nodes (distances and angles between node centers remain constant)
**Validates: Requirements 12.3, 12.4**

Property 17: Pan operation updates view
*For any* pan operation, the canvas view offset should change by the drag distance, and all nodes should appear to move by the same amount
**Validates: Requirements 12.2**

Property 18: View reset returns to defaults
*For any* canvas state, pressing the reset view button should set zoom to 1.0 and pan offsets to (0, 0)
**Validates: Requirements 12.5**

## Error Handling

### User Input Errors
- Invalid node connections (cycles, incompatible types): Display error message, prevent connection
- Attempting to delete output node: Hide delete button, show tooltip explaining it's required
- Exceeding node limit: Disable add buttons, show warning message
- Invalid parameter values: Clamp to valid range, show validation message

### Data Errors
- Corrupted save file: Show error dialog, maintain current state
- Unsupported node types in loaded file: Skip unsupported nodes, show warning
- Missing required fields: Use defaults, log warning

### Audio Errors
- No audio source in graph: Prevent playback, show error message
- Web Audio API not supported: Show browser compatibility message
- Audio context suspended: Prompt user to interact with page to resume

## Testing Strategy

### Unit Testing
- Node creation functions with various types
- Graph traversal algorithms (topological sort, cycle detection)
- Serialization/deserialization functions
- Parameter validation and clamping
- Coordinate transformation functions (canvas to screen, screen to canvas)

### Property-Based Testing
- Use fast-check library for JavaScript/TypeScript
- Generate random node graphs and verify properties hold
- Test with 100+ iterations per property
- Focus on graph invariants, serialization round-trips, and UI consistency

### Integration Testing
- Canvas rendering with various node configurations
- Mouse interaction sequences (drag, connect, select)
- Audio generation from node graphs
- Save/load workflows

### Visual Regression Testing
- Capture screenshots of canvas with various node layouts
- Compare against baseline images
- Detect unintended visual changes

## Performance Considerations

- Canvas rendering optimized with dirty rectangles (only redraw changed areas)
- Connection curves pre-calculated and cached
- Graph traversal memoized during audio generation
- Debounce parameter updates during rapid slider movements
- Limit canvas redraw rate to 60fps
- Use requestAnimationFrame for smooth animations

## Accessibility

- Keyboard navigation for node selection (Tab, Arrow keys)
- Keyboard shortcuts for common actions (Delete, Ctrl+S for save)
- ARIA labels on interactive elements
- High contrast mode support
- Screen reader announcements for state changes

## Future Enhancements

- Multi-select nodes for batch operations
- Copy/paste nodes and subgraphs
- Undo/redo functionality
- Node grouping/modules
- Preset library
- MIDI input support
- Real-time audio visualization
- Collaborative editing
