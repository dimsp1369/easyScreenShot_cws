# Easy Screenshot

A simple Chrome extension that allows you to take screenshots with a user-friendly interface and the ability to save them to Google Docs.

## 🚀 Development vs Production

**GitHub Version (Development):**
- Uses development Client ID
- For local testing and development
- NOT suitable for production use

**Production Version:**
- Available on [Chrome Web Store](https://chrome.google.com/webstore/detail/easy-screenshot/jfiljkfcimogfmjpgalhekblepdopmla)
- Uses production Client ID
- Fully functional with Google services

## 📦 Installation

**For Development:**
1. Clone this repository
2. Load as unpacked extension in Chrome
3. Use for testing and development

**For Production:**
1. Install from [Chrome Web Store](https://chrome.google.com/webstore/detail/easy-screenshot/jfiljkfcimogfmjpgalhekblepdopmla)
2. Full functionality with Google integration

## 🔒 Production Code

Production code with production Client ID is maintained in a separate private repository for security reasons.

## ✨ Features

- 📸 **Screenshot creation** – quick screen captures
- 💾 **File download** – save files to your computer
- ☁️ **Google Docs integration** – save screenshots to Google Docs
- ⌨️ **Hotkeys** – Ctrl+Shift+S for quick access
- 🎨 **Modern UI** – beautiful and intuitive interface
- 👀 **Preview** – view the screenshot before saving

## 🚀 Quick Start

**For Production Users:**
1. **Install from Chrome Web Store**
   - Visit [Easy Screenshot](https://chrome.google.com/webstore/detail/easy-screenshot/jfiljkfcimogfmjpgalhekblepdopmla)
   - Click "Add to Chrome"
   - Extension will work immediately with Google integration

**For Developers:**
1. **Clone and setup**
   - Clone this repository
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked extension"
   - Select the folder with the files

2. **Google API setup (for development)**
   - Follow the instructions in [GOOGLE_SETUP.md](./GOOGLE_SETUP.md)
   - Get a development Client ID in Google Cloud Console
   - Update `manifest.json`

3. **First use**
   - Click the extension icon
   - Sign in to your Google account (for Google Docs)
   - Click "📸 Take screenshot"
   - Or use the hotkey Ctrl+Shift+X

## 📖 Usage

### Taking a screenshot

**Method 1: Via popup**
1. Click the extension icon
2. Click "📸 Take screenshot"

**Method 2: Hotkeys**
- Windows/Linux: `Ctrl + Shift + X`
- Mac: `Cmd + Shift + X`

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
    "identity"        // Google OAuth authorization
  ]
}
```

### Google API

The extension uses:
- **Google Docs API** – create and edit documents
  - Scope: `https://www.googleapis.com/auth/documents`
  - Used for: Creating documents, inserting images/text, formatting
- **Google Drive API** – upload images and manage files
  - Scope: `https://www.googleapis.com/auth/drive.file`
  - Used for: Uploading screenshots, setting permissions, file management
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
├── google-docs-api.js      # Google Docs API integration
├── icons/                  # Extension icons
│   ├── icon.svg
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── CHANGELOG.md            # Changelog
├── PRIVACY_POLICY.md       # Privacy policy (Markdown)
└── README.md               # This file
```

### Customization

**Change hotkeys:**
```json
{
  "commands": {
    "_execute_action": {
      "suggested_key": {
        "default": "Ctrl+Shift+X"
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

**For Development:**
1. Fork the repository
2. Create a branch for a new feature
3. Make changes
4. Create a Pull Request

**For Production Issues:**
- Use the [Chrome Web Store](https://chrome.google.com/webstore/detail/easy-screenshot/jfiljkfcimogfmjpgalhekblepdopmla) for user support
- Report bugs through the store's feedback system

## 📄 Privacy Policy

- **Markdown version:** [Privacy Policy (MD)](https://dimsp1369.github.io/easyScreenShot_cws/PRIVACY_POLICY.md)
- **HTML version:** [Privacy Policy (HTML)](https://easyscreenshotpage.com/privacy-policy.html)

**Latest update:** 2025-11-29 | **Version:** 1.2

## 📄 License

MIT License – see LICENSE for details.

## 🙏 Acknowledgements

- Google Chrome Extensions API
- Google Docs API
- Extension developer community

---

**Version:** 1.2  
**Last updated:** 2025-11-29  
**Chrome Web Store:** [Easy Screenshot](https://chrome.google.com/webstore/detail/easy-screenshot/jfiljkfcimogfmjpgalhekblepdopmla) 