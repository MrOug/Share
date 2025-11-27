# Upstox V3 Console - Next.js Implementation

> Enterprise-grade stock analysis console built with **Next.js 14**, featuring Upstox V3 API integration, numerology calculations, and advanced charting capabilities.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Upstox](https://img.shields.io/badge/Upstox-V3_API-orange)](https://upstox.com/developer/)

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** installed
- **Upstox Developer Account** ([Sign up](https://upstox.com/developer/))

### Installation

```bash
# Clone and switch to Next.js branch
git clone https://github.com/MrOug/Share.git
cd Share
git checkout nextjs-v3-console

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
```

### Configuration

1. **Get Upstox API Credentials**
   - Visit [Upstox Developer Portal](https://upstox.com/developer/)
   - Create a new app
   - Note: **API Key** and **API Secret**

2. **Update `.env.local`**
```env
NEXT_PUBLIC_UPSTOX_API_KEY=your-api-key-here
UPSTOX_API_SECRET=your-api-secret-here
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/callback
```

3. **Configure Upstox App**
   - Set Redirect URI: `http://localhost:3000/callback`

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📊 Features

### Core Functionality
✅ **OAuth 2.0 Authentication** - Secure server-side token exchange  
✅ **V3 Historical Data** - Proper `/{unit}/{interval}/` format  
✅ **Multiple Data Sources** - Manual, Top 50, Indices, Sectors  
✅ **Flexible Timeframes** - 1M to MAX (since 2008/2022)  
✅ **Dynamic Instruments** - Auto-downloads NSE/BSE from CDN  
✅ **Rate Limiting** - 300ms delays between requests  

### Advanced Processing
✅ **Date Patching** - CSV incorporation date updates  
✅ **Numerology Engine** - Life Path, Personal Year/Month  
✅ **Chinese Zodiac** - Company & monthly zodiac mapping  
✅ **ML Pattern Analysis** - Per-company pattern recognition  

### Visualization
✅ **TradingView Charts** - Lightweight Charts integration  
✅ **Stock Cards** - Real-time display with breakdown  
✅ **Dark/Light Theme** - Toggle support  

## 📁 Project Structure

```
nextjs-v3-console/
├── app/
│   ├── api/auth/token/route.ts   # OAuth endpoint
│   ├── callback/page.tsx         # OAuth callback
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Entry point
│   └── globals.css               # Styling
├── components/
│   └── UpstoxConsole.tsx         # Main component
├── lib/
│   ├── upstoxApi.ts              # API layer
│   ├── numerology.ts             # Calculations
│   ├── dataProcessing.ts         # CSV utils
│   └── constants.ts              # Mappings
├── package.json
├── next.config.js
└── tsconfig.json
```

## 🔑 API Reference

### Upstox V3 Historical Candles

```
GET /v3/historical-candle/{instrument}/{unit}/{interval}/{to}/{from}
```

**Examples:**
```bash
# Daily
/v3/historical-candle/NSE_EQ|INE009A01021/days/1/2024-11-27/2023-11-27

# 4-Hour
/v3/historical-candle/NSE_EQ|INE009A01021/hours/4/2024-11-27/2024-11-01

# Weekly
/v3/historical-candle/NSE_EQ|INE009A01021/weeks/1/2024-11-27/2022-11-27
```

## 📋 Usage

### 1. Authenticate
1. Click **[AUTH]**
2. Login to Upstox
3. Wait for "✓ Authenticated"

### 2. Fetch Data
1. Select Data Mode
2. Choose Exchange/Interval
3. Set Time Period
4. Click **> EXECUTE_ANALYSIS**

### 3. Export
- **[DOWNLOAD RAW .CSV]** after completion

### 4. Date Patch
1. Upload `stocks.csv` + `te.csv`
2. **RUN DATE UPDATE**

### 5. Numerology
1. Upload `stocks_updated.csv`
2. **CALCULATE ALL**

### 6. ML Analysis
1. Upload numerology CSV
2. **ANALYZE BY COMPANY**

### 7. Charts
1. Search symbol
2. Set incorporation date
3. **OPEN CHART**

## 🔒 Security

- API secrets **server-side only**
- OAuth via Next.js API routes
- **No client-side credentials**
- Rate limiting: 300ms
- Token expires: 24 hours

## 🚀 Deploy to Vercel

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/MrOug/Share/tree/nextjs-v3-console)

### Manual Deployment

1. **Push to GitHub** ✓ (Already done!)
2. **Import to Vercel**
   - [vercel.com](https://vercel.com) → New Project
   - Import `MrOug/Share`
   - Branch: `nextjs-v3-console`
3. **Add Environment Variables**
   ```
   NEXT_PUBLIC_UPSTOX_API_KEY=your-key
   UPSTOX_API_SECRET=your-secret
   NEXT_PUBLIC_REDIRECT_URI=https://yourdomain.vercel.app/callback
   ```
4. **Update Upstox**
   - Redirect URI: `https://yourdomain.vercel.app/callback`
5. **Deploy!**

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| No access token | Click [AUTH], allow popups |
| API 400/401 | Check credentials, token expiry |
| CSV errors | UTF-8 encoding, valid headers |
| CORS errors | Use HTTP server, not `file://` |

## 📊 CSV Formats

### Stock Export
```csv
Company Name,Incorporation Date,Current Price,...
"Reliance Industries",08/05/1973,2850.50,...

Monthly Breakdown for Reliance:
Date,Open,Close,High,Low,Change %
Nov 2024,2800,2850.50,2900,2750,1.80
```

### Numerology Output
```csv
Stock,Incorporation_Date,Company_Chinese_Zodiac,Life_Path,...
RELIANCE,08/05/1973,Ox,7,...
```

## 📚 Resources

- [Upstox V3 Docs](https://upstox.com/developer/api-documentation/v3/get-historical-candle-data/)
- [Next.js Docs](https://nextjs.org/docs)
- [Lightweight Charts](https://tradingview.github.io/lightweight-charts/)

## 📝 License

Private use. Comply with Upstox API terms.

---

**🚀 Next.js 14 | 🔒 Secure OAuth | 🎨 Original UI**