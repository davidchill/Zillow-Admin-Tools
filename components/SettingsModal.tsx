// ── SettingsModal — extension settings panel ──

import type { Settings, ThemeMode, Tab } from '@/types';

interface Props {
  settings: Settings;
  onUpdate: (update: Partial<Settings>) => void;
  onClose: () => void;
}

function Toggle({
  checked,
  onChange,
  label,
  sub,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sub?: string;
}) {
  return (
    <div className="zat-toggle-row">
      <div className="zat-toggle-label-group">
        <div className="zat-toggle-label">{label}</div>
        {sub && <div className="zat-toggle-sub">{sub}</div>}
      </div>
      <label className="zat-toggle">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="zat-toggle-track" />
      </label>
    </div>
  );
}

const THEME_OPTIONS: { val: ThemeMode; label: string }[] = [
  { val: 'auto', label: 'Auto' },
  { val: 'light', label: 'Light' },
  { val: 'dark', label: 'Dark' },
];

const TAB_OPTIONS: { val: Tab; label: string }[] = [
  { val: 'listing', label: 'Listing' },
  { val: 'impersonate', label: 'Impersonate' },
  { val: 'cxn', label: 'CXN' },
];

export default function SettingsModal({ settings, onUpdate, onClose }: Props) {
  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseInt(e.target.value, 10);
    const clamped = Math.min(20, Math.max(5, isNaN(raw) ? 5 : raw));
    onUpdate({ historyLimit: clamped });
  };

  return (
    <div className="zat-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="zat-modal">
        <div className="zat-modal-header">
          <h2>Settings</h2>
          <button className="zat-modal-close" onClick={onClose} aria-label="Close settings">
            <svg viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="zat-modal-body">
          {/* Theme picker */}
          <div className="zat-setting-row">
            <span className="zat-setting-label">Theme</span>
            <div className="zat-seg">
              {THEME_OPTIONS.map(({ val, label }) => (
                <button
                  key={val}
                  className={`zat-seg-btn${settings.themeMode === val ? ' active' : ''}`}
                  onClick={() => onUpdate({ themeMode: val })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Default tab picker */}
          <div className="zat-setting-row">
            <span className="zat-setting-label">Default Tab</span>
            <div className="zat-toggle-sub" style={{ marginBottom: 8 }}>The tab you see first when opening the popup or side panel.</div>
            <div className="zat-seg">
              {TAB_OPTIONS.map(({ val, label }) => (
                <button
                  key={val}
                  className={`zat-seg-btn${settings.defaultTab === val ? ' active' : ''}`}
                  onClick={() => onUpdate({ defaultTab: val })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* History toggle + nested limit */}
          <div className="zat-setting-row">
            <Toggle
              checked={settings.historyEnabled}
              onChange={(v) => onUpdate({ historyEnabled: v })}
              label="Record History"
              sub="Tracks impersonations and recently viewed listings."
            />
            {settings.historyEnabled && (
              <div style={{ marginTop: 6, paddingTop: 6, paddingLeft: 14, borderTop: '1px solid var(--border-light)' }}>
                <div className="zat-setting-label-row">
                  <span className="zat-setting-label">History Limit</span>
                  <span className="zat-setting-label-hint">5 – 20 items</span>
                </div>
                <input
                  type="number"
                  min={5}
                  max={20}
                  value={settings.historyLimit}
                  onChange={handleLimitChange}
                  className="zat-setting-input"
                />
              </div>
            )}
          </div>

          {/* Floating tab toggle */}
          <div className="zat-setting-row">
            <Toggle
              checked={settings.floatingTabEnabled}
              onChange={(v) => onUpdate({ floatingTabEnabled: v })}
              label="Floating Side Panel Button"
              sub="Shows the draggable FAB on all pages to open the side panel."
            />
          </div>

          {/* Redirect toggle */}
          <div className="zat-setting-row">
            <Toggle
              checked={settings.redirectEnabled}
              onChange={(v) => onUpdate({ redirectEnabled: v })}
              label="Smart Redirect After Impersonate"
              sub="Redirects you to the profile page when impersonating agent profiles."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
