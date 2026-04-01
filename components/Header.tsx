// ── Header — always-dark top bar with logo, version, changelog, and settings ──

interface Props {
  onChangelogOpen: () => void;
  onSettingsOpen: () => void;
}

export default function Header({ onChangelogOpen, onSettingsOpen }: Props) {
  const version = chrome.runtime.getManifest().version;
  const RELEASE_DATE = 'Mar 25, 2026';

  return (
    <div
      style={{
        background: '#0f172a',
        padding: '16px 20px',
        color: 'white',
        flexShrink: 0,
      }}
    >
      <div className="flex items-center gap-3 mb-1">
        {/* Icon */}
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
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>

        {/* Title + version */}
        <h1
          className="flex-1"
          style={{ fontSize: 15, fontWeight: 800, color: 'white', lineHeight: 1.2 }}
        >
          Zillow Admin Tools
          <span className="zat-version-tag">
            v{version} · {RELEASE_DATE}
          </span>
        </h1>

        {/* Changelog button */}
        <button
          onClick={onChangelogOpen}
          title="What's New"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#1e293b')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'none')}
        >
          <svg
            viewBox="0 0 24 24"
            style={{ width: 18, height: 18, fill: 'none', stroke: '#93c5fd', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </button>

        {/* Settings button */}
        <button
          onClick={onSettingsOpen}
          title="Settings"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#1e293b')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'none')}
        >
          <svg
            viewBox="0 0 24 24"
            style={{ width: 18, height: 18, fill: 'none', stroke: '#93c5fd', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      <p style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}>
        Search listings or impersonate users by email, ZUID, or screen name.
      </p>
    </div>
  );
}
