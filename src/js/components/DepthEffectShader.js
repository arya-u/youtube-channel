/**
 * DepthEffectShader.js
 * Creates a depth-based transparency overlay shader for the sphere
 */

import * as THREE from 'three';
import { Config } from '../config.js';

export class DepthEffectShader {
    /**
     * Create a new DepthEffectShader
     * @param {THREE.Camera} camera - The camera for depth calculations
     * @param {THREE.Scene} scene - The scene for rendering
     */
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        this.depthTexture = null;
    }

    /**
     * Creates a 2D depth texture for the sphere
     * @param {number} size - The size of the 2D texture (default: 512)
     * @returns {THREE.CanvasTexture} The created depth texture
     */
    createDepthTexture(size = 512) {
        // Create a canvas to generate the depth texture
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Create image data
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;
        
        // Fill the texture with depth values based on sphere UV mapping
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const index = (y * size + x) * 4;
                
                // Convert pixel coordinates to UV coordinates (0-1)
                const u = x / (size - 1);
                const v = y / (size - 1);
                
                // Convert UV to spherical coordinates
                const phi = u * Math.PI * 2; // longitude (0 to 2π)
                const theta = v * Math.PI; // latitude (0 to π)
                
                // Convert spherical to cartesian coordinates (sphere surface point)
                const sx = Math.sin(theta) * Math.cos(phi);
                const sy = Math.cos(theta);
                const sz = Math.sin(theta) * Math.sin(phi);
                
                // Calculate depth based on distance from camera (assuming camera at z=positive)
                // Create a proper 3D transparency map where closer points are more opaque
                const spherePoint = new THREE.Vector3(sx, sy, sz);
                const cameraDirection = new THREE.Vector3(0, 0, 1); // Camera looking down negative z
                
                // Calculate how much this point faces the camera
                const facingCamera = spherePoint.dot(cameraDirection);
                
                // Convert to 0-1 range where 1 = facing camera (opaque), 0 = facing away (transparent)
                const depth = Math.max(0, facingCamera);
                const alpha = Math.floor(depth * 255);
                
                // Set RGBA values (grayscale for alpha map)
                data[index] = alpha;     // Red
                data[index + 1] = alpha; // Green
                data[index + 2] = alpha; // Blue
                data[index + 3] = 255;   // Alpha (fully opaque)
            }
        }
        
        // Put the image data on the canvas
        ctx.putImageData(imageData, 0, 0);
        
        // Create texture from canvas
        this.depthTexture = new THREE.CanvasTexture(canvas);
        this.depthTexture.wrapS = THREE.RepeatWrapping;
        this.depthTexture.wrapT = THREE.RepeatWrapping;
        this.depthTexture.minFilter = THREE.LinearFilter;
        this.depthTexture.magFilter = THREE.LinearFilter;
        this.depthTexture.needsUpdate = true;
        
        return this.depthTexture;
    }

    /**
     * Applies the depth effect to a sphere material
     * @param {THREE.Material} sphereMaterial - The sphere material to modify
     * @returns {THREE.Material} The modified material
     */
    applyDepthEffect(sphereMaterial) {
        if (!this.depthTexture) {
            this.createDepthTexture();
        }
        
        // Modify the sphere material to use the depth texture as alpha map
        sphereMaterial.alphaMap = this.depthTexture;
        sphereMaterial.transparent = true;
        sphereMaterial.needsUpdate = true;
        
        return sphereMaterial;
    }

    /**
     * Updates the depth texture based on camera position
     * Call this method when the camera moves for dynamic depth effects
     */
    updateDepthEffect() {
        if (!this.depthTexture) return;
        
        // Get depth effects configuration from Config if available
        let depthConfig;
        try {
            depthConfig = Config.projectionMaterial.depthEffects;
        } catch (e) {
            // Fallback if Config is not available
            depthConfig = { enabled: true };
        }
        
        if (!depthConfig.enabled) return;
        
        // Regenerate the depth texture based on current camera position
        this.updateDepthTextureForCamera();
    }
    
    /**
     * Updates the depth texture based on current camera position
     */
    updateDepthTextureForCamera(size = 512) {
        if (!this.depthTexture) {
            this.createDepthTexture(size);
            return;
        }
        
        // Get the canvas from the existing texture
        const canvas = this.depthTexture.image;
        const ctx = canvas.getContext('2d');
        
        // Create image data
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;
        
        // Get camera position (not normalized)
        const cameraPos = this.camera.position.clone();
        
        // Calculate min and max distances to determine depth range
        const sphereRadius = 1; // Assuming unit sphere
        const cameraDistance = cameraPos.length();
        const minDistance = Math.max(0, cameraDistance - sphereRadius); // Closest point
        const maxDistance = cameraDistance + sphereRadius; // Furthest point
        const distanceRange = maxDistance - minDistance;
        
        // Fill the texture with depth values based on actual distance from camera
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const index = (y * size + x) * 4;
                
                // Convert pixel coordinates to UV coordinates (0-1)
                const u = x / (size - 1);
                const v = y / (size - 1);
                
                // Convert UV to spherical coordinates
                const phi = u * Math.PI * 2; // longitude (0 to 2π)
                const theta = v * Math.PI; // latitude (0 to π)
                
                // Convert spherical to cartesian coordinates (sphere surface point)
                const sx = Math.sin(theta) * Math.cos(phi) * sphereRadius;
                const sy = Math.cos(theta) * sphereRadius;
                const sz = Math.sin(theta) * Math.sin(phi) * sphereRadius;
                
                // Create surface point vector
                const surfacePoint = new THREE.Vector3(sx, sy, sz);
                
                // Calculate distance from camera to this surface point
                const distanceToCamera = cameraPos.distanceTo(surfacePoint);
                
                // Normalize distance to 0-1 range where:
                // 0 = closest point (most transparent for depth effect)
                // 1 = furthest point (most opaque)
                const normalizedDistance = (distanceToCamera - minDistance) / distanceRange;
                const depth = Math.max(0, Math.min(1, normalizedDistance));
                
                // Invert for alpha map (closer = more transparent, further = more opaque)
                const alpha = Math.floor((1 - depth) * 255);
                
                // Set RGBA values (grayscale for alpha map)
                data[index] = alpha;     // Red
                data[index + 1] = alpha; // Green
                data[index + 2] = alpha; // Blue
                data[index + 3] = 255;   // Alpha (fully opaque)
            }
        }
        
        // Put the image data on the canvas
        ctx.putImageData(imageData, 0, 0);
        
        // Mark texture as needing update
        this.depthTexture.needsUpdate = true;
    }

    /**
     * Removes the depth effect and cleans up resources
     */
    dispose() {
        if (this.depthTexture) {
            this.depthTexture.dispose();
            this.depthTexture = null;
        }
    }

    /**
     * Gets the depth texture
     * @returns {THREE.CanvasTexture}
     */
    getDepthTexture() {
        return this.depthTexture;
    }
}