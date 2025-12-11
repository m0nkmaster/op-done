import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SynthesizerUI } from './SynthesizerUI';
import * as synthesizer from '../audio/synthesizer';

// Mock the synthesizer module
vi.mock('../audio/synthesizer', () => ({
  synthesizeSound: vi.fn(),
}));

describe('SynthesizerUI Loading States and Error Handling', () => {
  it('displays loading state during synthesis', async () => {
    // Mock synthesizeSound to return a promise that resolves after a delay
    const mockBuffer = {
      numberOfChannels: 1,
      length: 44100,
      sampleRate: 44100,
      duration: 1,
      getChannelData: () => new Float32Array(44100),
    } as AudioBuffer;

    vi.mocked(synthesizer.synthesizeSound).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockBuffer), 100))
    );

    render(<SynthesizerUI />);

    // Find and click the play button
    const playButton = screen.getByRole('button', { name: /play/i });
    expect(playButton).toBeInTheDocument();
    expect(playButton).not.toBeDisabled();

    // Click play
    playButton.click();

    // Button should show "Playing..." and be disabled
    await waitFor(() => {
      expect(screen.getByText(/playing/i)).toBeInTheDocument();
    });
  });

  it('displays loading state during export', async () => {
    // Mock synthesizeSound
    const mockBuffer = {
      numberOfChannels: 1,
      length: 44100,
      sampleRate: 44100,
      duration: 1,
      getChannelData: () => new Float32Array(44100),
    } as AudioBuffer;

    vi.mocked(synthesizer.synthesizeSound).mockResolvedValue(mockBuffer);

    render(<SynthesizerUI />);

    // Find the export button
    const exportButton = screen.getByRole('button', { name: /export/i });
    expect(exportButton).toBeInTheDocument();

    // Click export
    exportButton.click();

    // Should show "Exporting..." with loading indicator
    await waitFor(() => {
      expect(screen.getByText(/exporting/i)).toBeInTheDocument();
    });
  });

  it('displays error message when synthesis fails', async () => {
    // Mock synthesizeSound to throw an error
    vi.mocked(synthesizer.synthesizeSound).mockRejectedValue(
      new Error('Synthesis failed: Invalid configuration')
    );

    render(<SynthesizerUI />);

    // Click play
    const playButton = screen.getByRole('button', { name: /play/i });
    playButton.click();

    // Should display error message
    await waitFor(() => {
      expect(screen.getByText(/synthesis failed/i)).toBeInTheDocument();
    });
  });

  it('displays error message when export fails', async () => {
    // Mock synthesizeSound to throw an error
    vi.mocked(synthesizer.synthesizeSound).mockRejectedValue(
      new Error('Export failed: Audio processing error')
    );

    render(<SynthesizerUI />);

    // Click export
    const exportButton = screen.getByRole('button', { name: /export/i });
    exportButton.click();

    // Should display error message
    await waitFor(() => {
      expect(screen.getByText(/export failed/i)).toBeInTheDocument();
    });
  });

  it('allows dismissing error messages', async () => {
    // Mock synthesizeSound to throw an error
    vi.mocked(synthesizer.synthesizeSound).mockRejectedValue(
      new Error('Test error')
    );

    render(<SynthesizerUI />);

    // Trigger an error
    const playButton = screen.getByRole('button', { name: /play/i });
    playButton.click();

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(/test error/i)).toBeInTheDocument();
    });

    // Find and click the close button on the alert
    const closeButton = screen.getByRole('button', { name: /close/i });
    closeButton.click();

    // Error should be dismissed
    await waitFor(() => {
      expect(screen.queryByText(/test error/i)).not.toBeInTheDocument();
    });
  });
});
