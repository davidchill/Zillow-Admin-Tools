// ── QuickLinks — row of quick-access admin tool buttons ──

const LINKS = [
  {
    url: 'https://www.zillow.com/admin/richdata/ManageVirtualTours.htm',
    tip: '3D Home Tours Tool',
    svg: (
      <svg viewBox="0 0 24 24">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    url: 'https://www.zillow.com/admin/AdminListing.htm',
    tip: 'Address Change Tool',
    svg: (
      <svg viewBox="0 0 24 24">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    url: 'https://www.zillow.com/admin/TransferProfileData.htm',
    tip: 'Merge Profiles Tool',
    svg: (
      <svg viewBox="0 0 24 24">
        <circle cx="18" cy="18" r="3" />
        <circle cx="6" cy="6" r="3" />
        <path d="M6 21V9a9 9 0 0 0 9 9" />
      </svg>
    ),
  },
  {
    url: 'https://www.zillow.com/admin/UpgradeAccount.htm',
    tip: 'Upgrade Account Tool',
    svg: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <polyline points="16 12 12 8 8 12" />
        <line x1="12" y1="16" x2="12" y2="8" />
      </svg>
    ),
  },
  {
    url: 'https://referral-pricing-admin-portal.corp.zillow-prod-k8s.zg-int.net/',
    tip: 'CaRP Tool',
    svg: (
      <svg viewBox="0 0 24 24">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
];

export default function QuickLinks() {
  return (
    <div className="zat-quick-links">
      {LINKS.map(({ url, tip, svg }) => (
        <button
          key={url}
          className="zat-quick-btn"
          data-tip={tip}
          onClick={() => chrome.tabs.create({ url })}
        >
          {svg}
        </button>
      ))}
    </div>
  );
}
