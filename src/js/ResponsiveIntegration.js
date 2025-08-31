/**
 * ResponsiveIntegration.js
 * Example integration of ResponsiveManager with the Globe Visualizer
 * This file demonstrates how to set up responsive animations
 */

import { ResponsiveManager } from './components/ResponsiveManager.js';
import { AnimationManager } from './components/AnimationManager.js';
import { Config } from './config.js';

/**
 * ResponsiveGlobeVisualizer
 * Extends the main globe visualizer with responsive capabilities
 */
export class ResponsiveGlobeVisualizer {
    /**
     * Create a responsive globe visualizer
     * @param {Object} options - Configuration options
     * @param {THREE.Mesh} options.target - The target object to animate
     * @param {ImageProjector} options.imageProjector - Image projector instance
     * @param {GlobeVisualizer} options.globeVisualizer - Globe visualizer instance
     * @param {THREE.Camera} options.camera - Three.js camera
     * @param {THREE.Scene} options.scene - Three.js scene
     */
    constructor(options) {
        this.target = options.target;
        this.imageProjector = options.imageProjector;
        this.globeVisualizer = options.globeVisualizer;
        this.camera = options.camera;
        this.scene = options.scene;
        
        // Initialize managers
        this.animationManager = new AnimationManager(
            this.target,
            this.imageProjector,
            this.globeVisualizer
        );
        
        this.responsiveManager = new ResponsiveManager(
            Config,
            this.animationManager,
            this.onBreakpointChange.bind(this)
        );
        
        // Connect animation manager with responsive manager
        this.animationManager.setResponsiveManager(this.responsiveManager);
        this.animationManager.enableResponsiveMode();
        
        // Initialize responsive settings
        this.applyResponsiveSettings();
    }

    /**
     * Handle breakpoint changes
     * @param {string} newBreakpoint - New breakpoint name
     * @param {string} previousBreakpoint - Previous breakpoint name
     */
    onBreakpointChange(newBreakpoint, previousBreakpoint) {
        console.log(`Responsive Globe: Breakpoint changed from ${previousBreakpoint} to ${newBreakpoint}`);
        
        // Apply responsive settings for new breakpoint
        this.applyResponsiveSettings();
        
        // Notify animation manager
        this.animationManager.onBreakpointChange(newBreakpoint, previousBreakpoint);
        
        // Update other components if needed
        this.updateComponentsForBreakpoint(newBreakpoint);
    }

    /**
     * Apply responsive settings based on current breakpoint
     */
    applyResponsiveSettings() {
        const cameraConfig = this.responsiveManager.getResponsiveCameraConfig();
        const globeConfig = this.responsiveManager.getResponsiveGlobeConfig();
        const particleConfig = this.responsiveManager.getResponsiveParticleConfig();
        
        // Update camera settings
        this.updateCamera(cameraConfig);
        
        // Update globe settings
        this.updateGlobe(globeConfig);
        
        // Update particle settings
        this.updateParticles(particleConfig);
        
        console.log('Applied responsive settings for breakpoint:', this.responsiveManager.getCurrentBreakpoint());
    }

    /**
     * Update camera settings
     * @param {Object} cameraConfig - Camera configuration
     */
    updateCamera(cameraConfig) {
        if (this.camera) {
            // Update FOV
            if (cameraConfig.fov !== undefined) {
                this.camera.fov = cameraConfig.fov;
                this.camera.updateProjectionMatrix();
            }
            
            // Update position
            if (cameraConfig.position) {
                this.camera.position.set(...cameraConfig.position);
            }
            
            console.log('Camera updated for responsive breakpoint');
        }
    }

    /**
     * Update globe settings
     * @param {Object} globeConfig - Globe configuration
     */
    updateGlobe(globeConfig) {
        if (this.globeVisualizer) {
            // Update rotation speed
            if (globeConfig.rotationSpeed !== undefined) {
                this.globeVisualizer.continuousRotation.speed = globeConfig.rotationSpeed;
            }
            
            // Update globe radius (if supported)
            if (globeConfig.radius !== undefined && this.target) {
                const scale = globeConfig.radius / Config.globe.radius;
                // Note: This would require rebuilding the geometry for true radius change
                // For now, we'll use scale as an approximation
                console.log('Globe radius scaling:', scale);
            }
            
            console.log('Globe updated for responsive breakpoint');
        }
    }

    /**
     * Update particle settings
     * @param {Object} particleConfig - Particle configuration
     */
    updateParticles(particleConfig) {
        // This would require access to the particle system
        // Implementation depends on how particles are managed in the main visualizer
        console.log('Particle config for responsive breakpoint:', particleConfig);
    }

    /**
     * Update other components for breakpoint
     * @param {string} breakpoint - Current breakpoint
     */
    updateComponentsForBreakpoint(breakpoint) {
        // Update image projector settings if needed
        if (this.imageProjector) {
            const viewport = this.responsiveManager.getViewportDimensions();
            
            // Adjust image sizes based on viewport
            if (breakpoint === 'mobile') {
                this.imageProjector.setSizeMultiplier(0.7);
            } else if (breakpoint === 'tablet') {
                this.imageProjector.setSizeMultiplier(0.85);
            } else if (breakpoint === 'widescreen') {
                this.imageProjector.setSizeMultiplier(1.2);
            } else {
                this.imageProjector.setSizeMultiplier(1.0);
            }
        }
    }

    /**
     * Start responsive animations
     */
    startAnimations() {
        this.animationManager.playResponsiveSequence();
    }

    /**
     * Stop all animations
     */
    stopAnimations() {
        this.animationManager.stop();
    }

    /**
     * Get responsive status information
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            ...this.animationManager.getResponsiveStatus(),
            viewport: this.responsiveManager.getViewportDimensions()
        };
    }

    /**
     * Manually trigger breakpoint update
     * Useful for testing or forced updates
     */
    updateBreakpoint() {
        this.responsiveManager.handleResize();
    }

    /**
     * Add custom animation with responsive adjustments
     * @param {Object} animationParams - Animation parameters
     */
    addResponsiveAnimation(animationParams) {
        this.animationManager.addResponsive(animationParams);
    }

    /**
     * Play a custom responsive sequence
     * @param {Array} sequence - Animation sequence
     */
    playCustomResponsiveSequence(sequence) {
        // Apply responsive adjustments to each animation in the sequence
        const responsiveSequence = sequence.map(params => 
            this.animationManager.getResponsiveParams(params)
        );
        
        this.animationManager.playSequence(responsiveSequence);
    }

    /**
     * Update the animation loop
     * Should be called in the main render loop
     */
    update() {
        this.animationManager.update();
    }

    /**
     * Destroy the responsive visualizer and clean up
     */
    destroy() {
        this.animationManager.stop();
        this.responsiveManager.destroy();
        this.animationManager = null;
        this.responsiveManager = null;
    }
}

/**
 * Utility function to create a responsive globe visualizer
 * @param {Object} options - Configuration options
 * @returns {ResponsiveGlobeVisualizer} Configured responsive visualizer
 */
export function createResponsiveGlobeVisualizer(options) {
    return new ResponsiveGlobeVisualizer(options);
}

/**
 * Utility function to get responsive configuration for current viewport
 * @returns {Object} Current responsive configuration
 */
export function getCurrentResponsiveConfig() {
    const tempResponsiveManager = new ResponsiveManager(Config);
    const config = tempResponsiveManager.getCurrentConfig();
    tempResponsiveManager.destroy();
    return config;
}

/**
 * Utility function to check if current viewport is mobile
 * @returns {boolean} True if mobile viewport
 */
export function isMobileViewport() {
    return window.innerWidth < Config.responsive.breakpoints.tablet;
}

/**
 * Utility function to check if current viewport is tablet
 * @returns {boolean} True if tablet viewport
 */
export function isTabletViewport() {
    const width = window.innerWidth;
    return width >= Config.responsive.breakpoints.tablet && 
           width < Config.responsive.breakpoints.desktop;
}

/**
 * Utility function to check if current viewport is desktop
 * @returns {boolean} True if desktop viewport
 */
export function isDesktopViewport() {
    return window.innerWidth >= Config.responsive.breakpoints.desktop;
}