/**
 * ParticleSystem.js
 * Manages a particle effect sphere that syncs with the main globe
 */

import * as THREE from 'three';
import { Config } from '../config.js';

export class ParticleSystem {
    /**
     * Create a new ParticleSystem
     * @param {THREE.Object3D} parentSphere - The main sphere to sync with
     */
    constructor(parentSphere) {
        this.parentSphere = parentSphere;
        this.config = Config.particles;
        this.particles = [];
        // Trail system removed - trails are disabled in config
        this.particleGroup = new THREE.Group();
        this.time = 0;
        
        if (this.config.enabled) {
            this.init();
        }
    }

    /**
     * Initialize the particle system
     */
    init() {
        this.createParticles();
        this.setupParticleGroup();
    }

    /**
     * Create individual particles with random orbits
     */
    createParticles() {
        
        // Load particle texture
        const textureLoader = new THREE.TextureLoader();
        const particleTexture = textureLoader.load(this.config.texture);
        
        // Create particle material with camera-facing and double-sided properties
        const particleMaterial = new THREE.SpriteMaterial({
            map: particleTexture,
            color: this.config.particleColor,
            transparent: true,
            opacity: this.config.opacity,
            depthTest: false, // Disable depth testing for visibility from both sides
            depthWrite: false, // Disable depth writing to prevent z-fighting
            alphaTest: this.config.material.alphaTest,
            side: THREE.DoubleSide // Ensure visibility from both sides
        });

        // Create particles
        for (let i = 0; i < this.config.count; i++) {
            const sprite = new THREE.Sprite(particleMaterial);
            sprite.scale.setScalar(this.config.particleSize);
            
            // Disable frustum culling to prevent disappearing when partially off-screen
            sprite.frustumCulled = false;
            
            // Generate random orbital parameters
            const orbitData = this.generateRandomOrbit();
            
            // Store orbit data in userData
            sprite.userData = {
                orbitRadius: orbitData.radius,
                orbitSpeed: orbitData.speed,
                orbitInclination: orbitData.inclination,
                orbitPhase: orbitData.phase,
                orbitAxis: orbitData.axis
            };
            
            // Set initial position based on orbit data
            const initialAngle = orbitData.phase;
            let x = Math.cos(initialAngle) * orbitData.radius;
            let y = 0;
            let z = Math.sin(initialAngle) * orbitData.radius;
            
            const initialPosition = new THREE.Vector3(x, y, z);
            const rotationMatrix = new THREE.Matrix4();
            rotationMatrix.makeRotationAxis(orbitData.axis, orbitData.inclination);
            initialPosition.applyMatrix4(rotationMatrix);
            
            sprite.position.copy(initialPosition);
            
            this.particles.push(sprite);
            this.particleGroup.add(sprite);
            
            // Trail initialization removed - trails are disabled
        }
    }

    // Trail initialization method removed - trails are disabled

    // Trail update method removed - trails are disabled

    /**
     * Generate random orbital parameters for a particle
     * @returns {Object} Orbital parameters
     */
    generateRandomOrbit() {
        // Create varied orbital radii for spiral effect
        const minRadius = this.config.sphereRadius * 0.3;
        const maxRadius = this.config.sphereRadius;
        const radius = minRadius + Math.random() * (maxRadius - minRadius);
        
        // Varied orbital speeds for natural motion
        const baseSpeed = this.config.orbitSpeed;
        const speedVariation = this.config.orbitVariation;
        const speed = baseSpeed + (Math.random() - 0.5) * speedVariation * baseSpeed;
        
        // Create spiral motion with varied inclinations
        const inclination = Math.random() * Math.PI * 0.8; // Limit to 80% of full range for better distribution
        
        // Random starting phase
        const phase = Math.random() * Math.PI * 2;
        
        // Create varied orbital axes for 3D spiral motion
        const axis = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        ).normalize();
        
        // Add vertical offset for spiral layers
        const verticalOffset = (Math.random() - 0.5) * this.config.sphereRadius * 0.5;
        
        return {
            radius: radius,
            speed: speed,
            inclination: inclination,
            phase: phase,
            axis: axis,
            verticalOffset: verticalOffset
        };
    }

    /**
     * Setup the particle group to sync with parent sphere
     */
    setupParticleGroup() {
        // Disable frustum culling for the entire group
        this.particleGroup.frustumCulled = false;
        
        // Add to parent sphere so it inherits transformations
        this.parentSphere.add(this.particleGroup);
    }

    /**
     * Update particle positions based on their orbits
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        if (!this.config.enabled) return;
        
        this.time += deltaTime;
        
        this.particles.forEach((particle, index) => {
            const orbit = particle.userData;
            
            // Skip particles without proper orbit data
            if (!orbit || !orbit.axis || typeof orbit.speed === 'undefined' || typeof orbit.radius === 'undefined') {
                return;
            }
            
            // Calculate current position in orbit with spiral motion
            const angle = this.time * orbit.speed + orbit.phase;
            
            // Create spiral motion in 3D space
            let x = Math.cos(angle) * orbit.radius;
            let y = Math.sin(angle * 0.3) * orbit.radius * 0.2 + (orbit.verticalOffset || 0); // Slower vertical oscillation
            let z = Math.sin(angle) * orbit.radius;
            
            // Apply inclination by rotating around the orbit axis
            const position = new THREE.Vector3(x, y, z);
            
            // Create rotation matrix for inclination
            const rotationMatrix = new THREE.Matrix4();
            rotationMatrix.makeRotationAxis(orbit.axis, orbit.inclination);
            
            // Apply rotation
            position.applyMatrix4(rotationMatrix);
            
            // Set particle position
            particle.position.copy(position);
            
            // Trail update removed - trails are disabled
        });
    }

    /**
     * Update configuration from Config object
     */
    updateConfig() {
        this.config = Config.particles;
        
        if (!this.config.enabled && this.particleGroup.parent) {
            this.particleGroup.parent.remove(this.particleGroup);
            return;
        }
        
        if (this.config.enabled && !this.particleGroup.parent) {
            this.parentSphere.add(this.particleGroup);
        }
        
        // Update particle properties
        this.particles.forEach(particle => {
            particle.scale.setScalar(this.config.particleSize);
            particle.material.color.setStyle(this.config.particleColor);
            particle.material.opacity = this.config.opacity;
        });
        
        // Trail property updates removed - trails are disabled
    }

    /**
     * Get the particle group for external access
     * @returns {THREE.Group} The particle group
     */
    getParticleGroup() {
        return this.particleGroup;
    }
    
    /**
     * Set the layer for all particles and trails
     * @param {number} layer - The layer number to assign
     */
    setLayer(layer) {
        // Set particle group layer
        this.particleGroup.layers.set(layer);
        
        // Set all particles to the specified layer
        this.particleGroup.traverse((child) => {
            child.layers.set(layer);
        });
        
        // Trail layer setting removed - trails are disabled
    }

    /**
     * Set the render order for all particles and trails
     * @param {number} renderOrder - The render order to assign
     */
    setRenderOrder(renderOrder) {
        // Set render order for the main particle group
        if (this.particleGroup) {
            this.particleGroup.renderOrder = renderOrder;
        }
        
        // Set render order for individual particles
        if (this.particles && Array.isArray(this.particles)) {
            this.particles.forEach(particle => {
                if (particle.mesh) {
                    particle.mesh.renderOrder = renderOrder;
                }
            });
        }
        
        // Trail render order setting removed - trails are disabled
    }

    /**
     * Dispose of the particle system
     */
    dispose() {
        if (this.particles && Array.isArray(this.particles)) {
            this.particles.forEach(particle => {
                if (particle.material.map) {
                    particle.material.map.dispose();
                }
                particle.material.dispose();
            });
        }
        
        // Trail disposal removed - trails are disabled
        
        if (this.particleGroup.parent) {
            this.particleGroup.parent.remove(this.particleGroup);
        }
        
        this.particles = [];
    }
}