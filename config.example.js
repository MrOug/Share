# Upstox V3 Console - Example Configuration
# Copy this file to config.js and add your actual credentials
# NEVER commit config.js to version control

const CONFIG = {
    // OAuth Credentials (Get from https://upstox.com/developer/apps)
    apiKey: 'YOUR_API_KEY_HERE',
    apiSecret: 'YOUR_API_SECRET_HERE',
    redirectUri: 'http://127.0.0.1:8080/callback',

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
    enableDebugLogging: false,
    enableAnalytics: false
};

// Export for use in application
if (typeof window !== 'undefined') {
    window.UPSTOX_CONFIG = CONFIG;
}
