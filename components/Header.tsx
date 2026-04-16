// ── Header — always-dark top bar with logo, version, changelog, and settings ──

import type { ThemeMode } from '@/types';
import { RELEASE_DATE } from '@/utils/constants';

interface Props {
  onChangelogOpen: () => void;
  onSettingsOpen: () => void;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
}

const SunIcon = (
  <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = (
  <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const SystemIcon = (
  <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const THEME_BUTTONS: { mode: ThemeMode; icon: React.ReactNode; label: string }[] = [
  { mode: 'light', icon: SunIcon,    label: 'Light'  },
  { mode: 'auto',  icon: SystemIcon, label: 'System' },
  { mode: 'dark',  icon: MoonIcon,   label: 'Dark'   },
];

export default function Header({ onChangelogOpen, onSettingsOpen, themeMode, onThemeChange }: Props) {
  const version = chrome.runtime.getManifest().version;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #0f172a, #1a2740)',
        borderTop: '2px solid #3b82f6',
        padding: '10px 14px 10px 20px',
        color: 'white',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>

        {/* Logo + title — vertically centered against the right column height */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, alignSelf: 'stretch' }}>
          <div
            style={{
              background: '#3b82f6',
              padding: 8,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              style={{ width: 20, height: 20, fill: 'none', stroke: 'white', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>

          <h1
            style={{ fontSize: 15, fontWeight: 800, color: 'white', lineHeight: 1.2, margin: 0 }}
          >
            Zillow Admin Tools
            <span className="zat-version-tag">
              v{version} · {RELEASE_DATE}
            </span>
          </h1>
        </div>

        {/* Right column: changelog/settings + theme toggle, both centered */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>

          {/* Changelog + Settings */}
          <div style={{ display: 'flex', gap: 2 }}>
            <button
              onClick={onChangelogOpen}
              title="What's New"
              className="zat-header-icon-btn"
            >
              <svg viewBox="0 0 24 24" style={{ width: 15, height: 15, fill: 'none', stroke: '#93c5fd', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </button>
            <button
              onClick={onSettingsOpen}
              title="Settings"
              className="zat-header-icon-btn"
            >
              <svg viewBox="0 0 24 24" style={{ width: 15, height: 15, fill: 'none', stroke: '#93c5fd', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>

          {/* Theme toggle pill */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.08)', borderRadius: 6, padding: 2, gap: 1 }}>
            {THEME_BUTTONS.map(({ mode, icon, label }) => (
              <button
                key={mode}
                title={label}
                onClick={() => onThemeChange(mode)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 22,
                  height: 22,
                  borderRadius: 4,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'background 0.15s, color 0.15s',
                  background: themeMode === mode ? '#3b82f6' : 'transparent',
                  color: themeMode === mode ? '#ffffff' : '#64748b',
                }}
              >
                {icon}
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
