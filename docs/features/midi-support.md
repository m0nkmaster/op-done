# MIDI Support

Real-time MIDI input for the Synth Engine page.

## Features

- **Device Selection**: Auto-detects connected MIDI devices via Web MIDI API
- **Live Playing**: Play the current synth patch with any MIDI controller
- **Visual Feedback**: LED indicator shows MIDI activity, active notes displayed as badges
- **Polyphonic**: Up to 16 simultaneous voices with voice stealing

## Components

### `useMidi` Hook (`src/hooks/useMidi.ts`)

React hook for Web MIDI API integration.

```typescript
const midi = useMidi({
  onNoteOn: (note) => { /* handle note on */ },
  onNoteOff: (note) => { /* handle note off */ },
  onCC: (cc) => { /* handle control change */ },
  onPitchBend: (value, channel) => { /* handle pitch bend */ },
});
```

**Returns:**
- `supported`: Whether Web MIDI is available
- `enabled`: Whether MIDI access was granted
- `devices`: Array of connected MIDI input devices
- `selectedDeviceId`: Currently selected device
- `selectDevice(id)`: Select a device by ID
- `activeNotes`: Set of currently held note numbers
- `lastNote`: Most recent note event

**Utilities:**
- `midiToFrequency(note)`: Convert MIDI note to frequency (Hz)
- `midiVelocityToGain(velocity)`: Convert velocity (0-127) to gain (0-1)
- `midiNoteToName(note)`: Get note name (e.g., "C4", "F#5")

### `RealtimeSynth` Class (`src/audio/realtimeSynth.ts`)

Real-time audio synthesis engine for the Synth Engine page.

```typescript
const synth = new RealtimeSynth(config);
synth.noteOn(60, 100);  // Play C4 at velocity 100
synth.noteOff(60);      // Release C4
synth.updateConfig(newConfig);  // Update patch
synth.dispose();        // Clean up
```

Uses `AudioContext` (not `OfflineAudioContext`) for immediate playback with proper ADSR envelope handling.

## Browser Support

Requires Web MIDI API:
- Chrome/Edge: Full support
- Firefox: Requires `dom.webmidi.enabled` flag
- Safari: Not supported

## Usage

1. Connect a MIDI controller
2. Navigate to the Synth Engine page
3. Select your device from the MIDI dropdown
4. Play notes - the current patch responds in real-time
5. Adjust synth parameters while playing for live tweaking

