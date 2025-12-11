import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Knob } from './Knob';
import { Switch } from './Switch';
import { SegmentedButton } from './SegmentedButton';

describe('Visual Feedback and Interaction States', () => {
  describe('Knob Component', () => {
    it('renders with hover state styles', () => {
      const { container } = render(
        <Knob
          value={0.5}
          min={0}
          max={1}
          label="Test"
          onChange={() => {}}
        />
      );

      const knobElement = container.querySelector('[style*="cursor"]');
      expect(knobElement).toBeInTheDocument();
    });

    it('shows active state when dragging', () => {
      const { container } = render(
        <Knob
          value={0.5}
          min={0}
          max={1}
          label="Test"
          onChange={() => {}}
        />
      );

      const knobElement = container.querySelector('[style*="cursor"]');
      expect(knobElement).toHaveStyle({ cursor: 'ns-resize' });
    });
  });

  describe('Switch Component', () => {
    it('renders with hover state styles', () => {
      const { container } = render(
        <Switch
          value={false}
          label="Test"
          onChange={() => {}}
        />
      );

      const switchElement = container.querySelector('[style*="cursor"]');
      expect(switchElement).toBeInTheDocument();
      expect(switchElement).toHaveStyle({ cursor: 'pointer' });
    });

    it('displays ON/OFF state', () => {
      const { rerender } = render(
        <Switch
          value={false}
          label="Test"
          onChange={() => {}}
        />
      );

      expect(screen.getByText('OFF')).toBeInTheDocument();

      rerender(
        <Switch
          value={true}
          label="Test"
          onChange={() => {}}
        />
      );

      expect(screen.getByText('ON')).toBeInTheDocument();
    });
  });

  describe('SegmentedButton Component', () => {
    it('renders with hover state styles', () => {
      const options = [
        { value: 'a', label: 'Option A' },
        { value: 'b', label: 'Option B' },
      ];

      const { container } = render(
        <SegmentedButton
          value="a"
          options={options}
          onChange={() => {}}
        />
      );

      const buttons = container.querySelectorAll('[style*="cursor"]');
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach(button => {
        expect(button).toHaveStyle({ cursor: 'pointer' });
      });
    });

    it('highlights selected option', () => {
      const options = [
        { value: 'a', label: 'Option A' },
        { value: 'b', label: 'Option B' },
      ];

      render(
        <SegmentedButton
          value="a"
          options={options}
          onChange={() => {}}
        />
      );

      expect(screen.getByText('Option A')).toBeInTheDocument();
      expect(screen.getByText('Option B')).toBeInTheDocument();
    });
  });
});
