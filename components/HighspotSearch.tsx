// ── HighspotSearch — search input that opens zillow.highspot.com ──
import { useState } from 'react';
import { SearchSVG } from './icons';

export default function HighspotSearch() {
  const [query, setQuery] = useState('');

  function doSearch() {
    const q = query.trim();
    if (!q) return;
    chrome.tabs.create({ url: 'https://zillow.highspot.com/search?q=' + encodeURIComponent(q) });
    setQuery('');
  }

  return (
    <div className="zat-highspot-search">
      <label className="zat-input-label">Highspot Search</label>
      <div className="flex gap-2">
        <input
          type="text"
          className="zat-input"
          placeholder="Search Highspot..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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
