# 🔐 @monshy/auth

Das **@monshy/auth** Package bietet Authentifizierungs-Utilities für die MonshyFlow-Plattform. Es enthält JWT-Token-Management, API-Key-Generierung und verwandte Hilfsfunktionen.

---

## 📋 Inhaltsverzeichnis

- [Übersicht](#-übersicht)
- [Installation](#-installation)
- [API-Dokumentation](#-api-dokumentation)
- [Verwendungsbeispiele](#-verwendungsbeispiele)
- [Environment Variables](#-environment-variables)
- [Dependencies](#-dependencies)
- [Development](#-development)

---

## 🎯 Übersicht

`@monshy/auth` ist ein **Shared Package** (Library), das folgende Funktionalitäten bereitstellt:

- **JWT Management:** Token-Generierung, -Validierung und -Dekodierung
- **API Key Management:** Generierung, Hashing und Validierung von API Keys
- **Types:** TypeScript-Typen für JWT Payloads und API Keys
- **Security:** Sichere Token- und Key-Verarbeitung

**Dependencies:**
- `@monshy/core` - Basis-Utilities
- `jsonwebtoken` - JWT Handling
- `bcrypt` - Password Hashing (wird in auth-service verwendet)

---

## 📦 Installation

Das Package ist Teil des Monorepos und wird automatisch über Workspaces installiert:

```bash
# Im Root-Verzeichnis
pnpm install
```

### In einem Service verwenden

```json
{
  "dependencies": {
    "@monshy/auth": "workspace:*"
  }
}
```

```typescript
import { generateToken, verifyToken } from '@monshy/auth';
import { generateApiKey, hashApiKey } from '@monshy/auth';
```

---

## 📚 API-Dokumentation

### JWT Functions

#### generateToken

Generiert ein JWT Token mit den angegebenen Payload-Daten.

```typescript
import { generateToken } from '@monshy/auth';

const token = generateToken({
  userId: '507f1f77bcf86cd799439011',
  tenantId: '507f191e810c19729de860ea',
  email: 'user@example.com',
  role: 'user'
});

// Token wird automatisch mit folgenden Claims signiert:
// - issuer: JWT_ISSUER (Standard: 'monshy-auth-service')
// - audience: JWT_AUDIENCE (Standard: 'monshy-services')
// - expiresIn: '24h'
```

**Parameter:**
- `payload`: JWT Payload (ohne `iat` und `exp`, werden automatisch hinzugefügt)
  - `userId`: string - User ID
  - `tenantId`: string - Tenant ID
  - `email`: string - User Email
  - `role`: string - User Role

**Returns:** `string` - JWT Token

**Environment Variables:**
- `JWT_SECRET_KEY` oder `JWT_SECRET` oder `JwtSettings__SecretKey` - Secret für Signing
- `JWT_ISSUER` oder `JwtSettings__Issuer` - Token Issuer (Standard: 'monshy-auth-service')
- `JWT_AUDIENCE` oder `JwtSettings__Audience` - Token Audience (Standard: 'monshy-services')

---

#### verifyToken

Validiert und dekodiert ein JWT Token.

```typescript
import { verifyToken } from '@monshy/auth';

try {
  const payload = verifyToken(token);
  // payload: {
  //   userId: '507f1f77bcf86cd799439011',
  //   tenantId: '507f191e810c19729de860ea',
  //   email: 'user@example.com',
  //   role: 'user',
  //   iat: 1704112000,
  //   exp: 1704198400
  // }
} catch (error) {
  // Token ist ungültig oder abgelaufen
  console.error('Invalid token:', error.message);
}
```

**Parameter:**
- `token`: string - JWT Token

**Returns:** `JwtPayload` - Dekodierter Token Payload

**Throws:** `Error` - Wenn Token ungültig, abgelaufen oder nicht verifizierbar ist

**Validierung:**
- Prüft Signatur mit `JWT_SECRET`
- Prüft `issuer` (muss mit `JWT_ISSUER` übereinstimmen)
- Prüft `audience` (muss mit `JWT_AUDIENCE` übereinstimmen)
- Prüft `exp` (Expiration)

---

#### decodeToken

Dekodiert ein JWT Token ohne Validierung (unsicher, nur für Debugging).

```typescript
import { decodeToken } from '@monshy/auth';

const payload = decodeToken(token);
// payload kann null sein, wenn Token nicht dekodierbar ist
```

**Parameter:**
- `token`: string - JWT Token

**Returns:** `JwtPayload | null` - Dekodierter Payload oder null

**⚠️ Wichtig:** Diese Funktion validiert **NICHT** die Signatur oder Expiration. Nur für Debugging verwenden!

---

### API Key Functions

#### generateApiKey

Generiert einen sicheren API Key.

```typescript
import { generateApiKey } from '@monshy/auth';

const apiKey = generateApiKey();
// Beispiel: "mshy_abc123def456ghi789jkl012mno345pqr678"
```

**Returns:** `string` - API Key mit Prefix `mshy_`

**Format:**
- Prefix: `mshy_`
- 32 zufällige Bytes, base64url-kodiert
- Gesamtlänge: ~45 Zeichen

**Security:**
- Verwendet `crypto.randomBytes()` für kryptographisch sichere Zufallswerte
- Base64url-Kodierung für URL-Sicherheit

---

#### hashApiKey

Hasht einen API Key für sichere Speicherung.

```typescript
import { generateApiKey, hashApiKey } from '@monshy/auth';

const apiKey = generateApiKey();
const keyHash = hashApiKey(apiKey);

// Speichere keyHash in Datenbank (NICHT den API Key selbst!)
await apiKeyRepo.create({
  keyHash,
  name: 'Production API Key',
  tenantId: '507f191e810c19729de860ea'
});
```

**Parameter:**
- `apiKey`: string - Plain API Key

**Returns:** `string` - SHA-256 Hash des API Keys (hex)

**Security:**
- Verwendet SHA-256 Hashing
- Einweg-Hash (nicht umkehrbar)
- Für Vergleich mit gespeichertem Hash verwenden

**⚠️ Wichtig:** Der API Key selbst sollte **NIE** in der Datenbank gespeichert werden, nur der Hash!

---

#### validateApiKeyFormat

Validiert das Format eines API Keys.

```typescript
import { validateApiKeyFormat } from '@monshy/auth';

if (validateApiKeyFormat(apiKey)) {
  // API Key hat korrektes Format
} else {
  // API Key Format ist ungültig
}
```

**Parameter:**
- `apiKey`: string - API Key zum Validieren

**Returns:** `boolean` - true wenn Format gültig ist

**Validierung:**
- Muss mit `mshy_` beginnen
- Muss mindestens 10 Zeichen nach dem Prefix haben

---

### Types

#### JwtPayload

```typescript
import { JwtPayload } from '@monshy/auth';

const payload: JwtPayload = {
  userId: '507f1f77bcf86cd799439011',
  tenantId: '507f191e810c19729de860ea',
  email: 'user@example.com',
  role: 'user',
  iat: 1704112000,  // Issued At (automatisch)
  exp: 1704198400   // Expiration (automatisch)
};
```

**Properties:**
- `userId`: string - User ID
- `tenantId`: string - Tenant ID
- `email`: string - User Email
- `role`: string - User Role
- `iat?`: number - Issued At (Timestamp, optional)
- `exp?`: number - Expiration (Timestamp, optional)

---

#### ApiKeyPayload

```typescript
import { ApiKeyPayload } from '@monshy/auth';

const payload: ApiKeyPayload = {
  apiKeyId: '507f1f77bcf86cd799439012',
  tenantId: '507f191e810c19729de860ea',
  name: 'Production API Key',
  authMethod: 'ApiKey'
};
```

**Properties:**
- `apiKeyId`: string - API Key ID
- `tenantId`: string - Tenant ID
- `name`: string - API Key Name
- `authMethod`: 'ApiKey' - Authentication Method

---

#### AuthRequest

Erweiterte Express Request mit Auth Context.

```typescript
import { AuthRequest } from '@monshy/auth';
import { AuthContext } from '@monshy/core';

app.get('/api/protected', (req: AuthRequest, res) => {
  if (req.auth) {
    const { tenantId, userId, userRole } = req.auth;
    // ...
  }
});
```

---

## 💡 Verwendungsbeispiele

### JWT Token generieren und validieren

```typescript
import { generateToken, verifyToken } from '@monshy/auth';

// Token generieren (z.B. nach Login)
const token = generateToken({
  userId: user._id.toString(),
  tenantId: user.tenantId,
  email: user.email,
  role: user.roles[0] || 'user'
});

// Token an Client senden
res.json({ success: true, data: { token } });

// Token validieren (z.B. in Middleware)
try {
  const payload = verifyToken(token);
  req.user = payload; // User-Info zu Request hinzufügen
  next();
} catch (error) {
  res.status(401).json({ success: false, error: 'Invalid token' });
}
```

### API Key erstellen und validieren

```typescript
import { generateApiKey, hashApiKey, validateApiKeyFormat } from '@monshy/auth';

// API Key erstellen
const apiKey = generateApiKey();
const keyHash = hashApiKey(apiKey);

// In Datenbank speichern
await apiKeyRepo.create({
  keyHash,  // Nur Hash speichern!
  name: 'Production API Key',
  tenantId: user.tenantId,
  expiresAt: new Date('2025-12-31')
});

// API Key an Client senden (nur einmal!)
res.json({ success: true, data: { apiKey } });

// API Key validieren (z.B. in Middleware)
const providedKey = req.headers['x-api-key'] as string;

if (!validateApiKeyFormat(providedKey)) {
  return res.status(401).json({ success: false, error: 'Invalid API key format' });
}

const providedKeyHash = hashApiKey(providedKey);
const storedApiKey = await apiKeyRepo.findByKeyHash(providedKeyHash);

if (!storedApiKey || !storedApiKey.isActive) {
  return res.status(401).json({ success: false, error: 'Invalid API key' });
}

// API Key ist gültig
req.auth = {
  tenantId: storedApiKey.tenantId,
  apiKeyId: storedApiKey._id.toString(),
  authMethod: 'ApiKey'
};
next();
```

### Authentication Middleware

```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@monshy/auth';
import { UnauthorizedError } from '@monshy/core';

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid Authorization header');
    }
    
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    // User-Info zu Request hinzufügen
    (req as any).user = payload;
    
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unauthorized'
    });
  }
}
```

### Token Refresh Pattern

```typescript
import { verifyToken, generateToken, decodeToken } from '@monshy/auth';

function refreshTokenIfNeeded(token: string): string | null {
  // Prüfe ob Token bald abläuft (z.B. in 1 Stunde)
  const payload = decodeToken(token);
  
  if (!payload || !payload.exp) {
    return null;
  }
  
  const expiresIn = payload.exp * 1000 - Date.now();
  const oneHour = 60 * 60 * 1000;
  
  if (expiresIn < oneHour) {
    // Token erneuern
    return generateToken({
      userId: payload.userId,
      tenantId: payload.tenantId,
      email: payload.email,
      role: payload.role
    });
  }
  
  return null; // Token ist noch gültig
}
```

---

## 🔧 Environment Variables

### JWT Configuration

```bash
# JWT Secret (MINDESTENS 32 Zeichen!)
JWT_SECRET_KEY=your-very-long-and-secure-jwt-secret-min-32-chars
# oder
JWT_SECRET=your-very-long-and-secure-jwt-secret-min-32-chars
# oder (für .NET Kompatibilität)
JwtSettings__SecretKey=your-very-long-and-secure-jwt-secret-min-32-chars

# JWT Issuer (optional, Standard: 'monshy-auth-service')
JWT_ISSUER=monshy-auth-service
# oder
JwtSettings__Issuer=monshy-auth-service

# JWT Audience (optional, Standard: 'monshy-services')
JWT_AUDIENCE=monshy-services
# oder
JwtSettings__Audience=monshy-services
```

### ⚠️ Security Best Practices

1. **JWT Secret:**
   - Mindestens 32 Zeichen lang
   - Zufällig generiert (z.B. `openssl rand -hex 32`)
   - Nie im Code committen
   - In Production: Azure Key Vault oder ähnliches verwenden

2. **API Keys:**
   - Nur Hash in Datenbank speichern
   - API Key nur einmal anzeigen (bei Erstellung)
   - Keys können revokiert werden
   - Optional: Expiration setzen

---

## 📦 Dependencies

### Runtime Dependencies

- `@monshy/core` workspace:* - Basis-Utilities
- `jsonwebtoken` ^9.0.2 - JWT Handling
- `bcrypt` ^5.1.1 - Password Hashing (wird in auth-service verwendet)

### Dev Dependencies

- `typescript` ^5.9.3
- `@types/node` ^24.7.1
- `@types/jsonwebtoken` ^9.0.7
- `@types/bcrypt` ^5.0.2

---

## 🛠️ Development

### Build

```bash
cd packages/auth
pnpm build
```

### Watch Mode

```bash
cd packages/auth
pnpm dev
```

### Clean

```bash
cd packages/auth
pnpm clean
```

### Code Structure

```
auth/
├── src/
│   ├── jwt/            # JWT Functions
│   │   └── index.ts
│   ├── apiKey/         # API Key Functions
│   │   └── index.ts
│   ├── middleware/     # Auth Middleware (zur Zeit leer)
│   │   └── index.ts
│   ├── types/          # TypeScript Types
│   │   └── index.ts
│   └── index.ts        # Main Export
├── dist/               # Compiled JavaScript
└── package.json
```

---

## 🔗 Weitere Informationen

- **Auth Service:** Siehe [`../auth-service/README.md`](../auth-service/README.md)
- **Packages Overview:** Siehe [`../README.md`](../README.md)
- **jsonwebtoken Documentation:** [github.com/auth0/node-jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)

---

## 📄 Lizenz

Siehe Root-Repository für Lizenzinformationen.

