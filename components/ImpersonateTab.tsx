// ── ImpersonateTab — impersonate + find agent search ──

import { useState, useRef } from 'react';
import type { ImpersonateMethod, HistoryItem, Settings } from '@/types';
import { buildImpersonateUrl, buildAgentSearchUrl } from '@/utils/urls';
import { validateEmail, detectImpersonateMethod } from '@/utils/validation';
import ConfirmBar from './ConfirmBar';
import HistorySection from './HistorySection';
import { SearchSVG } from './icons';

const UserSVG = (
  <svg viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MODES: { mode: ImpersonateMethod; label: string; wip?: boolean }[] = [
  { mode: 'zuid', label: 'ZUID' },
  { mode: 'email', label: 'Email' },
  { mode: 'screenname', label: 'Screen Name' },
  { mode: 'auto', label: 'Auto', wip: true },
];

const MODE_LABELS: Record<string, string> = {
  auto: 'Email, ZUID, or Screen Name',
  email: 'Email Address',
  zuid: 'User ID (ZUID)',
  screenname: 'Screen Name',
};

const MODE_PLACEHOLDERS: Record<string, string> = {
  auto: 'Email, ZUID, or Screen Name',
  email: 'e.g. user@example.com',
  zuid: 'e.g. 12345678',
  screenname: 'e.g. johndoe42',
};

interface Props {
  history: HistoryItem[];
  settings: Settings;
  onAddToHistory: (type: 'impersonate', id: string, method: ImpersonateMethod, label?: string) => void;
  onClearHistory: () => void;
}

export default function ImpersonateTab({
  history,
  settings,
  onAddToHistory,
  onClearHistory,
}: Props) {
  const [mode, setMode] = useState<ImpersonateMethod>('zuid');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState<{ method: ImpersonateMethod; value: string } | null>(null);

  // Agent search
  const [agentName, setAgentName] = useState('');
  const [agentError, setAgentError] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  function executeImpersonate(method: ImpersonateMethod, val: string) {
    const url = buildImpersonateUrl(method, val);
    chrome.tabs.create({ url }, (tab) => {
      chrome.runtime.sendMessage({
        action: 'scrapeTab',
        tabId: tab.id,
        historyId: val,
        historyType: 'impersonate',
      });
    });
    if (settings.historyEnabled !== false) {
      onAddToHistory('impersonate', val, method);
    }
  }

  function doSearch() {
    const raw = value.trim();
    if (!raw) return;
    setError('');
    setPending(null);

    if (mode === 'auto') {
      const detected = detectImpersonateMethod(raw);
      if ('error' in detected) { setError(detected.error); return; }
      setPending({ method: detected.method, value: detected.value });
      return;
    }

    if (mode === 'email' && !validateEmail(raw)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (mode === 'zuid' && !/^\d+$/.test(raw)) {
      setError('ZUID must be numeric.');
      return;
    }
    executeImpersonate(mode, raw);
    setValue('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') doSearch();
  }

  function handleModeChange(m: ImpersonateMethod) {
    setMode(m);
    setError('');
    setPending(null);
  }

  function handleConfirm() {
    if (!pending) return;
    executeImpersonate(pending.method, pending.value);
    setPending(null);
    setValue('');
  }

  function doAgentSearch() {
    const name = agentName.trim();
    setAgentError('');
    if (!name) {
      setAgentError('Enter an agent name to search.');
      return;
    }
    chrome.tabs.create({ url: buildAgentSearchUrl(name) });
    setAgentName('');
  }

  const limit = Math.min(20, Math.max(5, settings.historyLimit || 5));
  const filteredHistory = history
    .filter((h) => h.type === 'impersonate')
    .slice(0, limit);

  const emptyMsg =
    settings.historyEnabled === false
      ? 'History recording is off. Enable it in Settings.'
      : 'No recent impersonations';

  return (
    <div className="flex flex-col gap-0">
      {/* Impersonation-related quick tools */}
      <div className="zat-section-label" style={{ background: 'transparent', margin: '0 0 8px' }}>Profile Tools</div>
      <div className="zat-quick-links" style={{ padding: '0 0 4px', background: 'none' }}>
        <button
          className="zat-quick-btn"
          data-tip="Merge Profiles"
          onClick={() => chrome.tabs.create({ url: 'https://www.zillow.com/admin/TransferProfileData.htm' })}
        >
          <svg viewBox="0 0 24 24">
            <circle cx="18" cy="18" r="3" />
            <circle cx="6" cy="6" r="3" />
            <path d="M6 21V9a9 9 0 0 0 9 9" />
          </svg>
        </button>
        <button
          className="zat-quick-btn"
          data-tip="Upgrade Account"
          onClick={() => chrome.tabs.create({ url: 'https://www.zillow.com/admin/UpgradeAccount.htm' })}
        >
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <polyline points="16 12 12 8 8 12" />
            <line x1="12" y1="16" x2="12" y2="8" />
          </svg>
        </button>
      </div>

      <div className="zat-section-label" style={{ background: 'transparent', margin: '4px 0 8px' }}>Impersonate</div>

      {/* Mode row */}
      <div className="zat-seg" style={{ marginBottom: 10 }}>
        {MODES.map(({ mode: m, label, wip }) => (
          <button
            key={m}
            className={`zat-seg-btn${mode === m ? ' active' : ''}`}
            onClick={() => handleModeChange(m)}
          >
            {label}
            {wip && <span className="zat-wip-tag">WIP</span>}
          </button>
        ))}
      </div>

      {/* Confirm bar (auto-detect) */}
      {pending && (
        <ConfirmBar
          method={pending.method}
          value={pending.value}
          onConfirm={handleConfirm}
          onCancel={() => { setPending(null); inputRef.current?.focus(); }}
        />
      )}

      {/* Main input */}
      <label className="zat-input-label">{MODE_LABELS[mode]}</label>
      <div className="flex gap-2 mb-1">
        <input
          ref={inputRef}
          type="text"
          className={`zat-input${error ? ' has-error' : ''}`}
          placeholder={MODE_PLACEHOLDERS[mode]}
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(''); }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        <button className="zat-search-btn" onClick={doSearch}>
          {SearchSVG}
        </button>
      </div>
      {error && <div className="zat-error">{error}</div>}

      {/* Find an Agent */}
      <div className="zat-section-divider">Find an Agent</div>
      <p className="zat-input-hint">Opens the Zillow Find an Agent results page.</p>
      <div className="flex gap-2 mb-1">
        <input
          type="text"
          className="zat-input"
          placeholder="Agent name"
          value={agentName}
          onChange={(e) => { setAgentName(e.target.value); setAgentError(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') doAgentSearch(); }}
          autoComplete="off"
        />
        <button className="zat-search-btn" onClick={doAgentSearch}>
          {SearchSVG}
        </button>
      </div>
      {agentError && <div className="zat-error">{agentError}</div>}

      {/* History */}
      <div className="mt-4">
        <HistorySection
          title="Recently Impersonated Profiles"
          icon={UserSVG}
          items={filteredHistory}
          emptyText={emptyMsg}
          onClear={filteredHistory.length > 0 ? onClearHistory : undefined}
          onItemClick={(item) => {
            chrome.tabs.create({
              url: buildImpersonateUrl(
                item.method as ImpersonateMethod,
                item.id
              ),
            });
          }}
        />
      </div>
    </div>
  );
}
