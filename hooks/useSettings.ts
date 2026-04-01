// ── useSettings — loads and persists extension settings from chrome.storage ──

import { useState, useEffect, useCallback } from 'react';
import type { Settings } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Initial load
    chrome.storage.local.get('zillow_settings', (data) => {
      if (data.zillow_settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...data.zillow_settings });
      }
      setReady(true);
    });

    // Live updates (e.g. FAB toggle from content script side)
    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes.zillow_settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...(changes.zillow_settings.newValue || {}) });
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const updateSettings = useCallback((update: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...update };
      chrome.storage.local.set({ zillow_settings: next });
      return next;
    });
  }, []);

  return { settings, updateSettings, ready };
}
