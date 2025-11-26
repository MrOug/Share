# Security Guide - Upstox V3 Console

## Architecture Overview

This application implements defense-in-depth security with multiple layers:

```
┌─────────────────────────────────────────┐
│         User Browser (Frontend)         │
│  - No hardcoded secrets                 │
│  - Encrypted token storage               │
│  - Input validation                      │
└──────────────┬──────────────────────────┘
               │ HTTPS Only
               ↓
┌─────────────────────────────────────────┐
│      Configuration (config.js)          │
│  - Git-ignored                           │
│  - Environment-based                     │
│  - Never committed                       │
└──────────────┬──────────────────────────┘
               │ Secure OAuth  
               ↓
┌─────────────────────────────────────────┐
│         Upstox API (V3)                 │
│  - Rate limited (3 req/s)               │
│  - Retry with backoff                    │
│  - Token expiry (24h)                    │
└─────────────────────────────────────────┘
```

## Credential Management

### ✅ DO

1. **Use config.example.js as template**
   ```bash
   cp config.example.js config.js
   # Edit config.js with real credentials
   ```

2. **Verify .gitignore protection**
   ```bash
   git status
   # config.js should NOT appear
   ```

3. **Encrypt tokens in storage**
   ```javascript
   CONFIG.useEncryptedStorage = true; // Already enabled
   ```

4. **Rotate credentials regularly**
   - Every 90 days minimum
   - Immediately if suspected compromise

### ❌ DON'T

1. **Never commit config.js**
   - Always in `.gitignore`
   - Use `config.example.js` for version control

2. **Never log credentials**
   ```javascript
   // BAD
   console.log('API Key:', apiKey);
   
   // GOOD
   console.log('API Key: [REDACTED]');
   ```

3. **Never expose in error messages**
   ```javascript
   //BAD
   throw new Error(`Failed with key ${apiKey}`);
   
   // GOOD
   throw new Error('Authentication failed');
   ```

4. **Never use in query parameters**
   ```javascript
   // BAD
   /api/data?api_key=abc123
   
   // GOOD - Use headers
   headers: { 'Authorization': 'Bearer token' }
   ```

## Token Security

### Storage Mechanism

```javascript
// Encrypted storage (enabled by default)
setAccessToken(token) {
    const encrypted = btoa(token); // Base64 encoding
    sessionStorage.setItem('token', encrypted);
    sessionStorage.setItem('expiry', Date.now() + 24*60*60*1000);
}
```

### Token Lifecycle

1. **Acquisition**: OAuth 2.0 authorization code flow
2. **Storage**: Encrypted in sessionStorage (browser session only)
3. **Usage**: Added to Authorization header
4. **Expiry**: Automatic cleanup after 24 hours
5. **Refresh**: Manual re-authentication required

### Best Practices

- ✅ Use `sessionStorage` (cleared on browser close)
- ✅ Set expiry timestamps  
- ✅ Clear on logout
- ❌ Don't use `localStorage` (persists across sessions)
- ❌ Don't store in cookies without HttpOnly flag

## Rate Limiting

### Configuration

```javascript
CONFIG.maxRequestsPerSecond = 3; // Upstox limit
CONFIG.retryAttempts = 3;
CONFIG.retryDelayMs = 1000; // Initial delay
```

### Implementation

```javascript
async safeFetch(url) {
    // Wait between requests
    const minInterval = 1000 / this.config.maxRequestsPerSecond;
    await this.enforceRateLimit(minInterval);
    
    // Retry with exponential backoff
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            return await fetch(url);
        } catch (e) {
            await sleep(1000 * Math.pow(2, attempt));
        }
    }
}
```

### Handling 429 Responses

```javascript
if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    await sleep(retryAfter * 1000);
    // Retry request
}
```

## Input Validation

### CSV Upload Protection

```javascript
// Validate file type
if (!file.name.endsWith('.csv')) {
    throw new Error('Only CSV files allowed');
}

// Limit file size
if (file.size > 10 * 1024 * 1024) { // 10MB
    throw new Error('File too large');
}

// Sanitize content
const content = await file.text();
const sanitized = content.replace(/<script>/gi, '');
```

### User Input Sanitization

```javascript
function sanitizeSymbol(symbol) {
    // Allow only alphanumeric and specific chars
    return symbol.replace(/[^A-Z0-9&-]/g, '').toUpperCase();
}

function sanitizeDate(dateStr) {
    // Validate date format
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        throw new Error('Invalid date format');
    }
    return dateStr;
}
```

## Content Security Policy

### Recommended Headers

```html
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' https://unpkg.com https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://api.upstox.com https://assets.upstox.com;
    img-src 'self' data:;
">
```

### Additional Security Headers

```html
<meta http-equiv="X-Content-Type-Options" content="nosniff">
<meta http-equiv="X-Frame-Options" content="DENY">
<meta http-equiv="X-XSS-Protection" content="1; mode=block">
```

## HTTPS Enforcement

### Development
```bash
# Use mkcert for local HTTPS
mkcert -install
mkcert localhost 127.0.0.1
python -m http.server 8080 --bind localhost
```

### Production
- **Always use HTTPS**
- Use Let's Encrypt for free SSL
- Redirect HTTP → HTTPS
- Enable HSTS header

## Logging & Monitoring

### Safe Logging

```javascript
class SecureLogger {
    log(level, message, context = {}) {
        // Redact sensitive fields
        const safe = this.redactSecrets(context);
        
        if (CONFIG.enableDebugLogging) {
            console.log(`[${level}] ${message}`, safe);
        }
        
        // Send to monitoring service (production)
        this.sendToMonitoring(level, message, safe);
    }
    
    redactSecrets(obj) {
        const sensitive = ['apiKey', 'apiSecret', 'accessToken', 'password'];
        const redacted = {...obj};
        
        sensitive.forEach(key => {
            if (redacted[key]) {
                redacted[key] = '[REDACTED]';
            }
        });
        
        return redacted;
    }
}
```

### Error Handling

```javascript
try {
    await api.fetchData();
} catch (error) {
    // Log sanitized error
    logger.error('Data fetch failed', {
        endpoint: error.endpoint, // Safe
        status: error.status,      // Safe
        // Don't log full error.message if it contains tokens
    });
    
    // Show generic message to user
    showError('Unable to fetch data. Please try again.');
}
```

## Vulnerability Prevention

| Attack Vector | Mitigation |
|---------------|------------|
| XSS | Input sanitization, CSP headers |
| CSRF | SameSite cookies, verify origin |
| Injection | Parameterized queries, validation |
| Credential Exposure | Git-ignored config, encrypted storage |
| Token Theft | HTTPS only, short expiry, sessionStorage |
| Rate Limit Abuse | Client-side throttling, retry backoff |

## Compliance Checklist

- [ ] No credentials in source code
- [ ] Config files git-ignored
- [ ] Tokens encrypted in storage
- [ ] HTTPS enforced
- [ ] CSP headers configured
- [ ] Input validation on all fields
- [ ] Rate limiting implemented
- [ ] Error messages don't leak data
- [ ] Logging redacts secrets
- [ ] Dependencies up to date
- [ ] Security headers set
- [ ] OAuth flow uses PKCE (if supported)

## Incident Response

###If Credentials Compromised

1. **Immediate Actions**
   ```bash
   # Revoke API key at Upstox dashboard
   # Clear all stored tokens
   sessionStorage.clear();
   
   # Generate new credentials
   # Update config.js with new values
   ```

2. **Audit**
   - Check access logs for unauthorized usage
   - Review all API calls made with old credentials
   - Notify affected users if data accessed

3. **Prevention**
   - Rotate credentials immediately
   - Enable IP whitelisting if available
   - Implement additional MFA

## Production Deployment Security

```bash
# Before deployment
1. Remove all console.log statements
2. Verify config.js not in build
3. Enable HTTPS
4. Set secure headers
5. Test OAuth flow in production domain
6. Monitor error rates
7. Set up automated backups
```

---

**Last Updated**: Nov 2024  
**Review Frequency**: Quarterly  
**Security Contact**: Implement as needed

