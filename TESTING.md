# Testing Guide for Trade Nest

This document outlines the testing strategy and QA procedures for the Trade Nest gift card exchange platform before production deployment.

## Table of Contents
- [Test Setup](#test-setup)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Test Types](#test-types)

## Test Setup

### Initial Setup

1. **Install Dependencies**
```bash
npm install
```

2. **Install Playwright Browsers** (for E2E tests)
```bash
npm run playwright:install
```

3. **Set Up Test Environment**
Create a `.env.test` file with test database credentials:
```env
DATABASE_URL="postgresql://test:test@localhost:5432/test_db"
NEXTAUTH_SECRET="test-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## Running Tests

### Unit & Integration Tests

```bash
# Run all unit/integration tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### End-to-End Tests

```bash
# Run E2E tests (headless)
npm run test:e2e

# Run E2E tests with UI (interactive)
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed
```

### Run All Tests

```bash
npm run test:all
```

## Test Coverage

### Current Test Coverage Areas

#### 1. Authentication (`src/__tests__/api/auth.test.ts`)
- ✅ User registration validation
- ✅ Email format validation
- ✅ Password strength validation
- ✅ Name length validation
- ✅ Login validation

#### 2. Submissions (`src/__tests__/api/submissions.test.ts`)
- ✅ Submission field validation
- ✅ Denomination validation
- ✅ Card code format validation
- ✅ Status flow validation
- ✅ Payout calculation accuracy

#### 3. Form Validation (`src/__tests__/components/validation.test.ts`)
- ✅ Email format validation
- ✅ Phone number validation
- ✅ Password validation
- ✅ Name validation
- ✅ Currency amount validation

#### 4. UI Components (`src/__tests__/components/LoginForm.test.tsx`)
- ✅ Login form rendering
- ✅ Form field presence
- ✅ Brand footer rendering

#### 5. E2E Authentication (`tests/e2e/auth.spec.ts`)
- ✅ Login page display
- ✅ Registration page display
- ✅ Navigation between pages
- ✅ Form validation errors
- ✅ Responsive design
- ✅ Brand identity

#### 6. E2E Navigation (`tests/e2e/navigation.spec.ts`)
- ✅ Page load without errors
- ✅ Performance (page load time)
- ✅ Accessibility (labels, keyboard navigation)
- ✅ Security (password masking, headers)

### Coverage Thresholds

Current minimum coverage requirements:
- **Branches**: 50%
- **Functions**: 50%
- **Lines**: 50%
- **Statements**: 50%

## Pre-Deployment Checklist

### 1. Run Complete Test Suite
```bash
npm run test:all
```

### 2. Code Quality Checks
```bash
npm run lint
npm run build
```

### 3. Manual Testing Checklist

#### Authentication Flow
- [ ] User can register with valid credentials
- [ ] Registration rejects invalid email
- [ ] Registration rejects weak password
- [ ] Email verification OTP is sent
- [ ] User can login with correct credentials
- [ ] Login fails with incorrect credentials
- [ ] User is redirected correctly based on role (SELLER → /seller/dashboard, ADMIN → /admin/dashboard)

#### Seller Flow
- [ ] Seller can view dashboard
- [ ] Seller can submit a gift card
- [ ] Image upload works correctly
- [ ] Payout estimate calculates correctly
- [ ] Seller can view submission history
- [ ] Status filters work correctly
- [ ] Seller can send messages to admin
- [ ] Seller receives admin reply notifications

#### Admin Flow
- [ ] Admin can view all submissions
- [ ] Admin can filter by status
- [ ] Admin can review submissions
- [ ] Admin can approve/reject submissions
- [ ] Admin can mark as paid
- [ ] Admin can add admin notes
- [ ] Admin can manage exchange rates
- [ ] Admin can reply to seller messages
- [ ] Admin sees unread message badges

#### UI/UX Testing
- [ ] Logo displays correctly everywhere
- [ ] Favicon loads correctly
- [ ] Brand name "Trade Nest" appears correctly
- [ ] Mobile responsive design works
- [ ] All forms have proper validation
- [ ] Error messages are clear
- [ ] Success messages appear
- [ ] Loading states work correctly

#### Security Testing
- [ ] Passwords are hashed (not stored in plain text)
- [ ] API routes check authentication
- [ ] Role-based access control works
- [ ] CSRF protection is enabled
- [ ] SQL injection prevention (using Prisma)
- [ ] XSS prevention (React escapes by default)

#### Performance Testing
- [ ] Pages load within 3 seconds
- [ ] Images are optimized
- [ ] No console errors in browser
- [ ] Database queries are efficient
- [ ] API responses are fast (<500ms)

#### Email Testing
- [ ] OTP emails are sent correctly
- [ ] Email templates display properly
- [ ] Logo appears in emails
- [ ] Links in emails work
- [ ] Message notification emails work

### 4. Browser Compatibility Testing

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

### 5. Environment Variables Check

Ensure all required environment variables are set in production:
```env
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
APP_URL
EMAIL_SERVER_HOST
EMAIL_SERVER_PORT
EMAIL_SERVER_USER
EMAIL_SERVER_PASSWORD
EMAIL_FROM
```

### 6. Database Migrations

```bash
# Run migrations on production database
npx prisma migrate deploy

# Seed initial data if needed
npx prisma db seed
```

### 7. Performance Optimization

- [ ] Run Lighthouse audit (target score > 90)
- [ ] Check bundle size
- [ ] Verify image optimization
- [ ] Enable compression
- [ ] Set up CDN for static assets

### 8. Security Hardening

- [ ] Enable HTTPS only
- [ ] Set security headers (CSP, HSTS, etc.)
- [ ] Rate limiting on API routes
- [ ] Input sanitization
- [ ] Disable debug mode in production

## Test Types

### Unit Tests
Test individual functions and components in isolation.
- Location: `src/__tests__/`
- Framework: Jest + React Testing Library

### Integration Tests
Test how different parts of the app work together.
- Location: `src/__tests__/api/`
- Framework: Jest

### End-to-End Tests
Test complete user workflows from start to finish.
- Location: `tests/e2e/`
- Framework: Playwright

## Continuous Integration

For CI/CD pipelines, run:
```bash
npm run test:coverage && npm run test:e2e
```

## Debugging Tests

### Debug Unit Tests
```bash
# Run specific test file
npm test -- auth.test.ts

# Run with verbose output
npm test -- --verbose
```

### Debug E2E Tests
```bash
# Run with UI for debugging
npm run test:e2e:ui

# Run specific test file
npx playwright test auth.spec.ts
```

## Reporting Issues

When a test fails:
1. Note the test name and file
2. Check the error message
3. Review recent code changes
4. Check environment variables
5. Verify database connection
6. Review the test logs

## Next Steps After Testing

1. ✅ All tests pass
2. ✅ Manual testing completed
3. ✅ Browser compatibility confirmed
4. ✅ Performance benchmarks met
5. ✅ Security audit completed
6. 🚀 Ready for production deployment

---

**Last Updated**: June 2026
**Maintained By**: Development Team
