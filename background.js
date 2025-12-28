/*
  Background Service Worker
  Handles extension installation and global events.
*/

chrome.runtime.onInstalled.addListener(() => {
  console.log('Advanced Color Picker installed.');
  // Initialize default storage values if needed
  chrome.storage.local.get(['colorHistory', 'settings'], (result) => {
    if (!result.colorHistory) {
      chrome.storage.local.set({ colorHistory: [] });
    }
  });
});
