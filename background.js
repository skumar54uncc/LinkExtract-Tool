// background.js
chrome.runtime.onInstalled.addListener(() => {
  // No-op for now. All logic handled in content and popup scripts.
});

// Listen for messages if needed in the future
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getBlocklist") {
    fetch('https://docs.google.com/document/d/12hIr268LflkvBanD46BZYy6NbKSQRqTaTHbi9zAuQRQ/export?format=txt')
      .then(r => r.text())
      .then(text => sendResponse({ blocklist: text }))
      .catch(() => sendResponse({ blocklist: null }));
    return true; // Required to use sendResponse asynchronously
  }
}); 