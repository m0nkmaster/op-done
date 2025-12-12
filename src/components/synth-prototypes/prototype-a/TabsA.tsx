/**
 * TabsA - Minimalist horizontal tab navigation component
 * Features: horizontal layout, state preservation, modified indicators, keyboard navigation
 */

import { useState, useCallback, useRef } from 'react';
import type { TabsProps } from '../shared/types';

export function TabsA({ tabs, activeTab, onTabChange }: TabsProps) {
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

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
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '4px',
    borderBottom: '1px solid #e0e0e0',
    padding: '0 24px',
    backgroundColor: '#fff',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#666',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    position: 'relative' as const,
    transition: 'all 150ms ease',
    outline: 'none',
    borderBottom: '2px solid transparent',
  },
  tabHover: {
    color: '#0066ff',
    backgroundColor: 'rgba(0, 102, 255, 0.05)',
  },
  tabActive: {
    color: '#0066ff',
    borderBottomColor: '#0066ff',
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '16px',
  },
  modifiedIndicator: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#0066ff',
    marginLeft: '4px',
  },
};
