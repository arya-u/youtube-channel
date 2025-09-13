/**
 * CSS styles for the Globe Visualizer
 * This module injects the required styles programmatically
 */

export function injectStyles() {
    // Check if styles are already injected
    if (document.getElementById('globe-visualizer-styles')) {
        return;
    }

    const styleElement = document.createElement('style');
    styleElement.id = 'globe-visualizer-styles';
    styleElement.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
        
        .globe-visualizer-container {
            position: relative;
            width: 100%;
            height: 100%;
        }
        
        .globe-visualizer-container canvas {
            display: block;
            background-color: transparent;
            mix-blend-mode: screen;
        }
        
        /* Welcome Animation Overlay */
        .globe-visualizer-container .globe-welcome-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            font-family: 'Inter', sans-serif;
        }
        
        .globe-visualizer-container .globe-welcome-text {
            font-size: clamp(2.5rem, 8vw, 12rem);
            font-weight: 900;
            color: black;
            text-align: center;
            opacity: 0;
            transform: scale(0.8);
            position: absolute;
            padding-left: clamp(20px, 5vw, 100px);
            padding-right: clamp(20px, 5vw, 100px);
            max-width: 90%;
            margin: 0 auto;
            word-wrap: break-word;
            white-space: normal;
            line-height: 1.1;
        }
        
        .globe-visualizer-container .globe-welcome-text::after {
            content: "";
            position: absolute;
            top: 20px;
            left: -20%;
            width: 120%;
            height: 120%;
            background-color: rgba(255, 255, 255, 1);
            border-radius: 1000px;
            filter: blur(50px);
            z-index: -1;
        }
        
        .globe-visualizer-container .globe-welcome-text.welcome {
            animation: globeTextAppearWelcome 1.2s ease-out forwards;
        }
        
        .globe-visualizer-container .globe-welcome-text.name {
            animation: globeTextAppear 4s ease-out 5s forwards;
        }
        
        .globe-visualizer-container .globe-welcome-text.lets-go {
            font-size: clamp(2rem, 6vw, 9rem);
            animation: globeTextAppearStays 1s ease-out 9.5s forwards;
        }
        
        @keyframes globeTextAppearWelcome {
            0% {
                opacity: 0;
                transform: scale(0.8) translateY(50px);
            }
            20% {
                opacity: 1;
                transform: scale(1.05) translateY(0);
            }
            80% {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
            100% {
                opacity: 0;
                transform: scale(0.9) translateY(-10px);
            }
        }
        
        @keyframes globeTextAppear {
            0% {
                opacity: 0;
                transform: scale(0.8) translateY(50px);
            }
            10% {
                opacity: 1;
                transform: scale(1.05) translateY(0);
            }
            95% {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
            100% {
                opacity: 0;
                transform: scale(0.9) translateY(-10px);
            }
        }
        
        @keyframes globeTextAppearStays {
            0% {
                opacity: 0;
                transform: scale(0.8) translateY(50px);
            }
            30% {
                opacity: 1;
                transform: scale(1.05) translateY(0);
            }
            100% {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
        
        /* Hide overlay after all animations complete */
        .globe-visualizer-container .globe-welcome-overlay.complete {
            animation: globeHideOverlay 0.5s ease-out 9s forwards;
        }
        
        @keyframes globeHideOverlay {
            to {
                opacity: 0;
                visibility: hidden;
            }
        }
    `;
    
    document.head.appendChild(styleElement);
}

export function removeStyles() {
    const styleElement = document.getElementById('globe-visualizer-styles');
    if (styleElement) {
        styleElement.remove();
    }
}