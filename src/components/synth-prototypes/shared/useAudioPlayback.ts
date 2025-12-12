/**
 * Shared audio playback hook for synth prototypes
 * Handles audio synthesis and playback with proper cleanup
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { SoundConfig } from '../../../types/soundConfig';
import { synthesizeSound } from '../../../audio/synthesizer';

export interface AudioPlaybackState {
  playing: boolean;
  error: string | null;
}

export interface AudioPlaybackActions {
  play: () => Promise<void>;
  stop: () => void;
}

export function useAudioPlayback(config: SoundConfig): AudioPlaybackState & AudioPlaybackActions {
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        try {
          sourceRef.current.stop();
        } catch {
          // Ignore errors if already stopped
        }
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {
        // Ignore errors if already stopped
      }
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setPlaying(false);
  }, []);

  const play = useCallback(async () => {
    if (playing) {
      stop();
    }

    setPlaying(true);
    setError(null);

    try {
      const buffer = await synthesizeSound(config);
      const audioContext = new AudioContext();
      const source = audioContext.createBufferSource();
      
      source.buffer = buffer;
      source.connect(audioContext.destination);
      
      audioContextRef.current = audioContext;
      sourceRef.current = source;

      source.onended = () => {
        setPlaying(false);
        audioContext.close();
        audioContextRef.current = null;
        sourceRef.current = null;
      };

      source.start();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to synthesize sound');
      setPlaying(false);
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }
  }, [config, playing, stop]);

  return {
    playing,
    error,
    play,
    stop,
  };
}
