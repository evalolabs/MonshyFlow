# E2E Test Users

The E2E tests use the test users from the seed script (`seed/README.md`).

## Available Test Users

| Email | Password | Roles | Tenant |
|-------|----------|-------|--------|
| `admin@acme.com` | `admin123` | admin, user | Acme Corporation |
| `user@acme.com` | `user123` | user | Acme Corporation |
| `developer@techstart.io` | `dev123` | user, developer | TechStart Inc |
| `demo@demo.monshy.com` | `demo123` | user | Demo Company |

## Usage in Tests

### Standard (Admin User)
```typescript
await loginAsTestUser(page);
// Uses: admin@acme.com / admin123
```

### Specific Tenant
```typescript
await loginAsTestUser(page, undefined, undefined, 'acme');
// Uses: admin@acme.com / admin123

await loginAsTestUser(page, undefined, undefined, 'techstart');
// Uses: developer@techstart.io / dev123

await loginAsTestUser(page, undefined, undefined, 'demo');
// Uses: demo@demo.monshy.com / demo123
```

### Custom Credentials
```typescript
await loginAsTestUser(page, 'user@acme.com', 'user123');
// Uses: user@acme.com / user123
```

## Prerequisites

⚠️ **Important**: The test users must be created beforehand using the seed script:

```bash
pnpm --filter @monshy/seed seed
```

## Tenant-Specific Secrets

The seed data also includes secrets for various tenants:

- **Acme Corporation**: `OPENAI_API_KEY`
- **TechStart Inc**: `AZURE_API_KEY`
- **Demo Company**: `DATABASE_PASSWORD`

These can be used in tests to verify tenant isolation.



