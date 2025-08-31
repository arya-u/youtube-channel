/**
 * Configuration for the YouTube Channel Globe Visualizer
 * This file contains all configurable parameters for the application
 */

export const Config = {
    // Canvas configuration
    canvas: {
        backgroundColor: 'black', // Can be 'transparent', hex color, or rgba
        alpha: true, // Enable transparency
        antialias: true, // Enable antialiasing
        preserveDrawingBuffer: false // Set to true if you need to capture canvas content
    },
    
    // Globe configuration
    globe: {
        radius: 2,
        segments: 32,
        backgroundColor: 'transparent',
        dotColor: '#ffffff',
        dotCount: 200,
        dotSizeRange: [0.5, 2],
        rotationSpeed: 0.0003
    },

    // Particle system configuration
    particles: {
        enabled: true,
        count: 300,
        sphereRadius: 2.7, // Larger than main globe for visibility (globe.radius + 1)
        particleSize: 0.015, // Moderate size for good visibility
        particleColor: '#ffffff', // Changed to white for visibility
        opacity: 1,
        texture: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNSIgY3k9IjUiIHI9IjUiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=', // Simple white circle SVG
        material: {
            transparent: true, // Enable transparency
            depthTest: false,
            depthWrite: false,
            alphaTest: 0.5
        },
        // Trail configuration
        trails: {
            
            // Fade plane configuration for screen-space trails
            fadePlane: {
                enabled: true,
                opacity: 0.02, // Very low opacity for gradual fading (0.005-0.05)
                clearInterval: 5000, // Clear background every 5 seconds (milliseconds)
                particleOnly: true, // Only affect particles, not other elements
                color: 0x888888 // Fade color (black)
            }
        }
    },
    
    // Camera configuration
    camera: {
        fov: 15, // Reduced from 75 to minimize perspective distortion (fisheye effect)
        near: 0.1,
        far: 1000,
        position: [0, 0, 20] // Moved camera further back to compensate for narrow FOV
    },
    
    // Image projection options
    imageOptions: {
        targetSize: Math.PI / 8,
        cornerRadius: 32,
        padding: 10
    },
    
    // Projection material configuration
    projectionMaterial: {
        // Basic RGB texture properties (like connecting texture directly to output in Blender)
        texture: {
            enabled: true,       // Use direct texture mappin
        },
        
        
        // Material properties
        material: {
            transparent: true,
            side: 'DoubleSide',  // 'FrontSide', 'BackSide', or 'DoubleSide'
            depthTest: false,
            depthWrite: false,   // Disabled to allow proper transparency sorting
            alphaTest: 0.3       // Alpha cutoff for transparency (0.0 to 1.0)
        }
     },
     
     // Sample images to project (can be replaced with actual YouTube thumbnails)
    images: [
        'images/hqdefault (1).jpg',
        'images/hqdefault (2).jpg',
        'images/hqdefault (3).jpg',
        'images/hqdefault (4).jpg',
        'images/hqdefault (5).jpg',
        'images/hqdefault (6).jpg',
        'images/hqdefault (7).jpg',
        'images/hqdefault (8).jpg',
        'images/hqdefault (9).jpg',
        'images/hqdefault (10).jpg',
        'images/hqdefault (11).jpg',
        'images/hqdefault (12).jpg',
        'images/hqdefault (13).jpg',
        'images/hqdefault (14).jpg',
        'images/hqdefault (15).jpg',
        'images/hqdefault (16).jpg',
        'images/hqdefault (17).jpg',
        'images/hqdefault (18).jpg',
        'images/hqdefault (19).jpg',
        'images/hqdefault (20).jpg',
        'images/hqdefault (21).jpg',
        'images/hqdefault (22).jpg',
        'images/hqdefault (23).jpg',
        'images/hqdefault (24).jpg',
        'images/hqdefault (25).jpg',
        'images/hqdefault (26).jpg',
        'images/hqdefault (27).jpg',
        'images/hqdefault (28).jpg',
        'images/hqdefault (29).jpg',
        'images/hqdefault (1).jpg',
        'images/hqdefault (2).jpg',
        'images/hqdefault (3).jpg',
        'images/hqdefault (4).jpg',
        'images/hqdefault (5).jpg',
        'images/hqdefault (6).jpg',
        'images/hqdefault (7).jpg',
        'images/hqdefault (8).jpg',
        'images/hqdefault (9).jpg',
        'images/hqdefault (10).jpg',
        'images/hqdefault (11).jpg',
        'images/hqdefault (12).jpg',
        'images/hqdefault (13).jpg',
        'images/hqdefault (14).jpg',
        'images/hqdefault (15).jpg',
        'images/hqdefault (16).jpg',
        'images/hqdefault (17).jpg',
        'images/hqdefault (18).jpg',
        'images/hqdefault (19).jpg',
        'images/hqdefault (20).jpg',
        'images/hqdefault (21).jpg',
        'images/hqdefault (22).jpg',
        'images/hqdefault (23).jpg',
        'images/hqdefault (24).jpg',
        'images/hqdefault (25).jpg',
        'images/hqdefault (26).jpg',
        'images/hqdefault (27).jpg',
        'images/hqdefault (28).jpg',
        'images/hqdefault (29).jpg'
    ],
    
    // Animation sequences
    animations: {
        complexSequence: [
            {
                target: {
                    scale: { x: 0, y: 0, z: 0 },
                    position: { x: -8, y: 0, z: 0 }, // Adjusted for new camera distance
                    imageScale: 0.4 // Keep images at normal size initially
                },
                duration: 0,
                easing: 'Linear.None'
            },
            {
                target: {
                    scale: { x: 3, y: 3, z: 3 },
                    position: { x: -3, y: 0, z: 0 }, // Adjusted for new camera distance
                    imageScale: 0.4, // Keep images at normal size initially
                    rotationSpeed: 0.001 // Increase rotation speed during this phase
                },
                duration: 2000,
                easing: 'Quadratic.InOut'
            },
            {
                target: {
                    rotationSpeed: 0.05 // Increase rotation speed during this phase
                },
                delay: 1000,
                duration: 1000,
                easing: 'Quadratic.InOut'
            },
            {
                target: {
                    scale: { x: 1.8, y: 1.8, z: 1.8 },
                    position: { x: 2.2, y: 0.3, z: 0 }, // Adjusted for new camera distance
                    imageScale: 1, // Keep images at normal size initially
                    rotationSpeed: 0.05 // Increase rotation speed during this phase
                },
                duration: 1100,
                easing: 'Quadratic.InOut',
                onComplete: () => console.log('Initial animation complete')
            },
            {
                target: {
                    rotationSpeed: 0.005 // Increase rotation speed during this phase
                },
                duration: 1000,
                easing: 'Quadratic.InOut'
            }
        ]
    },
    
    // Responsive configuration
    responsive: {
        // Breakpoint definitions (min-width in pixels)
        breakpoints: {
            mobile: 0,
            tablet: 768,
            desktop: 1024,
            widescreen: 1440
        },
        
        // Shared timing configuration for all breakpoints
        // This ensures consistent timing across all responsive animations
        keyframeTiming: {
            // Phase 1: Initial appearance
            phase1: {
                duration: 0,
                delay: 0,
                easing: 'Linear.None'
            },
            // Phase 2: Scale up and position
            phase2: {
                duration: 1800,
                delay: 0,
                easing: 'Quadratic.InOut'
            },
            // Phase 3: Rotation burst (optional delay)
            phase3: {
                duration: 1000,
                delay: 1000,
                easing: 'Quadratic.InOut'
            },
            // Phase 4: Final positioning and scaling
            phase4: {
                duration: 1200,
                delay: 0,
                easing: 'Quadratic.InOut'
            },
            // Phase 5: Settle rotation
            phase5: {
                duration: 1000,
                delay: 0,
                easing: 'Quadratic.InOut'
            }
        },
        
        // Configuration for each breakpoint
        configs: {
            mobile: {
                // Mobile-specific camera settings
                camera: {
                    fov: 25, // Wider FOV for mobile to show more content
                    position: [0, 0, 15] // Closer camera for mobile
                },
                
                // Mobile-specific globe settings
                globe: {
                    radius: 1.5, // Smaller globe for mobile
                    rotationSpeed: 0.0007 // Slightly faster rotation
                },
                
                // Mobile-specific particle settings
                particles: {
                    count: 150, // Fewer particles for performance
                    sphereRadius: 2.0,
                    particleSize: 0.02 // Slightly larger particles for visibility
                },
                
                // Mobile animation sequence (uses shared timing)
                animationSequence: [
                    {
                        target: {
                            scale: { x: 0, y: 0, z: 0 },
                            position: { x: 0, y: -3, z: 0 }, // Start from bottom center
                            imageScale: 0.3
                        },
                        // Uses keyframeTiming.phase1
                        useKeyframe: 'phase1'
                    },
                    {
                        target: {
                            scale: { x: 2.5, y: 2.5, z: 2.5 },
                            position: { x: 0, y: 1, z: 0 }, // Move to upper center
                            imageScale: 0.3,
                            rotationSpeed: 0.004
                        },
                        // Uses keyframeTiming.phase2
                        useKeyframe: 'phase2'
                    },
                    {
                        target: {
                            rotationSpeed: 0.01
                        },
                        // Uses keyframeTiming.phase3
                        useKeyframe: 'phase3'
                    },
                    {
                        target: {
                            scale: { x: 1.2, y: 1.2, z: 1.2 },
                            position: { x: 2, y: 0, z: 0 }, // Center position
                            imageScale: 0.8
                        },
                        // Uses keyframeTiming.phase4
                        useKeyframe: 'phase4'
                    },
                    {
                        target: {
                            rotationSpeed: 0.02
                        },
                        // Uses keyframeTiming.phase5
                        useKeyframe: 'phase5'
                    }
                ]
            },
            
            tablet: {
                // Tablet-specific camera settings
                camera: {
                    fov: 20,
                    position: [0, 0, 18]
                },
                
                // Tablet-specific globe settings
                globe: {
                    radius: 1.8,
                    rotationSpeed: 0.0004
                },
                
                // Tablet-specific particle settings
                particles: {
                    count: 200,
                    sphereRadius: 2.3,
                    particleSize: 0.018
                },
                
                // Tablet animation sequence (uses shared timing)
                animationSequence: [
                    {
                        target: {
                            scale: { x: 0, y: 0, z: 0 },
                            position: { x: -4, y: 0, z: 0 },
                            imageScale: 0.35
                        },
                        useKeyframe: 'phase1'
                    },
                    {
                        target: {
                            scale: { x: 2.8, y: 2.8, z: 2.8 },
                            position: { x: -1.5, y: 0, z: 0 },
                            imageScale: 0.35,
                            rotationSpeed: 0.0015
                        },
                        useKeyframe: 'phase2'
                    },
                    {
                        target: {
                            rotationSpeed: 0.03
                        },
                        useKeyframe: 'phase3'
                    },
                    {
                        target: {
                            scale: { x: 1.7, y: 1.7, z: 1.7 },
                            position: { x: 3, y: 2.2, z: 0 },
                            imageScale: 0.9
                        },
                        useKeyframe: 'phase4'
                    },
                    {
                        target: {
                            rotationSpeed: 0.004
                        },
                        useKeyframe: 'phase5'
                    }
                ]
            },
            
            desktop: {
                // Desktop uses default settings from main config
                camera: {},
                globe: {},
                particles: {},
                
                // Desktop animation sequence (uses shared timing)
                animationSequence: [
                    {
                        target: {
                            scale: { x: 0, y: 0, z: 0 },
                            position: { x: -8, y: 0, z: 0 },
                            imageScale: 0.4
                        },
                        useKeyframe: 'phase1'
                    },
                    {
                        target: {
                            scale: { x: 3, y: 3, z: 3 },
                            position: { x: -3, y: 0, z: 0 },
                            imageScale: 0.4,
                            rotationSpeed: 0.001
                        },
                        useKeyframe: 'phase2'
                    },
                    {
                        target: {
                            rotationSpeed: 0.05
                        },
                        useKeyframe: 'phase3'
                    },
                    {
                        target: {
                            scale: { x: 1.8, y: 1.8, z: 1.8 },
                            position: { x: 4.2, y: 0.3, z: 0 },
                            imageScale: 1
                        },
                        useKeyframe: 'phase4',
                        onComplete: () => console.log('Desktop animation complete')
                    },
                    {
                        target: {
                            rotationSpeed: 0.005
                        },
                        useKeyframe: 'phase5'
                    }
                ]
            },
            
            widescreen: {
                // Widescreen-specific settings
                camera: {
                    fov: 12, // Even narrower FOV for widescreen
                    position: [0, 0, 25] // Further back camera
                },
                
                globe: {
                    radius: 2.5, // Larger globe for widescreen
                    rotationSpeed: 0.0002
                },
                
                particles: {
                    count: 400, // More particles for widescreen
                    sphereRadius: 3.2,
                    particleSize: 0.012
                },
                
                // Widescreen animation sequence (uses shared timing)
                animationSequence: [
                    {
                        target: {
                            scale: { x: 0, y: 0, z: 0 },
                            position: { x: -12, y: 0, z: 0 },
                            imageScale: 0.5
                        },
                        useKeyframe: 'phase1'
                    },
                    {
                        target: {
                            scale: { x: 3.5, y: 3.5, z: 3.5 },
                            position: { x: -4, y: 0, z: 0 },
                            imageScale: 0.5,
                            rotationSpeed: 0.0008
                        },
                        useKeyframe: 'phase2'
                    },
                    {
                        target: {
                            rotationSpeed: 0.04
                        },
                        useKeyframe: 'phase3'
                    },
                    {
                        target: {
                            scale: { x: 2.2, y: 2.2, z: 2.2 },
                            position: { x: 3, y: 0.4, z: 0 },
                            imageScale: 1.2
                        },
                        useKeyframe: 'phase4',
                        onComplete: () => console.log('Widescreen animation complete')
                    },
                    {
                        target: {
                            rotationSpeed: 0.004
                        },
                        useKeyframe: 'phase5'
                    }
                ]
            }
        }
    }
};