// ── HighspotSearch — search input that opens zillow.highspot.com ──
import { useRef } from 'react';
import { SearchSVG } from './icons';

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
