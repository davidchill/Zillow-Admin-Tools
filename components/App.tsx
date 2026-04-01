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
    const defaultTab = settings.defaultTab || 'listing';
    // If zpidTab is disabled, fall back to impersonate
    if (!settings.zpidTabEnabled && defaultTab === 'listing') {
      setCurrentTab('impersonate');
    } else {
      setCurrentTab(defaultTab);
    }
  }, [ready]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Reload history when tab becomes visible again (popup re-opens)
  useEffect(() => {
    const handler = () => {
      if (!document.hidden) {
        chrome.storage.local.get(
          ['zillow_history_v3', 'zillow_viewed_v3', 'zillow_settings'],
          () => {
            // Storage hook handles the update via onChanged listener
          }
        );
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  if (!ready) return null;

  const showListingTab = settings.zpidTabEnabled;

  function switchTab(tab: Tab) {
    if (tab === 'listing' && !showListingTab) return;
    setCurrentTab(tab);
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'var(--bg-page)',
        color: 'var(--text-primary)',
      }}
    >
      <Header
        onChangelogOpen={() => setShowChangelog(true)}
        onSettingsOpen={() => setShowSettings(true)}
      />

      <HighspotSearch />

      <QuickLinks />

      {/* Tab bar */}
      <div className="zat-tabs">
        {showListingTab && (
          <button
            className={`zat-tab${currentTab === 'listing' ? ' active' : ''}`}
            onClick={() => switchTab('listing')}
          >
            {ListingTabIcon}
            Listing<br />Search
          </button>
        )}
        <button
          className={`zat-tab${currentTab === 'impersonate' ? ' active' : ''}`}
          onClick={() => switchTab('impersonate')}
        >
          {ImpersonateTabIcon}
          Impersonate /<br />Find Agent
        </button>
        <button
          className={`zat-tab${currentTab === 'cxn' ? ' active' : ''}`}
          onClick={() => switchTab('cxn')}
        >
          {CxnTabIcon}
          CXN Call<br />Testing
        </button>
      </div>

      {/* Tab content */}
      <div style={{ padding: '14px 14px 20px', flex: 1, overflowY: 'auto' }}>
        {currentTab === 'listing' && showListingTab && (
          <ListingTab
            viewedHistory={viewedHistory}
            settings={settings}
            onAddToHistory={addToHistory as (type: 'zpid' | 'phx' | 'dit', id: string, method: 'zpid' | 'phx' | 'dit', label?: string) => void}
            onClearViewed={clearViewed}
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
