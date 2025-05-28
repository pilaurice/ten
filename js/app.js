// =================================================================
// APPLICATION INITIALIZATION - js/app.js
// =================================================================

/**
 * Main application controller
 * Coordinates all modules and handles app-level events
 */
class TenGameApp {
    constructor() {
        this.isInitialized = false;
        this.version = '2.0.0';
        this.modules = {
            game: true,
            ai: true,
            ui: true,
            utils: true,
            analytics: true
        };
    }

    /**
     * Initialize the complete application
     */
    async initialize() {
        try {
            console.log(`🎮 Initializing Ultimate Tic-Tac-Toe v${this.version}`);
            
            // Check if all modules are loaded
            this.validateModules();
            
            // Initialize core systems
            await this.initializeCore();
            
            // Setup event handlers
            this.setupGlobalEventHandlers();
            
            // Initialize analytics
            this.initializeAnalytics();
            
            // Register service worker
            this.registerServiceWorker();
            
            // Mark as initialized
            this.isInitialized = true;
            
            console.log('✅ Ultimate Tic-Tac-Toe initialized successfully');
            
            // Track successful initialization
            if (typeof trackUIEvent === 'function') {
                trackUIEvent('app_initialized', 'success', {
                    version: this.version,
                    load_time: performance.now()
                });
            }
            
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Validate that all required modules are loaded
     */
    validateModules() {
        const requiredFunctions = [
            // Game module
            'resetGameState', 'isValidMove', 'executeMove', 'getGameState',
            // AI module
            'selectAIMove', 'scheduleAIMove',
            // UI module
            'initializeDOMCache', 'initializeEventListeners', 'initializeBoard',
            // Utils module
            'shareGame', 'registerServiceWorker',
            // Analytics module
            'trackGameEvent', 'trackUIEvent'
        ];

        const missingFunctions = requiredFunctions.filter(fn => typeof window[fn] !== 'function');
        
        if (missingFunctions.length > 0) {
            throw new Error(`Missing required functions: ${missingFunctions.join(', ')}`);
        }

        console.log('✅ All modules validated successfully');
    }

    /**
     * Initialize core application systems
     */
    async initializeCore() {
        // Initialize DOM cache and event listeners
        if (typeof initializeDOMCache === 'function') {
            initializeDOMCache();
        }
        
        if (typeof initializeEventListeners === 'function') {
            initializeEventListeners();
        }

        // Reset game to initial state
        if (typeof resetGameState === 'function') {
            resetGameState();
        }

        // Check for URL parameters (for future multiplayer features)
        this.handleURLParameters();
        
        console.log('✅ Core systems initialized');
    }

    /**
     * Setup global event handlers for app-level events
     */
    setupGlobalEventHandlers() {
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (typeof trackUIEvent === 'function') {
                trackUIEvent('page_visibility_change', null, {
                    visibility_state: document.visibilityState,
                    hidden: document.hidden
                });
            }
        });

        // Handle online/offline status changes
        window.addEventListener('online', () => {
            console.log('🌐 Connection restored');
            if (typeof trackUIEvent === 'function') {
                trackUIEvent('connection_change', null, { status: 'online' });
            }
        });

        window.addEventListener('offline', () => {
            console.log('📶 Connection lost');
            if (typeof trackUIEvent === 'function') {
                trackUIEvent('connection_change', null, { status: 'offline' });
            }
        });

        // Handle unhandled errors
        window.addEventListener('error', (event) => {
            console.error('🚨 Global error:', event.error);
            if (typeof trackError === 'function') {
                trackError(event.error, 'global_error_handler');
            }
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('🚨 Unhandled promise rejection:', event.reason);
            if (typeof trackError === 'function') {
                trackError(new Error(event.reason), 'unhandled_promise_rejection');
            }
        });

        // Handle beforeunload (user leaving the page)
        window.addEventListener('beforeunload', () => {
            if (typeof trackUIEvent === 'function') {
                trackUIEvent('page_unload');
            }
        });

        console.log('✅ Global event handlers setup');
    }

    /**
     * Initialize analytics system
     */
    initializeAnalytics() {
        try {
            if (typeof initializeAnalyticsWithErrorHandling === 'function') {
                initializeAnalyticsWithErrorHandling();
            }
            console.log('✅ Analytics initialized');
        } catch (error) {
            console.warn('⚠️ Analytics initialization failed:', error);
        }
    }

    /**
     * Register service worker for PWA functionality
     */
    registerServiceWorker() {
        try {
            if (typeof registerServiceWorker === 'function') {
                registerServiceWorker();
            }
            console.log('✅ Service worker registration initiated');
        } catch (error) {
            console.warn('⚠️ Service worker registration failed:', error);
        }
    }

    /**
     * Handle URL parameters for future features like multiplayer
     */
    handleURLParameters() {
        const params = new URLSearchParams(window.location.search);
        
        // Game mode parameter
        const mode = params.get('mode');
        if (mode) {
            console.log(`🎯 URL mode parameter detected: ${mode}`);
            // Could be used to auto-start specific game modes
        }

        // Game ID parameter (for future multiplayer)
        const gameId = params.get('game');
        if (gameId) {
            console.log(`🎮 Game ID detected: ${gameId}`);
            // Will be used for multiplayer game joining
        }

        // Share tracking
        const source = params.get('source');
        if (source && typeof trackUIEvent === 'function') {
            trackUIEvent('app_opened_from_share', source);
        }
    }

    /**
     * Handle initialization errors gracefully
     */
    handleInitializationError(error) {
        // Try to track the error if analytics is available
        if (typeof trackError === 'function') {
            trackError(error, 'app_initialization');
        }

        // Show user-friendly error message
        const errorMessage = document.createElement('div');
        errorMessage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff3333;
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            z-index: 10000;
            font-family: Inter, sans-serif;
        `;
        errorMessage.innerHTML = `
            <h3>Oops! Something went wrong</h3>
            <p>Please refresh the page to try again.</p>
            <button onclick="window.location.reload()" style="
                background: white;
                color: #ff3333;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                margin-top: 10px;
                cursor: pointer;
            ">Refresh Page</button>
        `;
        
        document.body.appendChild(errorMessage);
    }

    /**
     * Get application information
     */
    getInfo() {
        return {
            version: this.version,
            initialized: this.isInitialized,
            modules: this.modules,
            userAgent: navigator.userAgent,
            standalone: this.isStandalone(),
            online: navigator.onLine
        };
    }

    /**
     * Check if app is running as standalone PWA
     */
    isStandalone() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true;
    }

    /**
     * Debug method to get current state
     */
    debug() {
        const info = this.getInfo();
        console.table(info);
        
        if (typeof getGameState === 'function') {
            console.log('Game State:', getGameState());
        }
        
        return info;
    }
}

// =================================================================
// APPLICATION INSTANCE & INITIALIZATION
// =================================================================

// Create global app instance
const TenApp = new TenGameApp();

// Make app available globally for debugging
window.TenApp = TenApp;

/**
 * Initialize when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    TenApp.initialize();
});

/**
 * Show loading screen while app initializes (optional enhancement)
 */
function showLoadingScreen() {
    const loading = document.createElement('div');
    loading.id = 'loading-screen';
    loading.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #1E2233;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        flex-direction: column;
    `;
    loading.innerHTML = `
        <div style="color: white; font-family: Inter, sans-serif; text-align: center;">
            <h2>TEN</h2>
            <p>Loading...</p>
        </div>
    `;
    document.body.appendChild(loading);
}

function hideLoadingScreen() {
    const loading = document.getElementById('loading-screen');
    if (loading) {
        loading.style.opacity = '0';
        setTimeout(() => loading.remove(), 300);
    }
}

// =================================================================
// DEVELOPMENT HELPERS
// =================================================================

// Add some development helpers that are available in console
if (typeof console !== 'undefined') {
    window.TenDebug = {
        getAppInfo: () => TenApp.getInfo(),
        getGameState: () => typeof getGameState === 'function' ? getGameState() : 'Game module not loaded',
        resetGame: () => typeof resetGame === 'function' ? resetGame() : 'UI module not loaded',
        version: () => TenApp.version,
        modules: () => TenApp.modules
    };
    
    // Helpful console message for developers
    console.log(`
    🎮 Ultimate Tic-Tac-Toe Developer Console
    
    Available debug commands:
    - TenDebug.getAppInfo()  // Get app information
    - TenDebug.getGameState() // Get current game state  
    - TenDebug.resetGame()   // Reset the current game
    - TenDebug.version()     // Get app version
    - TenApp.debug()         // Full debug info
    
    App Version: ${TenApp.version}
    `);
}