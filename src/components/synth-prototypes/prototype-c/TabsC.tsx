/**
 * TabsC - Modern flat horizontal tab navigation with pill-shaped indicator
 * Features: sliding animation, pill indicator, modified indicators, keyboard navigation
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { TabsProps } from '../shared/types';

export function TabsC({ tabs, activeTab, onTabChange }: TabsProps) {
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });

  // Update pill position when active tab changes
  useEffect(() => {
    const activeElement = tabRefs.current.get(activeTab);
    if (activeElement) {
      const { offsetLeft, offsetWidth } = activeElement;
      setPillStyle({ left: offsetLeft, width: offsetWidth });
    }
  }, [activeTab]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        break;
      case 'ArrowRight':
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
    <div style={styles.container} role="tablist">
      {/* Pill-shaped active indicator */}
      <div
        style={{
          ...styles.pill,
          left: `${pillStyle.left}px`,
          width: `${pillStyle.width}px`,
        }}
      />

      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTab;
        
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
              ...(hoveredTab === tab.id && !isActive ? styles.tabHover : {}),
            }}
          >
            {tab.icon && <span style={styles.icon}>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.modified && (
              <span style={styles.modifiedIndicator} aria-label="Modified" />
            )}
          </button>
        );
      })}
    </div>
  );
}

const styles = {
  container: {
    position: 'relative' as const,
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '4px',
    padding: '4px',
    backgroundColor: '#222',
    borderRadius: '4px',
    marginBottom: '12px',
    border: '1px solid #3a3a3a',
  },
  pill: {
    position: 'absolute' as const,
    top: '4px',
    height: 'calc(100% - 8px)',
    background: '#ff8c42',
    borderRadius: '3px',
    transition: 'all 150ms ease',
    boxShadow: '0 0 4px rgba(255, 140, 66, 0.6)',
    zIndex: 0,
  },
  tab: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#888',
    fontSize: '10px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 150ms ease',
    outline: 'none',
    borderRadius: '3px',
    zIndex: 1,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  tabHover: {
    color: '#aaa',
    backgroundColor: 'rgba(255, 140, 66, 0.1)',
  },
  tabActive: {
    color: '#1a1a1a',
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '12px',
  },
  modifiedIndicator: {
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    backgroundColor: '#4ade80',
    marginLeft: '3px',
    boxShadow: '0 0 3px rgba(74, 222, 128, 0.6)',
  },
};
