# Chrome Extension Boilerplate

A complete boilerplate template for creating Chrome extensions using Manifest V3.

## Features

- ✅ Manifest V3 (latest Chrome extension standard)
- ✅ Popup interface with HTML/CSS/JS
- ✅ Background service worker
- ✅ Content script for page interaction
- ✅ Chrome Storage API integration
- ✅ Message passing between components
- ✅ Modern, clean UI

## Project Structure

```
.
├── manifest.json       # Extension configuration
├── popup.html         # Popup interface HTML
├── popup.js           # Popup interface logic
├── popup.css          # Popup styling
├── background.js      # Background service worker
├── content.js         # Content script (runs on web pages)
├── icons/             # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md          # This file
```

## Setup Instructions

1. **Create Icons**
   - Create an `icons` folder
   - Add three icon files: `icon16.png`, `icon48.png`, and `icon128.png`
   - You can use any image editor or online tools to create these

2. **Load Extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select this project folder

3. **Test the Extension**
   - Click the extension icon in the toolbar
   - Click the button in the popup
   - Open the browser console to see logs
   - The content script will run on all web pages

## Customization

### Modify Permissions
Edit `manifest.json` to add/remove permissions based on your needs:
- `storage` - For saving data
- `activeTab` - Access to current tab
- `tabs` - Access to all tabs
- `bookmarks` - Access to bookmarks
- etc.

### Add More Features
- **Options Page**: Add `options.html` and `options.js` for settings
- **Context Menus**: Use `chrome.contextMenus` API
- **Notifications**: Use `chrome.notifications` API
- **Badge**: Use `chrome.action.setBadgeText()` for popup badge

## Development Tips

- Use `chrome.storage.sync` for data that syncs across devices
- Use `chrome.storage.local` for device-specific data
- Content scripts run in isolated world - they can't access page's JavaScript variables
- Background service worker has a 5-minute idle timeout (use alarms for long-running tasks)

## Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Chrome Extension APIs](https://developer.chrome.com/docs/extensions/reference/)

## License

MIT - Feel free to use this template for your projects!
