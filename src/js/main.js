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
            console.log('Destroying globe visualization...');
            
            try {
                // Stop all animations first
                if (responsiveVisualizer && responsiveVisualizer.animationManager) {
                    responsiveVisualizer.animationManager.stop();
                }
            } catch (error) {
                console.warn('Error stopping animations:', error);
            }
            
            try {
                // Clean up responsive visualizer
                if (responsiveVisualizer) {
                    responsiveVisualizer.destroy();
                }
            } catch (error) {
                console.warn('Error destroying responsive visualizer:', error);
            }
            
            try {
                // Clean up image projector
                if (projector) {
                    // Stop any ongoing image loading or processing
                    if (projector.dispose) {
                        projector.dispose();
                    }
                }
            } catch (error) {
                console.warn('Error disposing image projector:', error);
            }
            
            try {
                // Clean up Three.js resources
                if (globe) {
                    // Dispose of globe visualizer resources
                    if (globe.dispose) {
                        globe.dispose();
                    }
                    
                    // Clean up scene objects
                    if (globe.getScene) {
                        const scene = globe.getScene();
                        while (scene.children.length > 0) {
                            const child = scene.children[0];
                            scene.remove(child);
                            
                            // Dispose of geometries and materials
                            if (child.geometry) {
                                child.geometry.dispose();
                            }
                            if (child.material) {
                                if (Array.isArray(child.material)) {
                                    child.material.forEach(material => material.dispose());
                                } else {
                                    child.material.dispose();
                                }
                            }
                        }
                    }
                    
                    // Dispose of renderer
                    if (globe.getRenderer) {
                        const renderer = globe.getRenderer();
                        if (renderer) {
                            renderer.dispose();
                            renderer.forceContextLoss();
                            renderer.domElement = null;
                        }
                    }
                }
            } catch (error) {
                console.warn('Error disposing Three.js resources:', error);
            }
            
            try {
                // Remove event listeners
                window.removeEventListener('resize', resizeHandler);
            } catch (error) {
                console.warn('Error removing event listeners:', error);
            }
            
            try {
                // Remove container from DOM
                if (container && container.parentNode) {
                    container.parentNode.removeChild(container);
                }
            } catch (error) {
                console.warn('Error removing container from DOM:', error);
            }
            
            try {
                // Clear any remaining timeouts or intervals
                if (typeof window !== 'undefined') {
                    // Clear any animation frames
                    if (window.requestAnimationFrame) {
                        let id = window.requestAnimationFrame(() => {});
                        while (id--) {
                            window.cancelAnimationFrame(id);
                        }
                    }
                }
            } catch (error) {
                console.warn('Error clearing timeouts/intervals:', error);
            }
            
            console.log('Globe visualization destroyed successfully.');
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