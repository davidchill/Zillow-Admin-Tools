// ── ListingTab — ZPID / PHX / DIT / address search + recently viewed ──

import { useState, useRef, useCallback, useMemo } from 'react';
import type { ListingMode, HistoryItem, Settings, AutocompleteResult } from '@/types';
import { buildListingUrl } from '@/utils/urls';
import AutocompleteDropdown from './AutocompleteDropdown';
import HistorySection from './HistorySection';
import { SearchSVG } from './icons';

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
  searchedHistory: HistoryItem[];
  settings: Settings;
  onAddToHistory: (type: 'zpid' | 'phx' | 'dit', id: string, method: 'zpid' | 'phx' | 'dit', label?: string) => void;
  onClearViewed: () => void;
  onClearSearched: () => void;
  onRemoveFromViewed: (zpid: string) => void;
}

export default function ListingTab({
  viewedHistory,
  searchedHistory,
  settings,
  onAddToHistory,
  onClearViewed,
  onClearSearched,
  onRemoveFromViewed,
}: Props) {
  const [listingMode, setListingMode] = useState<ListingMode>('zillow');
  const [zpidValue, setZpidValue] = useState('');
  const [zpidError, setZpidError] = useState('');
  const [mlsValue, setMlsValue] = useState('');
  // Address search
  const [addrValue, setAddrValue] = useState('');
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

  // Merge searched listings (zpid/phx/dit) with browsed listings (viewed),
  // deduplicated by id, sorted newest-first. The content script already
  // prevents a searched ZPID from also appearing in viewed history, so
  // duplicates are rare in practice but we guard anyway.
  const combinedHistory = useMemo(() => {
    const seen = new Set<string>();
    return [...searchedHistory, ...viewedHistory]
      .filter((h) => { const key = `${h.id}-${h.type}`; if (seen.has(key)) return false; seen.add(key); return true; })
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }, [searchedHistory, viewedHistory, limit]);

  const emptyMsg =
    settings.historyEnabled === false
      ? 'History recording is off. Enable it in Settings.'
      : 'No recently viewed or searched listings';

  return (
    <div className="flex flex-col gap-0" style={{ flex: 1, minHeight: 0 }}>
      <div className="zat-section-label" style={{ background: 'transparent', margin: '0 0 8px' }}>Listing Tools</div>

      {/* Listing-related quick tools */}
      <div className="zat-quick-links" style={{ padding: '0 0 4px', background: 'none' }}>
        <button
          className="zat-quick-btn"
          data-tip="3D Home Tours"
          onClick={() => chrome.tabs.create({ url: 'https://www.zillow.com/admin/richdata/ManageVirtualTours.htm' })}
        >
          <svg viewBox="0 0 24 24">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        </button>
        <button
          className="zat-quick-btn"
          data-tip="Address Change"
          onClick={() => chrome.tabs.create({ url: 'https://www.zillow.com/admin/AdminListing.htm' })}
        >
          <svg viewBox="0 0 24 24">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>

      <div className="zat-section-label" style={{ background: 'transparent', margin: '4px 0 8px' }}>Listing Search</div>

      {/* Listing mode row */}
      <div className="zat-seg" style={{ marginBottom: 10 }}>
        {LISTING_MODES.map(({ mode, label }) => (
          <button
            key={mode}
            className={`zat-seg-btn${listingMode === mode ? ' active' : ''}`}
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
                className="zat-input"
                placeholder="123 Main St, Seattle, WA"
                value={addrValue}
                onChange={(e) => {
                  setAddrValue(e.target.value);
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
        </>
      )}

      {/* Combined searched + viewed listing history */}
      <div style={{ marginTop: 16, flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 20 }}>
        <HistorySection
          title="Recently Viewed Listings"
          icon={EyeSVG}
          items={combinedHistory}
          emptyText={emptyMsg}
          onClear={combinedHistory.length > 0 ? () => { onClearViewed(); onClearSearched(); } : undefined}
          onItemClick={(item) => {
            chrome.tabs.create({ url: buildListingUrl(item.type as ListingMode, item.id) });
          }}
        />
      </div>
    </div>
  );
}
