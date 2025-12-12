/**
 * TabsB - Hardware-inspired vertical tab navigation component
 * Features: vertical layout, panel-style borders, LED indicators, keyboard navigation
 */

import { useState, useCallback, useRef } from 'react';
import type { TabsProps } from '../shared/types';

export function TabsB({ tabs, activeTab, onTabChange }: TabsProps) {
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        break;
      case 'ArrowDown':
        e.preventDefault();
        newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    const newTab = tabs[newIndex];
    if (newTab) {
      onTabChange(newTab.id);
      // Focus the new tab
      setTimeout(() => {
        tabRefs.current.get(newTab.id)?.focus();
      }, 0);
    }
  }, [tabs, onTabChange]);

  // Set ref for each tab button
  const setTabRef = useCallback((id: string, element: HTMLButtonElement | null) => {
    if (element) {
      tabRefs.current.set(id, element);
    } else {
      tabRefs.current.delete(id);
    }
  }, []);

  return (
    <div style={styles.container} role="tablist" aria-orientation="vertical">
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTab;
        const isHovered = hoveredTab === tab.id;
        
        return (
          <button
            key={tab.id}
            ref={(el) => setTabRef(tab.id, el)}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            onMouseEnter={() => setHoveredTab(tab.id)}
            onMouseLeave={() => setHoveredTab(null)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            style={{
              ...styles.tab,
              ...(isActive ? styles.tabActive : {}),
              ...(isHovered && !isActive ? styles.tabHover : {}),
            }}
          >
            <div style={styles.tabContent}>
              {tab.icon && <span style={styles.icon}>{tab.icon}</span>}
              <span style={styles.tabLabel}>{tab.label}</span>
            </div>
            
            {/* LED indicator for modified parameters */}
            {tab.modified && (
              <div style={styles.ledIndicator} aria-label="Modified">
                <div style={styles.ledGlow} />
              </div>
            )}
            
            {/* Active indicator bar */}
            {isActive && <div style={styles.activeBar} />}
          </button>
        );
      })}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
    backgroundColor: '#0a0a0a',
    padding: '12px 8px',
    borderRight: '2px solid #333',
    minWidth: '180px',
    boxShadow: 'inset -2px 0 4px rgba(0, 0, 0, 0.5)',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    border: '1px solid #2a2a2a',
    backgroundColor: '#1a1a1a',
    color: '#888',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    position: 'relative' as const,
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
    borderRadius: '4px',
    boxShadow: `
      0 1px 2px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.05)
    `,
    textAlign: 'left' as const,
  },
  tabHover: {
    backgroundColor: '#252525',
    borderColor: '#3a3a3a',
    color: '#aaa',
    transform: 'translateX(2px)',
  },
  tabActive: {
    backgroundColor: '#2a2a2a',
    borderColor: '#ff6b35',
    color: '#ff6b35',
    boxShadow: `
      0 2px 4px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 107, 53, 0.1),
      0 0 8px rgba(255, 107, 53, 0.3)
    `,
  },
  tabContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1,
  },
  tabLabel: {
    fontFamily: 'monospace',
    letterSpacing: '0.5px',
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '16px',
  },
  ledIndicator: {
    position: 'relative' as const,
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#ff6b35',
    boxShadow: `
      0 0 4px rgba(255, 107, 53, 0.8),
      inset 0 1px 1px rgba(255, 255, 255, 0.3)
    `,
  },
  ledGlow: {
    position: 'absolute' as const,
    inset: '-2px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 107, 53, 0.4)',
    filter: 'blur(2px)',
  },
  activeBar: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: '3px',
    backgroundColor: '#ff6b35',
    boxShadow: '0 0 8px rgba(255, 107, 53, 0.8)',
    borderRadius: '0 2px 2px 0',
  },
};
