/**
 * DialA - Minimalist continuous rotation dial component
 * Features: infinite rotation, min/max display, keyboard support, focus indicators
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { ContinuousDialProps } from '../shared/types';

export function DialA({
  value,
  min,
  max,
  step = 0.01,
  label,
  unit = '',
  onChange,
  onFocus,
  onBlur,
}: ContinuousDialProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [numericInputMode, setNumericInputMode] = useState(false);
  const [numericInput, setNumericInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dragStartY = useRef(0);
  const dialRef = useRef<HTMLDivElement>(null);

  // Initialize rotation angle from value
  useEffect(() => {
    const normalized = (value - min) / (max - min);
    setRotationAngle(normalized * 360);
  }, [value, min, max]);

  // Convert value to visual angle (0-360°)
  const valueToVisualAngle = useCallback((val: number) => {
    const normalized = (val - min) / (max - min);
    return normalized * 360;
  }, [min, max]);

  // Convert angle to value
  const angleToValue = useCallback((angle: number) => {
    const normalized = (angle % 360) / 360;
    const rawValue = min + normalized * (max - min);
    return Math.max(min, Math.min(max, rawValue));
  }, [min, max]);

  // Format value for display
  const formatValue = useCallback((val: number) => {
    if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}k`;
    }
    if (val < 1) {
      return val.toFixed(3);
    }
    return val.toFixed(1);
  }, []);

  // Handle mouse drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dialRef.current?.focus();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const deltaY = dragStartY.current - e.clientY;
    dragStartY.current = e.clientY;

    const sensitivity = 0.5;
    const newAngle = rotationAngle + deltaY * sensitivity;
    setRotationAngle(newAngle);

    const newValue = angleToValue(newAngle);
    onChange(newValue);
  }, [isDragging, rotationAngle, angleToValue, onChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle keyboard input
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (numericInputMode) {
      if (e.key === 'Enter') {
        const parsed = parseFloat(numericInput);
        if (!isNaN(parsed)) {
          onChange(Math.max(min, Math.min(max, parsed)));
        }
        setNumericInputMode(false);
        setNumericInput('');
        e.preventDefault();
      } else if (e.key === 'Escape') {
        setNumericInputMode(false);
        setNumericInput('');
        e.preventDefault();
      } else if (/^[0-9.-]$/.test(e.key)) {
        setNumericInput(prev => prev + e.key);
        e.preventDefault();
      } else if (e.key === 'Backspace') {
        setNumericInput(prev => prev.slice(0, -1));
        e.preventDefault();
      }
      return;
    }

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
      default:
        if (/^[0-9.-]$/.test(e.key)) {
          setNumericInputMode(true);
          setNumericInput(e.key);
          e.preventDefault();
        }
        break;
    }
  }, [numericInputMode, numericInput, value, min, max, step, onChange]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setNumericInputMode(false);
    setNumericInput('');
    onBlur?.();
  }, [onBlur]);

  const isAtLimit = value === min || value === max;
  const visualAngle = valueToVisualAngle(value);

  return (
    <div style={styles.container}>
      <div style={styles.label}>{label}</div>
      
      <div
        ref={dialRef}
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        tabIndex={0}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={{
          ...styles.dial,
          ...(isFocused ? styles.dialFocused : {}),
          ...(isHovered && !isDragging ? styles.dialHover : {}),
          ...(isAtLimit ? styles.dialAtLimit : {}),
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        <div
          style={{
            ...styles.indicator,
            transform: `rotate(${visualAngle}deg)`,
          }}
        />
      </div>

      {numericInputMode ? (
        <div style={styles.numericInput}>
          {numericInput || '_'}
        </div>
      ) : (
        <div style={styles.value}>
          {formatValue(value)}{unit}
        </div>
      )}

      <div style={styles.range}>
        {formatValue(min)}{unit} - {formatValue(max)}{unit}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    color: '#666',
  },
  dial: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    border: '2px solid #333',
    backgroundColor: '#fff',
    position: 'relative' as const,
    transition: 'all 150ms ease',
    outline: 'none',
  },
  dialHover: {
    borderColor: '#0066ff',
    boxShadow: '0 2px 8px rgba(0, 102, 255, 0.2)',
  },
  dialFocused: {
    outline: '2px solid #0066ff',
    outlineOffset: '2px',
    boxShadow: '0 0 0 4px rgba(0, 102, 255, 0.1)',
  },
  dialAtLimit: {
    borderColor: '#0066ff',
    opacity: 0.7,
  },
  indicator: {
    position: 'absolute' as const,
    top: '8px',
    left: '50%',
    width: '2px',
    height: '32px',
    backgroundColor: '#0066ff',
    transformOrigin: 'center 32px',
    marginLeft: '-1px',
    transition: 'transform 50ms ease-out',
  },
  value: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#000',
    minHeight: '24px',
  },
  numericInput: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#0066ff',
    minHeight: '24px',
    fontFamily: 'monospace',
  },
  range: {
    fontSize: '10px',
    color: '#999',
    textAlign: 'center' as const,
  },
};
