# Easy Screenshot

A simple Chrome extension that allows you to take screenshots with a user-friendly interface and the ability to save them to Google Docs.

## ✨ Features

- 📸 **Screenshot creation** – quick screen captures
- 💾 **File download** – save files to your computer
- ☁️ **Google Docs integration** – save screenshots to Google Docs
- ⌨️ **Hotkeys** – Ctrl+Shift+S for quick access
- 🎨 **Modern UI** – beautiful and intuitive interface
- 👀 **Preview** – view the screenshot before saving

## 🚀 Quick Start

1. **Install the extension**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked extension"
   - Select the folder with the files

2. **Google API setup (optional)**
   - To save to Google Docs, follow the instructions in [GOOGLE_SETUP.md](./GOOGLE_SETUP.md)
   - Get a Client ID in Google Cloud Console
   - Update `manifest.json`

3. **First use**
   - Click the extension icon
   - Sign in to your Google account (for Google Docs)
   - Click "📸 Take screenshot"
   - Or use the hotkey Ctrl+Shift+S

## 📖 Usage

### Taking a screenshot

**Method 1: Via popup**
1. Click the extension icon
2. Click "📸 Take screenshot"

**Method 2: Hotkeys**
- Windows/Linux: `Ctrl + Shift + S`
- Mac: `Cmd + Shift + S`

### Saving a screenshot

1. After taking a screenshot, a dialog will open
2. Enter a file name (default: `screenshot_YYYY-MM-DD_HH-MM-SS`)
3. Choose how to save:
   - **Download** – save to your computer
   - **Save to Google Docs** – create a document in Google Docs (requires authorization)

## 🛠️ Technical Details

### Architecture

- **Background Script** (`background.js`) – handles events and Google API
- **Content Script** (`content.js`) – interacts with web pages
- **Popup** (`popup.html/js`) – user interface

### Permissions

```json
{
  "permissions": [
    "activeTab",      // Access to the active tab
    "storage",        // Local storage
    "scripting",      // Script execution
    "notifications",  // Notifications
    "tabs",           // Tab management
    "desktopCapture", // Screenshot creation
    "identity"        // Google OAuth authorization
  ]
}
```

### Google API

The extension uses:
- **Google Docs API** – create and edit documents
- **Google Drive API** – upload images
- **OAuth 2.0** – secure authorization

## 📁 Project Structure

```
widjet/
├── manifest.json           # Extension configuration
├── background.js           # Background script
├── content.js              # Content script
├── popup.html              # Popup interface
├── popup.js                # Popup logic
├── widget.css              # Widget styles
├── GOOGLE_SETUP.md         # Google API setup
├── QUICK_START.md          # Quick start
├── CHANGELOG.md            # Changelog
└── README.md               # This file
```

## 🔧 Setup

### Google Cloud Console

For full Google Docs functionality:

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google Docs API and Google Drive API
3. Create an OAuth 2.0 Client ID for Chrome Extension
4. Update the `client_id` in `manifest.json`

Detailed instructions: [GOOGLE_SETUP.md](./GOOGLE_SETUP.md)

### Customization

**Change hotkeys:**
```json
{
  "commands": {
    "_execute_action": {
      "suggested_key": {
        "default": "Ctrl+Alt+S"
      }
    }
  }
}
```

**Change styles:**
Edit `widget.css` to change the appearance.

## 🐛 Troubleshooting

### Screenshot not created

**Possible reasons:**
- Missing `desktopCapture` permission
- Trying to capture a chrome:// page
- Content script not loaded

**Solution:**
1. Check permissions in `manifest.json`
2. Test on regular web pages
3. Check logs in the console

### Google authorization error

**Possible reasons:**
- Incorrect Client ID
- APIs not enabled in the project
- Incorrect OAuth settings

**Solution:**
1. Check settings in Google Cloud Console
2. Make sure the Client ID is correct
3. Ensure APIs are enabled

### Save dialog does not open

**Possible reasons:**
- Content script does not receive the message
- Error processing the screenshot
- DOM issues

**Solution:**
1. Check content script logs
2. Make sure the page is fully loaded
3. Check for conflicts with other extensions

### Logs and debugging

1. Open `chrome://extensions/`
2. Find the extension and click "Details"
3. Click "Inspect views" to view logs

## 🤝 Contributing

1. Fork the repository
2. Create a branch for a new feature
3. Make changes
4. Create a Pull Request

## 📄 License

MIT License – see LICENSE for details.

## 🙏 Acknowledgements

- Google Chrome Extensions API
- Google Docs API
- Extension developer community

---

**Version:** 1.0  
**Last updated:** 2025 