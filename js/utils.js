// =================================================================
// UTILITIES & HELPER FUNCTIONS - js/utils.js
// =================================================================

// =================================================================
// SHARING FUNCTIONALITY
// =================================================================

/**
 * Share the game using native sharing or clipboard
 */
async function shareGame() {
    const shareData = {
        title: 'Ultimate Tic-Tac-Toe - TEN',
        text: 'Play Ultimate Tic-Tac-Toe - Can you beat the AI on hard mode?',
        url: window.location.href
    };

    try {
        if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            await navigator.share(shareData);
            trackGameEvent('share_success', 'native');
        } else {
            await copyToClipboard(window.location.href);
            showToast('Link copied!');
            trackGameEvent('share_success', 'clipboard');
        }
    } catch (err) {
        if (err.name !== 'AbortError') {
            try {
                await copyToClipboard(window.location.href);
                showToast('Link copied!');
                trackGameEvent('share_success', 'clipboard');
            } catch (copyErr) {
                showToast('Share failed');
                trackGameEvent('share_failed');
            }
        }
    }
}

/**
 * Copy text to clipboard with fallback
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
}

// =================================================================
// SERVICE WORKER REGISTRATION
// =================================================================

/**
 * Register Service Worker for PWA functionality
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }
}

// =================================================================
// BROWSER & DEVICE DETECTION
// =================================================================

/**
 * Check if device supports touch
 */
function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Check if device is mobile
 */
function isMobile() {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Check if browser supports PWA features
 */
function supportsPWA() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Check if app is running in standalone mode (installed PWA)
 */
function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
}

// =================================================================
// PERFORMANCE UTILITIES
// =================================================================

/**
 * Debounce function to limit rapid function calls
 */
function debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

/**
 * Throttle function to limit function calls to once per interval
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Simple deep clone for game state
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

// =================================================================
// MATH & GAME UTILITIES
// =================================================================

/**
 * Generate a random integer between min and max (inclusive)
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Get a random element from an array
 */
function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Calculate percentage
 */
function percentage(part, whole) {
    return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

// =================================================================
// VALIDATION UTILITIES
// =================================================================

/**
 * Check if coordinates are within board bounds
 */
function isValidCoordinate(coord, max = 8) {
    return coord >= 0 && coord <= max && Number.isInteger(coord);
}

/**
 * Validate board and cell indices
 */
function isValidBoardCell(boardIndex, cellIndex) {
    return isValidCoordinate(boardIndex) && isValidCoordinate(cellIndex);
}

/**
 * Check if a value is a valid player ('X' or 'O')
 */
function isValidPlayer(player) {
    return player === 'X' || player === 'O';
}

// =================================================================
// LOCAL STORAGE UTILITIES (for future features)
// =================================================================

/**
 * Safe localStorage getter with fallback
 */
function getLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.warn('LocalStorage get error:', error);
        return defaultValue;
    }
}

/**
 * Safe localStorage setter
 */
function setLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.warn('LocalStorage set error:', error);
        return false;
    }
}

/**
 * Remove item from localStorage
 */
function removeLocalStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.warn('LocalStorage remove error:', error);
        return false;
    }
}

/**
 * Clear all localStorage data for the app
 */
function clearLocalStorage() {
    try {
        localStorage.clear();
        return true;
    } catch (error) {
        console.warn('LocalStorage clear error:', error);
        return false;
    }
}

// =================================================================
// ERROR HANDLING & LOGGING
// =================================================================

/**
 * Safe console logging that won't break in production
 */
function safeLog(message, ...args) {
    if (typeof console !== 'undefined' && console.log) {
        console.log(`[TEN Game] ${message}`, ...args);
    }
}

/**
 * Safe error logging
 */
function safeError(message, error) {
    if (typeof console !== 'undefined' && console.error) {
        console.error(`[TEN Game Error] ${message}`, error);
    }
}

/**
 * Safe warning logging
 */
function safeWarn(message, ...args) {
    if (typeof console !== 'undefined' && console.warn) {
        console.warn(`[TEN Game Warning] ${message}`, ...args);
    }
}

// =================================================================
// TIMING UTILITIES
// =================================================================

/**
 * Create a cancellable timeout
 */
function createTimeout(callback, delay) {
    const timeoutId = setTimeout(callback, delay);
    return {
        id: timeoutId,
        cancel: () => clearTimeout(timeoutId)
    };
}

/**
 * Create a promise that resolves after a delay
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Measure execution time of a function
 */
function measureTime(func, label = 'Function') {
    const start = performance.now();
    const result = func();
    const end = performance.now();
    safeLog(`${label} took ${end - start} milliseconds`);
    return result;
}

// =================================================================
// URL & ROUTING UTILITIES (for future multiplayer)
// =================================================================

/**
 * Get URL parameters
 */
function getURLParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
}

/**
 * Update URL without page reload
 */
function updateURL(params) {
    const url = new URL(window.location);
    Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
            url.searchParams.set(key, params[key]);
        } else {
            url.searchParams.delete(key);
        }
    });
    window.history.pushState({}, '', url);
}

/**
 * Generate a unique game ID (for future multiplayer)
 */
function generateGameId() {
    return Math.random().toString(36).substr(2, 9);
}

// =================================================================
// ANIMATION UTILITIES
// =================================================================

/**
 * Animate element with CSS classes
 */
function animateElement(element, animationClass, duration = 1000) {
    return new Promise(resolve => {
        element.classList.add(animationClass);
        setTimeout(() => {
            element.classList.remove(animationClass);
            resolve();
        }, duration);
    });
}

/**
 * Fade in an element
 */
function fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.display = 'block';
    
    const start = performance.now();
    
    function animate(timestamp) {
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / duration, 1);
        
        element.style.opacity = progress.toString();
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }
    
    requestAnimationFrame(animate);
}

/**
 * Fade out an element
 */
function fadeOut(element, duration = 300) {
    const start = performance.now();
    const startOpacity = parseFloat(element.style.opacity) || 1;
    
    function animate(timestamp) {
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / duration, 1);
        
        element.style.opacity = (startOpacity * (1 - progress)).toString();
        
        if (progress >= 1) {
            element.style.display = 'none';
        } else {
            requestAnimationFrame(animate);
        }
    }
    
    requestAnimationFrame(animate);
}

// =================================================================
// GLOBAL EXPORTS
// =================================================================

// Make share function available globally
window.shareGame = shareGame;