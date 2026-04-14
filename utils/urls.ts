// ── URL builders ──

import type { ImpersonateMethod, ListingMode } from '@/types';

export const IMPERSONATE_BASE = 'https://www.zillow.com/user/Impersonate.htm';
export const PROFILE_REDIRECT = 'https://www.zillow.com/myzillow/Profile.htm';
export const CONSUMER_REDIRECT = 'https://www.zillow.com/myzillow/Account.htm';

export const CXN_SPLUNK_Zuid_BASE =
  'https://zillowgroup.splunkcloud.com/en-US/app/search/connections_events_by_zuid' +
  '?form.field1.earliest=-30d%40d&form.field1.latest=now' +
  '&form.team_member_zuid=*&form.lead_ID=*&form.ZUID=';

export const PEARL_LEAD_BASE = 'https://concierge.revoc.zillow.com/admin/audit/';

export const DATADOG_EVENTS_BASE =
  'https://premier-agent.datadoghq.com/dashboard/d4f-vg6-29e/partner-support---pa-app-events-for-connections' +
  '?fromUser=false&refresh_mode=sliding&tpl_var_context.agentZuid%5B0%5D=';

export function buildImpersonateUrl(method: ImpersonateMethod, value: string): string {
  const p = new URLSearchParams();
  if (method === 'email') {
    p.set('pEmail', value);
    p.set('email', value);
  } else if (method === 'zuid') {
    p.set('pZuid', value);
    p.set('zuid', value);
    p.set('action', 'impersonate');
    p.set('confirm', '1');
  } else {
    p.set('pScreenName', value);
    p.set('screenName', value);
  }
  return IMPERSONATE_BASE + '?' + p.toString();
}

export function buildListingUrl(type: ListingMode | 'viewed', id: string): string {
  if (type === 'phx')
    return `https://phoenix-admin-tool.dna-compute-prod.zg-int.net/zillow-data-lookup?zpid=${id}`;
  if (type === 'dit')
    return `https://prm.in.zillow.net/zpid/edit?zpid=${id}`;
  // 'zillow' or 'viewed'
  return `https://www.zillow.com/homedetails/${id}_zpid/`;
}

export function buildAgentSearchUrl(name: string): string {
  const params = new URLSearchParams({ name: name.trim() });
  return `https://www.zillow.com/professionals/real-estate-agent-reviews/?${params.toString()}`;
}
