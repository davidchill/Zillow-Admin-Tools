// ── useHistory — loads and manages impersonation + viewed history ──

import { useState, useEffect, useCallback } from 'react';
import type { HistoryItem, HistoryItemType, ImpersonateMethod } from '@/types';

export function useHistory(historyLimit: number) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [viewedHistory, setViewedHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    // Initial load
    chrome.storage.local.get(['zillow_history_v3', 'zillow_viewed_v3'], (data) => {
      setHistory(data.zillow_history_v3 || []);
      setViewedHistory(data.zillow_viewed_v3 || []);
    });

    // Live updates (e.g. background populates address labels after tab scrape)
    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes.zillow_history_v3) {
        setHistory(changes.zillow_history_v3.newValue || []);
      }
      if (changes.zillow_viewed_v3) {
        setViewedHistory(changes.zillow_viewed_v3.newValue || []);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const addToHistory = useCallback(
    (
      type: HistoryItemType,
      id: string,
      method: ImpersonateMethod | 'viewed' | 'zpid' | 'phx' | 'dit',
      label = ''
    ) => {
      const limit = Math.min(20, Math.max(5, historyLimit));
      const item: HistoryItem = { type, id, method, label, timestamp: Date.now() };
      setHistory((prev) => {
        const updated = [item]
          .concat(prev.filter((h) => !(h.id === id && h.type === type)))
          .slice(0, limit);
        chrome.storage.local.set({ zillow_history_v3: updated });
        return updated;
      });
    },
    [historyLimit]
  );

  const clearHistory = useCallback(() => {
    setHistory((prev) => {
      const updated = prev.filter((h) => h.type !== 'impersonate');
      chrome.storage.local.set({ zillow_history_v3: updated });
      return updated;
    });
  }, []);

  const clearViewed = useCallback(() => {
    setViewedHistory([]);
    chrome.storage.local.set({ zillow_viewed_v3: [] });
  }, []);

  const removeFromViewed = useCallback((zpid: string) => {
    setViewedHistory((prev) => {
      const filtered = prev.filter((h) => h.id !== zpid);
      if (filtered.length !== prev.length) {
        chrome.storage.local.set({ zillow_viewed_v3: filtered });
        return filtered;
      }
      return prev;
    });
  }, []);

  return {
    history,
    viewedHistory,
    addToHistory,
    clearHistory,
    clearViewed,
    removeFromViewed,
  };
}
