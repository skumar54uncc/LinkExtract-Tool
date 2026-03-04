// popup.js
const linksList = document.getElementById('links-list');
const copyBtn = document.getElementById('copy-btn');
const downloadBtn = document.getElementById('download-btn');
const darkModeToggle = document.getElementById('dark-mode-toggle');

const CWS_REVIEW_URL = 'https://chromewebstore.google.com/detail/ir-linkextract-tool/ibnbjdggdknldigniajononhgfdpcmil?utm_source=item-share-cb';
const GITHUB_ISSUES_URL = 'https://github.com/skumar54uncc/LinkExtract-Tool/issues';

let links = [];
let isPinterestPage = false;
let isAutoRefreshActive = false;
let autoRefreshButton = null;

function renderLinks() {
  linksList.innerHTML = '';
  if (!links.length) {
    linksList.innerHTML = '<div class="empty">No links extracted yet.</div>';
    copyBtn.disabled = true;
    downloadBtn.disabled = true;
    return;
  }
  links.forEach(link => {
    const item = document.createElement('div');
    item.className = 'link-item';
    const href = document.createElement('a');
    href.className = 'link-href';
    href.href = link.href;
    href.target = '_blank';
    href.textContent = link.href;
    const text = document.createElement('div');
    text.className = 'link-text';
    text.textContent = link.text;
    item.appendChild(href);
    item.appendChild(text);
    linksList.appendChild(item);
  });
  copyBtn.disabled = false;
  downloadBtn.disabled = false;
}

function getActiveTab(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    callback(tabs[0]);
  });
}

function isValidUrlForContentScript(url) {
  // Disallow chrome://, edge://, about:, and extension pages
  return url &&
    !url.startsWith('chrome://') &&
    !url.startsWith('edge://') &&
    !url.startsWith('about:') &&
    !url.startsWith('chrome-extension://');
}

function showError(message) {
  linksList.innerHTML = `<div class="empty error">${message}</div>`;
  copyBtn.disabled = true;
  downloadBtn.disabled = true;
}

function showLoading() {
  linksList.innerHTML = '<div class="empty">Loading links...</div>';
  copyBtn.disabled = true;
  downloadBtn.disabled = true;
}

function showAutoRefreshStatus() {
  const statusDiv = document.getElementById('auto-refresh-status');
  if (statusDiv) {
    statusDiv.textContent = isAutoRefreshActive ? 
      '🔄 Auto-refresh active - Links update automatically as you scroll' : 
      '⏸️ Auto-refresh paused';
    statusDiv.className = isAutoRefreshActive ? 'status-active' : 'status-paused';
  }
}

function requestLinks() {
  getActiveTab(tab => {
    if (!tab || !isValidUrlForContentScript(tab.url)) {
      showError('This page is not supported. Please open a regular website tab.');
      return;
    }
    
    // Check if it's a Pinterest page
    isPinterestPage = tab.url.includes('pinterest.com') || tab.url.includes('pinterest.');
    
    chrome.tabs.sendMessage(tab.id, { type: 'LINKEXTRACT_TOOL_GET_SELECTED_LINKS' }, res => {
      if (chrome.runtime.lastError) {
        showError('Could not connect to content script. Try refreshing the page.');
        return;
      }
      if (res && res.links && res.links.length) {
        links = res.links;
        renderLinks();
      } else {
        // Try extracting all links if no selection
        showLoading();
        chrome.tabs.sendMessage(tab.id, { type: 'LINKEXTRACT_TOOL_EXTRACT_LINKS' }, res2 => {
          if (chrome.runtime.lastError) {
            showError('Could not connect to content script. Try refreshing the page.');
            return;
          }
          links = (res2 && res2.links) || [];
          renderLinks();
        });
      }
    });
  });
}

// Enhanced Pinterest-specific comprehensive extraction
function extractPinterestLinks() {
  getActiveTab(tab => {
    if (!tab || !isValidUrlForContentScript(tab.url)) {
      showError('This page is not supported. Please open a regular website tab.');
      return;
    }
    
    if (!tab.url.includes('pinterest.com') && !tab.url.includes('pinterest.')) {
      showError('This feature is only available on Pinterest pages.');
      return;
    }
    
    showLoading();
    
    // Use message passing to trigger ultra-aggressive Pinterest extraction
    chrome.tabs.sendMessage(tab.id, { 
      type: 'LINKEXTRACT_TOOL_EXTRACT_PINTEREST_ULTRA_AGGRESSIVE' 
    }, (results) => {
      if (chrome.runtime.lastError) {
        showError('Could not extract Pinterest links. Try refreshing the page.');
        return;
      }
      
      if (results && results.links && results.links.length > 0) {
        links = results.links;
        renderLinks();
        
        // Show success message with link count
        const notification = document.createElement('div');
        notification.className = 'update-notification success';
        notification.textContent = `✅ Found ${links.length} Pinterest links! (Ultra-Aggressive Mode)`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 3000);
      } else {
        showError('No Pinterest links found. Try scrolling down to load more content.');
      }
    });
  });
}

// Ultra-aggressive Pinterest extraction with forced scroll
function extractPinterestLinksWithScroll() {
  getActiveTab(tab => {
    if (!tab || !isValidUrlForContentScript(tab.url)) {
      showError('This page is not supported. Please open a regular website tab.');
      return;
    }
    
    if (!tab.url.includes('pinterest.com') && !tab.url.includes('pinterest.')) {
      showError('This feature is only available on Pinterest pages.');
      return;
    }
    
    showLoading();
    
    // Use message passing to trigger ultra-aggressive Pinterest extraction with scroll
    chrome.tabs.sendMessage(tab.id, { 
      type: 'LINKEXTRACT_TOOL_EXTRACT_PINTEREST_WITH_SCROLL' 
    }, (results) => {
      if (chrome.runtime.lastError) {
        showError('Could not extract Pinterest links. Try refreshing the page.');
        return;
      }
      
      if (results && results.links && results.links.length > 0) {
        links = results.links;
        renderLinks();
        
        // Show success message with link count
        const notification = document.createElement('div');
        notification.className = 'update-notification success';
        notification.textContent = `✅ Found ${links.length} Pinterest links! (Scroll + Ultra-Aggressive Mode)`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 3000);
      } else {
        showError('No Pinterest links found. Try scrolling down to load more content.');
      }
    });
  });
}

// Auto-refresh controls
function toggleAutoRefresh() {
  getActiveTab(tab => {
    if (!tab || !isValidUrlForContentScript(tab.url)) {
      return;
    }
    
    isAutoRefreshActive = !isAutoRefreshActive;
    
    if (isAutoRefreshActive) {
      // Start auto-refresh
      chrome.tabs.sendMessage(tab.id, { type: 'LINKEXTRACT_TOOL_START_AUTO_REFRESH' }, res => {
        if (res && res.success) {
          console.log('Auto-refresh started');
          showAutoRefreshStatus();
          if (autoRefreshButton) {
            autoRefreshButton.textContent = '⏸️ Pause Auto-Refresh';
            autoRefreshButton.className = 'auto-refresh-btn active';
          }
        }
      });
    } else {
      // Stop auto-refresh
      chrome.tabs.sendMessage(tab.id, { type: 'LINKEXTRACT_TOOL_STOP_AUTO_REFRESH' }, res => {
        if (res && res.success) {
          console.log('Auto-refresh stopped');
          showAutoRefreshStatus();
          if (autoRefreshButton) {
            autoRefreshButton.textContent = '🔄 Start Auto-Refresh';
            autoRefreshButton.className = 'auto-refresh-btn';
          }
        }
      });
    }
  });
}

function setDarkMode(enabled) {
  document.body.classList.toggle('dark-mode', enabled);
  localStorage.setItem('linkextract_tool_dark_mode', enabled ? '1' : '0');
  darkModeToggle.setAttribute('aria-pressed', enabled);
  darkModeToggle.textContent = enabled ? '☀️' : '🌙';
}

function loadDarkMode() {
  const enabled = localStorage.getItem('linkextract_tool_dark_mode') === '1';
  setDarkMode(enabled);
}

// Add Pinterest-specific button if on Pinterest
function addPinterestButton() {
  if (isPinterestPage) {
    const existingBtn = document.getElementById('pinterest-extract-btn');
    if (!existingBtn) {
      // Create container for Pinterest buttons
      const pinterestContainer = document.createElement('div');
      pinterestContainer.className = 'pinterest-buttons-container';
      
      // Ultra-aggressive button
      const pinterestBtn = document.createElement('button');
      pinterestBtn.id = 'pinterest-extract-btn';
      pinterestBtn.textContent = '🔍 Ultra-Aggressive Pinterest Extraction';
      pinterestBtn.className = 'pinterest-btn ultra-aggressive';
      pinterestBtn.addEventListener('click', extractPinterestLinks);
      
      // Ultra-aggressive with scroll button
      const pinterestScrollBtn = document.createElement('button');
      pinterestScrollBtn.id = 'pinterest-scroll-extract-btn';
      pinterestScrollBtn.textContent = '📜 Ultra-Aggressive + Force Scroll';
      pinterestScrollBtn.className = 'pinterest-btn ultra-aggressive-scroll';
      pinterestScrollBtn.addEventListener('click', extractPinterestLinksWithScroll);
      
      // Add buttons to container
      pinterestContainer.appendChild(pinterestBtn);
      pinterestContainer.appendChild(pinterestScrollBtn);
      
      // Insert after the title
      const title = document.querySelector('h1');
      if (title) {
        title.parentNode.insertBefore(pinterestContainer, title.nextSibling);
      }
    }
  }
}

// Add auto-refresh controls
function addAutoRefreshControls() {
  const existingControls = document.getElementById('auto-refresh-controls');
  if (!existingControls) {
    const controlsDiv = document.createElement('div');
    controlsDiv.id = 'auto-refresh-controls';
    controlsDiv.className = 'auto-refresh-controls';
    
    // Auto-refresh button
    autoRefreshButton = document.createElement('button');
    autoRefreshButton.textContent = '🔄 Start Auto-Refresh';
    autoRefreshButton.className = 'auto-refresh-btn';
    autoRefreshButton.addEventListener('click', toggleAutoRefresh);
    
    // Status indicator
    const statusDiv = document.createElement('div');
    statusDiv.id = 'auto-refresh-status';
    statusDiv.className = 'auto-refresh-status';
    statusDiv.textContent = '⏸️ Auto-refresh paused';
    
    controlsDiv.appendChild(autoRefreshButton);
    controlsDiv.appendChild(statusDiv);
    
    // Insert before the links list
    const main = document.querySelector('main');
    if (main) {
      main.insertBefore(controlsDiv, main.firstChild);
    }
  }
}

darkModeToggle.addEventListener('click', () => {
  const isDark = document.body.classList.contains('dark-mode');
  setDarkMode(!isDark);
});

function onCsvExportSuccess() {
  chrome.storage.local.get(['reviewAskShown'], (data) => {
    if (data.reviewAskShown) return;
    chrome.storage.local.set({ reviewAskShown: true });
    showReviewAsk();
  });
}

function showReviewAsk() {
  const overlay = document.getElementById('review-ask-overlay');
  const step1 = document.getElementById('review-step1');
  const step2Yes = document.getElementById('review-step2-yes');
  const step2No = document.getElementById('review-step2-no');
  overlay.setAttribute('aria-hidden', 'false');
  overlay.classList.add('visible');
  step1.hidden = false;
  step2Yes.hidden = true;
  step2No.hidden = true;
}

function hideReviewAsk() {
  const overlay = document.getElementById('review-ask-overlay');
  overlay.classList.remove('visible');
  overlay.setAttribute('aria-hidden', 'true');
}

function initReviewAskModal() {
  const overlay = document.getElementById('review-ask-overlay');
  const step1 = document.getElementById('review-step1');
  const step2Yes = document.getElementById('review-step2-yes');
  const step2No = document.getElementById('review-step2-no');
  document.getElementById('review-yes').addEventListener('click', () => {
    step1.hidden = true;
    step2No.hidden = true;
    step2Yes.hidden = false;
  });
  document.getElementById('review-no').addEventListener('click', () => {
    step1.hidden = true;
    step2Yes.hidden = true;
    step2No.hidden = false;
  });
  document.getElementById('review-later').addEventListener('click', () => {
    hideReviewAsk();
  });
  document.getElementById('review-open-cws').addEventListener('click', () => {
    chrome.tabs.create({ url: CWS_REVIEW_URL });
    hideReviewAsk();
  });
  document.getElementById('review-open-feedback').addEventListener('click', () => {
    chrome.tabs.create({ url: GITHUB_ISSUES_URL });
    hideReviewAsk();
  });
}

copyBtn.addEventListener('click', () => {
  if (!links.length) return;
  import('./utils/export.js').then(({ linksToCSV }) => {
    const csv = linksToCSV(links);
    navigator.clipboard.writeText(csv);
    onCsvExportSuccess();
  });
});

downloadBtn.addEventListener('click', () => {
  if (!links.length) return;
  import('./utils/export.js').then(({ downloadCSV }) => {
    downloadCSV(links);
    onCsvExportSuccess();
  });
});

// Listen for auto-export from content script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'LINKEXTRACT_TOOL_AUTO_EXPORT' && msg.links) {
    links = msg.links;
    renderLinks();
    // Auto-download CSV
    import('./utils/export.js').then(({ downloadCSV }) => {
      downloadCSV(links);
      onCsvExportSuccess();
    });
  } else if (msg.type === 'LINKEXTRACT_TOOL_LINKS_UPDATED' && msg.links) {
    // Real-time link updates
    const oldCount = links.length;
    links = msg.links;
    const newCount = links.length;
    
    if (newCount > oldCount) {
      console.log(`[Popup] Received ${newCount - oldCount} new links from ${msg.source}`);
      renderLinks();
      
      // Show a subtle notification
      const notification = document.createElement('div');
      notification.className = 'update-notification';
      notification.textContent = `+${newCount - oldCount} new links found`;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 2000);
    }
  }
});

// Initial load
loadDarkMode();
initReviewAskModal();
requestLinks();
// Add Pinterest button and auto-refresh controls after a short delay
setTimeout(() => {
  addPinterestButton();
  addAutoRefreshControls();
}, 100); 