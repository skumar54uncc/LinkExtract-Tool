// popup.js
const linksList = document.getElementById('links-list');
const copyBtn = document.getElementById('copy-btn');
const downloadBtn = document.getElementById('download-btn');
const darkModeToggle = document.getElementById('dark-mode-toggle');

let links = [];

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

function requestLinks() {
  getActiveTab(tab => {
    if (!tab || !isValidUrlForContentScript(tab.url)) {
      showError('This page is not supported. Please open a regular website tab.');
      return;
    }
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

darkModeToggle.addEventListener('click', () => {
  const isDark = document.body.classList.contains('dark-mode');
  setDarkMode(!isDark);
});

copyBtn.addEventListener('click', () => {
  if (!links.length) return;
  import('./utils/export.js').then(({ linksToCSV }) => {
    const csv = linksToCSV(links);
    navigator.clipboard.writeText(csv);
  });
});

downloadBtn.addEventListener('click', () => {
  if (!links.length) return;
  import('./utils/export.js').then(({ downloadCSV }) => {
    downloadCSV(links);
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
    });
  }
});

// Initial load
loadDarkMode();
requestLinks(); 