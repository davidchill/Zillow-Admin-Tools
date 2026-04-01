// ── Zillow Admin Tools – Shared Types ──

export type ImpersonateMethod = 'auto' | 'email' | 'zuid' | 'screenname';
export type ListingMode = 'zillow' | 'phx' | 'dit';
export type Tab = 'impersonate' | 'listing' | 'cxn';
export type ThemeMode = 'auto' | 'light' | 'dark';
export type HistoryItemType = 'impersonate' | 'zpid' | 'phx' | 'dit' | 'viewed';

export interface HistoryItem {
  type: HistoryItemType;
  id: string;
  method: ImpersonateMethod | 'viewed';
  label: string;
  timestamp: number;
}

export interface Settings {
  historyLimit: number;
  zpidTabEnabled: boolean;
  floatingTabEnabled: boolean;
  redirectEnabled: boolean;
  historyEnabled: boolean;
  defaultTab: Tab;
  themeMode: ThemeMode;
}

export const DEFAULT_SETTINGS: Settings = {
  historyLimit: 5,
  zpidTabEnabled: true,
  floatingTabEnabled: true,
  redirectEnabled: true,
  historyEnabled: true,
  defaultTab: 'listing',
  themeMode: 'auto',
};

// Autocomplete result shape from zillowstatic.com
export interface AutocompleteResult {
  display?: string;
  metaData?: {
    zpid?: number | string;
    addressString?: string;
    cityStateZip?: string;
  };
}

// Message shapes for chrome.runtime.sendMessage
export type BackgroundMessage =
  | { action: 'scrapeTab'; tabId: number; historyId: string; historyType: string }
  | { action: 'fetchAddress'; zpid: string; historyType: string }
  | { action: 'openSidePanel' }
  | { action: 'autocomplete'; query: string };
