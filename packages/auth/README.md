# 🔐 @monshy/auth

The **`@monshy/auth`** package provides authentication utilities for the MonshyFlow platform. It contains JWT token management, API key generation, and related helper functions.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Installation](#-installation)
- [API Documentation](#-api-documentation)
- [Usage Examples](#-usage-examples)
- [Environment Variables](#-environment-variables)
- [Dependencies](#-dependencies)
- [Development](#-development)

---

## 🎯 Overview

`@monshy/auth` is a **shared package (library)** that provides:

- **JWT Management:** Token generation, validation, and decoding
- **API Key Management:** Generation, hashing, and validation of API keys
- **Types:** TypeScript types for JWT payloads and API keys
- **Security:** Secure token and key handling

**Dependencies:**
- `@monshy/core` – base utilities
- `jsonwebtoken` – JWT handling
- `bcrypt` – password hashing (used in `auth-service`)

---

## 📦 Installation

The package is part of the monorepo and is installed automatically via workspaces:

```bash
# In the repository root
pnpm install
```

### Use in a service

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

## 📚 API Documentation

### JWT Functions

#### generateToken

Generates a JWT token with the given payload data.

```typescript
import { generateToken } from '@monshy/auth';

const token = generateToken({
  userId: '507f1f77bcf86cd799439011',
  tenantId: '507f191e810c19729de860ea',
  email: 'user@example.com',
  role: 'user'
});

// Token is automatically signed with the following claims:
// - issuer: JWT_ISSUER (default: 'monshy-auth-service')
// - audience: JWT_AUDIENCE (default: 'monshy-services')
// - expiresIn: '24h'
```

**Parameters:**
- `payload`: JWT payload (without `iat` and `exp`, they are added automatically)
  - `userId`: string – user ID
  - `tenantId`: string – tenant ID
  - `email`: string – user email
  - `role`: string – user role

**Returns:** `string` – JWT token

**Environment Variables:**
- `JWT_SECRET_KEY` or `JWT_SECRET` or `JwtSettings__SecretKey` – secret for signing
- `JWT_ISSUER` or `JwtSettings__Issuer` – token issuer (default: `monshy-auth-service`)
- `JWT_AUDIENCE` or `JwtSettings__Audience` – token audience (default: `monshy-services`)

---

#### verifyToken

Validates and decodes a JWT token.

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
  // Token is invalid or expired
  console.error('Invalid token:', (error as Error).message);
}
```

**Parameters:**
- `token`: string – JWT token

**Returns:** `JwtPayload` – decoded token payload

**Throws:** `Error` – if token is invalid, expired, or cannot be verified

**Validation:**
- Verifies signature with `JWT_SECRET`
- Verifies `issuer` (must match `JWT_ISSUER`)
- Verifies `audience` (must match `JWT_AUDIENCE`)
- Verifies `exp` (expiration)

---

#### decodeToken

Decodes a JWT token **without** validation (unsafe, for debugging only).

```typescript
import { decodeToken } from '@monshy/auth';

const payload = decodeToken(token);
// payload can be null if the token cannot be decoded
```

**Parameters:**
- `token`: string – JWT token

**Returns:** `JwtPayload | null` – decoded payload or null

**⚠️ Important:** This function does **NOT** validate the signature or expiration. Use only for debugging.

---

### API Key Functions

#### generateApiKey

Generates a secure API key.

```typescript
import { generateApiKey } from '@monshy/auth';

const apiKey = generateApiKey();
// Example: "mshy_abc123def456ghi789jkl012mno345pqr678"
```

**Returns:** `string` – API key with `mshy_` prefix

**Format:**
- Prefix: `mshy_`
- 32 random bytes, base64url-encoded
- Total length: ~45 characters

**Security:**
- Uses `crypto.randomBytes()` for cryptographically secure randomness
- Base64url encoding for URL safety

---

#### hashApiKey

Hashes an API key for secure storage.

```typescript
import { generateApiKey, hashApiKey } from '@monshy/auth';

const apiKey = generateApiKey();
const keyHash = hashApiKey(apiKey);

// Store keyHash in the database (NOT the API key itself!)
await apiKeyRepo.create({
  keyHash,
  name: 'Production API Key',
  tenantId: '507f191e810c19729de860ea'
});
```

**Parameters:**
- `apiKey`: string – plain API key

**Returns:** `string` – SHA-256 hash of the API key (hex)

**Security:**
- Uses SHA-256 hashing
- One-way hash (not reversible)
- Use for comparison with stored hash

**⚠️ Important:** The API key itself should **NEVER** be stored in the database, only the hash!

---

#### validateApiKeyFormat

Validates the format of an API key.

```typescript
import { validateApiKeyFormat } from '@monshy/auth';

if (validateApiKeyFormat(apiKey)) {
  // API key has correct format
} else {
  // API key format is invalid
}
```

**Parameters:**
- `apiKey`: string – API key to validate

**Returns:** `boolean` – true if format is valid

**Validation:**
- Must start with `mshy_`
- Must have at least 10 characters after the prefix

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
  iat: 1704112000,  // Issued At (automatically set)
  exp: 1704198400   // Expiration (automatically set)
};
```

**Properties:**
- `userId`: string – user ID
- `tenantId`: string – tenant ID
- `email`: string – user email
- `role`: string – user role
- `iat?`: number – issued at (timestamp, optional)
- `exp?`: number – expiration (timestamp, optional)

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
- `apiKeyId`: string – API key ID
- `tenantId`: string – tenant ID
- `name`: string – API key name
- `authMethod`: 'ApiKey' – authentication method

---

#### AuthRequest

Extended Express request with auth context.

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

## 💡 Usage Examples

### Generate and validate JWT token

```typescript
import { generateToken, verifyToken } from '@monshy/auth';

// Generate token (e.g., after login)
const token = generateToken({
  userId: user._id.toString(),
  tenantId: user.tenantId,
  email: user.email,
  role: user.roles[0] || 'user'
});

// Send token to client
res.json({ success: true, data: { token } });

// Validate token (e.g., in middleware)
try {
  const payload = verifyToken(token);
  req.user = payload; // Attach user info to request
  next();
} catch (error) {
  res.status(401).json({ success: false, error: 'Invalid token' });
}
```

### Create and validate API key

```typescript
import { generateApiKey, hashApiKey, validateApiKeyFormat } from '@monshy/auth';

// Create API key
const apiKey = generateApiKey();
const keyHash = hashApiKey(apiKey);

// Store in database
await apiKeyRepo.create({
  keyHash,  // Store only hash!
  name: 'Production API Key',
  tenantId: user.tenantId,
  expiresAt: new Date('2025-12-31')
});

// Send API key to client (only once!)
res.json({ success: true, data: { apiKey } });

// Validate API key (e.g., in middleware)
const providedKey = req.headers['x-api-key'] as string;

if (!validateApiKeyFormat(providedKey)) {
  return res.status(401).json({ success: false, error: 'Invalid API key format' });
}

const providedKeyHash = hashApiKey(providedKey);
const storedApiKey = await apiKeyRepo.findByKeyHash(providedKeyHash);

if (!storedApiKey || !storedApiKey.isActive) {
  return res.status(401).json({ success: false, error: 'Invalid API key' });
}

// API key is valid
req.auth = {
  tenantId: storedApiKey.tenantId,
  apiKeyId: storedApiKey._id.toString(),
  authMethod: 'ApiKey'
};
next();
```

### Authentication middleware

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

    // Attach user info to request
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

### Token refresh pattern

```typescript
import { verifyToken, generateToken, decodeToken } from '@monshy/auth';

function refreshTokenIfNeeded(token: string): string | null {
  // Check if token will expire soon (e.g., within 1 hour)
  const payload = decodeToken(token);

  if (!payload || !payload.exp) {
    return null;
  }

  const expiresIn = payload.exp * 1000 - Date.now();
  const oneHour = 60 * 60 * 1000;

  if (expiresIn < oneHour) {
    // Refresh token
    return generateToken({
      userId: payload.userId,
      tenantId: payload.tenantId,
      email: payload.email,
      role: payload.role
    });
  }

  return null; // Token is still valid
}
```

---

## 🔧 Environment Variables

### JWT Configuration

```bash
# JWT secret (AT LEAST 32 characters!)
JWT_SECRET_KEY=your-very-long-and-secure-jwt-secret-min-32-chars
# or
JWT_SECRET=your-very-long-and-secure-jwt-secret-min-32-chars
# or (for .NET compatibility)
JwtSettings__SecretKey=your-very-long-and-secure-jwt-secret-min-32-chars

# JWT Issuer (optional, default: 'monshy-auth-service')
JWT_ISSUER=monshy-auth-service
# or
JwtSettings__Issuer=monshy-auth-service

# JWT Audience (optional, default: 'monshy-services')
JWT_AUDIENCE=monshy-services
# or
JwtSettings__Audience=monshy-services
```

### ⚠️ Security Best Practices

1. **JWT Secret:**
   - At least 32 characters long
   - Randomly generated (e.g., `openssl rand -hex 32`)
   - Never commit to code
   - In production: use Azure Key Vault or similar

2. **API Keys:**
   - Store only the hash in the database
   - Show the API key only once (on creation)
   - Keys can be revoked
   - Optional: set expiration

---

## 📦 Dependencies

### Runtime Dependencies

- `@monshy/core` workspace:* – base utilities
- `jsonwebtoken` ^9.0.2 – JWT handling
- `bcrypt` ^5.1.1 – password hashing (used in `auth-service`)

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
│   ├── jwt/            # JWT functions
│   │   └── index.ts
│   ├── apiKey/         # API key functions
│   │   └── index.ts
│   ├── middleware/     # Auth middleware (currently empty)
│   │   └── index.ts
│   ├── types/          # TypeScript types
│   │   └── index.ts
│   └── index.ts        # Main export
├── dist/               # Compiled JavaScript
└── package.json
```

---

## 🔗 Further Information

- **Auth Service:** See [`../auth-service/README.md`](../auth-service/README.md)
- **Packages Overview:** See [`../README.md`](../README.md)
- **jsonwebtoken Documentation:** [github.com/auth0/node-jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)

---

## 📄 License

See root repository for license information.

