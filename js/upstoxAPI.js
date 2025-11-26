/**
 * Upstox V3 API Service Layer
 * Handles all API communications with proper V3 endpoint formats
 * Implements retry logic, rate limiting, and error handling
 */

class UpstoxAPI {
    constructor(config) {
        this.config = config;
        this.accessToken = null;
        this.requestQueue = [];
        this.lastRequestTime = 0;
        this.retryDelays = [1000, 2000, 4000]; // Exponential backoff
    }

    /**
     * Rate-limited fetch with retry logic
     */
    async safeFetch(url, options = {}) {
        // Rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        const minInterval = 1000 / this.config.maxRequestsPerSecond;

        if (timeSinceLastRequest < minInterval) {
            await new Promise(resolve =>
                setTimeout(resolve, minInterval - timeSinceLastRequest)
            );
        }

        this.lastRequestTime = Date.now();

        // Retry logic
        for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
            try {
                const response = await fetch(url, {
                    ...options,
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': this.accessToken ? `Bearer ${this.accessToken}` : '',
                        ...options.headers
                    }
                });

                if (response.status === 429) {
                    // Rate limited - wait and retry
                    const retryAfter = response.headers.get('Retry-After') || this.retryDelays[attempt];
                    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                    continue;
                }

                if (!response.ok && attempt < this.config.retryAttempts - 1) {
                    await new Promise(resolve => setTimeout(resolve, this.retryDelays[attempt]));
                    continue;
                }

                return response;
            } catch (error) {
                if (attempt === this.config.retryAttempts - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, this.retryDelays[attempt]));
            }
        }
    }

    /**
     * V3 Historical Candle Data
     * Format: /v3/historical-candle/{instrument}/{unit}/{interval}/{to_date}/{from_date}
     * 
     * @param {string} instrumentKey - e.g., "NSE_EQ|INE009A01021"
     * @param {string} unit - "minutes", "hours", "days", "weeks", "months"
     * @param {number|string} interval - 1, 5, 15, 30 for minutes; 1-5 for hours; 1 for days/weeks/months
     * @param {string} toDate - YYYY-MM-DD format
     * @param {string} fromDate - YYYY-MM-DD format
     */
    async getHistoricalCandles(instrumentKey, unit, interval, toDate, fromDate) {
        const url = `${this.config.apiBaseUrl}/v3/historical-candle/${encodeURIComponent(instrumentKey)}/${unit}/${interval}/${toDate}/${fromDate}`;

        const response = await this.safeFetch(url);

        if (!response.ok) {
            throw new Error(`API Error ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();

        if (!data.data || !data.data.candles) {
            throw new Error('No candle data available');
        }

        return data.data.candles;
    }

    /**
     * Search for instruments (V3)
     */
    async searchInstruments(query) {
        const url = `${this.config.apiBaseUrl}/v3/search?query=${encodeURIComponent(query)}`;

        const response = await this.safeFetch(url);

        if (!response.ok) {
            throw new Error(`Search failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Get Market Quote OHLC (V3)
     */
    async getMarketQuote(instrumentKey) {
        const url = `${this.config.apiBaseUrl}/v3/market-quote/ohlc?instrument_key=${encodeURIComponent(instrumentKey)}`;

        const response = await this.safeFetch(url);

        if (!response.ok) {
            throw new Error(`Market quote failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Exchange authorization code for access token
     */
    async exchangeCodeForToken(authCode) {
        const url = `${this.config.apiBaseUrl}/v2/login/authorization/token`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: new URLSearchParams({
                code: authCode,
                client_id: this.config.apiKey,
                client_secret: this.config.apiSecret,
                redirect_uri: this.config.redirectUri,
                grant_type: 'authorization_code'
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Token exchange failed');
        }

        const data = await response.json();
        this.setAccessToken(data.access_token);
        return data.access_token;
    }

    /**
     * Set and securely store access token
     */
    setAccessToken(token) {
        this.accessToken = token;

        if (this.config.useEncryptedStorage) {
            // Simple encryption using base64 (in production, use proper encryption)
            const encrypted = btoa(token);
            sessionStorage.setItem(this.config.tokenStorageKey, encrypted);
            sessionStorage.setItem(`${this.config.tokenStorageKey}_expiry`,
                Date.now() + (this.config.tokenExpiryHours * 60 * 60 * 1000));
        } else {
            sessionStorage.setItem(this.config.tokenStorageKey, token);
        }
    }

    /**
     * Retrieve stored access token
     */
    getStoredToken() {
        const expiry = sessionStorage.getItem(`${this.config.tokenStorageKey}_expiry`);

        if (expiry && Date.now() > parseInt(expiry)) {
            this.clearToken();
            return null;
        }

        const storedToken = sessionStorage.getItem(this.config.tokenStorageKey);

        if (!storedToken) return null;

        if (this.config.useEncryptedStorage) {
            try {
                this.accessToken = atob(storedToken);
            } catch (e) {
                this.clearToken();
                return null;
            }
        } else {
            this.accessToken = storedToken;
        }

        return this.accessToken;
    }

    /**
     * Clear stored token
     */
    clearToken() {
        this.accessToken = null;
        sessionStorage.removeItem(this.config.tokenStorageKey);
        sessionStorage.removeItem(`${this.config.tokenStorageKey}_expiry`);
    }

    /**
     * Check if authenticated
     */
    isAuthenticated() {
        return !!this.getStoredToken();
    }

    /**
     * Get authorization URL for OAuth flow
     */
    getAuthorizationUrl() {
        return `${this.config.apiBaseUrl}/v2/login/authorization/dialog?response_type=code&client_id=${this.config.apiKey}&redirect_uri=${encodeURIComponent(this.config.redirectUri)}`;
    }
}

// Export for use in application
if (typeof window !== 'undefined') {
    window.UpstoxAPI = UpstoxAPI;
}
