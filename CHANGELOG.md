# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-17

### Added
- Initial release of Bug Reporter Widget
- Screenshot capture using html2canvas
- Console log collection (last 50 logs)
- Network request monitoring (last 20 requests via fetch and XMLHttpRequest)
- System information collection (browser, OS, screen resolution, etc.)
- Customizable trigger button (position, size, shape, color, icon, shadow)
- Customizable modal UI (colors, text labels, branding)
- SaasBox API key and secret authentication
- Cross-browser support (Chrome 60+, Firefox 55+, Safari 12+, Edge 79+)
- Published to NPM registry
- Available via unpkg and jsDelivr CDNs
- UMD module format for broad compatibility

### Technical Details
- File size: 217KB minified (including html2canvas)
- Zero framework dependencies
- Vanilla JavaScript with ES5 transpilation via Babel
- Isolated CSS with `br-*` prefix to avoid conflicts
- Webpack-based build system

---

## [Unreleased]

### Planned
- Video recording capability
- Screenshot annotation tools
- Session replay integration
- Multi-language support
- Analytics dashboard
- Additional customization options

---

## Version Guidelines

Given a version number MAJOR.MINOR.PATCH, increment the:

- **MAJOR** version when you make incompatible API changes
- **MINOR** version when you add functionality in a backward compatible manner
- **PATCH** version when you make backward compatible bug fixes

---

## CDN URLs

After each release, the widget is available at:

**unpkg:**
```
https://unpkg.com/bug-reporter-widget@1.0.0/dist/bug-reporter.min.js
```

**jsDelivr:**
```
https://cdn.jsdelivr.net/npm/bug-reporter-widget@1.0.0/dist/bug-reporter.min.js
```

**Version Aliases:**
- `@latest` - Always the newest version
- `@1` - Latest 1.x.x version
- `@1.0` - Latest 1.0.x version
- `@1.0.0` - Specific version (recommended for production)

---

## Links

- [NPM Package](https://www.npmjs.com/package/bug-reporter-widget)
- [GitHub Repository](https://github.com/yourusername/bug-reporter-widget)
- [Report Issues](https://github.com/yourusername/bug-reporter-widget/issues)
