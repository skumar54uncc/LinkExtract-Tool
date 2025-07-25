// selector.js
console.log('[LinkExtract Tool] Selector loaded');
(function() {
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
  function linksToCSV(links) {
    // Deduplicate by href and filter
    const hrefSet = new Set();
    const deduped = [];
    links.forEach(link => {
      if (!hrefSet.has(link.href) && !isBlocked(link.href)) {
        hrefSet.add(link.href);
        deduped.push(link);
      }
    });
    const rows = [
      ['Text', 'URL'],
      ...deduped.map(l => [l.text.replace(/"/g, '""'), l.href.replace(/"/g, '""')])
    ];
    return rows.map(row => row.map(cell => '"' + cell + '"').join(',')).join('\r\n');
  }
  function downloadCSV(links) {
    const csv = linksToCSV(links);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ir-linkklips-links.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  // --- Drag-to-Select Logic ---
  let isCtrlOrCmd = false;
  let isDragging = false;
  let startPageX = 0, startPageY = 0;
  let startClientX = 0, startClientY = 0;
  let overlay = null;
  let highlightedLinks = [];
  let allLinksInBox = [];
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  // Add highlight CSS and overlay CSS
  (function addHighlightStyle() {
    const style = document.createElement('style');
    style.textContent = `
      .ir-linkklips-highlight {
        outline: 2px solid #ffbf0c !important;
        background: rgba(255,191,12,0.10) !important;
        border-radius: 4px !important;
        transition: outline 0.15s;
      }
      #ir-linkklips-selector {
        border: 1.5px dotted #ffbf0c !important;
      }
    `;
    document.head.appendChild(style);
  })();

  function createOverlay(x, y) {
    overlay = document.createElement('div');
    overlay.id = 'ir-linkklips-selector';
    overlay.style.position = 'fixed';
    overlay.style.zIndex = 999999;
    overlay.style.background = 'rgba(255,191,12,0.15)';
    overlay.style.border = '1.5px dotted #ffbf0c';
    overlay.style.borderRadius = '6px';
    overlay.style.pointerEvents = 'none';
    overlay.style.transition = 'all 0.15s cubic-bezier(.4,0,.2,1)';
    overlay.style.boxShadow = '0 2px 12px rgba(18,22,66,0.12)';
    overlay.style.left = x + 'px';
    overlay.style.top = y + 'px';
    overlay.style.width = '0px';
    overlay.style.height = '0px';
    document.body.appendChild(overlay);
  }

  function updateOverlay(clientX, clientY) {
    if (!overlay) return;
    // Calculate page coordinates for current mouse
    const currPageX = clientX + window.scrollX;
    const currPageY = clientY + window.scrollY;
    // Rectangle in page coordinates
    const leftPage = Math.min(startPageX, currPageX);
    const topPage = Math.min(startPageY, currPageY);
    const width = Math.abs(currPageX - startPageX);
    const height = Math.abs(currPageY - startPageY);
    // Convert to viewport (client) coordinates for overlay
    overlay.style.left = (leftPage - window.scrollX) + 'px';
    overlay.style.top = (topPage - window.scrollY) + 'px';
    overlay.style.width = width + 'px';
    overlay.style.height = height + 'px';
  }

  function removeOverlay() {
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
  }

  function clearHighlights() {
    highlightedLinks.forEach(link => link.classList.remove('ir-linkklips-highlight'));
    highlightedLinks = [];
  }

  function getLinksInRect(rect) {
    const links = Array.from(document.querySelectorAll('a[href]'));
    const visibleLinks = links.filter(link => {
      const r = link.getBoundingClientRect();
      // Convert link rect to page coordinates
      const linkLeft = r.left + window.scrollX;
      const linkTop = r.top + window.scrollY;
      const linkRight = r.right + window.scrollX;
      const linkBottom = r.bottom + window.scrollY;
      return (
        r.width > 0 && r.height > 0 &&
        window.getComputedStyle(link).visibility !== 'hidden' &&
        window.getComputedStyle(link).display !== 'none' &&
        linkRight > rect.left && linkLeft < rect.right && linkBottom > rect.top && linkTop < rect.bottom &&
        !isBlocked(link.href)
      );
    });
    // Deduplicate by href
    const hrefSet = new Set();
    const deduped = [];
    visibleLinks.forEach(link => {
      if (!hrefSet.has(link.href)) {
        hrefSet.add(link.href);
        deduped.push(link);
      }
    });
    return deduped;
  }

  // Autoscroll logic
  let autoScrollActive = false;
  let lastClientX = 0, lastClientY = 0;
  const SCROLL_EDGE_SIZE = 40;
  const SCROLL_SPEED = 8;

  function doAutoScroll() {
    if (!autoScrollActive) return;
    let scrolled = false;
    if (lastClientY < SCROLL_EDGE_SIZE) {
      window.scrollBy(0, -SCROLL_SPEED);
      scrolled = true;
    } else if (lastClientY > window.innerHeight - SCROLL_EDGE_SIZE) {
      window.scrollBy(0, SCROLL_SPEED);
      scrolled = true;
    }
    // Always update overlay to follow cursor and scroll
    if (isDragging && overlay) {
      updateOverlay(lastClientX, lastClientY);
      // Rectangle in page coordinates
      const currPageX = lastClientX + window.scrollX;
      const currPageY = lastClientY + window.scrollY;
      const rect = {
        left: Math.min(startPageX, currPageX),
        top: Math.min(startPageY, currPageY),
        right: Math.max(startPageX, currPageX),
        bottom: Math.max(startPageY, currPageY)
      };
      const links = getLinksInRect(rect);
      clearHighlights();
      highlightedLinks = links;
      links.forEach(link => link.classList.add('ir-linkklips-highlight'));
      allLinksInBox = links;
    }
    if (scrolled) {
      // If we scrolled, keep updating
      requestAnimationFrame(doAutoScroll);
    } else if (autoScrollActive) {
      // If not scrolled but still in edge, keep checking
      requestAnimationFrame(doAutoScroll);
    }
  }

  function startAutoScroll(clientX, clientY) {
    autoScrollActive = true;
    lastClientX = clientX;
    lastClientY = clientY;
    requestAnimationFrame(doAutoScroll);
  }
  function stopAutoScroll() {
    autoScrollActive = false;
  }

  // Key tracking
  window.addEventListener('keydown', e => {
    if ((isMac && e.metaKey) || (!isMac && e.ctrlKey)) {
      isCtrlOrCmd = true;
    }
  });
  window.addEventListener('keyup', e => {
    if ((isMac && !e.metaKey) || (!isMac && !e.ctrlKey)) {
      isCtrlOrCmd = false;
    }
  });
  window.addEventListener('blur', () => { isCtrlOrCmd = false; });

  // Mouse events
  window.addEventListener('mousedown', function(e) {
    if (e.button === 0 && isCtrlOrCmd) { // Left click + Ctrl/⌘
      isDragging = true;
      startClientX = e.clientX;
      startClientY = e.clientY;
      startPageX = e.clientX + window.scrollX;
      startPageY = e.clientY + window.scrollY;
      allLinksInBox = [];
      createOverlay(startClientX, startClientY);
      e.preventDefault();
    }
  }, true);

  window.addEventListener('mousemove', function(e) {
    if (isDragging && overlay) {
      lastClientX = e.clientX;
      lastClientY = e.clientY;
      updateOverlay(e.clientX, e.clientY);
      // Rectangle in page coordinates
      const currPageX = e.clientX + window.scrollX;
      const currPageY = e.clientY + window.scrollY;
      const rect = {
        left: Math.min(startPageX, currPageX),
        top: Math.min(startPageY, currPageY),
        right: Math.max(startPageX, currPageX),
        bottom: Math.max(startPageY, currPageY)
      };
      const links = getLinksInRect(rect);
      clearHighlights();
      highlightedLinks = links;
      links.forEach(link => link.classList.add('ir-linkklips-highlight'));
      allLinksInBox = links;
      // Autoscroll
      if (e.clientY < SCROLL_EDGE_SIZE || e.clientY > window.innerHeight - SCROLL_EDGE_SIZE) {
        startAutoScroll(e.clientX, e.clientY);
      } else {
        stopAutoScroll();
      }
    }
  }, true);

  window.addEventListener('mouseup', function(e) {
    if (isDragging && overlay) {
      isDragging = false;
      removeOverlay();
      clearHighlights();
      stopAutoScroll();
      // Prepare links for export
      if (allLinksInBox.length > 0) {
        const exportLinks = allLinksInBox.map(link => ({
          href: link.href,
          text: link.innerText.trim() || link.href
        }));
        downloadCSV(exportLinks);
      }
      allLinksInBox = [];
    }
  }, true);

  // Prevent text selection and accidental drag
  window.addEventListener('selectstart', function(e) {
    if (isDragging) e.preventDefault();
  }, true);

  // (Optional) Prevent context menu if you ever want right-click again
  // window.addEventListener('contextmenu', function(e) {
  //   if (isDragging) e.preventDefault();
  // }, true);
})(); 