/**
 * Main entry point for the YouTube Channel Globe Visualizer
 */

// Import core modules
import { GlobeVisualizer } from './components/GlobeVisualizer.js';
import { AnimationManager } from './components/AnimationManager.js';
import { ImageProjector } from './components/ImageProjector.js';
import { ResponsiveGlobeVisualizer } from './ResponsiveIntegration.js';
import { Config } from './config.js';

/**
 * Create welcome overlay animation
 * @param {string} name - The name to display in the second animation step
 */
function createWelcomeOverlay(name = 'User') {
    // Create overlay container
    const overlay = document.createElement('div');
    overlay.className = 'welcome-overlay';
    
    // Create text elements
    const welcomeText = document.createElement('div');
    welcomeText.className = 'welcome-text welcome';
    welcomeText.textContent = 'Welcome';
    
    const nameText = document.createElement('div');
    nameText.className = 'welcome-text name';
    nameText.textContent = name;
    
    const letsGoText = document.createElement('div');
    letsGoText.className = 'welcome-text lets-go';
    letsGoText.textContent = "Let's go global";
    
    // Append text elements to overlay
    overlay.appendChild(welcomeText);
    overlay.appendChild(nameText);
    overlay.appendChild(letsGoText);
    
    // Add overlay to body
    document.body.appendChild(overlay);
    
    // Mark overlay as complete after animations finish
    setTimeout(() => {
        overlay.classList.add('complete');
    }, 8500);
    
    return overlay;
}

/**
 * Initialize the globe visualizer
 * @param {Object} options - Initialization options
 * @param {string} options.name - Name to display in welcome animation
 * @param {Array} options.images - Images to project on the globe
 */
function initializeGlobe(options = {}) {
    const { name = 'User', images = Config.images } = options;
    
    // Create welcome overlay
    createWelcomeOverlay(name);
    
    // Update config with provided images
    if (images) {
        Config.images = images;
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create welcome overlay by default
    createWelcomeOverlay('User');
    
    // Create the globe visualizer with configuration
    const globe = new GlobeVisualizer(Config);
    
    // Add the renderer to the DOM
    document.body.appendChild(globe.getRenderer().domElement);
    
    // Create image projector with camera reference for depth effects
    const projector = new ImageProjector(globe.getSphere(), globe.getCamera(), globe.getGradientManager());
    
    // Create responsive globe visualizer
    const responsiveVisualizer = new ResponsiveGlobeVisualizer({
        target: globe.getSphere(),
        imageProjector: projector,
        globeVisualizer: globe,
        camera: globe.getCamera(),
        scene: globe.getScene()
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        globe.handleResize(window.innerWidth, window.innerHeight);
    });
    
    // Start the animation loop with depth effects
    globe.startAnimation(responsiveVisualizer.animationManager, projector);
    
    // If there are images to project, load them
    if (Config.images && Config.images.length > 0) {
        projector.projectImagesSpherically(Config.images, Config.imageOptions);
    }
    
    // Start responsive animations
    responsiveVisualizer.startAnimations();
    
    // Expose global API for runtime configuration
    window.GlobeAPI = {
        /**
         * Update fade plane configuration
         * @param {Object} config - New fade plane configuration
         * @param {number} config.opacity - Fade opacity (0.005-0.05)
         * @param {number} config.clearInterval - Clear interval in milliseconds
         * @param {boolean} config.particleOnly - Only affect particles
         * @param {number} config.color - Fade color (hex)
         */
        updateFadePlane: (config) => {
            globe.updateFadePlaneConfig(config);
        },
        
        /**
         * Clear trails immediately
         */
        clearTrails: () => {
            globe.clearTrails();
        },
        
        /**
         * Get current fade plane configuration
         */
        getFadePlaneConfig: () => {
            return Config.particles.trails.fadePlane;
        },
        
        /**
         * Enable/disable fade plane
         * @param {boolean} enabled - Whether to enable fade plane
         */
        setFadePlaneEnabled: (enabled) => {
            globe.updateFadePlaneConfig({ enabled });
        },
        
        /**
         * Get responsive visualizer instance
         */
        getResponsiveVisualizer: () => {
            return responsiveVisualizer;
        },
        
        /**
         * Get current breakpoint
         */
        getCurrentBreakpoint: () => {
            return responsiveVisualizer.responsiveManager.getCurrentBreakpoint();
        },
        
        /**
         * Force breakpoint update (for testing)
         */
        updateBreakpoint: () => {
            responsiveVisualizer.responsiveManager.updateBreakpoint();
        },
        
        /**
         * Initialize welcome overlay with custom name
         * @param {string} name - Name to display in welcome animation
         */
        showWelcomeOverlay: (name) => {
            createWelcomeOverlay(name);
        }
    };
});

// Expose initializeGlobe function globally
window.initializeGlobe = initializeGlobe;