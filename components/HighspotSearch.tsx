// ── HighspotSearch — search input that opens zillow.highspot.com ──
import { useRef } from 'react';

const SearchSVG = (
  <svg viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export default function HighspotSearch() {
  const inputRef = useRef<HTMLInputElement>(null);

  function doSearch() {
    const q = inputRef.current?.value.trim();
    if (!q) return;
    chrome.tabs.create({ url: 'https://zillow.highspot.com/search?q=' + encodeURIComponent(q) });
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="zat-highspot-search">
      <label className="zat-input-label">Highspot Search</label>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          className="zat-input"
          placeholder="Search Highspot..."
          autoComplete="off"
          onKeyDown={(e) => { if (e.key === 'Enter') doSearch(); }}
        />
        <button className="zat-search-btn" onClick={doSearch}>
          {SearchSVG}
        </button>
      </div>
    </div>
  );
}
