// ── HistorySection — renders a labelled group of history items with a clear button ──

import { useState } from 'react';
import type { HistoryItem } from '@/types';
import HistoryItemComponent from './HistoryItem';
import { TrashSVG } from './icons';

interface Props {
  title: string;
  icon: React.ReactNode;
  items: HistoryItem[];
  emptyText: string;
  onClear?: () => void;
  onItemClick: (item: HistoryItem) => void;
}

export default function HistorySection({
  title,
  icon,
  items,
  emptyText,
  onClear,
  onItemClick,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div>
      <div className="zat-history-header">
        <button
          className="zat-history-title zat-history-toggle"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
        >
          {icon}
          <span>{title}</span>
          <svg
            viewBox="0 0 24 24"
            className="zat-chevron"
            style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {!collapsed && items.length > 0 && onClear && (
          <button className="zat-clear-btn" onClick={onClear}>
            {TrashSVG}
            Clear
          </button>
        )}
      </div>

      {!collapsed && (
        items.length === 0 ? (
          <div className="zat-empty-state">
            <svg viewBox="0 0 24 24" style={{ width: 24, height: 24, fill: 'none', stroke: 'var(--text-faint)', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', marginBottom: 8 }}>
              <path d="M22 12h-6l-2 3H10l-2-3H2" />
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </svg>
            <p>{emptyText}</p>
          </div>
        ) : (
          items.map((item) => (
            <HistoryItemComponent
              key={`${item.type}-${item.id}-${item.timestamp}`}
              item={item}
              onClick={() => onItemClick(item)}
            />
          ))
        )
      )}
    </div>
  );
}
