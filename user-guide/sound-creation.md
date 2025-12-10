# sound creation (ai)

Text-to-synthesis that proposes a layered patch, then renders audio locally with Web Audio.

## requirements
- Set `VITE_OPENAI_KEY` (OpenAI) or `VITE_GEMINI_KEY` (Gemini) in your environment.  
- Network access is needed only for the chosen provider; rendering and WAV export stay client-side.

## workflow
1) Choose provider (Gemini by default).  
2) Describe the sound (“deep 808 kick”, “metallic pluck”, “warm pad”) or request tweaks to the last result.  
3) Generate to get a full JSON `SoundConfig`; view it inline.  
4) Play to audition, or download the rendered WAV.  
5) Optional: enable **MIDI** (if the browser supports it) and toggle **Loop/Gate** for sustained playback.

## iteration limits
- Conversation stops after ~20 messages; clear to restart.  
- Each prompt returns the full config; minimal changes are requested when you ask for tweaks.

## what the model is asked to build
- Layered synthesis: oscillators, noise, FM, and Karplus-Strong.  
- Envelopes (global + per-layer), filters, LFO (pitch/filter/amp/pan), saturation, reverb, delay, compressor, gate.  
- Unison voices with detune/spread and optional sub oscillator.

## exporting to OP-Z
- The WAV is not automatically OP-Z formatted. Drop the rendered WAV into **Drum Kit Creator** to convert it into a slice or a pack.

## common issues
- **“API key not set”**: Provide the key for the selected provider.  
- **Generation blocked**: Provider safety filters may refuse certain prompts; rephrase.  
- **Audio silent**: Click the page to unlock audio; check output device.  
- **Loop clicks**: Increase attack/release or disable loop; the engine uses exponential curves but extreme settings can still click.
