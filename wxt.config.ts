import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Zillow Admin Tools',
    version: '0.8.2',
    description:
      'Search by ZPID or Impersonate by Email, ZUID, or Screen Name — with right-click context menu support.',
    permissions: [
      'contextMenus',
      'activeTab',
      'tabs',
      'scripting',
      'storage',
      'sidePanel',
      'webNavigation',
    ],
    host_permissions: ['https://www.zillow.com/*', '*://*/*'],
    web_accessible_resources: [
      { resources: ['icons/icon48.png'], matches: ['*://*/*'] },
    ],
    side_panel: { default_path: 'sidepanel.html' },
    icons: {
      '16': 'icons/icon16.png',
      '48': 'icons/icon48.png',
      '128': 'icons/icon128.png',
    },
    action: {
      default_popup: 'popup.html',
      default_icon: {
        '16': 'icons/icon16.png',
        '48': 'icons/icon48.png',
        '128': 'icons/icon128.png',
      },
    },
  },
});
