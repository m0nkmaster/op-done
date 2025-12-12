/**
 * WaveformSelector - Compact waveform display with click-to-cycle
 */

import { useState } from 'react';

interface WaveformSelectorProps {
  value: 'sine' | 'square' | 'sawtooth' | 'triangle';
  onChange: (waveform: 'sine' | 'square' | 'sawtooth' | 'triangle') => void;
}

export function WaveformSelector({ value, onChange }: WaveformSelectorProps) {
  const [showMenu, setShowMenu] = useState(false);
  
  const waveforms: Array<{ type: 'sine' | 'square' | 'sawtooth' | 'triangle'; path: string }> = [
    { type: 'sine', path: 'M2,30 Q12,10 22,30 T42,30 T62,30' },
    { type: 'square', path: 'M2,40 L2,20 L18,20 L18,40 L34,40 L34,20 L50,20 L50,40 L62,40' },
    { type: 'sawtooth', path: 'M2,40 L18,20 L18,40 L34,20 L34,40 L50,20 L50,40 L62,20' },
    { type: 'triangle', path: 'M2,40 L10,20 L18,40 L26,20 L34,40 L42,20 L50,40 L58,20 L62,30' },
  ];

  const currentWaveform = waveforms.find(w => w.type === value) || waveforms[0];
  
  const cycleWaveform = () => {
    const currentIndex = waveforms.findIndex(w => w.type === value);
    const nextIndex = (currentIndex + 1) % waveforms.length;
    onChange(waveforms[nextIndex].type);
  };

  return (
    <div style={styles.container}>
      <button
        onClick={cycleWaveform}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowMenu(!showMenu);
        }}
        style={styles.button}
        title={`${value} (click to cycle)`}
      >
        <svg width="64" height="48" viewBox="0 0 64 48" style={styles.svg}>
          <path
            d={currentWaveform.path}
            fill="none"
            stroke="#ff8c42"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      
      {showMenu && (
        <div style={styles.menu}>
          {waveforms.map((wf) => (
            <button
              key={wf.type}
              onClick={() => {
                onChange(wf.type);
                setShowMenu(false);
              }}
              style={{
                ...styles.menuItem,
                ...(value === wf.type ? styles.menuItemActive : {}),
              }}
            >
              <svg width="48" height="32" viewBox="0 0 64 48" style={styles.svg}>
                <path
                  d={wf.path}
                  fill="none"
                  stroke={value === wf.type ? '#ff8c42' : '#888'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span style={styles.menuLabel}>{wf.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'relative' as const,
  },
  button: {
    padding: '3px 6px',
    background: '#2a2a2a',
    border: '1px solid #ff8c42',
    borderRadius: '2px',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    display: 'block',
  },
  menu: {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    marginTop: '2px',
    background: '#2a2a2a',
    border: '1px solid #ff8c42',
    borderRadius: '2px',
    padding: '4px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
    zIndex: 1000,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
  },
  menuItem: {
    padding: '4px 8px',
    background: '#3a3a3a',
    border: '1px solid #4a4a4a',
    borderRadius: '2px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 150ms ease',
  },
  menuItemActive: {
    background: '#2a2a2a',
    border: '1px solid #ff8c42',
  },
  menuLabel: {
    fontSize: '8px',
    fontWeight: 600,
    color: '#e0e0e0',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px',
    minWidth: '50px',
  },
};
