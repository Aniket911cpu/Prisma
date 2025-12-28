/**
 * Prisma Background Service Worker
 */

// Initialize default state
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['pickCount', 'history'], (result) => {
        if (result.pickCount === undefined) {
            chrome.storage.local.set({ pickCount: 0 });
        }
        if (!result.history) {
            chrome.storage.local.set({ history: [] });
        }
    });

    // Context Menu
    chrome.contextMenus.create({
        id: "prisma-pick",
        title: "Pick Color with Prisma",
        contexts: ["all"]
    });
});

// Handle Context Menu Click
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "prisma-pick") {
        // We cannot open EyeDropper from background, needs user gesture in popup or content script
        // So we'll open the popup or inject a script. 
        // EyeDropper API requires user interaction. Best to just open popup or notify user.
        // For V3, opening action programmatically is not directly possible easily without user gesture in some browsers.
        // We will inject a notification or script to tell user to use the popup.
        // Or better, we can inject a content script to grab color if we used a canvas method, but we want native EyeDropper.
        // Native EyeDropper MUST be triggered from Popup or a UI action.
        // So for context menu, we'll simpler just log/notify for now or focus on Popup usage primarily.
        console.log("Context menu clicked. Please use the popup for EyeDropper.");
    }
});

// Message Handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "incrementPickCount") {
        chrome.storage.local.get(['pickCount'], (result) => {
            const newCount = (result.pickCount || 0) + 1;
            chrome.storage.local.set({ pickCount: newCount });
            sendResponse({ count: newCount });
        });
        return true; // async response
    }
});
