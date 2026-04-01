// ── HistorySection — renders a labelled group of history items with a clear button ──

import type { HistoryItem } from '@/types';
import HistoryItemComponent from './HistoryItem';

interface Props {
  title: string;
  icon: React.ReactNode;
  items: HistoryItem[];
  emptyText: string;
  onClear?: () => void;
  onItemClick: (item: HistoryItem) => void;
}

const TrashSVG = (
  <svg viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);

export default function HistorySection({
  title,
  icon,
  items,
  emptyText,
  onClear,
  onItemClick,
}: Props) {
  return (
    <div>
      <div className="zat-history-header">
        <div className="zat-history-title">
          {icon}
          <span>{title}</span>
        </div>
        {items.length > 0 && onClear && (
          <button className="zat-clear-btn" onClick={onClear}>
            {TrashSVG}
            Clear
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="zat-empty-state">
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
      )}
    </div>
  );
}
