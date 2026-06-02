# Quick Testing Guide 🚀

## Before You Start

1. Install all dependencies:
```bash
npm install
```

2. Install Playwright browsers (only needed once):
```bash
npm run playwright:install
```

## Quick Test Commands

### ⚡ Quick Tests (Fast - Unit tests only)
```bash
npm run test:quick
# or
npm test
```
**Time: ~5 seconds** | **Tests: 31 unit tests**

### 🚀 Standard Tests (Recommended before deployment)
```bash
npm run test:all
```
**Time: ~30 seconds** | **Tests: 31 unit + 15 E2E (Chrome only)**

### 🌐 Full Cross-Browser Tests (Before production release)
```bash
npm run test:full
```
**Time: ~2 minutes** | **Tests: 31 unit + 75 E2E (all browsers)**

### E2E Tests Only
```bash
# Chrome only (fastest)
npm run test:e2e:chromium

# All browsers
npm run test:e2e
```

### Watch Mode (during development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Visual Testing (Playwright UI)

For interactive E2E test debugging:
```bash
npm run test:e2e:ui
```

## Pre-Deployment Quick Check

Run these commands in order:

1. **Lint & Build**
```bash
npm run lint
npm run build
```

2. **Run All Tests**
```bash
npm run test:all
```

3. **Manual Smoke Test**
   - Start dev server: `npm run dev`
   - Visit http://localhost:3000/login
   - Test login/register flows
   - Test core functionality

## Test Results

✅ **All tests passing?** → Ready for deployment!

❌ **Tests failing?** → Review [TESTING.md](./TESTING.md) for details

## Need Help?

- Full Testing Guide: [TESTING.md](./TESTING.md)
- Deployment Checklist: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- Project Documentation: [CLAUDE.md](./CLAUDE.md)
