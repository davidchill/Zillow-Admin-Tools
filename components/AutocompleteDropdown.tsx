// ── AutocompleteDropdown — address autocomplete suggestions ──

import type { AutocompleteResult } from '@/types';

interface Props {
  results: AutocompleteResult[];
  activeIdx: number;
  onSelect: (result: AutocompleteResult) => void;
}

export default function AutocompleteDropdown({ results, activeIdx, onSelect }: Props) {
  if (!results.length) return null;

  return (
    <div className="zat-ac-dropdown">
      {results.map((r, i) => {
        const meta = r.metaData || {};
        const address = meta.addressString || r.display || '';
        const cityState = meta.cityStateZip || '';
        return (
          <button
            key={i}
            className={`zat-ac-item${i === activeIdx ? ' active' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(r);
            }}
          >
            <div className="zat-ac-item-main">{address}</div>
            {cityState && <div className="zat-ac-item-sub">{cityState}</div>}
          </button>
        );
      })}
    </div>
  );
}
