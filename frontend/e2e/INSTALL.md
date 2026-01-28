# E2E Tests Installation

## 📦 Installation

### 1. Install Dependencies
```bash
cd frontend
pnpm install
```

This installs all dependencies including `@playwright/test` (already included in `package.json`).

### 2. Install Playwright Browsers
```bash
pnpm exec playwright install
```

Playwright automatically installs Chromium, Firefox, and WebKit.

### 3. Check Configuration
The configuration is already present in `playwright.config.ts`.

## 🚀 Getting Started

### Run Tests
```bash
# All tests
pnpm test:e2e

# In UI mode (recommended for development)
pnpm test:e2e:ui

# Debug mode
pnpm test:e2e:debug
```

### View Test Report
```bash
pnpm test:e2e:report
```

## ⚙️ Configuration

### Environment Variables
- `E2E_BASE_URL`: Base URL for tests (default: `http://localhost:5173`)
- `CI`: Automatically set in CI/CD

### Customization
Edit `playwright.config.ts` for:
- Different browsers
- Timeouts
- Retry logic
- Reporters

## 📝 Next Steps

1. Run tests: `pnpm test:e2e`
2. Write your own tests in `tests/secrets/`
3. Extend page objects in `tests/helpers/page-objects/`



