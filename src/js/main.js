/**
 * Main API entry point for the Globe Visualizer
 * Provides a clean, self-contained package interface
 */

// Import core modules
import { GlobeVisualizer } from './components/GlobeVisualizer.js';
import { ImageProjector } from './components/ImageProjector.js';
import { ResponsiveGlobeVisualizer } from './ResponsiveIntegration.js';
import { Config } from './config.js';
import { injectStyles } from './styles.js';

/**
 * Deep merge utility function
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(result[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    }
    
    return result;
}

/**
 * Create welcome overlay animation
 * @param {string} name - The name to display in the second animation step
 * @param {HTMLElement} container - Container element to append overlay to
 */
function createWelcomeOverlay(name = 'User', container = document.body) {
    // Create overlay container
    const overlay = document.createElement('div');
    overlay.className = 'globe-welcome-overlay';
    
    // Create text elements
    const welcomeText = document.createElement('div');
    welcomeText.className = 'globe-welcome-text welcome';
    welcomeText.textContent = 'Welcome';
    
    const nameText = document.createElement('div');
    nameText.className = 'globe-welcome-text name';
    nameText.textContent = name;
    
    const letsGoText = document.createElement('div');
    letsGoText.className = 'globe-welcome-text lets-go';
    letsGoText.textContent = "Let's go global";
    
    // Append text elements to overlay
    overlay.appendChild(welcomeText);
    overlay.appendChild(nameText);
    overlay.appendChild(letsGoText);
    
    // Add overlay to container
    container.appendChild(overlay);
    
    // Mark overlay as complete after animations finish
    setTimeout(() => {
        overlay.classList.add('complete');
    }, 8500);
    
    return overlay;
}

/**
 * Create a container element for the globe
 * @param {HTMLElement} targetElement - Element to append the container to
 * @returns {HTMLElement} The created container
 */
function createGlobeContainer(targetElement = document.body) {
    const container = document.createElement('div');
    container.className = 'globe-visualizer-container';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.position = 'relative';
    
    targetElement.appendChild(container);
    return container;
}

/**
 * Main API function to initiate the globe visualizer
 * @param {string} name - Name to display in welcome animation
 * @param {Array<string>} images - Array of image URLs/paths to project on the globe
 * @param {Object} overrides - Configuration overrides (optional)
 * @param {Function} callback - Callback function to call when animations are complete (optional)
 * @param {HTMLElement} targetElement - Target element to append the globe to (optional, defaults to document.body)
 * @returns {Object} Globe API object with control methods
 */
function initiateGlobe(name = 'User', images = [], overrides = {}, callback = null, targetElement = document.body) {
    // Inject required styles
    injectStyles();
    
    // Create configuration with overrides
    const config = deepMerge(Config, overrides);
    
    // Update images in config
    if (images && images.length > 0) {
        config.images = images;
    }
    
    // Create container for the globe
    const container = createGlobeContainer(targetElement);
    
    // Create welcome overlay
    const overlay = createWelcomeOverlay(name, container);
    
    // Create the globe visualizer with merged configuration
    const globe = new GlobeVisualizer(config);
    
    // Add the renderer to the container
    container.appendChild(globe.getRenderer().domElement);
    
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
    const resizeHandler = () => {
        globe.handleResize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', resizeHandler);
    
    // Start the animation loop with depth effects
    globe.startAnimation(responsiveVisualizer.animationManager, projector);
    
    // If there are images to project, load them
    if (config.images && config.images.length > 0) {
        projector.projectImagesSpherically(config.images, config.imageOptions);
    }
    
    // Start responsive animations
    responsiveVisualizer.startAnimations();
    
    // Set up animation completion callback
    if (callback && typeof callback === 'function') {
        // Monitor animation completion
        // The welcome overlay completes after 10 seconds (8.5s + 1.5s buffer)
        // The responsive animations complete based on the animation sequence
        const totalAnimationTime = 10500; // 10.5 seconds total
        
        setTimeout(() => {
            try {
                callback();
            } catch (error) {
                console.error('Error in animation completion callback:', error);
            }
        }, totalAnimationTime);
    }
    
    // Return API object for controlling the globe
    return {
        /**
         * Destroy the globe and clean up resources
         */
        destroy: () => {
            // Remove event listeners
            window.removeEventListener('resize', resizeHandler);
            
            // Remove container from DOM
            if (container && container.parentNode) {
                container.parentNode.removeChild(container);
            }
            
            // Clean up Three.js resources
            if (globe) {
                globe.dispose && globe.dispose();
            }
        },
        
        /**
         * Update fade plane configuration
         * @param {Object} config - New fade plane configuration
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
         * Get current breakpoint
         */
        getCurrentBreakpoint: () => {
            return responsiveVisualizer.responsiveManager.getCurrentBreakpoint();
        },
        
        /**
         * Get the container element
         */
        getContainer: () => container,
        
        /**
         * Get the globe visualizer instance
         */
        getGlobe: () => globe,
        
        /**
         * Get the responsive visualizer instance
         */
        getResponsiveVisualizer: () => responsiveVisualizer
    };
}

// Export the main API function as default for UMD bundle
export default initiateGlobe;

// Also export as named export for ES modules
export { initiateGlobe };

// Also expose globally for script tag usage
if (typeof window !== 'undefined') {
    window.initiateGlobe = initiateGlobe;
}