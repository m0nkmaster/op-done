# LLM Sound Creation Page

## Overview
- New React Router page at `/create-sound` for generating short WAV clips (≤6s) from natural-language prompts.
- Uses `createLlmSound` in `src/audio/llmSound.ts` to translate prompts into expressive synth parameters with stochastic nuance, then renders WAV bytes client-side.
- The flow runs locally but intentionally introduces randomness per render so clips feel more emotional and exploratory rather than deterministic.
- Presents waveform preview, designer-style explanation paragraphs, play/pause, and WAV download.

## Usage
1. Navigate via header nav: **Create LLM Sound**.
2. Enter a prompt (e.g., “large snare with water on it”) and set clip length (1–6s) plus LLM creativity.
3. Click **Generate sound** to render; then play or download the WAV.

## Tests
Run required checks before committing:
```
bun run lint
bun test
```
