# Synth Tools

Browser-based synthesizer and sample pack toolkit. Create sounds with AI, build drum kits, and export to OP-Z—all client-side.

## Features

### 🎹 Synthesizer
Full-featured Web Audio synth with AI-powered sound design.
- **Layered synthesis**: Oscillators, noise, FM, Karplus-Strong
- **Per-layer processing**: Filters, saturation, envelopes
- **Modulation**: LFO targeting pitch, filter, amplitude, pan
- **Effects chain**: Reverb, delay, distortion, compressor, gate
- **AI generation**: Describe any sound, get a playable patch (OpenAI/Gemini)
- **MIDI input**: Play live with any connected controller
- **JSON editor**: Full control over synthesis parameters
- **Export**: Download as WAV

### 🤖 AI Kit Generator
Generate complete 24-sound drum kits from text prompts.
- Describe your kit style ("vintage 808", "industrial", "lo-fi jazz")
- AI plans and synthesizes all 24 sounds
- Exports as ready-to-use OP-Z drum pack
- Supports OpenAI and Google Gemini

### 🥁 Drum Kit Creator
Build OP-Z drum packs from your own samples.
- Import up to 24 audio files (WAV, AIFF, MP3, M4A, FLAC)
- Auto-converts to OP-Z format (mono, 16-bit, 44.1kHz)
- Automatic classification (kick, snare, hat, cymbal)
- Pitch detection for melodic samples
- Per-slice volume, pitch, and preview controls
- Waveform visualization

### 🔬 Sample Analyzer
Inspect existing OP-Z drum packs.
- Parse and display metadata
- Visualize waveform with slice boundaries
- Audition individual slices
- View all parameters (volume, pitch, playmode, reverse)

### 💾 USB Browser
Direct OP-Z file management (Chromium browsers only).
- Browse sample pack slots
- Upload packs directly to device
- Delete and replace existing packs

## Quick Start

```bash
bun install
bun dev
```

Open http://localhost:5173

## AI Setup

For AI-powered features, add API keys to `.env`:

```
VITE_OPENAI_KEY=sk-...
VITE_GEMINI_KEY=...
```

Then use the Synthesizer or AI Kit Generator to create sounds from text descriptions.

## OP-Z Installation

After exporting a drum pack:

1. Connect OP-Z in content mode
2. Copy `.aif` file to `sample packs/<track>/<slot>/`
   - Tracks: `1-kick`, `2-snare`, `3-perc`, `4-sample`
   - Slots: `01` through `10`
3. Eject and reboot OP-Z

## Commands

```bash
bun install       # Install dependencies
bun dev           # Dev server (localhost:5173)
bun run build     # Production build
bun test          # Run tests
bun run lint      # Check linting
bun run lint:fix  # Auto-fix lint issues
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Bun |
| UI | Vite + React + TypeScript + MUI |
| Audio | Web Audio API + ffmpeg.wasm |
| AI | OpenAI GPT / Google Gemini |
| Testing | Vitest |

## Documentation

- **[User Guide](user-guide/user-guide.md)** — How to use each feature
- **[Developer Docs](developer-docs/README.md)** — Architecture and internals

## Privacy

- All audio processing runs locally in your browser
- No files uploaded except AI text prompts (when using AI features)
- Works offline (except AI features)

## Related Tools

- **[TE Drum Utility](https://teenage.engineering/apps/drum-utility)** — Official Teenage Engineering drum pack tool
- **[teoperator](https://github.com/schollz/teoperator)** — CLI tool by [@schollz](https://github.com/schollz) for OP-1/OP-Z patches

## License

MIT

## Credits

- **Format specification** from [schollz/teoperator](https://github.com/schollz/teoperator)
- **Compatibility testing** against [TE Drum Utility](https://teenage.engineering/apps/drum-utility)
- Built with ❤️ for the Teenage Engineering community
