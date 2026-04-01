// ── ListingTab — ZPID / PHX / DIT / address search + recently viewed ──

import { useState, useRef, useCallback } from 'react';
import type { ListingMode, HistoryItem, Settings, AutocompleteResult } from '@/types';
import { buildListingUrl } from '@/utils/urls';
import AutocompleteDropdown from './AutocompleteDropdown';
import HistorySection from './HistorySection';

const SearchSVG = (
  <svg viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const EyeSVG = (
  <svg viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const LISTING_MODES: { mode: ListingMode; label: string }[] = [
  { mode: 'zillow', label: 'Zillow' },
  { mode: 'phx', label: 'PHX' },
  { mode: 'dit', label: 'DIT' },
];

interface Props {
  viewedHistory: HistoryItem[];
  settings: Settings;
  onAddToHistory: (type: 'zpid' | 'phx' | 'dit', id: string, method: 'zpid' | 'phx' | 'dit', label?: string) => void;
  onClearViewed: () => void;
  onRemoveFromViewed: (zpid: string) => void;
}

export default function ListingTab({
  viewedHistory,
  settings,
  onAddToHistory,
  onClearViewed,
  onRemoveFromViewed,
}: Props) {
  const [listingMode, setListingMode] = useState<ListingMode>('zillow');
  const [zpidValue, setZpidValue] = useState('');
  const [zpidError, setZpidError] = useState('');
  const [mlsValue, setMlsValue] = useState('');
  // Address search
  const [addrValue, setAddrValue] = useState('');
  const [addrError, setAddrError] = useState('');
  const [acResults, setAcResults] = useState<AutocompleteResult[]>([]);
  const [acActiveIdx, setAcActiveIdx] = useState(-1);

  const acDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Autocomplete ───────────────────────────────────────────────────────────

  const triggerAutocomplete = useCallback((query: string) => {
    if (acDebounceTimer.current) clearTimeout(acDebounceTimer.current);
    if (!query || query.length < 2) { setAcResults([]); return; }
    acDebounceTimer.current = setTimeout(() => {
      chrome.runtime.sendMessage(
        { action: 'autocomplete', query },
        (response: { ok: boolean; results: AutocompleteResult[] } | undefined) => {
          if (chrome.runtime.lastError) { setAcResults([]); return; }
          setAcResults((response?.results) || []);
          setAcActiveIdx(-1);
        }
      );
    }, 300);
  }, []);

  function selectAcResult(result: AutocompleteResult) {
    const meta = result.metaData || {};
    const zpid = meta.zpid ? String(meta.zpid) : null;
    if (!zpid) { setAcResults([]); return; }
    const url = `https://www.zillow.com/homedetails/${zpid}_zpid/`;
    const label = result.display || '';
    setAddrValue('');
    setAcResults([]);
    setAcActiveIdx(-1);
    onRemoveFromViewed(zpid);
    if (settings.historyEnabled !== false) onAddToHistory('zpid', zpid, 'zpid', label);
    chrome.tabs.create({ url });
  }

  function doAddressSearch(address: string) {
    const slug = address
      .trim()
      .replace(/,/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    chrome.tabs.create({ url: `https://www.zillow.com/homes/for_sale/${slug}_rb/` });
    setAddrValue('');
    setAcResults([]);
  }

  // ── ZPID search ────────────────────────────────────────────────────────────

  function doZpidSearch() {
    const raw = zpidValue.trim();
    setZpidError('');
    if (!raw) return;
    const cleanId = raw.replace(/\D/g, '');
    if (!cleanId) {
      setZpidError('Please enter a numeric ZPID.');
      return;
    }
    const url = buildListingUrl(listingMode, cleanId);
    if (listingMode === 'zillow') {
      onRemoveFromViewed(cleanId);
      if (settings.historyEnabled !== false) {
        onAddToHistory('zpid', cleanId, 'zpid');
        chrome.runtime.sendMessage({ action: 'fetchAddress', zpid: cleanId, historyType: 'zpid' });
      }
    } else {
      if (settings.historyEnabled !== false) {
        onAddToHistory(listingMode, cleanId, listingMode);
        chrome.runtime.sendMessage({ action: 'fetchAddress', zpid: cleanId, historyType: listingMode });
      }
    }
    chrome.tabs.create({ url });
    setZpidValue('');
  }

  // ── MLS search ─────────────────────────────────────────────────────────────

  function doMlsSearch() {
    const raw = mlsValue.trim();
    if (!raw) return;
    chrome.tabs.create({
      url: `https://phoenix-admin-tool.dna-compute-prod.zg-int.net/zillow-data-lookup?mlsID=${encodeURIComponent(raw)}`,
    });
    setMlsValue('');
  }

  // ── Mode change ────────────────────────────────────────────────────────────

  function switchListingMode(mode: ListingMode) {
    setListingMode(mode);
    setZpidValue('');
    setZpidError('');
    setMlsValue('');
    setAcResults([]);
    setAcActiveIdx(-1);
    setAddrValue('');
    setAddrError('');
  }

  // ── Address keydown ────────────────────────────────────────────────────────

  function handleAddrKeyDown(e: React.KeyboardEvent) {
    if (acResults.length) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setAcActiveIdx((i) => Math.min(i + 1, acResults.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setAcActiveIdx((i) => Math.max(i - 1, -1));
        return;
      }
      if (e.key === 'Escape') {
        setAcResults([]);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        selectAcResult(
          acActiveIdx >= 0 ? acResults[acActiveIdx] : acResults[0]
        );
        return;
      }
    }
    if (e.key === 'Enter') {
      const q = addrValue.trim();
      if (q.length >= 2) doAddressSearch(q);
    }
  }

  const limit = Math.min(20, Math.max(5, settings.historyLimit || 5));
  const displayed = viewedHistory.slice(0, limit);
  const emptyMsg =
    settings.historyEnabled === false
      ? 'History recording is off. Enable it in Settings.'
      : 'No recently viewed properties';

  return (
    <div className="flex flex-col gap-0">
      {/* Listing mode row */}
      <div className="zat-modes">
        {LISTING_MODES.map(({ mode, label }) => (
          <button
            key={mode}
            className={`zat-mode-btn${listingMode === mode ? ' active' : ''}`}
            onClick={() => switchListingMode(mode)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ZPID input */}
      <label className="zat-input-label">ZPID</label>
      <div className="flex gap-2 mb-1">
        <input
          type="text"
          inputMode="numeric"
          className={`zat-input${zpidError ? ' has-error' : ''}`}
          placeholder="e.g. 29122711"
          value={zpidValue}
          onChange={(e) => { setZpidValue(e.target.value); setZpidError(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') doZpidSearch(); }}
          autoComplete="off"
        />
        <button className="zat-search-btn" onClick={doZpidSearch}>
          {SearchSVG}
        </button>
      </div>
      {zpidError && <div className="zat-error">{zpidError}</div>}

      {/* MLS input (PHX mode only) */}
      {listingMode === 'phx' && (
        <>
          <label className="zat-input-label" style={{ marginTop: 1 }}>MLS ID</label>
          <div className="flex gap-2 mb-1">
            <input
              type="text"
              className="zat-input"
              placeholder="e.g. 123435"
              value={mlsValue}
              onChange={(e) => setMlsValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') doMlsSearch(); }}
              autoComplete="off"
            />
            <button className="zat-search-btn" onClick={doMlsSearch}>
              {SearchSVG}
            </button>
          </div>
        </>
      )}

      {/* Address search (Zillow mode only) */}
      {listingMode === 'zillow' && (
        <>
          <label className="zat-input-label" style={{ marginTop: 4 }}>Address Search</label>
          <div className="relative flex gap-2 mb-1">
            <div className="relative flex-1">
              <input
                type="text"
                className={`zat-input${addrError ? ' has-error' : ''}`}
                placeholder="123 Main St, Seattle, WA"
                value={addrValue}
                onChange={(e) => {
                  setAddrValue(e.target.value);
                  setAddrError('');
                  triggerAutocomplete(e.target.value.trim());
                }}
                onKeyDown={handleAddrKeyDown}
                onBlur={() => setTimeout(() => setAcResults([]), 150)}
                autoComplete="off"
              />
              {acResults.length > 0 && (
                <AutocompleteDropdown
                  results={acResults}
                  activeIdx={acActiveIdx}
                  onSelect={selectAcResult}
                />
              )}
            </div>
            <button
              className="zat-search-btn"
              onClick={() => {
                if (acResults.length) {
                  selectAcResult(acActiveIdx >= 0 ? acResults[acActiveIdx] : acResults[0]);
                } else {
                  const q = addrValue.trim();
                  if (q.length >= 2) doAddressSearch(q);
                }
              }}
            >
              {SearchSVG}
            </button>
          </div>
          {addrError && <div className="zat-error">{addrError}</div>}
        </>
      )}

      {/* Recently viewed history */}
      <div className="mt-4">
        <HistorySection
          title="Recently Viewed"
          icon={EyeSVG}
          items={displayed}
          emptyText={emptyMsg}
          onClear={displayed.length > 0 ? onClearViewed : undefined}
          onItemClick={(item) => {
            chrome.tabs.create({ url: buildListingUrl(item.type as ListingMode, item.id) });
          }}
        />
      </div>
    </div>
  );
}
