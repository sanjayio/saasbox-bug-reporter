# Publishing Quick Start Guide

## Ready to Publish? ✅

Your bug reporter widget is configured and ready to publish to NPM!

**Dry-run results:**
- ✅ Package builds successfully
- ✅ Files correctly configured (4 files, 233KB total)
- ✅ prepublishOnly script works
- ✅ .npmignore is working (src/, demo/, node_modules/ excluded)

---

## Before First Publish

### 1. Update package.json

Replace placeholders in `package.json`:

```json
{
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "url": "https://github.com/sanjayio/saasbox.git"
  },
  "bugs": {
    "url": "https://github.com/sanjayio/saasbox/issues"
  },
  "homepage": "https://github.com/sanjayio/saasbox#readme"
}
```

### 2. Create NPM Account

```bash
# Create account at npmjs.com, then:
npm adduser
# or
npm login
```

### 3. Check Package Name

```bash
npm view saasbox-bug-reporter
```

If `404 Not Found` → Name is available ✅  
If package exists → Choose different name in package.json

---

## Publishing for the First Time

```bash
# 1. Make sure you're logged in
npm whoami

# 2. Publish (build happens automatically)
npm publish
```

That's it! Your package will be live on NPM and automatically available on unpkg and jsDelivr within 5-30 minutes.

---

## After Publishing

### Test CDN URLs (wait 5 minutes first)

```bash
# Test unpkg
curl -I https://unpkg.com/saasbox-bug-reporter@1.0.0/dist/bug-reporter.min.js

# Test jsDelivr
curl -I https://cdn.jsdelivr.net/npm/saasbox-bug-reporter@1.0.0/dist/bug-reporter.min.js
```

### View Your Package

- NPM: https://www.npmjs.com/package/saasbox-bug-reporter
- unpkg: https://unpkg.com/browse/saasbox-bug-reporter@1.0.0/
- jsDelivr: https://www.jsdelivr.com/package/npm/saasbox-bug-reporter

---

## Future Updates

### Patch Release (Bug Fixes)

```bash
npm version patch  # 1.0.0 → 1.0.1
npm publish
```

### Minor Release (New Features)

```bash
npm version minor  # 1.0.0 → 1.1.0
npm publish
```

### Major Release (Breaking Changes)

```bash
npm version major  # 1.0.0 → 2.0.0
npm publish
```

---

## Automated Publishing with GitHub Actions

### Setup (One Time)

1. **Generate NPM Token**:
   - Go to npmjs.com → Account Settings → Access Tokens
   - Generate "Automation" token
   - Copy the token

2. **Add to GitHub**:
   - GitHub repo → Settings → Secrets → Actions
   - New secret: `NPM_TOKEN` = (paste token)

### Publish via GitHub

```bash
# Bump version and create tag
npm version patch

# Push with tags
git push --follow-tags
```

GitHub Actions will automatically:
- Build the widget
- Publish to NPM
- Verify CDN availability
- Create GitHub release

---

## Customer Installation (After Publishing)

Share these URLs with customers:

### Via CDN

```html
<script src="https://unpkg.com/saasbox-bug-reporter@1.0.0/dist/bug-reporter.min.js"></script>
<script>
  BugReporter.init({
    apiEndpoint: 'https://api.yoursite.com/bugs',
    saasBoxKey: 'CUSTOMER_KEY',
    saasBoxSecret: 'CUSTOMER_SECRET'
  });
</script>
```

### Via NPM

```bash
npm install bug-reporter-widget
```

---

## Troubleshooting

### "Package name already taken"

Change name in package.json to something unique like:
```json
{
  "name": "@yourorg/bug-reporter-widget"
}
```

### "You must verify your email"

Check your NPM signup email and click verification link.

### "Build failed"

```bash
npm run build
# Fix any errors, then try publishing again
```

---

## Files Created for NPM Publishing

```
✅ package.json        - Updated with NPM fields
✅ LICENSE             - MIT license
✅ .npmignore          - Excludes src/, demo/, etc.
✅ CHANGELOG.md        - Version history
✅ README.md           - Updated with CDN installation
✅ docs/PUBLISHING.md  - Detailed publishing guide
✅ .github/workflows/publish-npm.yml - Auto-publish on tags
```

---

## Need More Help?

See detailed guide: `docs/PUBLISHING.md`

Or check NPM docs: https://docs.npmjs.com/

---

## Summary

**Package Size:** 56.7 KB (233.2 KB unpacked)  
**Files Included:** 4 (dist/, README, LICENSE, package.json)  
**Build:** Automatic via prepublishOnly hook  
**CDN:** Available on unpkg and jsDelivr after publishing  

You're all set! 🚀
