# Publishing to NPM Guide

This guide explains how to publish the Bug Reporter Widget to NPM, making it automatically available via unpkg and jsDelivr CDNs.

## Prerequisites

1. **NPM Account**: Create at [npmjs.com](https://www.npmjs.com/signup)
2. **Package Name Available**: `bug-reporter-widget` must be available
3. **Git Repository**: Code should be in a Git repository
4. **Build Passing**: Widget builds successfully

---

## First-Time Setup

### 1. Create NPM Account

```bash
npm adduser
# Enter username, password, and email
# Check confirmation email
```

### 2. Login Locally

```bash
npm login
# Enter credentials

# Verify login
npm whoami
# Should display your username
```

### 3. Check Package Name Availability

```bash
npm view bug-reporter-widget
```

**If you see `404`**: Name is available ✅  
**If package info appears**: Name is taken, choose a different name

---

## Publishing Process

### Manual Publishing

#### Step 1: Update Version

```bash
# For bug fixes (1.0.1 → 1.0.1)
npm version patch

# For new features (1.0.1 → 1.1.0)
npm version minor

# For breaking changes (1.0.1 → 2.0.0)
npm version major
```

This will:
- Update `package.json` and `package-lock.json`
- Create a git commit
- Create a git tag (e.g., `v1.0.1`)
- Run `postversion` script (pushes to GitHub)

#### Step 2: Build (Automatic)

The `prepublishOnly` script runs automatically before publishing:
```bash
# Runs automatically
npm run build
```

#### Step 3: Publish to NPM

```bash
npm publish
```

This will:
- Build the widget (via `prepublishOnly`)
- Upload to NPM registry
- Make available on unpkg within ~5 minutes
- Make available on jsDelivr within ~10 minutes

#### Step 4: Verify Publication

```bash
# Check NPM
npm view bug-reporter-widget

# Wait 5 minutes, then test unpkg
curl -I https://unpkg.com/bug-reporter-widget@1.0.1/dist/bug-reporter.min.js

# Test jsDelivr
curl -I https://cdn.jsdelivr.net/npm/bug-reporter-widget@1.0.1/dist/bug-reporter.min.js
```

---

## Automated Publishing (GitHub Actions)

### Setup GitHub Actions

1. **Generate NPM Token**:
   - Go to [npmjs.com](https://www.npmjs.com) → Account Settings → Access Tokens
   - Click "Generate New Token" → "Automation"
   - Copy the token

2. **Add to GitHub Secrets**:
   - Go to your GitHub repo → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste the token from step 1

### Trigger Automated Publishing

```bash
# Method 1: Use npm version (recommended)
npm version patch
git push --follow-tags

# Method 2: Manual git tag
git tag v1.0.1
git push origin v1.0.1
```

The GitHub Actions workflow will:
1. Checkout code
2. Install dependencies
3. Build widget
4. Publish to NPM
5. Verify CDN availability

---

## Version Management

### Semantic Versioning

Follow [semver.org](https://semver.org):

- **MAJOR** (1.0.1 → 2.0.0): Breaking changes
- **MINOR** (1.0.1 → 1.1.0): New features, backward compatible
- **PATCH** (1.0.1 → 1.0.1): Bug fixes

### Examples

```bash
# Bug fix: Fixed screenshot not capturing
npm version patch  # 1.0.1 → 1.0.1

# New feature: Added video recording
npm version minor  # 1.0.1 → 1.1.0

# Breaking change: Changed API format
npm version major  # 1.0.1 → 2.0.0
```

---

## Pre-Publish Checklist

Before publishing, ensure:

- [ ] Code is tested and working
- [ ] `npm run build` succeeds
- [ ] `dist/bug-reporter.min.js` exists
- [ ] `CHANGELOG.md` is updated
- [ ] `README.md` is current
- [ ] No sensitive data in code
- [ ] Version number is correct

---

## Testing Before Publishing

### Dry Run

```bash
# Test what will be published without actually publishing
npm publish --dry-run
```

This shows:
- Which files will be included
- Package size
- Any errors

### Local Testing

```bash
# Pack the package locally
npm pack

# This creates: bug-reporter-widget-1.0.1.tgz

# Install in another project
cd /path/to/test-project
npm install /path/to/bug-reporter-widget-1.0.1.tgz

# Test it works
```

---

## Post-Publishing Steps

### 1. Verify Package Page

Visit: `https://www.npmjs.com/package/bug-reporter-widget`

Check:
- README displays correctly
- Version is correct
- Files are listed

### 2. Test CDN URLs

```bash
# Wait 5-30 minutes after publishing

# Test unpkg
curl -I https://unpkg.com/bug-reporter-widget@latest/dist/bug-reporter.min.js

# Test jsDelivr
curl -I https://cdn.jsdelivr.net/npm/bug-reporter-widget@latest/dist/bug-reporter.min.js
```

### 3. Update CHANGELOG

Add release notes to `CHANGELOG.md`:

```markdown
## [1.0.1] - 2025-12-18

### Fixed
- Fixed screenshot capture on Firefox
- Improved error handling in network monitor

### Added
- Better console log formatting
```

### 4. Create GitHub Release

```bash
# Via GitHub CLI
gh release create v1.0.1 \
  --title "v1.0.1" \
  --notes "Bug fixes and improvements. See CHANGELOG.md" \
  dist/bug-reporter.min.js

# Or manually via GitHub web interface
```

---

## Updating an Existing Package

### For Bug Fixes

```bash
# 1. Fix the bug
# 2. Test thoroughly
# 3. Update version
npm version patch

# 4. Publish
npm publish

# 5. Verify
npm view bug-reporter-widget
```

### For New Features

```bash
# 1. Add the feature
# 2. Test thoroughly
# 3. Update README if needed
# 4. Update version
npm version minor

# 5. Publish
npm publish
```

---

## Deprecating a Version

If you published a broken version:

```bash
# Deprecate specific version
npm deprecate bug-reporter-widget@1.0.5 "This version has a critical bug. Use 1.0.6 instead."

# Customers will see warning when installing
```

---

## Unpublishing (Use Sparingly)

⚠️ **Only within 72 hours of publishing**

```bash
# Unpublish specific version
npm unpublish bug-reporter-widget@1.0.5

# Unpublish entire package (DANGEROUS)
npm unpublish bug-reporter-widget --force
```

**Better alternative**: Publish a new fixed version instead.

---

## Troubleshooting

### "Package name already taken"

**Solution**: Choose a different name in `package.json`:
```json
{
  "name": "@yourorg/bug-reporter-widget"
}
```

### "You must verify your email"

**Solution**: Check NPM signup email and click verification link

### "No permission to publish"

**Solution**: Make sure you're logged in:
```bash
npm whoami
npm login
```

### "prepublishOnly script failed"

**Solution**: Fix build errors:
```bash
npm run build
# Fix any errors shown
```

### "Cannot publish over existing version"

**Solution**: Bump version number:
```bash
npm version patch
npm publish
```

---

## Best Practices

1. **Always test before publishing**: Use `npm publish --dry-run`
2. **Use semantic versioning**: Follow semver strictly
3. **Update CHANGELOG**: Document all changes
4. **Test CDN URLs**: Verify unpkg/jsDelivr work after publishing
5. **Tag releases**: Use git tags for version tracking
6. **Never publish secrets**: Check `.npmignore` is correct
7. **Keep README updated**: This is your package homepage
8. **Monitor downloads**: Track usage on npmjs.com

---

## Package URLs After Publishing

Once published, the package is available at:

**NPM Registry:**
```
https://www.npmjs.com/package/bug-reporter-widget
```

**unpkg CDN:**
```
https://unpkg.com/bug-reporter-widget@1.0.1/dist/bug-reporter.min.js
https://unpkg.com/bug-reporter-widget@latest/dist/bug-reporter.min.js
```

**jsDelivr CDN:**
```
https://cdn.jsdelivr.net/npm/bug-reporter-widget@1.0.1/dist/bug-reporter.min.js
https://cdn.jsdelivr.net/npm/bug-reporter-widget@latest/dist/bug-reporter.min.js
```

**Download Stats:**
```
https://www.npmjs.com/package/bug-reporter-widget
```

---

## Getting Help

- **NPM Docs**: https://docs.npmjs.com/
- **Semantic Versioning**: https://semver.org/
- **unpkg**: https://unpkg.com/
- **jsDelivr**: https://www.jsdelivr.com/

---

## Quick Reference

```bash
# First time
npm adduser
npm login

# Publishing
npm version patch/minor/major
npm publish

# Verify
npm view bug-reporter-widget
curl -I https://unpkg.com/bug-reporter-widget@latest/dist/bug-reporter.min.js

# Troubleshoot
npm publish --dry-run
npm pack
```
