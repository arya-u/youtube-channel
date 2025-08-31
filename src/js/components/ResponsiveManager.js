/**
 * ResponsiveManager.js
 * Manages responsive behavior for the globe visualization
 * Provides different animation sequences and configurations based on viewport size
 */

export class ResponsiveManager {
    /**
     * Create a new ResponsiveManager
     * @param {Object} config - Configuration object containing breakpoints and responsive sequences
     * @param {AnimationManager} animationManager - Animation manager instance
     * @param {Function} onBreakpointChange - Callback when breakpoint changes
     */
    constructor(config, animationManager = null, onBreakpointChange = null) {
        this.config = config;
        this.animationManager = animationManager;
        this.onBreakpointChange = onBreakpointChange;
        this.currentBreakpoint = null;
        this.isInitialized = false;
        
        // Bind methods
        this.handleResize = this.handleResize.bind(this);
        
        // Initialize
        this.init();
    }

    /**
     * Initialize the responsive manager
     */
    init() {
        this.updateBreakpoint();
        this.addEventListeners();
        this.isInitialized = true;
    }

    /**
     * Add event listeners for viewport changes
     */
    addEventListeners() {
        window.addEventListener('resize', this.handleResize);
        window.addEventListener('orientationchange', this.handleResize);
    }

    /**
     * Remove event listeners
     */
    removeEventListeners() {
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('orientationchange', this.handleResize);
    }

    /**
     * Handle window resize events
     */
    handleResize() {
        // Debounce resize events
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            const previousBreakpoint = this.currentBreakpoint;
            this.updateBreakpoint();
            
            // If breakpoint changed, trigger callback and restart animations
            if (previousBreakpoint !== this.currentBreakpoint && this.isInitialized) {
                console.log(`Breakpoint changed from ${previousBreakpoint} to ${this.currentBreakpoint}`);
                
                if (this.onBreakpointChange) {
                    this.onBreakpointChange(this.currentBreakpoint, previousBreakpoint);
                }
                
                // Restart animations with new responsive sequence
                this.restartAnimations();
            }
        }, 150); // 150ms debounce
    }

    /**
     * Update the current breakpoint based on viewport width
     */
    updateBreakpoint() {
        const width = window.innerWidth;
        const breakpoints = this.config.responsive.breakpoints;
        
        let newBreakpoint = 'mobile'; // Default to mobile
        
        // Check breakpoints in order (largest to smallest)
        const sortedBreakpoints = Object.entries(breakpoints)
            .sort(([,a], [,b]) => b - a);
            
        for (const [name, minWidth] of sortedBreakpoints) {
            if (width >= minWidth) {
                newBreakpoint = name;
                break;
            }
        }
        
        this.currentBreakpoint = newBreakpoint;
    }

    /**
     * Get the current responsive configuration
     * @returns {Object} Current responsive config for the active breakpoint
     */
    getCurrentConfig() {
        const responsiveConfig = this.config.responsive.configs[this.currentBreakpoint];
        if (!responsiveConfig) {
            console.warn(`No responsive config found for breakpoint: ${this.currentBreakpoint}`);
            return this.config.responsive.configs.mobile || {}; // Fallback to mobile
        }
        return responsiveConfig;
    }

    /**
     * Get keyframe timing configuration
     * @param {string} keyframeName - Name of the keyframe (e.g., 'phase1', 'phase2')
     * @returns {Object|null} Keyframe timing configuration or null if not found
     */
    getKeyframeTiming(keyframeName) {
        if (!this.config.responsive.keyframeTiming) {
            console.warn('No keyframe timing configuration found in config');
            return null;
        }
        
        const timing = this.config.responsive.keyframeTiming[keyframeName];
        if (!timing) {
            console.warn(`Keyframe timing '${keyframeName}' not found`);
            return null;
        }
        
        return timing;
    }

    /**
     * Get the current animation sequence
     * @returns {Array} Animation sequence for the current breakpoint
     */
    getCurrentAnimationSequence() {
        const currentConfig = this.getCurrentConfig();
        return currentConfig.animationSequence || this.config.animations.complexSequence;
    }

    /**
     * Get responsive camera configuration
     * @returns {Object} Camera config for the current breakpoint
     */
    getResponsiveCameraConfig() {
        const currentConfig = this.getCurrentConfig();
        return {
            ...this.config.camera,
            ...currentConfig.camera
        };
    }

    /**
     * Get responsive globe configuration
     * @returns {Object} Globe config for the current breakpoint
     */
    getResponsiveGlobeConfig() {
        const currentConfig = this.getCurrentConfig();
        return {
            ...this.config.globe,
            ...currentConfig.globe
        };
    }

    /**
     * Get responsive particle configuration
     * @returns {Object} Particle config for the current breakpoint
     */
    getResponsiveParticleConfig() {
        const currentConfig = this.getCurrentConfig();
        return {
            ...this.config.particles,
            ...currentConfig.particles
        };
    }

    /**
     * Restart animations with the current responsive sequence
     */
    restartAnimations() {
        if (!this.animationManager) {
            console.warn('No animation manager provided to ResponsiveManager');
            return;
        }
        
        // Stop current animations
        this.animationManager.stop();
        
        // Start new sequence for current breakpoint
        const sequence = this.getCurrentAnimationSequence();
        this.animationManager.playSequence(sequence);
    }

    /**
     * Get the current breakpoint name
     * @returns {string} Current breakpoint name
     */
    getCurrentBreakpoint() {
        return this.currentBreakpoint;
    }

    /**
     * Check if current viewport matches a specific breakpoint
     * @param {string} breakpointName - Name of the breakpoint to check
     * @returns {boolean} True if current breakpoint matches
     */
    isBreakpoint(breakpointName) {
        return this.currentBreakpoint === breakpointName;
    }

    /**
     * Check if current viewport is mobile
     * @returns {boolean} True if mobile breakpoint
     */
    isMobile() {
        return this.isBreakpoint('mobile');
    }

    /**
     * Check if current viewport is tablet
     * @returns {boolean} True if tablet breakpoint
     */
    isTablet() {
        return this.isBreakpoint('tablet');
    }

    /**
     * Check if current viewport is desktop
     * @returns {boolean} True if desktop breakpoint
     */
    isDesktop() {
        return this.isBreakpoint('desktop') || this.isBreakpoint('widescreen');
    }

    /**
     * Get viewport dimensions
     * @returns {Object} Object with width and height
     */
    getViewportDimensions() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            aspectRatio: window.innerWidth / window.innerHeight
        };
    }

    /**
     * Destroy the responsive manager and clean up
     */
    destroy() {
        this.removeEventListeners();
        clearTimeout(this.resizeTimeout);
        this.animationManager = null;
        this.onBreakpointChange = null;
    }
}