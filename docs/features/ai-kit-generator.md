# AI Kit Generator

Generate complete OP-Z drum kits from text prompts using AI.

## Overview

The AI Kit Generator creates 24-sound drum kits from natural language descriptions. It uses AI to plan the kit, generate synthesis configs for each sound, and combines them into a valid OP-Z AIFF file.

## How It Works

1. **Planning Phase** - AI interprets your prompt and designs 24 unique sounds with names, descriptions, and categories (kick, snare, hihat, tom, perc, fx)

2. **Generation Phase** - Each sound idea is sent to AI to generate a complete `SoundConfig` with synthesis parameters, envelopes, filters, and effects

3. **Synthesis Phase** - Each config is rendered to audio using the synthesizer engine

4. **Build Phase** - Uses the proven `buildDrumPack` pipeline:
   - Each AudioBuffer converted to normalized WAV file
   - Stereo converted to mono with channel averaging
   - Each slice normalized to 95% peak for consistent volume
   - ffmpeg.wasm transcodes to mono 44.1kHz 16-bit AIFF
   - Proper silence gaps (100ms) added between slices
   - OP-Z APPL metadata chunk injected with scaled slice boundaries

## Usage

1. Navigate to **AI Kit Generator** from the nav bar
2. Enter a prompt like "80s inspired kick drums" or "industrial metal percussion"
3. Select AI provider (Gemini or OpenAI)
4. Click **GENERATE**
5. Watch progress as sounds are created
6. Click any sound to preview
7. Download the final `.aif` pack

## Requirements

- `VITE_GEMINI_KEY` or `VITE_OPENAI_KEY` environment variable set
- Sounds are limited to 24 per kit (OP-Z max slices)
- Total duration capped at 11.8s (OP-Z limit)
- Individual sounds limited to ~4s

## Architecture

```
AIKitGenerator.tsx
├── planKit()              - First AI call to design 24 sounds
├── generateConfig()       - Individual AI calls for each sound config
├── audioBufferToWavFile() - Convert AudioBuffer to normalized WAV
└── buildPack()            - Create slices and call buildDrumPack

pack.ts (existing)
├── buildDrumPack()        - Main pack building function
└── transcodeAndConcat()   - ffmpeg.wasm AIFF creation

aiff.ts (existing)
└── injectDrumMetadata()   - Add OP-Z APPL metadata chunk
```

## API Calls

- **Planning**: 1 request to generate kit structure (24 sound ideas)
- **Configs**: 1 batch request to generate all 24 sound configs
- Total: **2 API calls** per kit generation

## Output Format

Per OP-Z drum format specification:
- Mono, 16-bit PCM, 44.1kHz AIFF
- Big-endian audio data
- FORM/AIFF container with COMM and SSND chunks
- `APPL` chunk with `op-1` prefix + JSON metadata
- 100ms gaps between slices
- Slice boundaries scaled by 4096 (OP-1/OP-Z position format)
- drum_version: 1 for maximum compatibility
- playmode: 16384 (one-shot mode for proper playback)

## Sound Design Constraints

Each sound is limited to ensure all 24 fit within 12 seconds:
- Drums (kick, snare, hihat, tom, perc): max 0.3s duration
- FX: max 0.5s duration
- All sounds normalized to 95% peak
- Reverb/delay effects limited or removed to prevent tail bleed
- Sharp attacks, short decays for punchy character

