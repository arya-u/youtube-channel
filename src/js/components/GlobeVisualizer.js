/**
 * GlobeVisualizer.js
 * Core module for creating and managing the 3D globe visualization
 */

import * as THREE from 'three';
import { DepthEffectShader } from './DepthEffectShader.js';
import { Config } from '../config.js';
import { GradientManager } from './GradientManager.js';
import { ParticleSystem } from './ParticleSystem.js';

export class GlobeVisualizer {
    /**
     * Create a new GlobeVisualizer
     * @param {Object} config - Configuration options
     */
    constructor(config) {
        this.config = config;
        this.scene = new THREE.Scene();
        this.camera = this.createCamera();
        this.renderer = this.createRenderer();
        this.gradientManager = new GradientManager();
        this.sphere = this.createSphere();
        this.particleSystem = new ParticleSystem(this.sphere);
        this.depthEffectShader = null;
        this.lastTime = 0;
        // Lighting is disabled in config
        this.continuousRotation = {
            y: 0,
            speed: config.globe?.rotationSpeed || 0.000
        };
        
        // Create fade plane for trail effects
        this.createFadePlane();
    }

    /**
     * Create and configure the camera
     * @returns {THREE.PerspectiveCamera} The configured camera
     */
    createCamera() {
        const cameraConfig = this.config.camera || {};
        
        const camera = new THREE.PerspectiveCamera(
            cameraConfig.fov || 75,
            window.innerWidth / window.innerHeight,
            cameraConfig.near || 0.1,
            cameraConfig.far || 1000
        );
        
        const position = cameraConfig.position || [0, 0, 5];
        camera.position.set(position[0], position[1], position[2]);
        
        return camera;
    }

    /**
     * Create the WebGL renderer
     * @returns {THREE.WebGLRenderer}
     */
    createRenderer() {
        const canvasConfig = this.config.canvas || {};
        
        const renderer = new THREE.WebGLRenderer({
            alpha: canvasConfig.alpha !== undefined ? canvasConfig.alpha : true,
            antialias: canvasConfig.antialias !== undefined ? canvasConfig.antialias : true,
            preserveDrawingBuffer: true // Enable for trail effects
        });
        
        // Set canvas background color if specified
        if (canvasConfig.backgroundColor !== 'transparent') {
            renderer.setClearColor(canvasConfig.backgroundColor, 1.0);
        } else {
            // For transparent background, set clear color with alpha 0
            renderer.setClearColor(0x000000, 0);
        }
        
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        return renderer;
    }

    /**
     * Create gradient texture from black (closest to camera) to white (furthest)
     * @returns {THREE.CanvasTexture}
     */
    createGradientShader() {
        // Get sphere center (origin) and radius - initial values
        const sphereCenter = new THREE.Vector3(0, 0, 0);
        const sphereRadius = this.config.globe?.radius || 2;
        
        // Get camera position
        const cameraPos = this.camera.position.clone();
        
        // Calculate initial closest and furthest points in world coordinates
        const cameraDirection = cameraPos.clone().sub(sphereCenter).normalize();
        const closestPoint = sphereCenter.clone().add(cameraDirection.clone().multiplyScalar(sphereRadius));
        const furthestPoint = sphereCenter.clone().add(cameraDirection.clone().multiplyScalar(-sphereRadius));
        
        // Create shader material that calculates gradient based on world position
        const vertexShader = `
            varying vec3 vWorldPosition;
            
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        
        const fragmentShader = `
            uniform vec3 closestPoint;
            uniform vec3 furthestPoint;
            varying vec3 vWorldPosition;
            
            void main() {
                // Calculate distance from current world position to closest and furthest points
                float distToClosest = distance(vWorldPosition, closestPoint);
                float distToFurthest = distance(vWorldPosition, furthestPoint);
                
                // Calculate gradient value based on relative distances
                float totalDistance = distToClosest + distToFurthest;
                float gradientValue = distToClosest / totalDistance;
                
                // Make completely transparent
                gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
            }
        `;
        
        return new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: {
                closestPoint: { value: closestPoint },
                furthestPoint: { value: furthestPoint }
            },
            transparent: true,
            side: THREE.DoubleSide
        });
    }

    /**
     * Update the gradient shader based on current camera position
     */
    updateGradientShader() {
        if (this.sphere && this.sphere.material && this.sphere.material.uniforms) {
            // Update the sphere's world matrix to get current transformations
            this.sphere.updateMatrixWorld();
            
            // Get sphere's current world position and scale
            const sphereWorldPosition = new THREE.Vector3();
            const sphereScale = new THREE.Vector3();
            this.sphere.matrixWorld.decompose(sphereWorldPosition, new THREE.Quaternion(), sphereScale);
            
            // Calculate effective radius considering current scale
            const baseRadius = this.config.globe?.radius || 2;
            const effectiveRadius = baseRadius * Math.max(sphereScale.x, sphereScale.y, sphereScale.z);
            
            // Get camera position
            const cameraPos = this.camera.position.clone();
            
            // Calculate direction from sphere center to camera
            const cameraDirection = cameraPos.clone().sub(sphereWorldPosition).normalize();
            
            // Calculate closest and furthest points in world coordinates
            const closestPoint = sphereWorldPosition.clone().add(cameraDirection.clone().multiplyScalar(effectiveRadius));
            const furthestPoint = sphereWorldPosition.clone().add(cameraDirection.clone().multiplyScalar(-effectiveRadius));
            
            // Update shader uniforms
            this.sphere.material.uniforms.closestPoint.value = closestPoint;
            this.sphere.material.uniforms.furthestPoint.value = furthestPoint;
        }
    }

    // Dotted texture method removed - not used in current implementation

    /**
     * Create the sphere mesh
     * @returns {THREE.Mesh}
     */
    createSphere() {
        const radius = this.config.globe?.radius || 2;
        const segments = this.config.globe?.segments || 32;
        
        const geometry = new THREE.SphereGeometry(radius, segments, segments);
        
        // Create gradient shader material
        const gradientMaterial = this.createGradientShader();
        gradientMaterial.transparent = true;
        gradientMaterial.opacity = 0; // Make globe fully transparent
        
        const sphere = new THREE.Mesh(geometry, gradientMaterial);
        
        // Disable frustum culling to prevent disappearing when partially off-screen
        sphere.frustumCulled = false;
        
        this.scene.add(sphere);
        
        return sphere;
    }

    /**
     * Create fade plane for trail effects
     */
    createFadePlane() {
        const trailConfig = this.config.particles?.trails?.fadePlane;
        
        // Only create fade plane if enabled in config
        if (!trailConfig?.enabled) {
            // Just add camera to scene without fade plane
            this.scene.add(this.camera);
            return;
        }
        
        // If particleOnly is enabled, use render target approach
        if (trailConfig.particleOnly) {
            this.setupParticleOnlyTrails(trailConfig);
        } else {
            this.setupGlobalTrails(trailConfig);
        }
        
        // Set up periodic clearing if configured
        if (trailConfig.clearInterval && trailConfig.clearInterval > 0) {
            this.clearTimer = setInterval(() => {
                this.clearTrails();
            }, trailConfig.clearInterval);
        }
    }
    
    /**
     * Setup particle-only trails using render layers
     */
    setupParticleOnlyTrails(trailConfig) {
        // In particle-only mode, use renderOrder to control rendering sequence
        this.renderer.autoClearColor = false;
        
        // Create a fade plane that renders after particles with blur effect
        const fadeMaterial = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(trailConfig.color || 0x000000) },
                opacity: { value: trailConfig.opacity || 0.015 },
                blurAmount: { value: 2.0 },
                resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                uniform float opacity;
                uniform float blurAmount;
                uniform vec2 resolution;
                varying vec2 vUv;
                
                void main() {
                    vec2 center = vec2(0.5);
                    float dist = distance(vUv, center);
                    
                    // Create soft, blurred edge with gaussian-like falloff
                    float blur = 1.0 - smoothstep(0.0, blurAmount / min(resolution.x, resolution.y) * 100.0, dist);
                    float alpha = opacity * blur;
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            side: THREE.FrontSide,
            blending: THREE.CustomBlending,
            blendEquation: THREE.AddEquation,
            blendSrc: THREE.OneFactor,
            blendDst: THREE.OneMinusSrcColorFactor
        });
        
        const fadePlane = new THREE.PlaneGeometry(100, 100);
        this.fadeMesh = new THREE.Mesh(fadePlane, fadeMaterial);
        
        // Position plane in front of camera
        this.fadeMesh.position.z = -0.1;
        
        // Set render order: particles first (-1000), then fade plane (-999), then main objects (0)
        this.fadeMesh.renderOrder = -999;
        
        // Create Object3D to hold camera and fade plane together
        this.cameraGroup = new THREE.Object3D();
        this.cameraGroup.add(this.camera);
        this.cameraGroup.add(this.fadeMesh);
        
        // Add camera group to scene
        this.scene.add(this.cameraGroup);
        
        this.particleOnlyMode = true;
        this.trailConfig = trailConfig;
        
        // Set render orders for proper rendering sequence
        this.setupRenderOrder();
    }
    
    /**
     * Setup global trails affecting entire canvas
     */
    setupGlobalTrails(trailConfig) {
        // In global mode, disable auto clearing to create trail effects
        this.renderer.autoClearColor = false;
        
        // Create fade plane material with blur effect
        const fadeMaterial = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(trailConfig.color || 0x000000) },
                opacity: { value: trailConfig.opacity || 0.015 },
                blurAmount: { value: 2.0 },
                resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                uniform float opacity;
                uniform float blurAmount;
                uniform vec2 resolution;
                varying vec2 vUv;
                
                void main() {
                    vec2 center = vec2(0.5);
                    float dist = distance(vUv, center);
                    
                    // Create soft, blurred edge with gaussian-like falloff
                    float blur = 1.0 - smoothstep(0.0, blurAmount / min(resolution.x, resolution.y) * 100.0, dist);
                    float alpha = opacity * blur;
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        const fadePlane = new THREE.PlaneGeometry(100, 100); // Large plane to cover screen
        this.fadeMesh = new THREE.Mesh(fadePlane, fadeMaterial);
        
        // Position plane in front of camera
        this.fadeMesh.position.z = -0.1;
        
        // Make plane render before everything to fade previous frames
        this.fadeMesh.renderOrder = -1000;
        
        // Create Object3D to hold camera and fade plane together
        this.cameraGroup = new THREE.Object3D();
        this.cameraGroup.add(this.camera);
        this.cameraGroup.add(this.fadeMesh);
        
        // Add camera group to scene
        this.scene.add(this.cameraGroup);
        
        this.particleOnlyMode = false;
        
        // Reset render orders for global mode
        this.resetRenderOrder();
    }
    
    /**
     * Setup render order for particle-only mode
     * Particles render first, then fade plane, then main objects
     */
    setupRenderOrder() {
        // Set particles and trails to render first
        if (this.particleSystem) {
            this.particleSystem.setRenderOrder(-1000);
        }
        
        // Set main sphere and projected images to render last
        if (this.sphere) {
            this.sphere.renderOrder = 0;
            // Set all projected images to render after fade plane
            this.sphere.traverse((child) => {
                if (child !== this.sphere) {
                    child.renderOrder = 0;
                }
            });
        }
    }
    
    /**
     * Reset render order for global mode
     * Everything renders in default order
     */
    resetRenderOrder() {
        // Reset particles to default render order
        if (this.particleSystem) {
            this.particleSystem.setRenderOrder(0);
        }
        
        // Reset main sphere and projected images to default
        if (this.sphere) {
            this.sphere.renderOrder = 0;
            this.sphere.traverse((child) => {
                if (child !== this.sphere) {
                    child.renderOrder = 0;
                }
            });
        }
    }
    
    /**
     * Clear accumulated trails by temporarily increasing fade opacity
     */
    clearTrails() {
        if (this.particleOnlyMode) {
            // In particle-only mode, clear by temporarily hiding and showing particles
            if (this.particleSystem) {
                const particleGroup = this.particleSystem.getParticleGroup();
                const originalVisible = particleGroup.visible;
                particleGroup.visible = false;
                
                // Force a render to clear the trails
                this.renderer.render(this.scene, this.camera);
                
                // Restore visibility after a brief moment
                setTimeout(() => {
                    particleGroup.visible = originalVisible;
                }, 50);
            }
        } else if (this.fadeMesh) {
            // In global mode, use fade plane
            const originalOpacity = this.fadeMesh.material.opacity;
            this.fadeMesh.material.opacity = 0.3; // Temporarily increase opacity to clear
            
            // Reset to original opacity after a brief moment
            setTimeout(() => {
                if (this.fadeMesh) {
                    this.fadeMesh.material.opacity = originalOpacity;
                }
            }, 100);
        }
    }
    
    /**
     * Update fade plane configuration
     * @param {Object} newConfig - New fade plane configuration
     */
    updateFadePlaneConfig(newConfig) {
        const trailConfig = { ...this.config.particles.trails.fadePlane, ...newConfig };
        
        // Update material properties only if in global mode
        if (!this.particleOnlyMode && this.fadeMesh) {
            this.fadeMesh.material.opacity = trailConfig.opacity || 0.015;
            this.fadeMesh.material.color.setHex(trailConfig.color || 0x000000);
        }
        
        // Update clear interval for both modes
        if (this.clearTimer) {
            clearInterval(this.clearTimer);
        }
        
        if (trailConfig.clearInterval && trailConfig.clearInterval > 0) {
            this.clearTimer = setInterval(() => {
                this.clearTrails();
            }, trailConfig.clearInterval);
        }
        
        // Update config
        this.config.particles.trails.fadePlane = trailConfig;
        
        // If switching between modes, recreate the fade plane setup
        if (newConfig.hasOwnProperty('particleOnly') && newConfig.particleOnly !== this.particleOnlyMode) {
            this.recreateFadePlane();
        }
    }
    
    /**
     * Recreate fade plane setup when switching modes
     */
    recreateFadePlane() {
        // Clean up existing setup
        if (this.fadeMesh) {
            if (this.cameraGroup) {
                this.cameraGroup.remove(this.fadeMesh);
                this.scene.remove(this.cameraGroup);
            }
            this.fadeMesh = null;
            this.cameraGroup = null;
        }
        
        if (this.camera.parent) {
            this.camera.parent.remove(this.camera);
        }
        
        // Reset renderer auto clear to default before recreating
        this.renderer.autoClearColor = true;
        
        // Recreate with new configuration
        this.createFadePlane();
    }

    // Lighting setup removed - lighting is disabled in config

    /**
     * Handle window resize
     * @param {number} width - New width
     * @param {number} height - New height
     */
    handleResize(width, height) {
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        // Update fade plane shader resolution uniform
        if (this.fadeMesh && this.fadeMesh.material && this.fadeMesh.material.uniforms && this.fadeMesh.material.uniforms.resolution) {
            this.fadeMesh.material.uniforms.resolution.value.set(width, height);
        }
    }

    /**
     * Start the animation loop
     * @param {AnimationManager} animator - Animation manager instance
     * @param {ImageProjector} projector - Image projector for depth effects
     */
    startAnimation(animator, projector = null) {
        // Initialize depth effect shader if projector is provided and depth effects are enabled
        if (projector && Config.projectionMaterial?.depthEffects?.enabled) {
            this.depthEffectShader = new DepthEffectShader(this.camera, this.scene);
            // Apply depth effects to the sphere material itself
            // this.depthEffectShader.applyDepthEffect(this.sphere.material);
        }
        
        const animate = () => {
            requestAnimationFrame(animate);
            
            // Calculate delta time
            const currentTime = Date.now();
            const deltaTime = this.lastTime ? currentTime - this.lastTime : 0;
            this.lastTime = currentTime;
            
            // Update animations
            if (animator) {
                animator.update();
            }
            
            // Update depth effects for projected images
            if (this.depthEffectShader) {
                this.depthEffectShader.updateDepthEffect();
            }
            
            // Update gradient shader based on camera position
            this.updateGradientShader();
            
            // Update gradient manager uniforms
            if (this.gradientManager) {
                this.gradientManager.updateUniforms(currentTime * 0.001, this.camera.position, this.sphere.geometry.parameters.radius);
            }
            
            // Update particle system
            if (this.particleSystem) {
                this.particleSystem.update(deltaTime);
            }
            
            // Update continuous rotation
            this.continuousRotation.y += this.continuousRotation.speed;
            
            // Only update the y rotation, preserving any animation rotations
            this.sphere.rotation.y = this.continuousRotation.y;
            
            // Render the scene
            this.renderer.render(this.scene, this.camera);
        };
        
        animate();
    }

    /**
     * Get the renderer
     * @returns {THREE.WebGLRenderer}
     */
    getRenderer() {
        return this.renderer;
    }

    /**
     * Get the sphere mesh
     * @returns {THREE.Mesh}
     */
    getSphere() {
        return this.sphere;
    }

    /**
     * Get the scene
     * @returns {THREE.Scene}
     */
    getScene() {
        return this.scene;
    }

    /**
     * Get the camera
     * @returns {THREE.PerspectiveCamera}
     */
    getCamera() {
        return this.camera;
    }

    /**
     * Get the gradient manager
     * @returns {GradientManager}
     */
    getGradientManager() {
        return this.gradientManager;
    }

    /**
     * Get the particle system
     * @returns {ParticleSystem}
     */
    getParticleSystem() {
        return this.particleSystem;
    }
    
    /**
     * Dispose of the visualizer and clean up resources
     */
    dispose() {
        // Clear the fade plane timer
        if (this.clearTimer) {
            clearInterval(this.clearTimer);
            this.clearTimer = null;
        }
        
        // Dispose of particle system
        if (this.particleSystem) {
            this.particleSystem.dispose();
        }
        
        // Dispose of gradient manager
        if (this.gradientManager) {
            this.gradientManager.dispose();
        }
        
        // Dispose of depth effect shader
        if (this.depthEffectShader) {
            this.depthEffectShader.dispose();
        }
        
        // Dispose of renderer
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}