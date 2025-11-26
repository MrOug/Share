/**
 * Vercel Serverless Function - Config API
 * Returns configuration from environment variables
 * Accessible at: /api/config
 */

module.exports = (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow GET
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    // Return configuration from environment variables
    const config = {
        apiKey: process.env.UPSTOX_API_KEY || '',
        apiSecret: process.env.UPSTOX_API_SECRET || '',
        redirectUri: process.env.UPSTOX_REDIRECT_URI || '',
        apiBaseUrl: 'https://api.upstox.com',
        apiVersion: 'v3',
        tokenStorageKey: 'upstox_access_token',
        useEncryptedStorage: true,
        tokenExpiryHours: 24,
        maxRequestsPerSecond: 3,
        retryAttempts: 3,
        retryDelayMs: 1000,
        enableDebugLogging: false,
        enableAnalytics: false
    };

    // Check if configured
    const isConfigured = !!(config.apiKey && config.apiSecret && config.redirectUri);

    res.status(200).json({
        success: true,
        configured: isConfigured,
        config: config
    });
};
