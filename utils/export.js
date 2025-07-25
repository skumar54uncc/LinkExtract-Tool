// utils/export.js
// Blocklist for domains to exclude from CSV. Edit this list as needed.
export const BLOCKED_DOMAINS = [
  'support.google.com',
  // add more domains as needed
];
export function isBlocked(url) {
  try {
    const u = new URL(url);
    return BLOCKED_DOMAINS.some(domain => u.hostname.endsWith(domain));
  } catch {
    return false;
  }
}

export function linksToCSV(links) {
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

export function downloadCSV(links) {
  const csv = linksToCSV(links);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ir-linkextract-links.csv';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
} 