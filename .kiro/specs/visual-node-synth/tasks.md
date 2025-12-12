# Implementation Plan

- [x] 1. Set up core data structures and state management
  - Create TypeScript interfaces for Node, Connection, NodeGraph, CanvasState
  - Implement node factory functions for each node type with default parameters
  - Create state management hooks using React useState/useReducer
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 1.1 Write property test for node creation
  - **Property 1: Node creation produces valid nodes**
  - **Validates: Requirements 1.1, 1.2, 1.5**

- [-] 2. Implement canvas rendering system
  - Set up HTML5 Canvas with proper sizing and scaling
  - Implement grid background rendering
  - Create node rendering function with type labels, parameters, and connection points
  - Implement connection rendering with Bezier curves and gradients
  - Add selection highlighting (glow effect, thicker border)
  - _Requirements: 1.3, 4.2, 8.1, 8.3_

- [-] 2.1 Write property test for node rendering
  - **Property 2: Node rendering completeness**
  - **Validates: Requirements 1.3**

- [ ] 3. Implement node dragging functionality
  - Add mousedown handler to detect node clicks and enter drag mode
  - Add mousemove handler to update node position during drag
  - Add mouseup handler to exit drag mode
  - Implement canvas boundary constraints
  - Update connection lines in real-time during drag
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 3.1 Write property test for drag operations
  - **Property 3: Drag operation maintains consistency**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

- [ ] 4. Implement node connection system
  - Add click handlers for connection points to enter connection mode
  - Render temporary connection line following mouse cursor
  - Implement connection creation on second click
  - Add connection deletion on connection click
  - Implement cycle detection algorithm
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 4.1 Write property test for connection creation
  - **Property 4: Connection creation is valid**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.6**

- [ ] 4.2 Write property test for connection deletion
  - **Property 5: Connection deletion maintains consistency**
  - **Validates: Requirements 3.5**

- [ ] 5. Implement node selection and editor panel
  - Add click handler for node selection
  - Create editor panel component with conditional rendering based on node type
  - Implement oscillator parameter controls (waveform selector, frequency slider, detune)
  - Implement filter parameter controls (type selector, cutoff, resonance)
  - Implement envelope parameter controls (ADSR sliders)
  - Implement LFO parameter controls (waveform, frequency, depth, target)
  - Implement effect parameter controls (type-specific parameters)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 5.1 Write property test for node selection
  - **Property 6: Node selection updates UI**
  - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ]* 5.2 Write property test for parameter changes
  - **Property 7: Parameter changes update state and visuals**
  - **Validates: Requirements 4.4, 4.5**

- [ ] 6. Implement custom waveform drawing
  - Create SVG drawing area in oscillator editor
  - Add mouse event handlers for drawing (mousedown, mousemove, mouseup)
  - Capture drawn path as array of amplitude values
  - Store custom waveform data in node state
  - Render waveform preview (custom or standard)
  - Add clear button to reset to standard waveform
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 6.1 Write property test for waveform drawing
  - **Property 8: Custom waveform round-trip**
  - **Validates: Requirements 5.2, 5.3**

- [ ]* 6.2 Write property test for oscillator editor display
  - **Property 9: Oscillator editor displays appropriate content**
  - **Validates: Requirements 5.1, 5.4, 5.5**

- [ ] 7. Implement envelope visualization
  - Create SVG component for ADSR curve rendering
  - Calculate curve points from ADSR parameters
  - Update curve in real-time as parameters change
  - Render attack ramp, decay slope, sustain level, release tail
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ]* 7.1 Write property test for envelope visualization
  - **Property 10: Envelope visualization accuracy**
  - **Validates: Requirements 6.1, 6.2, 6.3**

- [ ] 8. Implement node and connection deletion
  - Add delete button to editor panel (hidden for output node)
  - Implement node deletion function that removes node and all its connections
  - Implement connection deletion on click
  - Add warning when deleting last oscillator
  - Update canvas rendering after deletion
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 8.1 Write property test for node deletion
  - **Property 11: Node deletion maintains graph integrity**
  - **Validates: Requirements 7.1, 7.2, 7.4**

- [ ] 9. Implement save and load functionality
  - Create serialization function to convert graph state to JSON
  - Create deserialization function to recreate graph from JSON
  - Add save button that triggers JSON download
  - Add load button with file input
  - Implement validation for loaded data
  - Add error handling for invalid files
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 9.1 Write property test for save/load round-trip
  - **Property 12: Save/load round-trip preserves state**
  - **Validates: Requirements 9.1, 9.2, 9.3, 9.5**

- [ ] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement graph traversal and audio generation
  - Implement topological sort algorithm for node ordering
  - Create function to detect disconnected graphs
  - Implement Web Audio API node creation from visual nodes
  - Connect Web Audio nodes based on visual connections
  - Add play button handler to generate and play audio
  - Add stop button handler to stop playback
  - Add export button to render audio to WAV file
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 11.1 Write property test for graph traversal
  - **Property 13: Graph traversal produces valid audio order**
  - **Validates: Requirements 10.1, 10.2**

- [ ]* 11.2 Write property test for disconnected graph detection
  - **Property 14: Disconnected graph detection**
  - **Validates: Requirements 10.5**

- [ ] 12. Implement zoom and pan functionality
  - Add mouse wheel handler for zoom
  - Implement zoom centered on cursor position
  - Add middle-click drag handler for panning
  - Transform node positions and sizes based on zoom/pan
  - Add reset view button
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ]* 12.1 Write property test for zoom cursor position
  - **Property 15: Zoom maintains cursor position**
  - **Validates: Requirements 12.1**

- [ ]* 12.2 Write property test for view transforms
  - **Property 16: View transforms preserve node relationships**
  - **Validates: Requirements 12.3, 12.4**

- [ ]* 12.3 Write property test for pan operation
  - **Property 17: Pan operation updates view**
  - **Validates: Requirements 12.2**

- [ ]* 12.4 Write property test for view reset
  - **Property 18: View reset returns to defaults**
  - **Validates: Requirements 12.5**

- [ ] 13. Implement toolbar and node creation
  - Create toolbar component with add node buttons
  - Add button handlers to create nodes of each type
  - Implement node limit (16 nodes) with warning
  - Add play, stop, export buttons to toolbar
  - Add save/load buttons to toolbar
  - _Requirements: 1.1, 1.4, 10.3, 10.4_

- [ ] 14. Add visual feedback for active audio
  - Implement active state tracking during playback
  - Add pulsing/glow effects to active nodes
  - Add animated effects to active connections
  - Remove effects when playback stops
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 15. Polish and optimization
  - Implement dirty rectangle rendering optimization
  - Add connection curve caching
  - Debounce parameter updates
  - Limit canvas redraw rate to 60fps
  - Add keyboard shortcuts (Delete, Ctrl+S, Tab navigation)
  - Add ARIA labels for accessibility
  - Test browser compatibility

- [ ] 16. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
