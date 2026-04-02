// ── CxnTab — CXN Call Testing: Splunk ZUID lookup + Pearl Lead search ──

import { useState } from 'react';
import { CXN_SPLUNK_Zuid_BASE, PEARL_LEAD_BASE } from '@/utils/urls';
import { SearchSVG } from './icons';

export default function CxnTab() {
  const [zuidValue, setZuidValue] = useState('');
  const [zuidError, setZuidError] = useState('');
  const [pearlValue, setPearlValue] = useState('');
  const [pearlError, setPearlError] = useState('');

  function doZuidSearch() {
    const raw = zuidValue.trim();
    setZuidError('');
    if (!raw) return;
    const clean = raw.replace(/\D/g, '');
    if (!clean) {
      setZuidError('Please enter a numeric ZUID.');
      return;
    }
    chrome.tabs.create({ url: CXN_SPLUNK_Zuid_BASE + clean });
    setZuidValue('');
  }

  function doPearlSearch() {
    const raw = pearlValue.trim();
    setPearlError('');
    if (!raw) return;
    chrome.tabs.create({ url: PEARL_LEAD_BASE + encodeURIComponent(raw) });
    setPearlValue('');
  }

  return (
    <div className="flex flex-col gap-0">
      {/* ZUID → Splunk */}
      <label className="zat-input-label">ZUID (Splunk Connection Events)</label>
      <p className="zat-input-hint">Opens the Splunk connections dashboard filtered by ZUID.</p>
      <div className="flex gap-2 mb-1">
        <input
          type="text"
          inputMode="numeric"
          className={`zat-input${zuidError ? ' has-error' : ''}`}
          placeholder="e.g. 12345678"
          value={zuidValue}
          onChange={(e) => { setZuidValue(e.target.value); setZuidError(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') doZuidSearch(); }}
          autoComplete="off"
        />
        <button className="zat-search-btn" onClick={doZuidSearch}>
          {SearchSVG}
        </button>
      </div>
      {zuidError && <div className="zat-error">{zuidError}</div>}

      {/* Pearl Lead */}
      <div className="zat-section-divider">Pearl Lead Audit</div>
      <p className="zat-input-hint">Opens the Pearl concierge audit page for the given lead ID.</p>
      <div className="flex gap-2 mb-1">
        <input
          type="text"
          className={`zat-input${pearlError ? ' has-error' : ''}`}
          placeholder="Lead ID"
          value={pearlValue}
          onChange={(e) => { setPearlValue(e.target.value); setPearlError(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') doPearlSearch(); }}
          autoComplete="off"
        />
        <button className="zat-search-btn" onClick={doPearlSearch}>
          {SearchSVG}
        </button>
      </div>
      {pearlError && <div className="zat-error">{pearlError}</div>}
    </div>
  );
}
