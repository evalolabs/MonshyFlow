# 🚦 Rate Limiting - Documentation

## 📋 Overview

Kong Gateway implements rate limiting to protect the API from abuse and DDoS attacks.

## ⚙️ Current configuration

**Note:** The current limits are increased for E2E tests and development. For production they should be reduced.

### Public auth routes (login, register)
- **Limit:** 1000 requests per minute (increased for E2E tests, default would be 10)
- **Limit:** 10000 requests per hour (increased for E2E tests, default would be 100)
- **Based on:** IP address

### API routes (workflows, etc.)
- **Limit:** 1000 requests per minute (increased for E2E tests, default would be 100)
- **Limit:** 10000 requests per hour (increased for E2E tests, default would be 1000)
- **Based on:** IP address

### Secrets service routes
- **Limit:** 5000 requests per minute (very high for E2E tests)
- **Limit:** 50000 requests per hour (very high for E2E tests)
- **Based on:** IP address

## 🔴 Error: 429 Too Many Requests

### What does this mean?

The client has exceeded the rate limit. Kong blocks further requests for a certain period of time.

### What should the client do?

#### Option 1: Wait (recommended)
```
"Please wait 60 seconds and try again."
```

#### Option 2: Inspect rate limit headers
The response contains headers with information (sent automatically by Kong):
- `X-RateLimit-Limit-Minute`: Maximum number of requests per minute (e.g. 10)
- `X-RateLimit-Remaining-Minute`: Remaining requests per minute (e.g. 0)
- `X-RateLimit-Limit-Hour`: Maximum number of requests per hour (e.g. 100)
- `X-RateLimit-Remaining-Hour`: Remaining requests per hour (e.g. 96)
- `Retry-After`: Time in seconds until the next attempt (e.g. 141)

#### Option 3: Show error message
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Too many requests. Maximum 10 requests per minute allowed.",
  "retryAfter": 60
}
```

## 🛠️ Frontend implementation

### Example: Error handling

```typescript
// API client
async function login(email: string, password: string) {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (response.status === 429) {
      // Rate limit reached
      const retryAfter = response.headers.get('Retry-After') || '60';
      const remainingMinute = response.headers.get('X-RateLimit-Remaining-Minute') || '0';
      const limitMinute = response.headers.get('X-RateLimit-Limit-Minute') || '10';
      
      throw new Error(
        `Too many requests. Please wait ${retryAfter} seconds. ` +
        `Remaining: ${remainingMinute} of ${limitMinute} requests/minute.`
      );
    }

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return await response.json();
  } catch (error) {
    // Error handling
    console.error('Login error:', error);
    throw error;
  }
}
```

### Example: UI error message

```typescript
// React/Vue/etc.
if (error.message.includes('429') || error.message.includes('Rate limit')) {
  showError(
    'Too many requests',
    'Please wait a moment and try again. ' +
    'Maximum 1000 login attempts per minute allowed (development).'
  );
}
```

## 🔧 Adjusting rate limits

### Increase for development

In `kong/kong.yml`:

```yaml
- name: rate-limiting
  service: auth-service
  route: auth-login
  config:
    minute: 1000  # Increased for E2E tests (default: 10)
    hour: 10000   # Increased for E2E tests (default: 100)
```

Then restart Kong:
```bash
docker-compose restart kong
```

### For production

Rate limits should be stricter in production:
- **Login/Register:** 5-10 requests/minute (protect against brute-force)
- **API routes:** 100 requests/minute (normal traffic)
- **Secrets service:** 200 requests/minute (sensitive service)

**Currently:** Limits are increased for E2E tests. Before going to production, reduce them in `kong/kong.yml`.

## 📊 Monitoring

### Inspect rate limiting status

```bash
# Kong Admin API
curl http://localhost:8001/plugins | jq '.data[] | select(.name=="rate-limiting")'
```

### Inspect logs

```bash
# Rate limit violations in logs
docker-compose logs kong | grep "429"
```

## 🎯 Best practices

1. **User-friendly error messages**
   - Show a clear message: "Too many requests"
   - Show wait time: "Please wait 60 seconds"
   - Show a retry button (after the wait time)

2. **Use rate limit headers**
   - Show remaining requests in the UI
   - Show a countdown until reset

3. **Retry logic**
   - Automatic retry after `retryAfter` seconds
   - Exponential backoff on repeated 429 errors

4. **Development vs production**
   - Development: higher limits (20-50/minute)
   - Production: strict limits (5-10/minute for auth)

## 🔗 Further resources

- [Kong Rate Limiting Plugin](https://docs.konghq.com/hub/kong-inc/rate-limiting/)
- [HTTP 429 Status Code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)

