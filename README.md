# Saasbox Bug Reporter Widget

A lightweight, embeddable JavaScript widget that helps SaaS customers report bugs easily. The widget captures screenshots, console logs, network activity, and system information automatically.

## Features

- ✅ **Automatic Screenshot Capture** - Takes a screenshot of the current page
- ✅ **Console Log Collection** - Captures the last 50 console logs
- ✅ **Network Request Monitoring** - Tracks the last 20 network requests
- ✅ **System Information** - Collects browser, OS, and device details
- ✅ **Simple Text Description** - Users can describe the issue
- ✅ **Lightweight** - Under 50KB minified
- ✅ **Cross-Browser Compatible** - Works on Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- ✅ **Easy Installation** - Just add two script tags

## Installation

### Via CDN (Recommended)

Add these two lines to your HTML, just before the closing `</body>` tag:

```html
<!-- Using unpkg CDN -->
<script src="https://unpkg.com/saasbox-bug-reporter@1.0.1/dist/bug-reporter.min.js"></script>
<script>
  BugReporter.init({
    apiEndpoint: 'https://saasbox.app/api/bug-reporter',
    saasBoxKey: 'YOUR_SAASBOX_KEY',
    saasBoxSecret: 'YOUR_SAASBOX_SECRET'
  });
</script>
```

**Alternative CDNs:**
```html
<!-- jsDelivr (alternative CDN) -->
<script src="https://cdn.jsdelivr.net/npm/saasbox-bug-reporter@1.0.1/dist/bug-reporter.min.js"></script>
```

**Version Options:**
- `@1.0.1` - Specific version (recommended for production)
- `@1.0` - Latest patch version (auto-updates 1.0.x)
- `@1` - Latest minor version (auto-updates 1.x.x)
- `@latest` - Always latest version (not recommended for production)

### Via NPM (For Bundled Applications)

```bash
npm install saasbox-bug-reporter
```

```javascript
import BugReporter from 'saasbox-bug-reporter';

BugReporter.init({
  apiEndpoint: 'https://saasbox.app/api/bug-reporter', // or your self-hosted api endpoint
  saasBoxKey: 'YOUR_SAASBOX_KEY',
  saasBoxSecret: 'YOUR_SAASBOX_SECRET'
});
```

That's it! The widget will appear as a floating bug button in the bottom-right corner.

## API Endpoint

The widget sends a `POST` request with `multipart/form-data` to your configured endpoint:

### Request Format

```javascript
{
  saasBoxKey: "your-saasbox-key",
  saasBoxSecret: "your-saasbox-secret",
  description: "User's bug description",
  screenshot: File (PNG image blob),
  consoleLogs: JSON string with array of logs,
  networkRequests: JSON string with array of requests,
  systemInfo: JSON string with system information
}
```

### Example Backend (Node.js/Express)

```javascript
const express = require('express');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

app.post('/api/bug-reporter', upload.single('screenshot'), (req, res) => {
  const {
    saasBoxKey,
    saasBoxSecret,
    description,
    consoleLogs,
    networkRequests,
    systemInfo
  } = req.body;

  const screenshot = req.file; // File object

  // Verify credentials
  if (!verifySaasBoxCredentials(saasBoxKey, saasBoxSecret)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Parse JSON strings
  const logs = JSON.parse(consoleLogs);
  const requests = JSON.parse(networkRequests);
  const system = JSON.parse(systemInfo);

  // Save to database, send to bug tracking system, etc.
  console.log(`Bug report from SaasBox key: ${saasBoxKey}`);
  
  res.json({ success: true, id: 'bug-123' });
});
```

## Data Structure

### Console Logs
```json
[
  {
    "level": "log",
    "message": "User clicked submit button",
    "timestamp": "2025-12-17T10:30:00.000Z"
  }
]
```

### Network Requests
```json
[
  {
    "url": "https://api.example.com/data",
    "method": "GET",
    "status": 200,
    "statusText": "OK",
    "duration": 245,
    "type": "fetch",
    "timestamp": "2025-12-17T10:30:00.000Z"
  }
]
```

### System Information
```json
{
  "userAgent": "Mozilla/5.0...",
  "browser": "Chrome",
  "browserVersion": "120.0",
  "platform": "MacIntel",
  "language": "en-US",
  "screenResolution": {
    "width": 1920,
    "height": 1080
  },
  "viewportSize": {
    "width": 1440,
    "height": 900
  },
  "timestamp": "2025-12-17T10:30:00.000Z",
  "pageUrl": "https://yoursite.com/page",
  "referrer": "https://google.com"
}
```

## Configuration Options

### Basic Configuration

```javascript
BugReporter.init({
  apiEndpoint: 'https://saasbox.app/api/bug-reporter', // Required
  saasBoxKey: 'your-saasbox-key', // Required - Your SaasBox API key
  saasBoxSecret: 'your-saasbox-secret' // Required - Your SaasBox API secret
});
```

### Full Customization Options

```javascript
BugReporter.init({
  // Required
  apiEndpoint: 'https://saasbox.app/api/bug-reporter',
  saasBoxKey: 'your-saasbox-key',
  saasBoxSecret: 'your-saasbox-secret',
  
  // Trigger Button Customization
  position: 'bottom-right',      // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
  offsetX: 20,                    // Distance from horizontal edge (pixels)
  offsetY: 20,                    // Distance from vertical edge (pixels)
  buttonSize: 60,                 // Button size in pixels
  buttonShape: 'circle',          // 'circle', 'rounded' (12px radius), 'square' (4px radius)
  buttonIcon: '🐛',               // Any text, emoji, or HTML
  buttonColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  buttonShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  
  // Modal Customization
  modalTitle: 'Report a Bug',
  modalHeaderColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  modalHeaderTextColor: '#ffffff',
  modalPrimaryColor: '#667eea',   // Used for focus states and accents
  modalDescriptionLabel: 'Describe the issue',
  modalDescriptionPlaceholder: 'Please describe what went wrong...',
  modalSubmitText: 'Submit Report',
  modalCancelText: 'Cancel'
});
```

### Customization Examples

**Support Widget Theme:**
```javascript
BugReporter.init({
  apiEndpoint: 'https://saasbox.app/api/bug-reporter',
  saasBoxKey: 'your-saasbox-key',
  saasBoxSecret: 'your-saasbox-secret',
  buttonIcon: '💬',
  buttonColor: '#4CAF50',
  modalTitle: 'Contact Support',
  modalHeaderColor: '#4CAF50',
  modalPrimaryColor: '#4CAF50',
  modalSubmitText: 'Send Message'
});
```

**Feedback Widget Theme:**
```javascript
BugReporter.init({
  apiEndpoint: 'https://saasbox.app/api/bug-reporter',
  saasBoxKey: 'your-saasbox-key',
  saasBoxSecret: 'your-saasbox-secret',
  buttonIcon: '📝',
  buttonColor: '#FF9800',
  buttonShape: 'rounded',
  position: 'bottom-left',
  modalTitle: 'Share Feedback',
  modalHeaderColor: '#FF9800',
  modalPrimaryColor: '#FF9800',
  modalDescriptionLabel: 'Your feedback',
  modalDescriptionPlaceholder: 'Tell us what you think...',
  modalSubmitText: 'Send Feedback'
});
```

**Custom Brand Colors:**
```javascript
BugReporter.init({
  apiEndpoint: 'https://saasbox.app/api/bug-reporter',
  saasBoxKey: 'your-saasbox-key',
  saasBoxSecret: 'your-saasbox-secret',
  buttonColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  buttonShadow: '0 6px 20px rgba(245, 87, 108, 0.4)',
  modalHeaderColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  modalPrimaryColor: '#f5576c',
  offsetX: 30,
  offsetY: 30,
  buttonSize: 70
});
```

## Development

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Build and watch for changes
npm run dev

# Serve demo locally
npm run serve
# Then open http://localhost:8080/demo/
```

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## File Size

- Unminified: ~25KB
- Minified: ~45KB (including html2canvas library)

## Security Considerations

- The widget captures visible page content in screenshots
- Console logs may contain sensitive information
- Network requests include URLs and status codes (not request/response bodies)
- Ensure your API endpoint validates and sanitizes all incoming data
- Use HTTPS for the API endpoint
- Consider implementing rate limiting to prevent abuse

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
