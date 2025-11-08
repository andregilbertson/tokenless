// Background service worker
chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed");

    // Initialize default storage
    chrome.storage.sync.set({ clickCount: 0 });
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getData") {
        age.sync.get(["clickCount"], (result) => {
            sendResponse({ count: result.clickCount || 0 });
        });
        return true; // Keep the message channel open for async response
    }
});

// Example: Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
        console.log("Tab updated:", tab.url);
    }
});
