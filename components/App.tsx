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
import { ListingTabIcon, ImpersonateTabIcon, CxnTabIcon } from './icons';

export type Surface = 'popup' | 'sidepanel';

interface Props {
  surface: Surface;
}

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

  // Set initial tab from settings once loaded.
  // settings.defaultTab is intentionally omitted from deps: we only want to
  // apply the default once when ready flips true. After that the user may have
  // navigated to another tab, and re-running on every settings change would
  // reset their active tab unexpectedly.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!ready) return;
    setCurrentTab(settings.defaultTab || 'listing');
  }, [ready]);

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
        themeMode={settings.themeMode}
        onThemeChange={(mode) => updateSettings({ themeMode: mode })}
      />

      {settings.highspotEnabled && <HighspotSearch />}

      <div className="zat-section-label">Quick Access</div>

      <QuickLinks />

      <div style={{ height: '1px', background: 'var(--border)', margin: '0 14px' }} />

      {/* Tab bar */}
      <div className="zat-tabs" style={{ borderBottom: 'none' }}>
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
