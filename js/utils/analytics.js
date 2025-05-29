// =================================================================
// ANALYTICS TRACKING - js/analytics.js
// =================================================================

// Analytics configuration
const ANALYTICS_CONFIG = {
    // Replace with your actual GA4 measurement ID
    measurementId: 'G-Y4LTM4JLVF',
    
    // Custom dimensions (if you set them up in GA4)
    customDimensions: {
        gameMode: 'custom_dimension_1',
        aiDifficulty: 'custom_dimension_2',
        gameResult: 'custom_dimension_3'
    },
    
    // Event categories
    categories: {
        GAME: 'Game',
        UI: 'User Interface',
        SHARING: 'Sharing',
        ERROR: 'Error'
    }
};

// =================================================================
// ANALYTICS INITIALIZATION
// =================================================================

/**
 * Initialize Google Analytics
 */
function initializeAnalytics() {
    // Google Analytics is loaded in the HTML head
    // This function can be used for additional setup
    
    if (typeof gtag === 'function') {
        // Set user properties
        gtag('config', ANALYTICS_CONFIG.measurementId, {
            page_title: 'Ultimate Tic-Tac-Toe - TEN',
            page_location: window.location.href,
            custom_map: ANALYTICS_CONFIG.customDimensions
        });
        
        // Track initial page load
        trackEvent('page_view', ANALYTICS_CONFIG.categories.UI, 'Home', {
            page_title: document.title,
            page_location: window.location.href
        });
        
        safeLog('Analytics initialized successfully');
    } else {
        safeWarn('Google Analytics not loaded');
    }
}

// =================================================================
// CORE TRACKING FUNCTIONS
// =================================================================

/**
 * Track a custom event with Google Analytics
 */
function trackEvent(eventName, category = null, label = null, parameters = {}) {
    if (typeof gtag !== 'function') {
        safeWarn('gtag not available, event not tracked:', eventName);
        return;
    }
    
    try {
        const eventData = {
            event_category: category || ANALYTICS_CONFIG.categories.GAME,
            ...parameters
        };
        
        if (label) {
            eventData.event_label = label;
        }
        
        gtag('event', eventName, eventData);
        safeLog('Event tracked:', eventName, eventData);
    } catch (error) {
        safeError('Failed to track event:', error);
    }
}

/**
 * Track game-specific events
 */
function trackGameEvent(action, difficulty = null, additionalData = {}) {
    const eventData = {
        event_category: ANALYTICS_CONFIG.categories.GAME,
        value: 1,
        ...additionalData
    };
    
    if (difficulty) {
        eventData.event_label = difficulty;
        eventData[ANALYTICS_CONFIG.customDimensions.aiDifficulty] = difficulty;
    }
    
    trackEvent(action, ANALYTICS_CONFIG.categories.GAME, difficulty, eventData);
}

// =================================================================
// GAME EVENT TRACKING
// =================================================================

/**
 * Track game start events
 */
function trackGameStart(mode, difficulty = null) {
    const eventData = {
        [ANALYTICS_CONFIG.customDimensions.gameMode]: mode
    };
    
    if (difficulty) {
        eventData[ANALYTICS_CONFIG.customDimensions.aiDifficulty] = difficulty;
    }
    
    trackGameEvent('game_start', mode, eventData);
}

/**
 * Track game end events
 */
function trackGameEnd(result, mode, difficulty = null, moveCount = null) {
    const eventData = {
        [ANALYTICS_CONFIG.customDimensions.gameResult]: result,
        [ANALYTICS_CONFIG.customDimensions.gameMode]: mode
    };
    
    if (difficulty) {
        eventData[ANALYTICS_CONFIG.customDimensions.aiDifficulty] = difficulty;
    }
    
    if (moveCount) {
        eventData.move_count = moveCount;
    }
    
    trackGameEvent('game_end', mode, eventData);
}

/**
 * Track player moves
 */
function trackMove(boardIndex, cellIndex, player, moveNumber) {
    trackGameEvent('player_move', null, {
        board_index: boardIndex,
        cell_index: cellIndex,
        player: player,
        move_number: moveNumber
    });
}

/**
 * Track AI moves with difficulty
 */
function trackAIMove(boardIndex, cellIndex, difficulty, moveNumber, thinkingTime) {
    trackGameEvent('ai_move', difficulty, {
        board_index: boardIndex,
        cell_index: cellIndex,
        move_number: moveNumber,
        thinking_time: Math.round(thinkingTime)
    });
}

/**
 * Track game resets
 */
function trackGameReset(mode, moveCount = null) {
    const eventData = {
        [ANALYTICS_CONFIG.customDimensions.gameMode]: mode
    };
    
    if (moveCount) {
        eventData.moves_before_reset = moveCount;
    }
    
    trackGameEvent('game_reset', mode, eventData);
}

// =================================================================
// UI EVENT TRACKING
// =================================================================

/**
 * Track UI interactions
 */
function trackUIEvent(action, element = null, additionalData = {}) {
    const eventData = {
        ...additionalData
    };
    
    if (element) {
        eventData.ui_element = element;
    }
    
    trackEvent(action, ANALYTICS_CONFIG.categories.UI, element, eventData);
}

/**
 * Track modal opens
 */
function trackModalOpen(modalName) {
    trackUIEvent('modal_open', modalName);
}

/**
 * Track modal closes
 */
function trackModalClose(modalName) {
    trackUIEvent('modal_close', modalName);
}

/**
 * Track navigation events
 */
function trackNavigation(from, to) {
    trackUIEvent('navigation', null, {
        from_screen: from,
        to_screen: to
    });
}

/**
 * Track button clicks
 */
function trackButtonClick(buttonName, context = null) {
    trackUIEvent('button_click', buttonName, {
        context: context
    });
}

// =================================================================
// SHARING EVENT TRACKING
// =================================================================

/**
 * Track sharing events
 */
function trackShare(method, success = true) {
    const eventData = {
        method: method,
        success: success
    };
    
    trackEvent(success ? 'share_success' : 'share_failed', 
               ANALYTICS_CONFIG.categories.SHARING, 
               method, 
               eventData);
}

/**
 * Track social media shares
 */
function trackSocialShare(platform) {
    trackShare(platform, true);
}

/**
 * Track clipboard copy events
 */
function trackClipboardCopy(success = true) {
    trackShare('clipboard', success);
}

// =================================================================
// PERFORMANCE EVENT TRACKING
// =================================================================

/**
 * Track performance metrics
 */
function trackPerformance(metric, value, context = null) {
    const eventData = {
        metric_name: metric,
        metric_value: value
    };
    
    if (context) {
        eventData.context = context;
    }
    
    trackEvent('performance_metric', ANALYTICS_CONFIG.categories.GAME, metric, eventData);
}

/**
 * Track page load time
 */
function trackPageLoadTime() {
    if (typeof performance !== 'undefined' && performance.timing) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        trackPerformance('page_load_time', loadTime, 'milliseconds');
    }
}

/**
 * Track AI thinking time
 */
function trackAIThinkingTime(difficulty, thinkingTime) {
    trackPerformance('ai_thinking_time', thinkingTime, difficulty);
}

/**
 * Track game duration
 */
function trackGameDuration(duration, result, mode) {
    const eventData = {
        game_duration: duration,
        game_result: result,
        game_mode: mode
    };
    
    trackEvent('game_duration', ANALYTICS_CONFIG.categories.GAME, mode, eventData);
}

// =================================================================
// ERROR EVENT TRACKING
// =================================================================

/**
 * Track JavaScript errors
 */
function trackError(error, context = null) {
    const eventData = {
        error_message: error.message || 'Unknown error',
        error_stack: error.stack || 'No stack trace',
        user_agent: navigator.userAgent
    };
    
    if (context) {
        eventData.error_context = context;
    }
    
    trackEvent('javascript_error', ANALYTICS_CONFIG.categories.ERROR, error.message, eventData);
}

/**
 * Track game logic errors
 */
function trackGameError(errorType, details = null) {
    const eventData = {
        error_type: errorType
    };
    
    if (details) {
        eventData.error_details = details;
    }
    
    trackEvent('game_error', ANALYTICS_CONFIG.categories.ERROR, errorType, eventData);
}

// =================================================================
// USER ENGAGEMENT TRACKING
// =================================================================

/**
 * Track user session information
 */
function trackSessionInfo() {
    const sessionData = {
        screen_resolution: `${screen.width}x${screen.height}`,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`,
        device_type: isMobile() ? 'mobile' : 'desktop',
        touch_support: isTouchDevice(),
        pwa_mode: isStandalone(),
        browser_online: navigator.onLine
    };
    
    trackEvent('session_info', ANALYTICS_CONFIG.categories.UI, 'session_start', sessionData);
}

/**
 * Track user preferences
 */
function trackUserPreference(preference, value) {
    const eventData = {
        preference_name: preference,
        preference_value: value
    };
    
    trackEvent('user_preference', ANALYTICS_CONFIG.categories.UI, preference, eventData);
}

/**
 * Track feature usage
 */
function trackFeatureUsage(feature, context = null) {
    const eventData = {
        feature_name: feature
    };
    
    if (context) {
        eventData.usage_context = context;
    }
    
    trackEvent('feature_usage', ANALYTICS_CONFIG.categories.UI, feature, eventData);
}

// =================================================================
// A/B TESTING & EXPERIMENTS
// =================================================================

/**
 * Track A/B test assignments (for future use)
 */
function trackExperiment(experimentName, variant) {
    const eventData = {
        experiment_name: experimentName,
        variant: variant
    };
    
    trackEvent('experiment_assignment', ANALYTICS_CONFIG.categories.UI, experimentName, eventData);
}

/**
 * Track conversion events for experiments
 */
function trackConversion(conversionType, experimentName = null, variant = null) {
    const eventData = {
        conversion_type: conversionType
    };
    
    if (experimentName) {
        eventData.experiment_name = experimentName;
    }
    
    if (variant) {
        eventData.variant = variant;
    }
    
    trackEvent('conversion', ANALYTICS_CONFIG.categories.GAME, conversionType, eventData);
}

// =================================================================
// CUSTOM EVENT BUILDERS
// =================================================================

/**
 * Create a custom event with game state context
 */
function createGameStateEvent(eventName, additionalData = {}) {
    const gameState = typeof getGameState === 'function' ? getGameState() : {};
    const gameMode = typeof getGameMode === 'function' ? getGameMode() : {};
    
    const eventData = {
        current_player: gameState.currentPlayer,
        move_count: gameState.moveCount || getTotalMoves(),
        game_progress: Math.round((gameState.moveCount || getTotalMoves()) / 81 * 100),
        is_ai_game: gameMode.isAI,
        ai_difficulty: gameMode.difficulty,
        ...additionalData
    };
    
    return {
        name: eventName,
        data: eventData
    };
}

/**
 * Track events with automatic game context
 */
function trackGameContextEvent(eventName, category = null, label = null, additionalData = {}) {
    const contextEvent = createGameStateEvent(eventName, additionalData);
    trackEvent(contextEvent.name, category, label, contextEvent.data);
}

// =================================================================
// BATCH EVENT TRACKING (for future optimization)
// =================================================================

/**
 * Event queue for batch processing
 */
let eventQueue = [];
let batchTimeout = null;

/**
 * Add event to batch queue
 */
function queueEvent(eventName, category, label, data) {
    eventQueue.push({
        name: eventName,
        category: category,
        label: label,
        data: data,
        timestamp: Date.now()
    });
    
    // Process queue after short delay
    if (batchTimeout) {
        clearTimeout(batchTimeout);
    }
    
    batchTimeout = setTimeout(processBatchEvents, 1000);
}

/**
 * Process queued events in batch
 */
function processBatchEvents() {
    if (eventQueue.length === 0) return;
    
    const events = [...eventQueue];
    eventQueue = [];
    
    events.forEach(event => {
        trackEvent(event.name, event.category, event.label, event.data);
    });
    
    safeLog(`Processed ${events.length} batched events`);
}

// =================================================================
// INITIALIZATION & ERROR HANDLING
// =================================================================

/**
 * Initialize analytics with error handling
 */
function initializeAnalyticsWithErrorHandling() {
    try {
        initializeAnalytics();
        trackSessionInfo();
        trackPageLoadTime();
        
        // Set up global error tracking
        window.addEventListener('error', (event) => {
            trackError(event.error, 'global_error_handler');
        });
        
        // Set up unhandled promise rejection tracking
        window.addEventListener('unhandledrejection', (event) => {
            trackError(new Error(event.reason), 'unhandled_promise_rejection');
        });
        
    } catch (error) {
        safeError('Failed to initialize analytics:', error);
    }
}

// =================================================================
// ANALYTICS UTILITIES
// =================================================================

/**
 * Check if analytics is properly loaded
 */
function isAnalyticsLoaded() {
    return typeof gtag === 'function';
}

/**
 * Get analytics configuration
 */
function getAnalyticsConfig() {
    return { ...ANALYTICS_CONFIG };
}

/**
 * Update analytics configuration
 */
function updateAnalyticsConfig(newConfig) {
    Object.assign(ANALYTICS_CONFIG, newConfig);
}

// =================================================================
// GDPR & PRIVACY COMPLIANCE
// =================================================================

/**
 * Set analytics consent (for GDPR compliance)
 */
function setAnalyticsConsent(granted = true) {
    if (typeof gtag === 'function') {
        gtag('consent', 'update', {
            analytics_storage: granted ? 'granted' : 'denied'
        });
        
        trackEvent('consent_update', ANALYTICS_CONFIG.categories.UI, granted ? 'granted' : 'denied');
    }
}

/**
 * Disable analytics tracking
 */
function disableAnalytics() {
    if (typeof gtag === 'function') {
        window[`ga-disable-${ANALYTICS_CONFIG.measurementId}`] = true;
        trackEvent('analytics_disabled', ANALYTICS_CONFIG.categories.UI);
    }
}

// =================================================================
// EXPORTS & INITIALIZATION
// =================================================================

// Initialize analytics when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeAnalyticsWithErrorHandling();
});

// Make key functions available globally
window.trackGameEvent = trackGameEvent;
window.trackUIEvent = trackUIEvent;
window.trackShare = trackShare;