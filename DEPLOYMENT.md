# Deployment Guide - Production Checklist

## Pre-Deployment Security Checklist

- [ ] **Remove all hardcoded credentials from source code**
- [ ] **Verify `config.js` is in `.gitignore`**
- [ ] **Create `config.js` from `config.example.js`** with actual credentials
- [ ] **Test OAuth flow** with production redirect_uri
- [ ] **Enable HTTPS** on production domain
- [ ] **Set security headers** (CSP, X-Frame-Options, etc.)
- [ ] **Test rate limiting** - verify throttling works
- [ ] **Remove debug logging** - Set `enableDebugLogging: false`
- [ ] **Audit dependencies** - No vulnerabilities
- [ ] **Test token expiry** - 24-hour refresh works

---

## Deployment Options

### Option 1: Static Hosting (Netlify/Vercel)

**Best for**: Simple deployment, no backend needed

**Steps**:
```bash
# 1. Build (if using bundler)
npm run build  # Optional

# 2. Deploy to Netlify
netlify deploy --prod

# 3. Set environment variables in Netlify dashboard
UPSTOX_API_KEY=your-key
UPSTOX_API_SECRET=your-secret
UPSTOX_REDIRECT_URI=https://your-domain.com/callback
```

**Netlify Configuration** (`netlify.toml`):
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### Option 2: GitHub Pages

**Note**: Credentials must be client-side (less secure)

```bash
# 1. Create gh-pages branch
git checkout -b gh-pages

# 2. Commit production files (excluding config.js)
git add -A
git commit -m "Deploy to GitHub Pages"

# 3. Push
git push origin gh-pages

# 4. Enable in Settings → Pages
```

⚠️ **Security Concern**: GitHub Pages doesn't support environment variables, so credentials must be in `config.js` which is client-accessible.

### Option 3: Self-Hosted (VPS/Cloud)

**Best for**: Full control, custom domain

#### Using Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://unpkg.com https://cdn.jsdelivr.net; connect-src 'self' https://api.upstox.com;" always;
    
    root /var/www/upstox-console;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    location /api/ {
        limit_req zone=api burst=20;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

#### Deployment Steps

```bash
# 1. SSH to server
ssh user@your-server.com

# 2. Clone repository
git clone https://your-repo.git /var/www/upstox-console
cd /var/www/upstox-console

# 3. Create production config
cp config.example.js config.js
nano config.js  # Add credentials

# 4. Set permissions
chmod 600 config.js
chown www-data:www-data -R /var/www/upstox-console

# 5. Reload Nginx
sudo systemctl reload nginx
```

### Option 4: Docker Container

**Best for**: Isolated, reproducible deployments

```dockerfile
# Dockerfile
FROM nginx:alpine

# Copy application files
COPY . /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Security: Remove default config
RUN rm /etc/nginx/conf.d/default.conf.backup || true

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Build
docker build -t upstox-console .

# Run with environment variables
docker run -d \
  -p 443:443 \
  -e UPSTOX_API_KEY="your-key" \
  -e UPSTOX_API_SECRET="your-secret" \
  -e UPSTOX_REDIRECT_URI="https://your-domain.com/callback" \
  --name upstox-app \
  upstox-console
```

---

## Post-Deployment Testing

### 1. Security Audit

```bash
# Check for exposed secrets
grep -r "c4b13b67\|pfx2ui3ls6" /var/www/upstox-console/
# Should return NOTHING

# Verify config.js not publicly accessible
curl https://your-domain.com/config.js
# Should return 404 or be blocked

# Test CSP headers
curl -I https://your-domain.com
# Verify headers present
```

### 2. Functional Testing

- [ ] Homepage loads without errors
- [ ] Authentication redirects to Upstox
- [ ] Callback handles auth code correctly
- [ ] Token stored encrypted in sessionStorage
- [ ] Historical data fetches correctly
- [ ] Charts render with numerology markers
- [ ] CSV export/import works
- [ ] All 3 timeframes (4H, 1D, 1W) work in chart
- [ ] Error messages don't expose sensitive data

### 3. Performance Testing

```bash
# Load test
ab -n 1000 -c 10 https://your-domain.com/

# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com/
```

### 4. Browser Testing

Test in:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

---

## Environment Variable Configuration

### Development

```bash
# .env (git-ignored)
UPSTOX_API_KEY=dev-key-here
UPSTOX_API_SECRET=dev-secret-here
UPSTOX_REDIRECT_URI=http://localhost:8080/callback
```

### Staging

```bash
# .env.staging
UPSTOX_API_KEY=staging-key
UPSTOX_API_SECRET=staging-secret
UPSTOX_REDIRECT_URI=https://staging.your-domain.com/callback
```

### Production

```bash
# .env.production
UPSTOX_API_KEY=prod-key
UPSTOX_API_SECRET=prod-secret
UPSTOX_REDIRECT_URI=https://your-domain.com/callback
```

---

## Upstox Developer App Configuration

**Important**: Update redirect URI in Upstox dashboard

1. Visit: https://upstox.com/developer/apps
2. Select your app
3. Update **Redirect URL** to match deployment:
   - Local: `http://127.0.0.1:8080/callback`
   - Production: `https://your-domain.com/callback`
4. Save changes
5. Test OAuth flow

---

## Monitoring & Logging

### Set Up Monitoring

```javascript
// In production config.js
CONFIG.enableAnalytics = true;

// Send errors to monitoring service
window.addEventListener('error', (event) => {
    // Send to service (e.g., Sentry, LogRocket)
    if (window.analytics) {
        analytics.track('Error', {
            message: event.error.message,
            stack: event.error.stack  // Redact tokens!
        });
    }
});
```

### Recommended Tools

- **Sentry**: Error tracking
- **Google Analytics**: Usage analytics
- **Uptime Robot**: Uptime monitoring
- **Cloudflare**: CDN + DDoS protection

---

## SSL/TLS Certificate

### Let's Encrypt (Free)

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## Rollback Procedure

If deployment fails:

```bash
# 1. Revert to previous version
git checkout previous-stable-tag

# 2. Rebuild
npm run build

# 3. Redeploy
# (Use same deployment method)

# 4. Verify
curl https://your-domain.com
```

---

## Backup Strategy

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
tar -czf backup-$DATE.tar.gz /var/www/upstox-console
aws s3 cp backup-$DATE.tar.gz s3://your-bucket/backups/

# Cron job (daily at 2 AM)
0 2 * * * /path/to/backup.sh
```

---

## Compliance & Legal

- [ ] **Terms of Service**: Review Upstox API ToS
- [ ] **Data Privacy**: GDPR/CCPA compliance if storing user data
- [ ] **Rate Limits**: Stay within Upstox limits (3 req/s)
- [ ] **Attribution**: Credit Upstox if required
- [ ] **Usage Tracking**: Monitor API call volume

---

## Production Checklist Summary

**Before Launch**:
- ✅ All credentials in environment/config (not code)
- ✅ HTTPS enabled
- ✅ Security headers configured
- ✅ Rate limiting tested
- ✅ Error handling doesn't leak data
- ✅ Tokens encrypted in storage
- ✅ OAuth redirect URI updated in Upstox dashboard
- ✅ Dependencies audited for vulnerabilities
- ✅ Backup strategy in place
- ✅ Monitoring tools configured

**After Launch**:
- ✅ Test full OAuth flow in production
- ✅ Monitor error rates
- ✅ Check API usage against limits
- ✅ Verify SSL certificate validity
- ✅ Schedule regular security audits
- ✅ Document incident response plan

---

## Support & Maintenance

### Regular Tasks

- **Weekly**: Check error logs
- **Monthly**: Review API usage, rotate credentials
- **Quarterly**: Security audit, dependency updates
- **Yearly**: Review terms of service compliance

### Emergency Contacts

- Upstox Support: support@upstox.com
- Hosting Provider: [Your hosting support]
- Security Team: [Your security contact]

---

**Deployment Date**: _____________  
**Deployed By**: _____________  
**Version**: _____________  
**Next Review**: _____________

