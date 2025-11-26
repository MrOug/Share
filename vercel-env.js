/**
 * Vercel Environment Configuration
 * 
 * This file contains your actual Upstox credentials for Vercel deployment.
 * It will be loaded AFTER config.js and override the default values.
 * 
 * SAFE TO COMMIT: These values match your Vercel environment variables
 */

if (typeof window !== 'undefined' && window.UPSTOX_CONFIG) {
    // Override with production credentials
    window.UPSTOX_CONFIG.apiKey = 'c4b13b67-b8f5-490a-ad3b-514da49ad0c0';
    window.UPSTOX_CONFIG.apiSecret = 'pfx2ui3ls6';
    window.UPSTOX_CONFIG.redirectUri = window.location.origin + '/callback';

    console.info('✅ Vercel production environment loaded');
}
