/**
 * DialB - Hardware-inspired 3D continuous rotation dial component
 * Features: infinite rotation with mechanical feel, 3D styling, LED-style display, keyboard support
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { ContinuousDialProps } from '../shared/types';

export function DialB({
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

  // Handle mouse drag with mechanical feel
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

    // Slightly lower sensitivity for mechanical feel
    const sensitivity = 0.4;
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
      <div style={styles.label}>{label.toUpperCase()}</div>
      
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
        {/* Outer ring for 3D effect */}
        <div style={styles.dialOuter} />
        
        {/* Inner dial surface */}
        <div style={styles.dialInner}>
          <div
            style={{
              ...styles.indicator,
              transform: `rotate(${visualAngle}deg)`,
            }}
          />
        </div>
      </div>

      {/* LED-style value display */}
      {numericInputMode ? (
        <div style={styles.ledDisplay}>
          <div style={styles.ledText}>
            {numericInput || '_'}
          </div>
        </div>
      ) : (
        <div style={styles.ledDisplay}>
          <div style={styles.ledText}>
            {formatValue(value)}{unit}
          </div>
        </div>
      )}

      <div style={styles.range}>
        <span>{formatValue(min)}{unit}</span>
        <span>{formatValue(max)}{unit}</span>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '10px',
    padding: '16px',
  },
  label: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '1px',
    color: '#888',
    fontFamily: 'monospace',
  },
  dial: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    position: 'relative' as const,
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
  },
  dialOuter: {
    position: 'absolute' as const,
    inset: 0,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 50%, #0a0a0a 100%)',
    boxShadow: `
      0 2px 4px rgba(0, 0, 0, 0.5),
      inset 0 1px 2px rgba(255, 255, 255, 0.1),
      inset 0 -1px 2px rgba(0, 0, 0, 0.5)
    `,
  },
  dialInner: {
    position: 'absolute' as const,
    inset: '6px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #3a3a3a 0%, #2a2a2a 50%, #1a1a1a 100%)',
    boxShadow: `
      inset 0 2px 4px rgba(0, 0, 0, 0.6),
      inset 0 -1px 2px rgba(255, 255, 255, 0.05)
    `,
  },
  dialHover: {
    transform: 'scale(1.05)',
    filter: 'brightness(1.1)',
  },
  dialFocused: {
    outline: '2px solid #ff6b35',
    outlineOffset: '3px',
    boxShadow: '0 0 0 4px rgba(255, 107, 53, 0.2)',
  },
  dialAtLimit: {
    filter: 'brightness(1.2)',
  },
  indicator: {
    position: 'absolute' as const,
    top: '4px',
    left: '50%',
    width: '3px',
    height: '20px',
    background: 'linear-gradient(180deg, #ff6b35 0%, #ff8c5a 100%)',
    transformOrigin: 'center 22px',
    marginLeft: '-1.5px',
    borderRadius: '2px',
    boxShadow: '0 0 4px rgba(255, 107, 53, 0.8)',
    transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  ledDisplay: {
    backgroundColor: '#0a0a0a',
    border: '1px solid #333',
    borderRadius: '4px',
    padding: '6px 12px',
    minWidth: '80px',
    textAlign: 'center' as const,
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.8)',
  },
  ledText: {
    fontSize: '16px',
    fontWeight: 600,
    fontFamily: 'monospace',
    color: '#ff6b35',
    textShadow: '0 0 8px rgba(255, 107, 53, 0.8)',
    minHeight: '20px',
  },
  range: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    fontSize: '9px',
    color: '#666',
    fontFamily: 'monospace',
    paddingTop: '4px',
  },
};
