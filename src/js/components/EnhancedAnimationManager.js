/**
 * EnhancedAnimationManager.js
 * Extended AnimationManager with completion callback support
 */

import { AnimationManager } from './AnimationManager.js';

export class EnhancedAnimationManager extends AnimationManager {
    constructor(target, imageProjector = null, globeVisualizer = null, responsiveManager = null) {
        super(target, imageProjector, globeVisualizer, responsiveManager);
        this.completionCallbacks = [];
        this.sequenceCompletionCallbacks = [];
        this.isSequenceRunning = false;
        this.totalAnimationsInSequence = 0;
        this.completedAnimationsInSequence = 0;
    }

    /**
     * Add a callback to be called when all animations are complete
     * @param {Function} callback - Callback function
     */
    addCompletionCallback(callback) {
        if (typeof callback === 'function') {
            this.completionCallbacks.push(callback);
        }
    }

    /**
     * Add a callback to be called when a specific sequence is complete
     * @param {Function} callback - Callback function
     */
    addSequenceCompletionCallback(callback) {
        if (typeof callback === 'function') {
            this.sequenceCompletionCallbacks.push(callback);
        }
    }

    /**
     * Override the add method to track completion
     */
    add(params) {
        // Wrap the original onComplete callback
        const originalOnComplete = params.onComplete;
        params.onComplete = () => {
            // Call original callback if it exists
            if (originalOnComplete && typeof originalOnComplete === 'function') {
                originalOnComplete();
            }
            
            // Track sequence completion
            if (this.isSequenceRunning) {
                this.completedAnimationsInSequence++;
                this.checkSequenceCompletion();
            }
            
            // Check if all animations are complete
            this.checkAllAnimationsComplete();
        };
        
        return super.add(params);
    }

    /**
     * Override playSequence to track sequence completion
     */
    playSequence(sequence) {
        this.isSequenceRunning = true;
        this.totalAnimationsInSequence = sequence.length;
        this.completedAnimationsInSequence = 0;
        
        super.playSequence(sequence);
    }

    /**
     * Play responsive animation sequence with completion tracking
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
     * Check if the current sequence is complete
     */
    checkSequenceCompletion() {
        if (this.isSequenceRunning && 
            this.completedAnimationsInSequence >= this.totalAnimationsInSequence) {
            
            this.isSequenceRunning = false;
            
            // Call sequence completion callbacks
            this.sequenceCompletionCallbacks.forEach(callback => {
                try {
                    callback();
                } catch (error) {
                    console.error('Error in sequence completion callback:', error);
                }
            });
            
            console.log('Animation sequence completed');
        }
    }

    /**
     * Check if all animations are complete (queue empty and no current animation)
     */
    checkAllAnimationsComplete() {
        // Use setTimeout to check after current execution stack
        setTimeout(() => {
            if (this.queue.length === 0 && !this.currentAnimation) {
                // Call all completion callbacks
                this.completionCallbacks.forEach(callback => {
                    try {
                        callback();
                    } catch (error) {
                        console.error('Error in completion callback:', error);
                    }
                });
                
                console.log('All animations completed');
            }
        }, 10);
    }

    /**
     * Clear all completion callbacks
     */
    clearCompletionCallbacks() {
        this.completionCallbacks = [];
        this.sequenceCompletionCallbacks = [];
    }

    /**
     * Override stop to reset tracking
     */
    stop() {
        super.stop();
        this.isSequenceRunning = false;
        this.totalAnimationsInSequence = 0;
        this.completedAnimationsInSequence = 0;
    }

    /**
     * Get animation status including completion tracking
     */
    getAnimationStatus() {
        return {
            ...super.getResponsiveStatus(),
            isSequenceRunning: this.isSequenceRunning,
            totalAnimationsInSequence: this.totalAnimationsInSequence,
            completedAnimationsInSequence: this.completedAnimationsInSequence,
            queueLength: this.queue.length,
            hasCurrentAnimation: !!this.currentAnimation,
            completionCallbacksCount: this.completionCallbacks.length,
            sequenceCompletionCallbacksCount: this.sequenceCompletionCallbacks.length
        };
    }
}