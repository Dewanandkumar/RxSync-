/**
 * Service Worker for Rx to Google Reminder
 * Manifest V3 compliant service worker
 */

// Initialize default settings on install
chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get(['defaultTimes', 'autoNotify']);
  if (!existing.defaultTimes) {
    await chrome.storage.local.set({
      defaultTimes: {
        morning: '08:00',
        afternoon: '13:00',
        night: '20:30',
        bedtime: '22:00'
      },
      autoNotify: true
    });
  }
});

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      if (message.type === 'OPEN_SIDE_PANEL') {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.windowId) {
          await chrome.sidePanel.open({ windowId: tab.windowId });
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'No active window found' });
        }
      } else if (message.type === 'GET_SETTINGS') {
        const settings = await chrome.storage.local.get(['defaultTimes', 'autoNotify']);
        sendResponse({ success: true, settings });
      } else {
        sendResponse({ success: true });
      }
    } catch (err) {
      console.error('Service worker error:', err);
      sendResponse({ success: false, error: err.message });
    }
  })();
  return true; // Keep message channel open for async response
});
