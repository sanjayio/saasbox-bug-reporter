# Saasbox Bug Reporter Widget

A lightweight, embeddable JavaScript widget that helps SaaS customers report bugs easily. The widget captures screenshots, console logs, network activity, and system information automatically.

## Features

- ✅ **Flexible Screenshot Capture** - Full viewport or area selection mode
- ✅ **Interactive Annotation Tools** - Add arrows, text, and freehand drawings to screenshots
- ✅ **Undo/Redo Functionality** - Full history management for annotations
- ✅ **Color Selection** - Multiple colors for annotations (red, green, blue)
- ✅ **Console Log Collection** - Captures the last 50 console logs
- ✅ **Network Request Monitoring** - Tracks the last 20 network requests
- ✅ **System Information** - Collects browser, OS, and device details
- ✅ **Simple Text Description** - Users can describe the issue
- ✅ **Lightweight** - Under 57KB minified (83% smaller than before!)
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
    apiEndpoint: 'https://saasbox.app/api/bug-reports',
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
  apiEndpoint: 'https://saasbox.app/api/bug-reports', // or your self-hosted api endpoint
  saasBoxKey: 'YOUR_SAASBOX_KEY',
  saasBoxSecret: 'YOUR_SAASBOX_SECRET'
});
```

#### Next.js Applications

**Option 1: Using Script Component (Recommended for Next.js 13+ App Router)**

```typescript
// components/BugReporter.tsx
'use client';

import Script from 'next/script';

declare global {
  interface Window {
    BugReporter?: {
      init: (config: {
        apiEndpoint: string;
        saasBoxKey: string;
        saasBoxSecret: string;
        screenshotMode?: string;
        position?: string;
        offsetX?: number;
        offsetY?: number;
        buttonSize?: number;
        buttonShape?: string;
        buttonIcon?: string;
        buttonColor?: string;
        buttonShadow?: string;
        buttonIconColor?: string;
        modalTitle?: string;
        modalHeaderColor?: string;
        modalHeaderTextColor?: string;
        modalBodyColor?: string;
        modalBodyTextColor?: string;
        modalPrimaryColor?: string;
        modalDescriptionLabel?: string;
        modalDescriptionPlaceholder?: string;
        modalDescriptionTextColor?: string;
        modalDescriptionPlaceholderColor?: string;
        modalSubmitText?: string;
        modalCancelText?: string;
        modalSubmitButtonColor?: string;
        modalCancelButtonColor?: string;
        buttonShadowHover?: string;
        modalBorderColor?: string;
        modalDisabledButtonColor?: string;
        modalCancelButtonBackground?: string;
        messageBackgroundColor?: string;
        messageTextColor?: string;
        messageBorderColor?: string;
        messageInfoBackground?: string;
        messageInfoText?: string;
        messageInfoBorder?: string;
        messageErrorBackground?: string;
        messageErrorText?: string;
        messageErrorBorder?: string;
        messageSuccessBackground?: string;
        messageSuccessText?: string;
        messageSuccessBorder?: string;
        selectionOverlayColor?: string;
        selectionBorderColor?: string;
        selectionInfoBackground?: string;
        selectionInfoText?: string;
        overlayColor?: string;
        toolbarBackgroundColor?: string;
        toolbarButtonBackground?: string;
        toolbarButtonColor?: string;
        toolbarButtonHoverBackground?: string;
        toolbarButtonActiveBackground?: string;
        toolbarButtonDisabledBackground?: string;
        toolbarButtonActiveShadow?: string;
        colorButtonBackground?: string;
        colorButtonBorder?: string;
        colorButtonHoverBorder?: string;
        colorButtonActiveBorder?: string;
        colorButtonActiveShadow?: string;
        textAnnotationBackground?: string;
        textAnnotationColor?: string;
        textAnnotationBorder?: string;
      }) => void;
    };
  }
}

export function BugReporter() {
  return (
    <Script
      src="https://unpkg.com/saasbox-bug-reporter@1.0.8/dist/bug-reporter.min.js"
      strategy="afterInteractive"
      onLoad={() => {
        if (typeof window !== 'undefined' && window.BugReporter) {
          window.BugReporter.init({
            apiEndpoint: `${process.env.NEXT_PUBLIC_SITE_URL}/api/bug-reports`,
            saasBoxKey: `${process.env.NEXT_PUBLIC_SAASBOX_CREDENTIAL_KEY}`,
            saasBoxSecret: `${process.env.NEXT_PUBLIC_SAASBOX_CREDENTIAL_SECRET}`,
            
            // Screenshot capture mode
            screenshotMode: 'selection',
            
            // Trigger button customization
            position: 'bottom-left',
            offsetX: 15,
            offsetY: 15,
            buttonSize: 55,
            buttonShape: 'rounded',
            buttonIcon: '🐞',
            buttonColor: '#f8f2e5',
            buttonIconColor: '#000000',
            buttonShadow: '0 6px 20px #ed9a56',
            buttonShadowHover: '0 8px 25px #ed9a56',
            
            // Modal customization
            modalTitle: 'Report a Bug',
            modalHeaderColor: '#f8f2e5',
            modalHeaderTextColor: '#000000',
            modalBodyColor: '#ffffff',
            modalBodyTextColor: '#333333',
            modalPrimaryColor: '#ed9a56',
            modalDescriptionLabel: 'Describe the issue',
            modalDescriptionPlaceholder: 'Please tell us what went wrong...',
            modalDescriptionTextColor: '#333333',
            modalDescriptionPlaceholderColor: '#999999',
            modalSubmitText: 'Submit',
            modalCancelText: 'Cancel',
            modalSubmitButtonColor: '#ffffff',
            modalCancelButtonColor: '#6c757d',
            
            // Advanced color customization
            modalBorderColor: '#e1e5e9',
            modalDisabledButtonColor: '#cccccc',
            modalCancelButtonBackground: 'transparent',
            messageBackgroundColor: '#f8f9fa',
            messageTextColor: '#333',
            messageBorderColor: '#dee2e6',
            messageInfoBackground: '#d1ecf1',
            messageInfoText: '#0c5460',
            messageInfoBorder: '#bee5eb',
            messageErrorBackground: '#f8d7da',
            messageErrorText: '#721c24',
            messageErrorBorder: '#f5c6cb',
            messageSuccessBackground: '#d4edda',
            messageSuccessText: '#155724',
            messageSuccessBorder: '#c3e6cb',
            
            // Annotation and selection colors
            selectionOverlayColor: 'rgba(0, 0, 0, 0.7)',
            selectionBorderColor: '#ed9a56',
            selectionInfoBackground: 'rgba(0, 0, 0, 0.8)',
            selectionInfoText: 'white',
            overlayColor: 'rgba(0, 0, 0, 0.5)',
            toolbarBackgroundColor: '#ed9a56',
            toolbarButtonBackground: 'rgba(255, 255, 255, 0.2)',
            toolbarButtonColor: 'white',
            toolbarButtonHoverBackground: 'rgba(255, 255, 255, 0.3)',
            toolbarButtonActiveBackground: 'rgba(255, 255, 255, 0.4)',
            toolbarButtonDisabledBackground: 'rgba(255, 255, 255, 0.1)',
            toolbarButtonActiveShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            
            // Color picker and annotation colors
            colorButtonBackground: '#ef4444',
            colorButtonBorder: 'rgba(255, 255, 255, 0.3)',
            colorButtonHoverBorder: 'rgba(255, 255, 255, 0.6)',
            colorButtonActiveBorder: '#ffffff',
            colorButtonActiveShadow: '0 0 0 2px rgba(255, 255, 255, 0.5)',
            textAnnotationBackground: 'rgba(255, 255, 255, 0.8)',
            textAnnotationColor: '#ef4444',
            textAnnotationBorder: 'transparent'
          });
        }
      }}
    />
  );
}
```

Then import and use it in your layout or page:

```typescript
// app/layout.tsx or app/(root)/layout.tsx
import { BugReporter } from '@/components/BugReporter';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <BugReporter />
      </body>
    </html>
  );
}
```

**Option 2: Dynamic Import (Classic Approach)**

```typescript
// In your _app.tsx, layout.tsx, or a client component
import { useEffect } from 'react';
import dynamic from 'next/dynamic';

const BugReporter = dynamic(() => import('saasbox-bug-reporter'), { ssr: false });

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      import('saasbox-bug-reporter').then((BugReporter) => {
        BugReporter.default.init({
          apiEndpoint: 'https://saasbox.app/api/bug-reporter',
          saasBoxKey: 'YOUR_SAASBOX_KEY',
          saasBoxSecret: 'YOUR_SAASBOX_SECRET',
          screenshotMode: 'selection',
          position: 'bottom-right',
          // ... all other customization options
        });
      });
    }
  }, []);

  return <Component {...pageProps} />;
}
```

**Environment Variables Setup:**

Create a `.env.local` file in your Next.js project root:

```env
# .env.local
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_SAASBOX_CREDENTIAL_KEY=your-saasbox-key
NEXT_PUBLIC_SAASBOX_CREDENTIAL_SECRET=your-saasbox-secret
```

**Notes:**
- The Script component approach is recommended for Next.js 13+ App Router
- TypeScript declarations are included for full type safety
- All customization options are available with proper TypeScript types
- The widget only loads on the client side, avoiding SSR issues
- Environment variables must be prefixed with `NEXT_PUBLIC_` to be available in the browser

**Note:** This widget uses `html-to-image` which supports modern CSS color functions like `lab()`, `lch()`, `oklab()`, and `oklch()` that are commonly used in Next.js applications with Tailwind CSS. The widget has been optimized for maximum performance with inline CSS-in-JS styles and minimal dependencies.

That's it! The widget will appear as a floating bug button in the bottom-right corner (or wherever you position it with the `position` option).

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
  
  // Screenshot Capture Mode
  screenshotMode: 'selection',    // 'selection' (area selection) or 'full' (full viewport)
  
  // Trigger Button Customization
  position: 'bottom-right',      // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
  offsetX: 20,                    // Distance from horizontal edge (pixels)
  offsetY: 20,                    // Distance from vertical edge (pixels)
  buttonSize: 60,                 // Button size in pixels
  buttonShape: 'circle',          // 'circle', 'rounded' (12px radius), 'square' (4px radius)
  buttonIcon: '🐛',               // Any text, emoji, or HTML
  buttonColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  buttonShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  buttonIconColor: '#ffffff',    // Icon/text color
  
  // Modal Customization
  modalTitle: 'Report a Bug',
  modalHeaderColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  modalHeaderTextColor: '#ffffff',
  modalBodyColor: '#ffffff',
  modalBodyTextColor: '#333333',
  modalPrimaryColor: '#667eea',   // Used for focus states and accents
  modalDescriptionLabel: 'Describe the issue',
  modalDescriptionPlaceholder: 'Please describe what went wrong...',
  modalDescriptionTextColor: '#333333',
  modalDescriptionPlaceholderColor: '#999999',
  modalSubmitText: 'Submit Report',
  modalCancelText: 'Cancel',
  modalSubmitButtonColor: '#ffffff',
  modalCancelButtonColor: '#6c757d',
  
  // Advanced Color Customization
  buttonShadowHover: '0 6px 16px rgba(0, 0, 0, 0.2)',
  modalBorderColor: '#e1e5e9',
  modalDisabledButtonColor: '#cccccc',
  modalCancelButtonBackground: 'transparent',
  messageBackgroundColor: '#f8f9fa',
  messageTextColor: '#333',
  messageBorderColor: '#dee2e6',
  messageInfoBackground: '#d1ecf1',
  messageInfoText: '#0c5460',
  messageInfoBorder: '#bee5eb',
  messageErrorBackground: '#f8d7da',
  messageErrorText: '#721c24',
  messageErrorBorder: '#f5c6cb',
  messageSuccessBackground: '#d4edda',
  messageSuccessText: '#155724',
  messageSuccessBorder: '#c3e6cb',
  selectionOverlayColor: 'rgba(0, 0, 0, 0.7)',
  selectionBorderColor: '#667eea',
  selectionInfoBackground: 'rgba(0, 0, 0, 0.8)',
  selectionInfoText: 'white',
  overlayColor: 'rgba(0, 0, 0, 0.5)',
  toolbarBackgroundColor: '#667eea',
  toolbarButtonBackground: 'rgba(255, 255, 255, 0.2)',
  toolbarButtonColor: 'white',
  toolbarButtonHoverBackground: 'rgba(255, 255, 255, 0.3)',
  toolbarButtonActiveBackground: 'rgba(255, 255, 255, 0.4)',
  toolbarButtonDisabledBackground: 'rgba(255, 255, 255, 0.1)',
  toolbarButtonActiveShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
  colorButtonBackground: '#ef4444',
  colorButtonBorder: 'rgba(255, 255, 255, 0.3)',
  colorButtonHoverBorder: 'rgba(255, 255, 255, 0.6)',
  colorButtonActiveBorder: '#ffffff',
  colorButtonActiveShadow: '0 0 0 2px rgba(255, 255, 255, 0.5)',
  textAnnotationBackground: 'rgba(255, 255, 255, 0.8)',
  textAnnotationColor: '#ef4444',
  textAnnotationBorder: 'transparent'
});
```

### Customization Examples

**Support Widget Theme:**
```javascript
BugReporter.init({
  apiEndpoint: 'https://saasbox.app/api/bug-reporter',
  saasBoxKey: 'your-saasbox-key',
  saasBoxSecret: 'your-saasbox-secret',
  screenshotMode: 'full',
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
  screenshotMode: 'selection',
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
  screenshotMode: 'selection',
  buttonColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  buttonShadow: '0 6px 20px rgba(245, 87, 108, 0.4)',
  modalHeaderColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  modalPrimaryColor: '#f5576c',
  offsetX: 30,
  offsetY: 30,
  buttonSize: 70,
  toolbarBackgroundColor: '#f5576c',
  selectionBorderColor: '#f5576c'
});
```

**Dark Mode Theme:**
```javascript
BugReporter.init({
  apiEndpoint: 'https://saasbox.app/api/bug-reporter',
  saasBoxKey: 'your-saasbox-key',
  saasBoxSecret: 'your-saasbox-secret',
  screenshotMode: 'selection',
  buttonColor: '#1a1a1a',
  buttonIconColor: '#ffffff',
  modalBodyColor: '#1a1a1a',
  modalBodyTextColor: '#ffffff',
  modalHeaderColor: '#333333',
  modalPrimaryColor: '#4fc3f7',
  modalDescriptionTextColor: '#ffffff',
  modalDescriptionPlaceholderColor: '#999999',
  messageBackgroundColor: '#2a2a2a',
  messageTextColor: '#ffffff',
  toolbarBackgroundColor: '#333333',
  selectionOverlayColor: 'rgba(0, 0, 0, 0.8)',
  overlayColor: 'rgba(0, 0, 0, 0.7)'
});
```

**Minimalist Theme:**
```javascript
BugReporter.init({
  apiEndpoint: 'https://saasbox.app/api/bug-reporter',
  saasBoxKey: 'your-saasbox-key',
  saasBoxSecret: 'your-saasbox-secret',
  screenshotMode: 'full',
  buttonIcon: '⚠️',
  buttonColor: '#ffffff',
  buttonShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  buttonIconColor: '#333333',
  modalTitle: 'Report Issue',
  modalBodyColor: '#fafafa',
  modalHeaderColor: '#ffffff',
  modalHeaderTextColor: '#333333',
  modalPrimaryColor: '#333333',
  borderColor: '#e0e0e0',
  toolbarBackgroundColor: '#333333'
});
```

## Screenshot & Annotation Features

The widget provides powerful screenshot capture and annotation capabilities:

### Screenshot Capture Modes

**Area Selection Mode (`'selection'`)**
- User clicks and drags to select a specific area
- Shows crosshair guides and selection dimensions
- Perfect for capturing specific UI elements or error messages
- Default mode for most use cases

**Full Viewport Mode (`'full'`)**
- Immediately captures the entire visible viewport
- No interaction required - just click the button
- Great for general bug reporting and mobile experiences

### Annotation Tools

Once a screenshot is captured, users can annotate it with:

**🎨 Color Selection**
- Red, Green, and Blue colors for all annotations
- Intuitive color picker in the toolbar
- Selected color applies to all annotation tools

**➡️ Arrow Tool**
- Click and drag to draw arrows
- Perfect for pointing to specific issues
- Adjustable length and direction
- Draggable and resizable after creation

**📝 Text Tool**
- Click anywhere to add editable text
- Text appears with background for readability
- Editable inline - just click and type
- Draggable to reposition

**✏️ Freehand Drawing**
- Draw freehand lines and shapes
- Great for circling areas or custom annotations
- Smooth笔触 with pressure sensitivity
- Multiple colors available

**↩️ Undo/Redo**
- Full history management (up to 50 states)
- Undo (Ctrl+Z / Cmd+Z) and Redo (Ctrl+Y / Cmd+Y)
- Automatic state saving after each annotation
- Clear all annotations with confirmation

### Keyboard Shortcuts

- `Escape` - Close modal or cancel selection mode
- `Ctrl+Z` / `Cmd+Z` - Undo last annotation
- `Ctrl+Y` / `Cmd+Y` - Redo annotation
- `Click & Drag` - Select area (in selection mode)
- `Click & Drag` - Draw arrows or freehand (in annotation modes)

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

- Unminified: ~110KB
- Minified: ~57KB (including html-to-image library)
- **Optimization**: Reduced from 271KB to 57KB (79% reduction)

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
