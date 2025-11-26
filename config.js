        };
    }
};

// Export for browser
if (typeof window !== 'undefined') {
    window.UPSTOX_CONFIG = CONFIG;
}

// Node.js export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
