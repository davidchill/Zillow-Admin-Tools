// ── ChangelogModal — parses and displays CHANGELOG_UI.md ──

import { useState, useEffect, useRef } from 'react';

interface Props {
  onClose: () => void;
}

function parseChangelog(md: string): JSX.Element[] {
  const lines = md.split('\n');
  const elements: JSX.Element[] = [];
  let pending: JSX.Element[] = [];
  let k = 0;

  const flush = () => {
    if (pending.length) {
      elements.push(<ul key={k++} className="zat-cl-list">{pending}</ul>);
      pending = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line === '---') { flush(); continue; }
    if (
      line.startsWith('# ') ||
      line.startsWith('All notable') ||
      line.startsWith('Versions are') ||
      line.startsWith('Versioning follows') ||
      line.startsWith('- `0.') ||
      line.startsWith('- `1.')
    ) continue;

    if (/^## \[Earlier\]/.test(line)) {
      flush();
      elements.push(
        <div key={k++} className="zat-cl-version">
          <span className="zat-cl-version-num">Earlier</span>
        </div>
      );
      continue;
    }

    const vMatch = line.match(/^## \[(.+?)\]\s*[–-]\s*(.+)/);
    if (vMatch) {
      flush();
      elements.push(
        <div key={k++} className="zat-cl-version">
          <span className="zat-cl-version-num">v{vMatch[1]}</span>
          <span className="zat-cl-version-date">{vMatch[2]}</span>
        </div>
      );
      continue;
    }

    const sMatch = line.match(/^### (.+)/);
    if (sMatch) {
      flush();
      elements.push(<div key={k++} className="zat-cl-section">{sMatch[1]}</div>);
      continue;
    }

    const iMatch = line.match(/^- (.+)/);
    if (iMatch) {
      pending.push(<li key={k++}>{iMatch[1]}</li>);
    }
  }

  flush();
  return elements;
}

export default function ChangelogModal({ onClose }: Props) {
  const [elements, setElements] = useState<JSX.Element[]>([]);
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    fetch(chrome.runtime.getURL('CHANGELOG_UI.md'))
      .then((r) => r.text())
      .then((md) => {
        setElements(parseChangelog(md));
        setLoading(false);
      })
      .catch(() => {
        setElements([
          <div key="err" style={{ textAlign: 'center', padding: 24, color: 'var(--text-faint)', fontSize: 13 }}>
            Could not load changelog.
          </div>,
        ]);
        setLoading(false);
      });
  }, []);

  return (
    <div
      className="zat-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="zat-modal">
        <div className="zat-modal-header">
          <h2>What&rsquo;s New</h2>
          <button className="zat-modal-close" onClick={onClose} aria-label="Close changelog">
            <svg viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="zat-modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-faint)', fontSize: 13 }}>
              Loading…
            </div>
          ) : (
            <>{elements}</>
          )}
        </div>
      </div>
    </div>
  );
}
