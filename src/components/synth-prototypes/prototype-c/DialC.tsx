/**
 * DialC - Modern flat continuous rotation dial component with gradient styling
 * Features: infinite rotation with bouncy feel, flat gradients, circular progress, keyboard support
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { ContinuousDialProps } from '../shared/types';

// Convert frequency to musical note
function frequencyToNote(freq: number): string {
  const A4 = 440;
  const C0 = A4 * Math.pow(2, -4.75);
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  const halfSteps = 12 * Math.log2(freq / C0);
  const noteIndex = Math.round(halfSteps) % 12;
  const octave = Math.floor(Math.round(halfSteps) / 12);
  
  return `${noteNames[noteIndex]}${octave}`;
}

export function DialC({
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
  const [numericInputMode, setNumericInputMode] = useState(false);
  const [numericInput, setNumericInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isDialHovered, setIsDialHovered] = useState(false);
  const dragStartY = useRef(0);
  const dragStartX = useRef(0);
  const lastMoveTime = useRef(Date.now());
  const lastDelta = useRef(0);
  const dialRef = useRef<HTMLDivElement>(null);
  const hasDragged = useRef(false);

  // Fixed range: 270° from 225° (min) to 495° (max)
  const MIN_ANGLE = 225; // 3:15 on clock
  const MAX_ANGLE = 495; // 2:45 on clock (or -225° + 360°)
  const ANGLE_RANGE = MAX_ANGLE - MIN_ANGLE; // 270°

  // Convert value to angle
  const valueToAngle = useCallback((val: number) => {
    const normalized = (val - min) / (max - min);
    return MIN_ANGLE + normalized * ANGLE_RANGE;
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
    hasDragged.current = false;
    dragStartY.current = e.clientY;
    dragStartX.current = e.clientX;
    lastMoveTime.current = Date.now();
    lastDelta.current = 0;
    dialRef.current?.focus();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const deltaY = dragStartY.current - e.clientY;
    const deltaX = e.clientX - dragStartX.current;
    
    // Mark as dragged if moved more than 2 pixels
    if (Math.abs(deltaY) > 2 || Math.abs(deltaX) > 2) {
      hasDragged.current = true;
    }
    
    dragStartY.current = e.clientY;
    dragStartX.current = e.clientX;

    // Calculate velocity-based sensitivity
    const now = Date.now();
    const timeDelta = Math.max(1, now - lastMoveTime.current);
    lastMoveTime.current = now;
    
    const delta = deltaY + deltaX;
    const velocity = Math.abs(delta) / timeDelta; // pixels per ms
    
    // Adaptive sensitivity: fast movements = high sensitivity, slow = low sensitivity
    // Fast swipe (>1 px/ms) can cover full range in ~100px
    // Slow drag (<0.2 px/ms) gives fine control
    const baseSensitivity = 1.5; // Base multiplier
    const velocityMultiplier = Math.max(0.3, Math.min(5, velocity * 100)); // 0.3x to 5x based on speed
    const sensitivity = baseSensitivity * velocityMultiplier;
    
    // Use logarithmic scaling for frequency parameters (Hz)
    let newValue: number;
    if (unit === 'Hz' && max > min * 10) {
      // Logarithmic scaling for wide frequency ranges
      const logMin = Math.log(min);
      const logMax = Math.log(max);
      const currentLog = Math.log(Math.max(min, value));
      const logChange = delta * sensitivity * (logMax - logMin) / ANGLE_RANGE;
      const newLog = Math.max(logMin, Math.min(logMax, currentLog + logChange));
      newValue = Math.exp(newLog);
    } else {
      // Linear scaling for other parameters
      const valueChange = delta * sensitivity * (max - min) / ANGLE_RANGE;
      newValue = Math.max(min, Math.min(max, value + valueChange));
    }
    
    lastDelta.current = delta;
    
    // Only trigger onChange if value actually changed
    if (Math.abs(newValue - value) > step / 2) {
      onChange(newValue);
    }
  }, [isDragging, min, max, step, value, onChange, unit, ANGLE_RANGE]);

  const handleMouseUp = useCallback(() => {
    // If didn't drag, open numeric input
    if (!hasDragged.current) {
      console.log('Dial clicked without drag, opening input mode');
      setNumericInputMode(true);
      setNumericInput(value.toString());
    }
    setIsDragging(false);
    // Reset hasDragged after a short delay
    setTimeout(() => {
      hasDragged.current = false;
    }, 100);
  }, [value]);

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

  // Calculate visual angle from current value
  const visualAngle = valueToAngle(value);
  
  // Show activity indicator when dragging
  const isActive = isDragging;

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
        onClick={() => {
          // Backup click handler in case mouseup doesn't fire
          if (!isDragging && !hasDragged.current) {
            console.log('Dial clicked (via onClick), opening input mode');
            setNumericInputMode(true);
            setNumericInput(value.toString());
          }
        }}
        onMouseEnter={() => setIsDialHovered(true)}
        onMouseLeave={() => setIsDialHovered(false)}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={{
          ...styles.dialContainer,
          cursor: isDragging ? 'grabbing' : 'pointer',
        }}
      >
        {/* Activity ring */}
        {isActive && (
          <div style={styles.activityRing} />
        )}
        
        {/* Endless rotary encoder */}
        <div
          style={{
            ...styles.dial,
            ...(isFocused ? styles.dialFocused : {}),
            ...(isDialHovered && !isDragging ? styles.dialHover : {}),
          }}
        >
          {/* Single notch for reference */}
          <div 
            style={{
              ...styles.notch,
              transform: `rotate(${visualAngle}deg)`,
            }}
          />
        </div>
      </div>

      {numericInputMode ? (
        <input
          type="text"
          value={numericInput}
          onChange={(e) => setNumericInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const parsed = parseFloat(numericInput);
              if (!isNaN(parsed)) {
                onChange(Math.max(min, Math.min(max, parsed)));
              }
              setNumericInputMode(false);
              setNumericInput('');
            } else if (e.key === 'Escape') {
              setNumericInputMode(false);
              setNumericInput('');
            }
          }}
          onBlur={() => {
            setNumericInputMode(false);
            setNumericInput('');
          }}
          autoFocus
          style={styles.numericInputField}
        />
      ) : (
        <>
          <div style={styles.value}>
            {formatValue(value)}{unit && ` ${unit}`}
          </div>
          {unit === 'Hz' && value >= 20 && value <= 20000 && (
            <div style={styles.note}>
              {frequencyToNote(value)}
            </div>
          )}
        </>
      )}


    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '2px',
    padding: '2px',
  },
  label: {
    fontSize: '8px',
    fontWeight: 600,
    color: '#ff8c42',
    letterSpacing: '0.3px',
    textTransform: 'uppercase' as const,
  },
  dialContainer: {
    position: 'relative' as const,
    width: '40px',
    height: '40px',
  },
  activityRing: {
    position: 'absolute' as const,
    top: '-2px',
    left: '-2px',
    right: '-2px',
    bottom: '-2px',
    borderRadius: '50%',
    border: '2px solid rgba(255, 140, 66, 0.6)',
    boxShadow: '0 0 8px rgba(255, 140, 66, 0.4)',
    pointerEvents: 'none' as const,
  },
  dial: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 35% 35%, #4a4a4a, #252525)',
    border: '2px solid #1a1a1a',
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.6), 0 1px 3px rgba(0, 0, 0, 0.4)',
    outline: 'none',
    position: 'relative' as const,
  },
  notch: {
    position: 'absolute' as const,
    top: '5px',
    left: '50%',
    width: '2px',
    height: '6px',
    background: '#ff8c42',
    marginLeft: '-1px',
    borderRadius: '1px',
    transformOrigin: 'center 15px',
  },
  dialHover: {
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.6), 0 1px 4px rgba(255, 140, 66, 0.3)',
  },
  dialFocused: {
    boxShadow: `
      inset 0 2px 4px rgba(0, 0, 0, 0.6),
      0 0 0 2px rgba(255, 140, 66, 0.5)
    `,
  },
  value: {
    fontSize: '9px',
    fontWeight: 600,
    color: '#e0e0e0',
    minHeight: '12px',
    fontFamily: 'monospace',
    letterSpacing: '0.2px',
    cursor: 'text',
  },
  numericInputField: {
    fontSize: '9px',
    fontWeight: 600,
    color: '#ff8c42',
    minHeight: '12px',
    fontFamily: 'monospace',
    letterSpacing: '0.2px',
    background: '#1a1a1a',
    border: '1px solid #ff8c42',
    borderRadius: '2px',
    padding: '1px 3px',
    textAlign: 'center' as const,
    outline: 'none',
    width: '50px',
  },
  note: {
    fontSize: '7px',
    fontWeight: 600,
    color: '#888',
    fontFamily: 'monospace',
    letterSpacing: '0.2px',
  },
};
