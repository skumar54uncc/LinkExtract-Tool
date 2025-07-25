// content.js
(function() {
  let lastExtractedLinks = [];

  // --- Blocklist logic ---
  let blocklistDomains = [];
  function loadBlockList() {
    chrome.runtime.sendMessage({ action: "getBlocklist" }, response => {
      if (response && response.blocklist) {
        blocklistDomains = response.blocklist
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith("#"));
      } else {
        blocklistDomains = [];
      }
    });
  }
  function isBlocked(url) {
    try {
      const u = new URL(url);
      return blocklistDomains.some(domain => u.hostname === domain || u.hostname.endsWith('.' + domain));
    } catch {
      return false;
    }
  }
  loadBlockList();

  // Extract all visible <a href> links, filtered by blocklist
  function extractLinks() {
    const links = Array.from(document.querySelectorAll('a[href]'));
    const visibleLinks = links.filter(link => {
      const rect = link.getBoundingClientRect();
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        window.getComputedStyle(link).visibility !== 'hidden' &&
        window.getComputedStyle(link).display !== 'none' &&
        !isBlocked(link.href)
      );
    });
    // Deduplicate by href
    const hrefSet = new Set();
    const deduped = [];
    visibleLinks.forEach(link => {
      const href = link.href;
      if (!hrefSet.has(href)) {
        hrefSet.add(href);
        deduped.push({
          href,
          text: link.innerText.trim() || link.href
        });
      }
    });
    lastExtractedLinks = deduped;
    return deduped;
  }

  // Listen for selection events from selector.js
  window.addEventListener('LINKEXTRACT_TOOL_SELECTION', (e) => {
    const selectedLinks = e.detail.links;
    lastExtractedLinks = selectedLinks;
    chrome.runtime.sendMessage({
      type: 'LINKEXTRACT_TOOL_LINKS_SELECTED',
      links: selectedLinks
    });
  });

  // Listen for Ctrl+Z to copy all visible links from top to current scroll position
  window.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.repeat) {
      // Get all visible links from top to current scroll position, filtered by blocklist
      const links = Array.from(document.querySelectorAll('a[href]'));
      const scrollBottom = window.scrollY + window.innerHeight;
      const visibleLinks = links.filter(link => {
        const rect = link.getBoundingClientRect();
        const absTop = rect.top + window.scrollY;
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          window.getComputedStyle(link).visibility !== 'hidden' &&
          window.getComputedStyle(link).display !== 'none' &&
          absTop < scrollBottom &&
          !isBlocked(link.href)
        );
      });
      // Deduplicate by href
      const hrefSet = new Set();
      const deduped = [];
      visibleLinks.forEach(link => {
        const href = link.href;
        if (!hrefSet.has(href)) {
          hrefSet.add(href);
          deduped.push(link.href);
        }
      });
      if (deduped.length) {
        // Copy to clipboard
        navigator.clipboard.writeText(deduped.join('\n')).then(() => {
          // Show notification
          const notif = document.createElement('div');
          notif.textContent = `Copied ${deduped.length} links!`;
          notif.style.position = 'fixed';
          notif.style.bottom = '32px';
          notif.style.left = '50%';
          notif.style.transform = 'translateX(-50%)';
          notif.style.background = '#23242a';
          notif.style.color = '#ffbf0c';
          notif.style.padding = '10px 24px';
          notif.style.borderRadius = '8px';
          notif.style.fontSize = '1.1rem';
          notif.style.zIndex = 99999;
          notif.style.boxShadow = '0 2px 12px rgba(0,0,0,0.18)';
          document.body.appendChild(notif);
          setTimeout(() => notif.remove(), 1800);
        });
      }
    }
  });

  // Listen for popup requests
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'LINKEXTRACT_TOOL_EXTRACT_LINKS') {
      sendResponse({ links: extractLinks() });
    } else if (msg.type === 'LINKEXTRACT_TOOL_GET_SELECTED_LINKS') {
      sendResponse({ links: lastExtractedLinks });
    }
    // Return true for async response if needed
    return false;
  });
})(); 