'use client';

import { useState, useEffect } from 'react';
import { upstoxApi } from '@/lib/upstoxApi';
import { INSTRUMENTS, INCORPORATION_DATES, COMPANY_FULL_NAMES, NIFTY_50, NIFTY_NEXT_50, BANK_NIFTY, SENSEX, SECTOR_STOCKS } from '@/lib/constants';
import { getChineseZodiac, calculateLifePath, calculatePersonalYear, calculatePersonalMonth, normalizeMonthYear } from '@/lib/numerology';
import { parseCSV, parseCSVLine, parseStockCSV, downloadCSV } from '@/lib/dataProcessing';

interface StockResult {
  symbol: string;
  companyName: string;
  incorporationDate: string;
  latestPrice: string;
  oldestPrice: string;
  highPrice: string;
  lowPrice: string;
  change: string;
  percentChange: string;
  dataPoints: number;
  monthlyData?: any[];
}

export function UpstoxConsole() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isConnected, setIsConnected] = useState(false);
  const [authStatus, setAuthStatus] = useState('');
  const [logs, setLogs] = useState<string[]>(['// System initialized...']);
  const [stockResults, setStockResults] = useState<StockResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [showProgress, setShowProgress] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [dataMode, setDataMode] = useState('manual');
  const [symbols, setSymbols] = useState('');
  const [exchange, setExchange] = useState('NSE_EQ');
  const [interval, setInterval] = useState('months/1');
  const [timePeriod, setTimePeriod] = useState('12');
  const [stocksFile, setStocksFile] = useState<File | null>(null);
  const [teFile, setTeFile] = useState<File | null>(null);
  const [numerologyFile, setNumerologyFile] = useState<File | null>(null);
  const [mlFile, setMlFile] = useState<File | null>(null);
  const [chartInstrumentKey, setChartInstrumentKey] = useState('');
  const [chartIncorpDate, setChartIncorpDate] = useState('');
  const [chartDateRange, setChartDateRange] = useState('1Y');
  const [chartSearchQuery, setChartSearchQuery] = useState('');

  useEffect(() => {
    const code = sessionStorage.getItem('upstox_auth_code');
    if (code) {
      sessionStorage.removeItem('upstox_auth_code');
      exchangeCodeForToken(code);
    }
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type === 'UPSTOX_AUTH_CODE') exchangeCodeForToken(event.data.code);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const log = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('en-IN');
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.body.setAttribute('data-theme', newTheme);
    log(`Switched to ${newTheme} theme`);
  };

  const authenticateUpstox = () => {
    const apiKey = process.env.NEXT_PUBLIC_UPSTOX_API_KEY;
    const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI;
    if (!apiKey || !redirectUri) { log('❌ API credentials not configured'); return; }
    const authUrl = `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${apiKey}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    log('Opening Upstox authorization page...');
    const authWindow = window.open(authUrl, 'UpstoxAuth', 'width=600,height=700,left=200,top=100');
    if (!authWindow) { alert('Popup blocked!'); return; }
    setAuthStatus('⏳ Waiting for authorization...');
  };

  const exchangeCodeForToken = async (authCode: string) => {
    try {
      log('Exchanging code for token...');
      const response = await fetch('/api/auth/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: authCode }) });
      const data = await response.json();
      if (response.ok && data.access_token) {
        upstoxApi.setAccessToken(data.access_token);
        setAuthStatus('✓ Authenticated');
        setIsConnected(true);
        log('✓ Token obtained');
      } else throw new Error(data.error || 'Failed');
    } catch (error: any) {
      setAuthStatus(`✗ Error: ${error.message}`);
      log(`✗ Auth error: ${error.message}`);
      setIsConnected(false);
    }
  };

  const getStockList = async (): Promise<string[]> => {
    if (dataMode === 'manual') return symbols.split(',').map(s => s.trim().toUpperCase()).filter(s => s);
    if (dataMode === 'top50') return NIFTY_50.slice(0, 50);
    if (dataMode === 'nifty50') return NIFTY_50;
    if (dataMode === 'niftyNext50') return NIFTY_NEXT_50;
    if (dataMode === 'bankNifty') return BANK_NIFTY;
    if (dataMode === 'sensex') return SENSEX;
    if (dataMode.startsWith('sector')) {
      const sector = dataMode.replace('sector', '').toLowerCase();
      return SECTOR_STOCKS[sector as keyof typeof SECTOR_STOCKS] || [];
    }
    return [];
  };

  const fetchStockData = async () => {
    if (!upstoxApi.getAccessToken()) { setAuthStatus('❌ Please authenticate'); return; }
    const stocks = await getStockList();
    if (!stocks.length) { setAuthStatus('❌ Enter symbols'); return; }
    const [unit, intervalNum] = interval.split('/');
    let fromDate = timePeriod === 'max' ? (unit.includes('minute') || unit.includes('hour') ? '2022-01-01' : '2008-01-01') : new Date(Date.now() - parseInt(timePeriod) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = new Date().toISOString().split('T')[0];
    log(`Fetching ${stocks.length} stocks...`);
    setShowProgress(true);
    const results: StockResult[] = [];
    for (let i = 0; i < stocks.length; i++) {
      const symbol = stocks[i];
      setProgress(((i + 1) / stocks.length) * 100);
      setProgressText(`Processing ${symbol} (${i + 1}/${stocks.length})`);
      try {
        const instrumentKey = INSTRUMENTS[exchange as keyof typeof INSTRUMENTS]?.[symbol];
        if (!instrumentKey) { log(`✗ ${symbol}: Not found`); continue; }
        const data = await upstoxApi.getHistoricalData(instrumentKey, unit, intervalNum, toDate, fromDate);
        if (data.data?.candles?.length) {
          const candles = data.data.candles;
          const latest = candles[0][4], oldest = candles[candles.length - 1][4];
          const high = Math.max(...candles.map((c: any) => c[2])), low = Math.min(...candles.map((c: any) => c[3]));
          const change = latest - oldest, pct = ((change / oldest) * 100).toFixed(2);
          let monthly: any[] = [];
          if (interval === 'months/1') monthly = candles.map((c: any) => ({ date: new Date(c[0]).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' }), open: c[1].toFixed(2), close: c[4].toFixed(2), high: c[2].toFixed(2), low: c[3].toFixed(2), change: ((c[4] - c[1]) / c[1] * 100).toFixed(2) })).reverse();
          results.push({ symbol, companyName: COMPANY_FULL_NAMES[symbol] || symbol, incorporationDate: INCORPORATION_DATES[symbol] || 'N/A', latestPrice: latest.toFixed(2), oldestPrice: oldest.toFixed(2), highPrice: high.toFixed(2), lowPrice: low.toFixed(2), change: change.toFixed(2), percentChange: pct, dataPoints: candles.length, monthlyData: monthly });
          log(`✓ ${symbol}: ${pct}%`);
        }
      } catch (error: any) { log(`✗ ${symbol}: ${error.message}`); }
      await new Promise(r => setTimeout(r, 300));
    }
    setShowProgress(false); setProgressText(''); setStockResults(results); setShowExport(true);
    log(`✓ Done: ${results.length} analyzed`);
  };

  const exportToCSV = () => {
    if (!stockResults.length) return;
    let csv = 'Company Name,Incorporation Date,Current Price,Period High,Period Low,Change,Change %,Data Points\n';
    stockResults.forEach(s => {
      csv += `"${s.companyName}",${s.incorporationDate},${s.latestPrice},${s.highPrice},${s.lowPrice},${s.change},${s.percentChange},${s.dataPoints}\n`;
      if (s.monthlyData?.length) {
        csv += `\nMonthly Breakdown for ${s.companyName}:\nDate,Open,Close,High,Low,Change %\n`;
        s.monthlyData.forEach(m => csv += `${m.date},${m.open},${m.close},${m.high},${m.low},${m.change}\n`);
        csv += '\n';
      }
    });
    downloadCSV(csv, `stocks_${new Date().toISOString().split('T')[0]}.csv`);
    log('✓ CSV exported');
  };