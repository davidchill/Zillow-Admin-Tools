// ── QuickLinks — row of quick-access admin tool buttons ──

const LINKS = [
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
  {
    url: 'https://support.zillow-workspace.com/admin/users',
    tip: 'Supportal',
    svg: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4" />
        <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
        <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
        <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
        <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
      </svg>
    ),
  },
  {
    url: 'https://www.zuora.com/platform/webapp',
    tip: 'Zuora Billing',
    svg: (
      <svg viewBox="0 0 24 24">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
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
