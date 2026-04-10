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
    if (!raw) return;
    chrome.tabs.create({ url: PEARL_LEAD_BASE + encodeURIComponent(raw) });
    setPearlValue('');
  }

  return (
    <div className="flex flex-col gap-0" style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 20 }}>
      {/* CXN-related quick tools */}
      <div className="zat-section-label" style={{ background: 'transparent', margin: '0 0 8px' }}>CXN Call Tools</div>
      <div className="zat-quick-links" style={{ padding: '0 0 4px', background: 'none', marginBottom: '10px' }}>
        <button
          className="zat-quick-btn"
          data-tip="FAQT2 Test Calls"
          onClick={() => chrome.tabs.create({ url: 'https://faqt2-prod.corp.connectionsplatform-prod-k8s.zg-int.net/findpro/testConnection' })}
        >
          <svg viewBox="0 0 24 24">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.5 11.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.41 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.41a16 16 0 0 0 6 6l.76-.76a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </button>
        <button
          className="zat-quick-btn"
          data-tip="Pearl Dashboard"
          onClick={() => chrome.tabs.create({ url: 'https://concierge.revoc.zillow.com/admin/audit' })}
        >
          <svg viewBox="0 0 24 24">
            <path d="M12 2a10 10 0 1 0 10 10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </button>
        <button
          className="zat-quick-btn"
          data-tip="VoIP Dashboard"
          onClick={() => chrome.tabs.create({ url: 'https://internal-tools-ui.zg-ap-apps.com/voip-dashboard' })}
        >
          <svg viewBox="0 0 24 24">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
          </svg>
        </button>
      </div>

      {/* ZUID → Splunk */}
      <label className="zat-input-label">Splunk - Events by ZUID</label>
      <p className="zat-input-hint">Opens the Splunk connections dashboard filtered by ZUID.</p>
      <div className="flex gap-2 mb-1">
        <input
          type="text"
          inputMode="numeric"
          className={`zat-input${zuidError ? ' has-error' : ''}`}
          placeholder="Input ZUID"
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
      <div className="zat-section-divider" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        Pearl Lead Audit
        <span className="zat-wip-tag">WIP</span>
      </div>
      <p className="zat-input-hint">Opens the Pearl concierge audit page for the given lead ID.</p>
      <div className="flex gap-2 mb-1">
        <input
          type="text"
          className="zat-input"
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
    </div>
  );
}
