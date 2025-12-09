# Test-Setup Scripts

Dieser Ordner enthält Scripts zum schnellen Anlegen von Test-Usern und Tenants für das Monshy-Projekt.

## Verwendung

### Windows (PowerShell)

```powershell
.\create-test-users.ps1
```

### Linux/Mac (Bash)

```bash
chmod +x create-test-users.sh
./create-test-users.sh
```

## Was wird erstellt?

1. **Tenant**: "TestTenant"
2. **Admin-User**: admin@test.com / admin123
3. **Test-User 1**: user1@test.com / user123
4. **Test-User 2**: user2@test.com / user123
5. **Manager-User**: manager@test.com / manager123

## Voraussetzungen

- Auth-Service muss laufen (Port 5244) oder Gateway (Port 5000)
- MongoDB muss erreichbar sein
- Services müssen gestartet sein

## Hinweis

Dieser Ordner kann nach dem Testen einfach gelöscht werden.

