# Upstox V3 Console - Production Ready

Enterprise-grade stock analysis console with Upstox V3 API integration, numerology calculations, and advanced charting capabilities.

## 🔒 Security Features

✅ **No hardcoded credentials** - All secrets in configuration files  
✅ **Encrypted token storage** - Secure session management  
✅ **Rate limiting** - Automatic request throttling  
✅ **Retry logic** - Exponential backoff for failed requests  
✅ **CSP headers** - Content Security Policy protection  
✅ **Input validation** - Sanitization of all user inputs  

## 🚀 Quick Start

### 1. Get Upstox API Credentials

1. Visit [Upstox Developer Portal](https://upstox.com/developer/apps)
2. Create a new app
3. Note down your **API Key** and **API Secret**
4. Set redirect URI to `http://127.0.0.1:8080/callback`

### 2. Configure Application

```bash
# Copy example config
cp config.example.js config.js

# Edit config.js and add your credentials
# NEVER commit config.js to git!
```

Edit `config.js`:
```javascript
const CONFIG = {
    apiKey: 'your-actual-api-key',
    apiSecret: 'your-actual-api-secret',
    redirectUri: 'http://127.0.0.1:8080/callback',
    // ... rest of config
};
```

### 3. Run Application

#### Option A: Simple HTTP Server (Python)
```bash
python -m http.server 8080
```

#### Option B: Node.js HTTP Server
```bash
npx http-server -p 8080
```

#### Option C: VS Code Live Server
1. Install "Live Server" extension
2. Right-click `index.html` → "Open with Live Server"

### 4. Open in Browser

Navigate to: `http://127.0.0.1:8080`

## 📁 Project Structure

```
upstox-production/
├── index.html              # Main application (NO SECRETS)
├── config.example.js       # Template configuration
├── config.js               # Your actual config (git-ignored)
├── .gitignore             # Protects sensitive files
├── js/
│   ├── up stoxAPI.js       # V3 API service layer
│   ├── auth.js            # Authentication logic
│   ├── dataProcessing.js  # CSV & numerology functions
│   └── ui.js              # UI rendering & charts
├── css/
│   └── styles.css         # Application styles
└── docs/
    ├── README.md          # This file
    ├── SECURITY.md        # Security guidelines
    └── DEPLOYMENT.md      # Deployment guide
```

## 🔑 Environment Variables (Optional)

For server-side deployment, use environment variables:

```bash
export UPSTOX_API_KEY="your-key"
export UPSTOX_API_SECRET="your-secret"
export UPSTOX_REDIRECT_URI="your-callback-url"
```

## 📊 Features

### Data Analysis
- Historical data extraction (up to 10+ years)
- Multiple timeframes: 1M, 5M, 15M, 30M, 1H, 4H, 1D, 1W, 1M
- Top 50 stocks analysis
- Gainer/Loser detection

### Numerology Integration
- Life Path number calculation
- Personal Year/Month calculations
- Chinese Zodiac mapping
- Pattern analysis for each company

### Advanced Charting
- TradingView-style candlestick charts
- Numerology overlays (PM/PY markers)
- Interactive timeframe switching
- Lightweight Charts library integration

### Data Processing
- CSV export/import
- Date patching from incorporation data
- ML pattern recognition
- Company-specific analysis

## 🌐 API Endpoints Used

All endpoints use proper **V3 format**:

| Endpoint | Format | Purpose |
|----------|--------|---------|
| Historical Candles | `/v3/historical-candle/{instrument}/{unit}/{interval}/{to}/{from}` | OHLC data |
| Market Quote | `/v3/market-quote/ohlc` | Current prices |
| Search | `/v3/search?query={symbol}` | Instrument lookup |
| Auth Token | `/v2/login/authorization/token` | OAuth flow |

### V3 Format Examples

✅ **CORRECT**:
```javascript
/v3/historical-candle/NSE_EQ|INE009A01021/days/1/2024-11-26/2023-11-26
/v3/historical-candle/NSE_EQ|INE009A01021/hours/4/2024-11-26/2024-11-01
/v3/historical-candle/NSE_EQ|INE009A01021/weeks/1/2024-11-26/2022-11-26
```

❌ **INCORRECT** (Old format):
```javascript
/v3/historical-candle/NSE_EQ|INE009A01021/day/2024-11-26/2023-11-26  // Missing interval!
/v3/historical-candle/NSE_EQ|INE009A01021/1hour/2024-11-26/...       // Wrong unit format!
```

## 🛡️ Security Best Practices

1. **Never commit `config.js`** - Always in `.gitignore`
2. **Use HTTPS** - In production, always serve over HTTPS
3. **Rotate credentials** - Change API keys regularly
4. **Monitor logs** - Check for suspicious activity
5. **Rate limiting** - Built-in, but monitor usage
6. **Token expiry** - Tokens valid for 24 hours

## 🐛 Troubleshooting

### "No access token" error
- Click [AUTH] button to authenticate
- Check `config.js` has correct credentials
- Verify redirect_uri matches Upstox app settings

### "API Error 400/401"
- Confirm API credentials are valid
- Check token hasn't expired (24hr limit)
- Verify instrument key format is correct

### Template literal error in charts
- Fixed in production version
- Uses string concatenation, not nested templates

### CORS errors
- Run from proper HTTP server (not `file://`)
- Ensure localhost port matches redirect URI

## 📚 Documentation

- [Security Guide](./SECURITY.md) - Detailed security architecture
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment steps
- [Upstox API Docs](https://upstox.com/developer/api-documentation) - Official API reference

## 🔄 Updates & Maintenance

### Checking for API Changes
```bash
# Monitor Upstox changelog
https://upstox.com/developer/api-documentation/changelog
```

### Updating Dependencies
- Lightweight Charts: Check for updates
- Chart.js: Monitor security advisories

## ⚠️ Important Notes

- **Access tokens expire after 24 hours** - Re-authenticate daily
- **Rate limits apply** - Max 3 requests/second (configurable)
- **Historical data limits**:
  - Intraday (minutes/hours): From Jan 2022
  - Daily/Weekly/Monthly: From Jan 2000

## 📞 Support

- **Upstox API Issues**: support@upstox.com
- **Documentation**: https://upstox.com/developer/api-documentation
- **Developer Forum**: Check Upstox community

## 📄 License

Private use only. Ensure compliance with Upstox API terms of service.

---

**Built with enterprise-grade security** | Zero exposed credentials | Production-ready architecture
