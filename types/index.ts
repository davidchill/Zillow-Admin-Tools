// ── Zillow Admin Tools – Shared Types ──

export type ImpersonateMethod = 'auto' | 'email' | 'zuid' | 'screenname';
export type ListingMode = 'zillow' | 'phx' | 'dit';
export type Tab = 'impersonate' | 'listing' | 'cxn';
export type ThemeMode = 'auto' | 'light' | 'dark';
export type HistoryItem =
  | { type: 'impersonate'; id: string; method: ImpersonateMethod; label: string; timestamp: number }
  | { type: 'zpid';        id: string; method: 'zpid';            label: string; timestamp: number }
  | { type: 'phx';         id: string; method: 'phx';             label: string; timestamp: number }
  | { type: 'dit';         id: string; method: 'dit';             label: string; timestamp: number }
  | { type: 'viewed';      id: string; method: 'viewed';          label: string; timestamp: number };

// Derived alias — kept for backwards compatibility with existing imports
export type HistoryItemType = HistoryItem['type'];

export interface Settings {
  historyLimit: number;
  floatingTabEnabled: boolean;
  redirectEnabled: boolean;
  historyEnabled: boolean;
  defaultTab: Tab;
  themeMode: ThemeMode;
}

export const DEFAULT_SETTINGS: Settings = {
  historyLimit: 5,
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
