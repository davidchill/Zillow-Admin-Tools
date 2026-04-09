// ── App — root component shared by popup and sidepanel ──

import { useState, useEffect } from 'react';
import type { Tab } from '@/types';
import { useSettings } from '@/hooks/useSettings';
import { useHistory } from '@/hooks/useHistory';
import Header from './Header';
import HighspotSearch from './HighspotSearch';
import QuickLinks from './QuickLinks';
import ImpersonateTab from './ImpersonateTab';
import ListingTab from './ListingTab';
import CxnTab from './CxnTab';
import SettingsModal from './SettingsModal';
import ChangelogModal from './ChangelogModal';

export type Surface = 'popup' | 'sidepanel';

interface Props {
  surface: Surface;
}

// ── Tab icons ──────────────────────────────────────────────────────────────

const ListingTabIcon = (
  <svg viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const ImpersonateTabIcon = (
  <svg viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const CxnTabIcon = (
  <svg viewBox="0 0 24 24">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.5 11.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.41 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.41a16 16 0 0 0 6 6l.76-.76a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.34 16l-.42 2.92z" />
  </svg>
);

export default function App({ surface }: Props) {
  const { settings, updateSettings, ready } = useSettings();
  const {
    history,
    viewedHistory,
    addToHistory,
    clearHistory,
    clearSearchedListings,
    clearViewed,
    removeFromViewed,
  } = useHistory(settings.historyLimit);

  const [currentTab, setCurrentTab] = useState<Tab>('listing');
  const [showSettings, setShowSettings] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);

  // Set body surface attribute for CSS width rules
  useEffect(() => {
    document.body.setAttribute('data-surface', surface);
  }, [surface]);

  // Apply theme to <html>
  useEffect(() => {
    const { themeMode } = settings;
    if (themeMode === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (themeMode === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [settings.themeMode]);

  // Set initial tab from settings once loaded
  useEffect(() => {
    if (!ready) return;
    setCurrentTab(settings.defaultTab || 'listing');
  }, [ready]);  // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return null;

  function switchTab(tab: Tab) {
    setCurrentTab(tab);
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-page)',
        color: 'var(--text-primary)',
      }}
    >
      <Header
        onChangelogOpen={() => setShowChangelog(true)}
        onSettingsOpen={() => setShowSettings(true)}
      />

      <HighspotSearch />

      <div className="zat-section-label">Quick Access</div>

      <QuickLinks />

      <div style={{ height: '1px', background: 'var(--border-light)', margin: '0 0 10px' }} />

      {/* Tab bar */}
      <div className="zat-tabs">
        <button
          className={`zat-tab${currentTab === 'listing' ? ' active' : ''}`}
          onClick={() => switchTab('listing')}
        >
          {ListingTabIcon}
          Listing<br />Troubleshooting
        </button>
        <button
          className={`zat-tab${currentTab === 'impersonate' ? ' active' : ''}`}
          onClick={() => switchTab('impersonate')}
        >
          {ImpersonateTabIcon}
          Impersonate /<br />Profile Troubleshooting
        </button>
        <button
          className={`zat-tab${currentTab === 'cxn' ? ' active' : ''}`}
          onClick={() => switchTab('cxn')}
        >
          {CxnTabIcon}
          CXN Call<br />Troubleshooting
        </button>
      </div>

      {/* Tab content */}
      <div style={{ padding: '14px 14px 0', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {currentTab === 'listing' && (
          <ListingTab
            viewedHistory={viewedHistory}
            searchedHistory={history.filter(
              (h) => h.type === 'zpid' || h.type === 'phx' || h.type === 'dit'
            )}
            settings={settings}
            onAddToHistory={addToHistory}
            onClearViewed={clearViewed}
            onClearSearched={clearSearchedListings}
            onRemoveFromViewed={removeFromViewed}
          />
        )}
        {currentTab === 'impersonate' && (
          <ImpersonateTab
            history={history}
            settings={settings}
            onAddToHistory={addToHistory as (type: 'impersonate', id: string, method: 'email' | 'zuid' | 'screenname' | 'auto', label?: string) => void}
            onClearHistory={clearHistory}
          />
        )}
        {currentTab === 'cxn' && <CxnTab />}
      </div>

      {/* Modals */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showChangelog && (
        <ChangelogModal onClose={() => setShowChangelog(false)} />
      )}
    </div>
  );
}
