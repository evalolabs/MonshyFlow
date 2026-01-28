# E2E Tests for Secrets Management

## 🏗️ Architecture

### Page Object Model Pattern
- **SecretsPage**: Encapsulates all interactions with the secrets page
- **WorkflowEditorPage**: Encapsulates workflow editor interactions
- **Test Utils**: Reusable helper functions

### Best Practices
1. **Test Isolation**: Each test runs in a separate browser context
2. **Cleanup**: Automatic cleanup of test data after each test
3. **Page Objects**: All page interactions are encapsulated in classes
4. **Retry Logic**: Automatic retries for flaky tests
5. **Screenshots/Videos**: Automatic capture on failures

## 🚀 Setup

### Installation
```bash
cd frontend
# Install dependencies (includes @playwright/test)
pnpm install

# Install Playwright browsers
pnpm exec playwright install
```

### Configuration
- `playwright.config.ts`: Main configuration
- `tests/helpers/`: Test utilities and page objects
- `tests/secrets/`: Secrets-specific tests

## 📝 Running Tests

### ⚠️ Before Running Tests

**Important:** Make sure the following services are running:

1. **Backend Services** (via Docker Compose or locally):
   - Kong Gateway (Port 5000)
   - Auth Service (Port 5244)
   - Secrets Service (Port 5004)
   - MongoDB (Port 27017)
   - Redis (Port 6379)
   - RabbitMQ (Port 5672)

2. **Frontend Dev Server** (optional):
   - Playwright starts the server automatically if it's not running
   - If already started, it will be reused (`reuseExistingServer: true`)

3. **Auth State** (optional):
   - If you want to test a fresh login, delete: `frontend/e2e/playwright/.auth/user.json`
   - Otherwise, the existing auth state will be reused

**Quick Check:**
```bash
# Check if backend is running
curl http://localhost:5000/health  # Kong Gateway
curl http://localhost:5244/health  # Auth Service (if directly accessible)

# Check if frontend is running
curl http://localhost:5173
```

### All Tests
```bash
cd frontend/e2e
pnpm exec playwright test
```

### Specific Test Suite
```bash
pnpm exec playwright test secrets-management
```

### In UI Mode (interactive)
```bash
pnpm exec playwright test --ui
```

### Debug Mode
```bash
pnpm exec playwright test --debug
```

## 🧪 Test Suites

### 1. Secrets Management (`secrets-management.spec.ts`)
- Create secret
- View secrets (tenant isolation)
- Edit secret
- Delete secret
- Search secrets

### 2. Workflow + Secrets Integration (`workflow-secrets-integration.spec.ts`)
- New tenant → add secret → configure node → run workflow
- Missing secret → user guided to create → returns to node → validation clears
- Default secret auto-detection
- Override secret functionality
- Deep-linking to create secret

### 3. Multi-Tenant Isolation (`multi-tenant-isolation.spec.ts`)
- Secrets are filtered by tenant
- Tenant badge is visible
- Cannot access secrets from other tenants

## 🔧 Test Utilities

### `test-utils.ts`
- `loginAsTestUser()`: Login helper
- `createTestSecret()`: Create secret
- `deleteTestSecret()`: Delete secret
- `cleanupTestSecrets()`: Bulk cleanup
- `waitForElement()`: Element waiting with retry
- `expectVisible()` / `expectText()`: Assertion helpers

### Page Objects
- **SecretsPage**: All secrets page interactions
- **WorkflowEditorPage**: Workflow editor interactions

## 🎯 CI/CD Integration

Tests can be integrated into CI/CD:

```yaml
# .github/workflows/e2e.yml
- name: Run E2E Tests
  run: |
    cd frontend
    pnpm exec playwright test
```

## 📊 Test Report

After running:
```bash
pnpm exec playwright show-report
```

## 🐛 Debugging

### Screenshots on Failures
Automatically saved in `test-results/`

### Videos on Failures
Automatically saved in `test-results/`

### Trace Viewer
```bash
pnpm exec playwright show-trace test-results/trace.zip
```

## 🧹 Cleanup Test Secrets

If test secrets remain after tests, you can clean them up manually:

```bash
cd frontend/e2e
pnpm cleanup
```

The script automatically deletes all secrets with the following prefixes:
- `test-`
- `OPENAI_API_KEY_`
- `DEEP_LINK_SECRET_`
- `PIPEDRIVE_API_KEY`

**Note:** Tests should automatically clean up (`afterEach`), but if tests fail or are interrupted, secrets may remain.

## 📋 Checklist

- [x] Playwright Setup
- [x] Page Object Model Pattern
- [x] Test Utilities
- [x] Secrets Management Tests
- [x] Workflow Integration Tests
- [x] Multi-Tenant Isolation Tests
- [ ] CI/CD Integration
- [ ] Performance Tests
- [ ] Visual Regression Tests



