# 🚀 LinkExtract Tool

**Extract, organize, and export hyperlinks from any webpage in seconds.**  
*Perfect for researchers, journalists, analysts, and power users.*

---

> 📄 **[Privacy Policy](https://docs.google.com/document/d/1D_KKoiT0F-BTVLOmbqNmzApkGXN9a0wxw6JMen7jj90/edit?usp=sharing)**

---

## ✨ Key Features

- **Intuitive Drag-and-Select:**  
  Effortlessly capture all visible links within any area of a webpage. Just hold <kbd>Ctrl</kbd> (Windows/Linux) or <kbd>⌘</kbd> (Mac), then right-click and drag—no more tedious manual copying!

- **One-Tap Link Harvesting:**  
  Instantly copy all visible links up to your current scroll position with <kbd>Ctrl+Z</kbd> or <kbd>⌘+Z</kbd>.

- **Smart Popup Dashboard:**  
  - Instantly view and review extracted links.
  - Copy links as a ready-to-use CSV with a single click.
  - Download your links as a CSV file for further analysis.
  - Enjoy a sleek dark mode for late-night research.
  - **Privacy Policy link is always available in the popup.**

- **Centralized Blocklist Filtering:**  
  The blocklist is now managed centrally via a Google Doc. Any updates to the blocklist are instantly reflected for all users—no need to reinstall or update the extension. If you want a domain added or removed, just contact the blocklist maintainer.

- **Seamless, Fast, and Secure:**  
  - Only visible, non-hidden, and non-blocked links are included.
  - No duplicates—just clean, actionable data.
  - Works on virtually any website.

---

## 🛠️ How It Works

1. **Install the Extension**
   - Download or clone this repository.
   - Go to `chrome://extensions` in Chrome.
   - Enable "Developer mode" and click "Load unpacked."
   - Select the project folder.

2. **Extract Links Your Way**
   - **Drag-and-Select:**  
     Hold <kbd>Ctrl</kbd> (or <kbd>⌘</kbd> on Mac) and right-click-drag to select any area. All visible links inside are instantly captured.
   - **Keyboard Shortcut:**  
     Press <kbd>Ctrl+Z</kbd> (or <kbd>⌘+Z</kbd>) to copy all visible links from the top of the page to your current scroll.

3. **Manage and Export**
   - Click the extension icon to open the popup.
   - Instantly see your extracted links.
   - Click **Copy CSV** to copy to clipboard, or **Download CSV** to save.
   - Toggle dark mode for a comfortable viewing experience.
   - **Find the Privacy Policy link at the bottom of the popup.**

4. **Blocklist Management**
   - The blocklist is fetched automatically from a central Google Doc ([view or request changes here](https://docs.google.com/document/d/12hIr268LflkvBanD46BZYy6NbKSQRqTaTHbi9zAuQRQ/edit?usp=sharing)).
   - To request a domain be added or removed, contact the maintainer of the Google Doc.

---

## ⚡ Why LinkExtract Tool?

- **Save Time:** No more manual link copying or messy spreadsheets.
- **Stay Organized:** Export clean, deduplicated, and filtered link lists.
- **Boost Productivity:** Designed for speed, simplicity, and reliability.

---

## 📝 Permissions & Security

- **Permissions:**  
  - `activeTab`, `scripting` — To interact with the current page.
  - `<all_urls>` — To enable extraction on any website.
- **Privacy:**  
  - All processing happens locally in your browser.
  - No data is sent anywhere—your research stays yours.
  - See our [Privacy Policy](https://docs.google.com/document/d/1D_KKoiT0F-BTVLOmbqNmzApkGXN9a0wxw6JMen7jj90/edit?usp=sharing) for full details.

---

## 🧩 File Structure

- `popup.html`, `popup.js`, `popup.css` — Extension popup UI and logic.
- `content.js` — Handles link extraction and keyboard shortcuts.
- `selector.js` — Powers the drag-and-select feature.
- `background.js` — Manages blocklist fetching from Google Docs.
- `utils/export.js` — CSV and clipboard export utilities.
- `icons/` — Extension icons.

---

## 💡 Pro Tips

- Use the drag-and-select feature to target only the links you need.
- Request blocklist changes from the maintainer to keep your exports focused and relevant.
- Toggle dark mode for a more comfortable experience during long research sessions.

---

## 📦 Packaging & Sharing as a .crx Extension

Want to share this extension with your team without using the Chrome Web Store? You can package it as a `.crx` file:

1. **Open Chrome and go to** `chrome://extensions`.
2. **Enable Developer mode** (top right).
3. **Click "Pack extension"** (top left).
4. **Select the extension root directory** (the folder containing your manifest and code).
5. **Click "Pack Extension".**
   - Chrome will generate a `.crx` file and a private key (`.pem`).
6. **Share the `.crx` file** with your teammates.
7. **To install:**
   - Drag and drop the `.crx` file into `chrome://extensions` (with Developer mode enabled).
   - Confirm the installation prompt.

**Note:** If you update the extension code, you must repackage and redistribute the `.crx` file. However, blocklist updates are automatic via the Google Doc!

---

## 📄 Privacy Policy

You can always view the latest privacy policy here:  
[https://docs.google.com/document/d/1D_KKoiT0F-BTVLOmbqNmzApkGXN9a0wxw6JMen7jj90/edit?usp=sharing](https://docs.google.com/document/d/1D_KKoiT0F-BTVLOmbqNmzApkGXN9a0wxw6JMen7jj90/edit?usp=sharing)

---

## 📄 License

MIT License

---

**Ready to supercharge your link extraction workflow?  
Install LinkExtract Tool and start collecting smarter, not harder!**
