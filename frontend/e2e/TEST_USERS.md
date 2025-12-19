# E2E Test Users

Die E2E-Tests verwenden die Test-User aus dem Seed-Script (`seed/README.md`).

## Verfügbare Test-User

| Email | Password | Roles | Tenant |
|-------|----------|-------|--------|
| `admin@acme.com` | `admin123` | admin, user | Acme Corporation |
| `user@acme.com` | `user123` | user | Acme Corporation |
| `developer@techstart.io` | `dev123` | user, developer | TechStart Inc |
| `demo@demo.monshy.com` | `demo123` | user | Demo Company |

## Verwendung in Tests

### Standard (Admin User)
```typescript
await loginAsTestUser(page);
// Verwendet: admin@acme.com / admin123
```

### Spezifischer Tenant
```typescript
await loginAsTestUser(page, undefined, undefined, 'acme');
// Verwendet: admin@acme.com / admin123

await loginAsTestUser(page, undefined, undefined, 'techstart');
// Verwendet: developer@techstart.io / dev123

await loginAsTestUser(page, undefined, undefined, 'demo');
// Verwendet: demo@demo.monshy.com / demo123
```

### Benutzerdefinierte Credentials
```typescript
await loginAsTestUser(page, 'user@acme.com', 'user123');
// Verwendet: user@acme.com / user123
```

## Voraussetzungen

⚠️ **Wichtig**: Die Test-User müssen vorher mit dem Seed-Script erstellt werden:

```bash
pnpm --filter @monshy/seed seed
```

## Tenant-spezifische Secrets

Die Seed-Daten enthalten auch Secrets für verschiedene Tenants:

- **Acme Corporation**: `OPENAI_API_KEY`
- **TechStart Inc**: `AZURE_API_KEY`
- **Demo Company**: `DATABASE_PASSWORD`

Diese können in Tests verwendet werden, um Tenant-Isolation zu testen.




