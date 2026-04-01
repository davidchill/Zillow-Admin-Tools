// ── ChangelogModal — parses and displays CHANGELOG_UI.md ──

import { useState, useEffect, useRef } from 'react';

interface Props {
  onClose: () => void;
}

function parseChangelog(md: string): string {
  const lines = md.split('\n');
  let html = '';
  let inList = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line === '---') {
      if (inList) { html += '</ul>'; inList = false; }
      continue;
    }
    if (
      line.startsWith('# ') ||
      line.startsWith('All notable') ||
      line.startsWith('Versions are') ||
      line.startsWith('Versioning follows') ||
      line.startsWith('- `0.') ||
      line.startsWith('- `1.')
    ) continue;

    if (/^## \[Earlier\]/.test(line)) {
      if (inList) { html += '</ul>'; inList = false; }
      html += '<div class="zat-cl-version"><span class="zat-cl-version-num">Earlier</span></div>';
      continue;
    }

    const vMatch = line.match(/^## \[(.+?)\]\s*[–-]\s*(.+)/);
    if (vMatch) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<div class="zat-cl-version"><span class="zat-cl-version-num">v${vMatch[1]}</span><span class="zat-cl-version-date">${vMatch[2]}</span></div>`;
      continue;
    }

    const sMatch = line.match(/^### (.+)/);
    if (sMatch) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<div class="zat-cl-section">${sMatch[1]}</div><ul class="zat-cl-list">`;
      inList = true;
      continue;
    }

    const iMatch = line.match(/^- (.+)/);
    if (iMatch) {
      if (!inList) { html += '<ul class="zat-cl-list">'; inList = true; }
      html += `<li>${iMatch[1]}</li>`;
      continue;
    }
  }

  if (inList) html += '</ul>';
  return html;
}

export default function ChangelogModal({ onClose }: Props) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    fetch(chrome.runtime.getURL('CHANGELOG_UI.md'))
      .then((r) => r.text())
      .then((md) => {
        setHtml(parseChangelog(md));
        setLoading(false);
      })
      .catch(() => {
        setHtml('<div style="text-align:center;padding:24px;color:var(--text-faint);font-size:13px;">Could not load changelog.</div>');
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
            <div dangerouslySetInnerHTML={{ __html: html }} />
          )}
        </div>
      </div>
    </div>
  );
}
