# Synthesizer UI Redesign - Design Document

## Overview

This design document outlines three distinct prototype UIs for the synthesizer redesign. Each prototype will be a standalone page implementing the same synthesis functionality with different visual and interaction approaches. The prototypes focus on continuous rotation dials, visible parameter ranges, keyboard accessibility, and polished aesthetics.

All prototypes will:
- Use the existing `SoundConfig` type and `synthesizeSound` function
- Implement continuous rotation dials (360° rotation without limits)
- Display min/max values on all controls
- Support full keyboard navigation and control
- Organize parameters using tabs or equivalent grouping
- Provide smooth animations and visual feedback

## Architecture

### Prototype Structure

Each prototype will be implemented as a separate page component:

```
src/pages/
├── SynthPrototypeA.tsx  (Minimalist design)
├── SynthPrototypeB.tsx  (Hardware-inspired design)
├── SynthPrototypeC.tsx  (Modern flat design)
```

### Shared Components

To avoid duplication, shared logic will be extracted:

```
src/components/synth-prototypes/
├── shared/
│   ├── useSynthState.ts          (Shared state management hook)
│   ├── useAudioPlayback.ts       (Shared audio playback logic)
│   └── audioExport.ts            (Shared WAV export utility)
├── prototype-a/
│   ├── DialA.tsx                 (Minimalist dial)
│   ├── TabsA.tsx                 (Minimalist tabs)
│   └── ControlPanelA.tsx         (Minimalist panels)
├── prototype-b/
│   ├── DialB.tsx                 (Hardware-inspired dial)
│   ├── TabsB.tsx                 (Hardware-inspired tabs)
│   └── ControlPanelB.tsx         (Hardware-inspired panels)
└── prototype-c/
    ├── DialC.tsx                 (Modern flat dial)
    ├── TabsC.tsx                 (Modern flat tabs)
    └── ControlPanelC.tsx         (Modern flat panels)
```

### Routing

Add routes to `src/App.tsx`:

```typescript
<Route path="/synth-prototype-a" element={<SynthPrototypeA />} />
<Route path="/synth-prototype-b" element={<SynthPrototypeB />} />
<Route path="/synth-prototype-c" element={<SynthPrototypeC />} />
```

### State Management

Each prototype will use a shared custom hook for state management:

```typescript
// useSynthState.ts
export function useSynthState() {
  const [config, setConfig] = useState<SoundConfig>(DEFAULT_PRESET);
  
  const updateLayer = (index: number, layer: Layer) => { /* ... */ };
  const updateEnvelope = (envelope: Envelope) => { /* ... */ };
  const updateFilter = (filter: Filter) => { /* ... */ };
  // ... other update functions
  
  return { config, updateLayer, updateEnvelope, updateFilter, /* ... */ };
}
```

## Components and Interfaces

### Continuous Rotation Dial Component

All three prototypes will implement continuous rotation dials with these core features:

```typescript
interface ContinuousDialProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  label: string;
  unit?: string;
  onChange: (value: number) => void;
  logarithmic?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}
```

**Key Behaviors:**
- **Continuous Rotation**: Dial rotates infinitely; visual indicator wraps around
- **Value Clamping**: Internal value is clamped to [min, max] even as dial continues rotating
- **Visual Feedback**: When value hits min/max, dial changes color/opacity but continues rotating
- **Drag Interaction**: Vertical mouse drag adjusts value (up = increase, down = decrease)
- **Keyboard Support**:
  - Tab: Focus control
  - Arrow Up/Down: Increment/decrement by step
  - Number keys: Enter direct numeric input mode
  - Enter: Confirm numeric input
  - Escape: Cancel numeric input

**Rotation Calculation:**
```typescript
// Track cumulative rotation angle (unbounded)
const [rotationAngle, setRotationAngle] = useState(0);

// Map value to visual angle (0-360°, wraps around)
const valueToVisualAngle = (val: number) => {
  const normalized = (val - min) / (max - min);
  return normalized * 360;
};

// On drag, update rotation angle continuously
const handleDrag = (deltaY: number) => {
  const newAngle = rotationAngle + deltaY * sensitivity;
  setRotationAngle(newAngle);
  
  // Convert angle to value, clamp to range
  const rotations = newAngle / 360;
  const newValue = min + (rotations % 1) * (max - min);
  const clampedValue = Math.max(min, Math.min(max, newValue));
  
  onChange(clampedValue);
};
```

### Tab Navigation Component

Each prototype will implement tab-based organization:

```typescript
interface TabConfig {
  id: string;
  label: string;
  icon?: React.ReactNode;
  modified?: boolean;  // Show indicator if values changed
}

interface TabsProps {
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}
```

**Tab Groups:**
1. **Synthesis** - Layers, oscillators, noise, FM, Karplus-Strong
2. **Envelope** - ADSR controls, envelope visualization
3. **Filter** - Filter type, cutoff, resonance, filter envelope
4. **Modulation** - LFO controls, modulation routing
5. **Effects** - Reverb, delay, distortion, compressor, gate
6. **Playback** - Duration, play, export, presets

## Data Models

### Shared State Hook

```typescript
interface SynthState {
  config: SoundConfig;
  activeTab: string;
  playing: boolean;
  exporting: boolean;
  error: string | null;
}

interface SynthActions {
  updateLayer: (index: number, layer: Layer) => void;
  addLayer: (type: LayerType) => void;
  removeLayer: (index: number) => void;
  updateEnvelope: (envelope: Envelope) => void;
  updateFilter: (filter: Filter) => void;
  updateLFO: (lfo: LFO) => void;
  updateEffects: (effects: Effects) => void;
  updateDuration: (duration: number) => void;
  setActiveTab: (tab: string) => void;
  play: () => Promise<void>;
  export: () => Promise<void>;
}
```

## Prototype A: Minimalist Design

### Visual Characteristics
- **Color Palette**: Monochrome with single accent color (blue)
- **Typography**: Clean sans-serif, generous whitespace
- **Dials**: Large (80px), simple circle with single indicator line
- **Layout**: Centered content, maximum 1200px width
- **Animations**: Subtle, fast (150ms)

### Dial Design
```
┌─────────────┐
│   CUTOFF    │  ← Label
│             │
│      ●      │  ← Large dial (80px)
│     ╱       │  ← Single indicator line
│             │
│   2.5k Hz   │  ← Current value
│  20Hz-20kHz │  ← Min-Max range
└─────────────┘
```

### Tab Design
- Horizontal tabs at top
- Underline indicator for active tab
- Minimal borders, lots of whitespace

### Key Features
- Focus on clarity and simplicity
- Large, easy-to-target controls
- Minimal visual noise
- High contrast for readability

## Prototype B: Hardware-Inspired Design

### Visual Characteristics
- **Color Palette**: Dark background (#1a1a1a) with metallic accents
- **Typography**: Monospace for values, sans-serif for labels
- **Dials**: Medium (64px), 3D appearance with shadows and highlights
- **Layout**: Panel-based, resembles hardware synth modules
- **Animations**: Mechanical feel (200ms with easing)

### Dial Design
```
┌─────────────┐
│   CUTOFF    │  ← Label (uppercase)
│             │
│   ╱───●───╲ │  ← 3D dial with depth
│  │    │    ││  ← Shadow/highlight
│   ╲───────╱ │
│             │
│   2.5k Hz   │  ← LED-style value display
│ 20Hz  20kHz │  ← Min/Max at edges
└─────────────┘
```

### Tab Design
- Vertical tabs on left side (like hardware modules)
- Panel-style with borders and shadows
- LED indicators for modified parameters

### Key Features
- Skeuomorphic design mimicking hardware
- Tactile visual feedback
- Panel-based organization
- Metallic textures and gradients

## Prototype C: Modern Flat Design

### Visual Characteristics
- **Color Palette**: Vibrant gradients, multiple accent colors
- **Typography**: Modern sans-serif (Inter, SF Pro)
- **Dials**: Medium (64px), flat with gradient fills
- **Layout**: Card-based, responsive grid
- **Animations**: Smooth, bouncy (250ms with spring easing)

### Dial Design
```
┌─────────────┐
│   Cutoff    │  ← Label (sentence case)
│             │
│    ╱───╲    │  ← Flat dial with gradient
│   │  ●  │   │  ← Circular progress indicator
│    ╲───╱    │
│             │
│   2.5k Hz   │  ← Value with unit
│ 20Hz - 20kHz│  ← Range with dash
└─────────────┘
```

### Tab Design
- Horizontal tabs with pill-shaped active indicator
- Smooth sliding animation between tabs
- Floating card design for panels

### Key Features
- Contemporary, app-like aesthetic
- Vibrant colors and gradients
- Smooth, fluid animations
- Card-based layout with shadows

## Keyboard Accessibility

All prototypes will implement consistent keyboard behavior:

### Focus Management
```typescript
// Tab order: left-to-right, top-to-bottom
const focusableElements = [
  'button',
  '[role="slider"]',
  'input',
  'select',
  '[tabindex="0"]'
];

// Visual focus indicator
const focusStyles = {
  outline: '2px solid #0066ff',
  outlineOffset: '2px',
  boxShadow: '0 0 0 4px rgba(0, 102, 255, 0.1)'
};
```

### Dial Keyboard Controls
```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault();
      onChange(Math.min(max, value + step));
      break;
    case 'ArrowDown':
      e.preventDefault();
      onChange(Math.max(min, value - step));
      break;
    case 'PageUp':
      e.preventDefault();
      onChange(Math.min(max, value + step * 10));
      break;
    case 'PageDown':
      e.preventDefault();
      onChange(Math.max(min, value - step * 10));
      break;
    case 'Home':
      e.preventDefault();
      onChange(min);
      break;
    case 'End':
      e.preventDefault();
      onChange(max);
      break;
    case '0': case '1': case '2': case '3': case '4':
    case '5': case '6': case '7': case '8': case '9':
    case '.': case '-':
      // Enter numeric input mode
      setNumericInputMode(true);
      setNumericInput(e.key);
      break;
    case 'Enter':
      if (numericInputMode) {
        const parsed = parseFloat(numericInput);
        if (!isNaN(parsed)) {
          onChange(Math.max(min, Math.min(max, parsed)));
        }
        setNumericInputMode(false);
      }
      break;
    case 'Escape':
      setNumericInputMode(false);
      setNumericInput('');
      break;
  }
};
```

### Numeric Input Mode
When a user types a number while a dial is focused:
1. Dial enters "input mode" - shows text input overlay
2. User types complete value
3. Press Enter to apply, Escape to cancel
4. Value is validated and clamped to [min, max]

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Continuous Rotation Behavior
*For any* dial control, when the user drags continuously in one direction, the dial should rotate infinitely without stopping, even when the parameter value reaches min or max.
**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Value Clamping
*For any* dial control with defined min/max bounds, the parameter value should always be clamped to the valid range regardless of rotation angle.
**Validates: Requirements 1.3**

### Property 3: Min/Max Display
*For any* dial control, the minimum and maximum values should be visible on the control at all times.
**Validates: Requirements 2.1, 2.2**

### Property 4: Tab State Preservation
*For any* prototype, switching between tabs should preserve all parameter values in all tabs.
**Validates: Requirements 3.3**

### Property 5: Keyboard Navigation Order
*For any* prototype, pressing Tab should move focus through controls in a logical, predictable order.
**Validates: Requirements 14.1, 14.4**

### Property 6: Arrow Key Adjustment
*For any* focused dial control, pressing arrow up/down should increment/decrement the value by the step amount.
**Validates: Requirements 14.2**

### Property 7: Numeric Input Validation
*For any* dial control in numeric input mode, entering a value outside [min, max] should clamp the value to the valid range.
**Validates: Requirements 14.3**

### Property 8: Focus Indicator Visibility
*For any* focused control, a clear visual focus indicator should be displayed.
**Validates: Requirements 14.5**

### Property 9: Prototype Independence
*For any* two prototypes, navigating between them should not carry over state from one to the other.
**Validates: Requirements 11.3**

### Property 10: Synthesis Consistency
*For any* prototype, given the same SoundConfig, the synthesized audio should be identical across all three prototypes.
**Validates: Requirements 5.3**

### Property 11: Animation Smoothness
*For any* control interaction, state transitions should use smooth animations without jarring jumps.
**Validates: Requirements 4.1, 4.2**

### Property 12: Hover State Feedback
*For any* interactive element, hovering should display a hover state with smooth transition.
**Validates: Requirements 4.5**

## Error Handling

### Synthesis Errors
- Display error message in a toast/alert
- Log detailed error to console
- Keep UI functional (don't crash)

### Invalid Input
- Numeric input: Show validation error, don't apply invalid value
- Out-of-range: Clamp to valid range, show warning

### Audio Context Errors
- Browser compatibility: Show message with browser requirements
- Permissions: Request user interaction if needed

## Testing Strategy

### Unit Testing

**Dial Component Tests:**
- Continuous rotation behavior
- Value clamping at boundaries
- Keyboard input handling
- Numeric input mode
- Focus management

**Tab Component Tests:**
- Tab switching
- State preservation
- Modified indicator display

**State Hook Tests:**
- Config updates
- Layer management
- Parameter validation

### Property-Based Testing

The UI will use fast-check for property tests:

- **Configuration**: Each property test will run a minimum of 100 iterations
- **Tagging**: Each property test will include a comment with the format: `**Feature: synth-ui-redesign, Property {number}: {property_text}**`

**Property Test Examples:**

```typescript
import fc from 'fast-check';

/**
 * Feature: synth-ui-redesign, Property 1: Continuous Rotation Behavior
 * For any dial control, when the user drags continuously in one direction,
 * the dial should rotate infinitely without stopping.
 */
test('continuous rotation property', () => {
  fc.assert(
    fc.property(
      fc.float({ min: -10000, max: 10000 }), // Arbitrary rotation angle
      fc.float({ min: 0, max: 1 }),          // Min value
      fc.float({ min: 1, max: 100 }),        // Max value
      (angle, min, max) => {
        const value = angleToValue(angle, min, max);
        expect(value).toBeGreaterThanOrEqual(min);
        expect(value).toBeLessThanOrEqual(max);
      }
    ),
    { numRuns: 100 }
  );
});

/**
 * Feature: synth-ui-redesign, Property 7: Numeric Input Validation
 * For any dial control in numeric input mode, entering a value outside
 * [min, max] should clamp the value to the valid range.
 */
test('numeric input clamping property', () => {
  fc.assert(
    fc.property(
      fc.float({ min: -1000, max: 1000 }),  // Input value
      fc.float({ min: 0, max: 1 }),         // Min
      fc.float({ min: 1, max: 100 }),       // Max
      (input, min, max) => {
        const clamped = clampValue(input, min, max);
        expect(clamped).toBeGreaterThanOrEqual(min);
        expect(clamped).toBeLessThanOrEqual(max);
        if (input < min) expect(clamped).toBe(min);
        if (input > max) expect(clamped).toBe(max);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Manual Testing

**Visual Comparison:**
- Side-by-side comparison of all three prototypes
- Aesthetic evaluation (polish, consistency, appeal)
- Animation smoothness and timing

**Interaction Testing:**
- Dial responsiveness and feel
- Keyboard navigation flow
- Tab switching smoothness
- Focus indicator visibility

**Accessibility Testing:**
- Keyboard-only navigation
- Screen reader compatibility (basic)
- Focus trap prevention
- Color contrast validation

### Testing Framework Setup

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

## Implementation Notes

### Performance Considerations

- **Dial Rendering**: Use CSS transforms for rotation (GPU-accelerated)
- **State Updates**: Debounce rapid parameter changes during drag
- **Tab Switching**: Lazy load tab content to reduce initial render time
- **Animation**: Use `requestAnimationFrame` for smooth 60fps animations

### Browser Compatibility

- Target modern browsers (Chrome, Firefox, Safari, Edge)
- Use CSS custom properties for theming
- Polyfill Web Audio API if needed
- Test on both desktop and tablet (touch support)

### Code Organization

```
src/
├── components/
│   └── synth-prototypes/
│       ├── shared/
│       │   ├── useSynthState.ts
│       │   ├── useAudioPlayback.ts
│       │   ├── audioExport.ts
│       │   └── types.ts
│       ├── prototype-a/
│       │   ├── DialA.tsx
│       │   ├── TabsA.tsx
│       │   ├── ControlPanelA.tsx
│       │   └── styles.ts
│       ├── prototype-b/
│       │   ├── DialB.tsx
│       │   ├── TabsB.tsx
│       │   ├── ControlPanelB.tsx
│       │   └── styles.ts
│       └── prototype-c/
│           ├── DialC.tsx
│           ├── TabsC.tsx
│           ├── ControlPanelC.tsx
│           └── styles.ts
├── pages/
│   ├── SynthPrototypeA.tsx
│   ├── SynthPrototypeB.tsx
│   └── SynthPrototypeC.tsx
└── test/
    └── synth-prototypes/
        ├── dial.test.tsx
        ├── tabs.test.tsx
        └── state.test.ts
```

### Shared Utilities

Extract common logic to avoid duplication:

```typescript
// audioExport.ts
export function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  // Shared WAV export logic
}

// useSynthState.ts
export function useSynthState() {
  // Shared state management
}

// useAudioPlayback.ts
export function useAudioPlayback(config: SoundConfig) {
  // Shared playback logic
}
```

## Next Steps

After design approval:
1. Create implementation task list
2. Build shared utilities first
3. Implement Prototype A (simplest)
4. Implement Prototype B
5. Implement Prototype C
6. Add routing and navigation
7. Manual testing and comparison
8. User selects preferred design
9. Refine selected design
10. Replace production SynthesizerUI
