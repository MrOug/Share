/**
 * Local Development Configuration Template
 * 
 * INSTRUCTIONS:
 * 1. Copy this file to: config.local.js
 * 2. Add your REAL Upstox credentials below
 * 3. NEVER commit config.local.js (it's in .gitignore)
 * 
 * Usage:
 * - For local testing, the app will load config.local.js (if it exists)
 * - For Vercel deployment, it uses environment variables from config.js
 */

const CONFIG = {
    // YOUR REAL CREDENTIALS HERE (only for local development)
    apiKey: 'c4b13b67-b8f5-490a-ad3b-514da49ad0c0',
    apiSecret: 'pfx2ui3ls6',
    redirectUri: 'http://localhost:8080/callback',

    // API Configuration
    apiBaseUrl: 'https://api.upstox.com',
    apiVersion: 'v3',

    // Security Settings
    tokenStorageKey: 'upstox_access_token',
    useEncryptedStorage: true,
    tokenExpiryHours: 24,

    // Rate Limiting
    maxRequestsPerSecond: 3,
    retryAttempts: 3,
    retryDelayMs: 1000,

    // Feature Flags
    enableDebugLogging: true,  // Enable for local dev
    enableAnalytics: false
};

if (typeof window !== 'undefined') {
    window.UPSTOX_CONFIG = CONFIG;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
