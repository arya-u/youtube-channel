/**
 * AnimationManager.js
 * Manages animations for the globe visualization
 */

import * as TWEEN from '@tweenjs/tween.js';

export class AnimationManager {
    /**
     * Create a new AnimationManager
     * @param {THREE.Mesh} target - The target object to animate (usually the sphere)
     * @param {ImageProjector} imageProjector - Optional image projector for animating projected images
     * @param {GlobeVisualizer} globeVisualizer - Optional globe visualizer for animating rotation speed
     * @param {ResponsiveManager} responsiveManager - Optional responsive manager for breakpoint-aware animations
     */
    constructor(target, imageProjector = null, globeVisualizer = null, responsiveManager = null) {
        this.target = target;
        this.imageProjector = imageProjector;
        this.globeVisualizer = globeVisualizer;
        this.responsiveManager = responsiveManager;
        this.queue = [];
        this.currentAnimation = null;
        this.lastImageScale = null; // Track last imageScale to avoid unnecessary updates
        this.lastRotationSpeed = null; // Track last rotationSpeed to avoid unnecessary updates
        this.isResponsiveMode = false; // Track if responsive mode is enabled
    }

    /**
     * Add an animation to the sequence
     * @param {Object} params - Animation parameters
     * @param {Object} params.target - Target values for the animation
     * @param {number} params.duration - Duration in milliseconds
     * @param {number} params.delay - Delay before starting in milliseconds
     * @param {string} params.easing - Easing function name (e.g., 'Quadratic.InOut')
     * @param {Function} params.onComplete - Callback when animation completes
     * @returns {AnimationManager} - For chaining
     */
    add(params) {
        // Process keyframe timing if useKeyframe is specified
        if (params.useKeyframe && this.responsiveManager && this.isResponsiveMode) {
            const keyframeTiming = this.responsiveManager.getKeyframeTiming(params.useKeyframe);
            if (keyframeTiming) {
                // Override timing parameters with keyframe values
                params = {
                    ...params,
                    duration: keyframeTiming.duration,
                    easing: keyframeTiming.easing,
                    delay: keyframeTiming.delay
                };
            }
        }
        
        this.queue.push(params);
        if (!this.currentAnimation) {
            this.playNext();
        }
        return this; // For chaining
    }

    /**
     * Play the next animation in the queue
     */
    playNext() {
        if (this.queue.length === 0) {
            this.currentAnimation = null;
            return;
        }

        const params = this.queue.shift();
        const easingFunc = this.getEasingFunction(params.easing || 'Quadratic.InOut');

        // Create a tween for the current state
        const currentState = {
            scale: { x: this.target.scale.x, y: this.target.scale.y, z: this.target.scale.z },
            position: { x: this.target.position.x, y: this.target.position.y, z: this.target.position.z },
            rotation: { x: this.target.rotation.x, y: this.target.rotation.y, z: this.target.rotation.z },
            imageScale: this.imageProjector ? this.imageProjector.sizeMultiplier : 1.0, // Current scale multiplier for projected images
            rotationSpeed: this.globeVisualizer ? this.globeVisualizer.continuousRotation.speed : 0.0003 // Current rotation speed
        };

        // Create target state matching the structure of current state
        const targetState = {
            scale: { ...currentState.scale },
            position: { ...currentState.position },
            rotation: {
                x: currentState.rotation.x,
                y: currentState.rotation.y,
                z: currentState.rotation.z
            },
            imageScale: currentState.imageScale,
            rotationSpeed: currentState.rotationSpeed
        };

        // Update target state with provided values, excluding y rotation
        if (params.target.scale) {
            Object.assign(targetState.scale, params.target.scale);
        }
        if (params.target.position) {
            Object.assign(targetState.position, params.target.position);
        }
        if (params.target.rotation) {
            // Only apply x and z rotations from animations
            if (params.target.rotation.x !== undefined) targetState.rotation.x = params.target.rotation.x;
            if (params.target.rotation.z !== undefined) targetState.rotation.z = params.target.rotation.z;
        }
        if (params.target.imageScale !== undefined) {
            targetState.imageScale = params.target.imageScale;
        }
        if (params.target.rotationSpeed !== undefined) {
            targetState.rotationSpeed = params.target.rotationSpeed;
        }

        this.currentAnimation = new TWEEN.Tween(currentState)
            .to(targetState, params.duration)
            .easing(easingFunc)
            .delay(params.delay || 0)
            .onUpdate(() => {
                // Update scale
                this.target.scale.set(
                    currentState.scale.x,
                    currentState.scale.y,
                    currentState.scale.z
                );
                // Update position
                this.target.position.set(
                    currentState.position.x,
                    currentState.position.y,
                    currentState.position.z
                );
                // Update rotation, letting animate() handle y rotation
                this.target.rotation.x = currentState.rotation.x;
                this.target.rotation.z = currentState.rotation.z;
                
                // Update projected image sizes if imageProjector is available and value changed
                if (this.imageProjector && currentState.imageScale !== undefined) {
                    // Only update if imageScale has actually changed
                    if (this.lastImageScale !== currentState.imageScale) {
                        this.imageProjector.setSizeMultiplier(currentState.imageScale);
                        console.log('Image size multiplier updated:', currentState.imageScale);
                        this.lastImageScale = currentState.imageScale;
                    }
                }
                
                // Update rotation speed if globeVisualizer is available and value changed
                if (this.globeVisualizer && currentState.rotationSpeed !== undefined) {
                    // Only update if rotationSpeed has actually changed
                    if (this.lastRotationSpeed !== currentState.rotationSpeed) {
                        this.globeVisualizer.continuousRotation.speed = currentState.rotationSpeed;
                        console.log('Rotation speed updated:', currentState.rotationSpeed);
                        this.lastRotationSpeed = currentState.rotationSpeed;
                    }
                }
            })
            .onComplete(() => {
                if (params.onComplete) {
                    params.onComplete();
                }
                this.playNext();
            })
            .start();
    }

    /**
     * Get the easing function from TWEEN.js
     * @param {string} name - Name of the easing function (e.g., 'Quadratic.InOut')
     * @returns {Function} - The easing function
     */
    getEasingFunction(name) {
        const [type, style] = name.split('.');
        return TWEEN.Easing[type][style];
    }

    /**
     * Play a predefined animation sequence
     * @param {Array} sequence - Array of animation parameters
     */
    playSequence(sequence) {
        sequence.forEach(params => {
            // Process keyframe timing if useKeyframe is specified
            if (params.useKeyframe && this.responsiveManager && this.isResponsiveMode) {
                const keyframeTiming = this.responsiveManager.getKeyframeTiming(params.useKeyframe);
                if (keyframeTiming) {
                    // Override timing parameters with keyframe values
                    params = {
                        ...params,
                        duration: keyframeTiming.duration,
                        easing: keyframeTiming.easing,
                        delay: keyframeTiming.delay
                    };
                }
            }
            this.add(params);
        });
    }

    /**
     * Update the animation system
     * Should be called in the animation loop
     */
    update() {
        TWEEN.update();
    }

    /**
     * Stop all animations and clear the queue
     */
    stop() {
        if (this.currentAnimation) {
            this.currentAnimation.stop();
            this.currentAnimation = null;
        }
        this.queue = [];
    }

    /**
     * Enable responsive mode
     * When enabled, animations will automatically adapt to viewport changes
     */
    enableResponsiveMode() {
        this.isResponsiveMode = true;
        if (this.responsiveManager) {
            console.log('Responsive animation mode enabled');
        } else {
            console.warn('ResponsiveManager not provided - responsive mode disabled');
            this.isResponsiveMode = false;
        }
    }

    /**
     * Disable responsive mode
     */
    disableResponsiveMode() {
        this.isResponsiveMode = false;
        console.log('Responsive animation mode disabled');
    }

    /**
     * Play responsive animation sequence based on current breakpoint
     */
    playResponsiveSequence() {
        if (!this.isResponsiveMode || !this.responsiveManager) {
            console.warn('Responsive mode not enabled or ResponsiveManager not available');
            return;
        }

        const sequence = this.responsiveManager.getCurrentAnimationSequence();
        const breakpoint = this.responsiveManager.getCurrentBreakpoint();
        
        console.log(`Playing responsive animation sequence for breakpoint: ${breakpoint}`);
        this.playSequence(sequence);
    }

    /**
     * Set the responsive manager
     * @param {ResponsiveManager} responsiveManager - The responsive manager instance
     */
    setResponsiveManager(responsiveManager) {
        this.responsiveManager = responsiveManager;
        if (this.isResponsiveMode) {
            console.log('ResponsiveManager updated for AnimationManager');
        }
    }

    /**
     * Get responsive animation parameters for current breakpoint
     * @param {Object} baseParams - Base animation parameters
     * @returns {Object} Responsive animation parameters
     */
    getResponsiveParams(baseParams) {
        if (!this.isResponsiveMode || !this.responsiveManager) {
            return baseParams;
        }

        const breakpoint = this.responsiveManager.getCurrentBreakpoint();
        const viewport = this.responsiveManager.getViewportDimensions();
        
        // Create responsive modifications based on breakpoint
        const responsiveParams = { ...baseParams };
        
        // Adjust animation parameters based on viewport
        if (breakpoint === 'mobile') {
            // Mobile optimizations
            if (responsiveParams.duration) {
                responsiveParams.duration *= 0.8; // Faster animations on mobile
            }
            if (responsiveParams.target && responsiveParams.target.position) {
                // Adjust positions for mobile viewport
                responsiveParams.target.position.x *= 0.5;
                responsiveParams.target.position.y *= 0.7;
            }
        } else if (breakpoint === 'widescreen') {
            // Widescreen optimizations
            if (responsiveParams.duration) {
                responsiveParams.duration *= 1.2; // Slower, more dramatic animations
            }
            if (responsiveParams.target && responsiveParams.target.position) {
                // Enhance positions for widescreen
                responsiveParams.target.position.x *= 1.3;
            }
        }
        
        return responsiveParams;
    }

    /**
     * Add animation with responsive adjustments
     * @param {Object} params - Animation parameters
     * @returns {AnimationManager} - For chaining
     */
    addResponsive(params) {
        const responsiveParams = this.getResponsiveParams(params);
        return this.add(responsiveParams);
    }

    /**
     * Add animation with keyframe timing support
     * @param {Object} target - Target values for the animation
     * @param {number} duration - Duration in milliseconds
     * @param {string} easing - Easing function name
     * @param {number} delay - Delay before starting
     * @param {Function} onComplete - Callback when animation completes
     * @param {string} useKeyframe - Optional keyframe name for shared timing
     * @returns {Object} - Animation object
     */
    addAnimation(target, duration = 1000, easing = 'Linear.None', delay = 0, onComplete = null, useKeyframe = null) {
        // If useKeyframe is specified and we have a responsive manager, use shared timing
        if (useKeyframe && this.responsiveManager && this.isResponsiveMode) {
            const keyframeTiming = this.responsiveManager.getKeyframeTiming(useKeyframe);
            if (keyframeTiming) {
                duration = keyframeTiming.duration;
                easing = keyframeTiming.easing;
                delay = keyframeTiming.delay;
            }
        }
        
        const animation = {
            target,
            duration,
            easing,
            delay,
            onComplete,
            useKeyframe
        };
        this.queue.push(animation);
        return animation;
    }

    /**
     * Add responsive animation with keyframe support
     * @param {Object} animationConfig - Animation configuration
     * @returns {Object|null} - Animation object or null if responsive mode not enabled
     */
    addResponsiveAnimation(animationConfig) {
        if (!this.isResponsiveMode || !this.responsiveManager) {
            console.warn('Responsive mode not enabled or ResponsiveManager not set');
            return null;
        }
        
        const { target, duration = 1000, easing = 'Linear.None', delay = 0, onComplete = null, useKeyframe = null } = animationConfig;
        return this.addAnimation(target, duration, easing, delay, onComplete, useKeyframe);
    }

    /**
     * Handle breakpoint change event
     * @param {string} newBreakpoint - New breakpoint name
     * @param {string} previousBreakpoint - Previous breakpoint name
     */
    onBreakpointChange(newBreakpoint, previousBreakpoint) {
        if (!this.isResponsiveMode) {
            return;
        }

        console.log(`AnimationManager: Breakpoint changed from ${previousBreakpoint} to ${newBreakpoint}`);
        
        // Stop current animations
        this.stop();
        
        // Start new responsive sequence after a brief delay
        setTimeout(() => {
            this.playResponsiveSequence();
        }, 100);
    }

    /**
     * Get current responsive status
     * @returns {Object} Status object with responsive information
     */
    getResponsiveStatus() {
        return {
            isResponsiveMode: this.isResponsiveMode,
            hasResponsiveManager: !!this.responsiveManager,
            currentBreakpoint: this.responsiveManager ? this.responsiveManager.getCurrentBreakpoint() : null,
            viewport: this.responsiveManager ? this.responsiveManager.getViewportDimensions() : null
        };
    }
}