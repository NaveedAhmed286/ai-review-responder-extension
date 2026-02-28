

# AI Review Responder - Chrome Extension

Generate AI-powered responses to reviews on any platform with one click.

## Features

- Works on Facebook, Google, Twitter, Instagram, Yelp, and more
- One-click response generation
- Auto-fills reply boxes
- Multiple tone options (Professional, Friendly, Enthusiastic, Formal)
- License key verification
- Usage tracking

## Installation

### From Chrome Web Store (Coming Soon)

### Developer Mode (Local Testing)

1. Open Chrome and go to `chrome://extensions`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `ai-review-responder-extension` folder
5. Extension appears in toolbar

## Usage

1. Click the extension icon in toolbar
2. Enter your license key
3. Navigate to any review on Facebook, Google, etc.
4. Click "Generate Response"
5. Click "Fill Reply Box"
6. Click "Post" on the platform

## Development

### File Structure

```

extension/
├── manifest.json          # Extension config
├── popup.html            # Main popup
├── popup.js              # Popup logic
├── content.js            # Runs on websites
├── background.js         # Background tasks
├── utils.js              # Shared functions
├── options.html          # Settings page
├── options.js            # Settings logic
├── platforms/            # Platform handlers
│   ├── facebook.js
│   ├── google.js
│   ├── twitter.js
│   ├── instagram.js
│   └── yelp.js
├── styles/
│   └── popup.css         # Popup styles
└── icons/                # Extension icons
├── icon16.png
├── icon48.png
└── icon128.png

```

## Publishing to Chrome Web Store

1. Create a ZIP of all files
2. Go to Chrome Web Store Developer Dashboard
3. Pay one-time $5 registration fee
4. Upload ZIP
5. Fill in store listing details
6. Submit for review

## Support

- Email: hi@aiinfra.work
- Website: https://responder.aiinfra.work

## License

Proprietary - All rights reserved
```

