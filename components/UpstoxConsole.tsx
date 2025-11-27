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

  // Form states
  const [dataMode, setDataMode] = useState('manual');
  const [symbols, setSymbols] = useState('');
  const [exchange, setExchange] = useState('NSE_EQ');
  const [interval, setInterval] = useState('months/1');
  const [timePeriod, setTimePeriod] = useState('12');
  
  // File upload states
  const [stocksFile, setStocksFile] = useState<File | null>(null);
  const [teFile, setTeFile] = useState<File | null>(null);
  const [numerologyFile, setNumerologyFile] = useState<File | null>(null);
  const [mlFile, setMlFile] = useState<File | null>(null);

  // Chart states
  const [chartInstrumentKey, setChartInstrumentKey] = useState('');
  const [chartIncorpDate, setChartIncorpDate] = useState('');
  const [chartDateRange, setChartDateRange] = useState('1Y');
  const [chartSearchQuery, setChartSearchQuery] = useState('');

  useEffect(() => {
    // Check for auth code from callback
    const code = sessionStorage.getItem('upstox_auth_code');
    if (code) {
      sessionStorage.removeItem('upstox_auth_code');
      exchangeCodeForToken(code);
    }

    // Listen for auth code from popup
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type === 'UPSTOX_AUTH_CODE') {
        exchangeCodeForToken(event.data.code);
      }
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
    
    if (!apiKey || !redirectUri) {
      log('❌ API credentials not configured');
      return;
    }

    const authUrl = `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${apiKey}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    log('Opening Upstox authorization page...');
    const authWindow = window.open(authUrl, 'UpstoxAuth', 'width=600,height=700,left=200,top=100');
    
    if (!authWindow) {
      alert('Popup blocked! Please allow popups for this site and try again.');
      return;
    }
    
    setAuthStatus('⏳ Waiting for authorization...');
  };

  const exchangeCodeForToken = async (authCode: string) => {
    try {
      log('Exchanging authorization code for access token...');
      
      const response = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: authCode }),
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        upstoxApi.setAccessToken(data.access_token);
        setAuthStatus('✓ Authenticated');
        setIsConnected(true);
        log('✓ Access token obtained');
      } else {
        throw new Error(data.error || 'Failed to get access token');
      }
    } catch (error: any) {
      setAuthStatus(`✗ Error: ${error.message}`);
      log(`✗ Authentication error: ${error.message}`);
      setIsConnected(false);
    }
  };

  const getStockList = async (): Promise<string[]> => {
    if (dataMode === 'manual') {
      return symbols.split(',').map(s => s.trim().toUpperCase()).filter(s => s);
    }

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
    if (!upstoxApi.getAccessToken()) {
      setAuthStatus('❌ Please authenticate first');
      return;
    }

    const stocks = await getStockList();
    if (stocks.length === 0) {
      setAuthStatus('❌ Please enter stock symbols');
      return;
    }

    const exchangeKey = exchange;
    const intervalParts = interval.split('/');
    const unit = intervalParts[0];
    const intervalNum = intervalParts[1];

    let fromDate: string;
    if (timePeriod === 'max') {
      if (unit.includes('minute') || unit.includes('hour')) {
        fromDate = '2022-01-01';
      } else {
        fromDate = '2008-01-01';
      }
      log(`Processing Full History since ${fromDate}...`);
    } else {
      const months = parseInt(timePeriod);
      const date = new Date();
      date.setMonth(date.getMonth() - months);
      fromDate = date.toISOString().split('T')[0];
    }

    const toDate = new Date().toISOString().split('T')[0];

    log(`Fetching data for ${stocks.length} stocks...`);
    setShowProgress(true);
    const results: StockResult[] = [];

    for (let i = 0; i < stocks.length; i++) {
      const symbol = stocks[i];
      const progressPct = ((i + 1) / stocks.length) * 100;
      setProgress(progressPct);
      setProgressText(`Processing ${symbol} (${i + 1}/${stocks.length})`);

      try {
        const instrumentKey = INSTRUMENTS[exchangeKey as keyof typeof INSTRUMENTS]?.[symbol];
        if (!instrumentKey) {
          log(`✗ ${symbol}: Not found in instrument list`);
          continue;
        }

        const data = await upstoxApi.getHistoricalData(
          instrumentKey,
          unit,
          intervalNum,
          toDate,
          fromDate
        );

        if (data.data && data.data.candles && data.data.candles.length > 0) {
          const candles = data.data.candles;
          const latestPrice = candles[0][4];
          const oldestPrice = candles[candles.length - 1][4];
          const highPrice = Math.max(...candles.map((c: any) => c[2]));
          const lowPrice = Math.min(...candles.map((c: any) => c[3]));
          const priceChange = latestPrice - oldestPrice;
          const percentChange = ((priceChange / oldestPrice) * 100).toFixed(2);

          let monthlyData: any[] = [];
          if (interval === 'months/1') {
            monthlyData = candles.map((candle: any) => ({
              date: new Date(candle[0]).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' }),
              open: candle[1].toFixed(2),
              close: candle[4].toFixed(2),
              high: candle[2].toFixed(2),
              low: candle[3].toFixed(2),
              change: ((candle[4] - candle[1]) / candle[1] * 100).toFixed(2)
            })).reverse();
          }

          const stockObj: StockResult = {
            symbol,
            companyName: COMPANY_FULL_NAMES[symbol] || symbol,
            incorporationDate: INCORPORATION_DATES[symbol] || 'Not Available',
            latestPrice: latestPrice.toFixed(2),
            oldestPrice: oldestPrice.toFixed(2),
            highPrice: highPrice.toFixed(2),
            lowPrice: lowPrice.toFixed(2),
            change: priceChange.toFixed(2),
            percentChange,
            dataPoints: candles.length,
            monthlyData
          };

          results.push(stockObj);
          log(`✓ ${symbol}: ${percentChange}%`);
        } else {
          log(`✗ ${symbol}: No data`);
        }
      } catch (error: any) {
        log(`✗ ${symbol}: ${error.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setShowProgress(false);
    setProgressText('');
    setStockResults(results);
    setShowExport(true);
    log(`✓ Completed: ${results.length} stocks analyzed`);
  };