// ── HistoryItem — renders a single history entry with badge, copy, and open buttons ──

import { useRef } from 'react';
import type { HistoryItem as HistoryItemType } from '@/types';
import { buildListingUrl, buildImpersonateUrl } from '@/utils/urls';

interface Props {
  item: HistoryItemType;
  onClick: () => void;
}

const COPY_SVG = (
  <svg className="zat-copy-icon" viewBox="0 0 24 24">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const EXT_SVG = (
  <svg className="zat-ext-icon" viewBox="0 0 24 24">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

function getBadgeClass(item: HistoryItemType): string {
  if (item.type === 'viewed') return 'zat-badge-viewed';
  if (item.type === 'zpid') return 'zat-badge-zpid';
  if (item.type === 'phx') return 'zat-badge-phx';
  if (item.type === 'dit') return 'zat-badge-dit';
  return `zat-badge-${item.method || 'zuid'}`;
}

function getBadgeText(item: HistoryItemType): string {
  if (item.type === 'viewed') return 'Viewed';
  if (item.type === 'zpid') return 'ZPID';
  if (item.type === 'phx') return 'PHX';
  if (item.type === 'dit') return 'DIT';
  if (item.method === 'screenname') return 'Screen';
  return (item.method || 'ZUID').toUpperCase();
}

function SmartCopyBtn({ text, tip }: { text: string; tip: string }) {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      const btn = btnRef.current;
      if (!btn) return;
      btn.classList.add('copy-ok');
      setTimeout(() => btn.classList.remove('copy-ok'), 1500);
    });
  };

  return (
    <button ref={btnRef} className="zat-copy-btn" data-tip={tip} onClick={handleClick}>
      {COPY_SVG}
    </button>
  );
}

function OpenBtn({ url, tip, label }: { url: string; tip: string; label?: React.ReactNode }) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    chrome.tabs.create({ url });
  };
  return (
    <button className="zat-open-btn" data-tip={tip} onClick={handleClick}>
      {label ?? EXT_SVG}
    </button>
  );
}

export default function HistoryItem({ item, onClick }: Props) {
  const badgeClass = getBadgeClass(item);
  const badgeText = getBadgeText(item);

  // Build action buttons depending on type
  const isListing =
    item.type === 'viewed' ||
    item.type === 'zpid' ||
    item.type === 'phx' ||
    item.type === 'dit';

  let actionButtons: React.ReactNode;
  let extButton: React.ReactNode;

  if (item.type === 'viewed') {
    const zpidUrl = `https://www.zillow.com/homedetails/${item.id}_zpid/`;
    const phxUrl = `https://phoenix-admin-tool.dna-compute-prod.zg-int.net/zillow-data-lookup?zpid=${item.id}`;
    const ditUrl = `https://prm.in.zillow.net/zpid/edit?zpid=${item.id}`;
    actionButtons = (
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <SmartCopyBtn text={item.id} tip="Copy ZPID" />
        {item.label && <SmartCopyBtn text={item.label} tip="Copy Address" />}
        <SmartCopyBtn text={zpidUrl} tip="Copy URL" />
        <OpenBtn url={phxUrl} tip="Open in PHX" label="PHX" />
        <OpenBtn url={ditUrl} tip="Open in DIT" label="DIT" />
      </div>
    );
    extButton = <OpenBtn url={zpidUrl} tip="Open in Zillow" />;
  } else if (isListing) {
    const copyTip =
      item.type === 'zpid' || item.type === 'phx' || item.type === 'dit'
        ? 'Copy ZPID'
        : 'Copy ID';
    actionButtons = <SmartCopyBtn text={item.id} tip={copyTip} />;
    extButton = (
      <OpenBtn
        url={buildListingUrl((item.type === 'zpid' ? 'zillow' : item.type) as 'zillow' | 'phx' | 'dit', item.id)}
        tip="Open listing"
      />
    );
  } else {
    // Impersonate
    const copyTip =
      item.method === 'email'
        ? 'Copy Email'
        : item.method === 'screenname'
        ? 'Copy Screen Name'
        : 'Copy ZUID';
    actionButtons = <SmartCopyBtn text={item.id} tip={copyTip} />;
    extButton = (
      <OpenBtn
        url={buildImpersonateUrl(item.method as 'email' | 'zuid' | 'screenname', item.id)}
        tip="Impersonate"
      />
    );
  }

  return (
    <button className="zat-history-item" onClick={onClick}>
      <div className="zat-history-item-top">
        <span className="zat-history-item-id">
          <span className={`zat-badge ${badgeClass}`}>{badgeText}</span>
          <span className="zat-history-item-id-text">{item.id}</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {actionButtons}
          {extButton}
        </div>
      </div>
      {item.label && (
        <div className="zat-history-item-sub">{item.label}</div>
      )}
    </button>
  );
}
