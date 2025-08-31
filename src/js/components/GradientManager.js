import * as THREE from 'three';

/**
 * Manages shared gradient uniforms for consistent gradient calculations
 * across the sphere and projected image materials
 */
export class GradientManager {
    constructor() {
        // Shared uniforms for gradient calculations (matching sphere shader)
        this.uniforms = {
            time: { value: 0.0 },
            closestPoint: { value: new THREE.Vector3(0, 0, 0) },
            furthestPoint: { value: new THREE.Vector3(0, 0, 0) }
        };
        
        // Track registered materials for uniform updates
        this.registeredMaterials = [];
    }
    
    /**
     * Register a material to receive gradient uniform updates
     * @param {THREE.Material} material - Material to register
     */
    registerMaterial(material) {
        this.registeredMaterials.push(material);
    }
    
    /**
     * Unregister a material from gradient uniform updates
     * @param {THREE.Material} material - Material to unregister
     */
    unregisterMaterial(material) {
        const index = this.registeredMaterials.indexOf(material);
        if (index > -1) {
            this.registeredMaterials.splice(index, 1);
        }
    }
    
    /**
     * Update shared uniforms (called from animation loop)
     * @param {number} time - Current time
     * @param {THREE.Vector3} cameraPosition - Camera position
     * @param {number} sphereRadius - Sphere radius
     */
    updateUniforms(time, cameraPosition, sphereRadius = 2.0) {
        this.uniforms.time.value = time;
        
        // Calculate closest and furthest points (same as sphere shader)
        const sphereCenter = new THREE.Vector3(0, 0, 0);
        const cameraDirection = cameraPosition.clone().sub(sphereCenter).normalize();
        const closestPoint = sphereCenter.clone().add(cameraDirection.clone().multiplyScalar(sphereRadius));
        const furthestPoint = sphereCenter.clone().add(cameraDirection.clone().multiplyScalar(-sphereRadius));
        
        this.uniforms.closestPoint.value.copy(closestPoint);
        this.uniforms.furthestPoint.value.copy(furthestPoint);
        
        // Update all registered materials
        this.registeredMaterials.forEach(material => {
            if (material.uniforms) {
                if (material.uniforms.time) material.uniforms.time.value = time;
                if (material.uniforms.closestPoint) material.uniforms.closestPoint.value.copy(closestPoint);
                if (material.uniforms.furthestPoint) material.uniforms.furthestPoint.value.copy(furthestPoint);
            }
        });
    }
    
    /**
     * Get shared uniforms for use in other materials
     * @returns {Object} Uniforms object
     */
    getSharedUniforms() {
        return {
            time: { value: this.uniforms.time.value },
            closestPoint: { value: this.uniforms.closestPoint.value.clone() },
            furthestPoint: { value: this.uniforms.furthestPoint.value.clone() }
        };
    }
    
    /**
     * Create vertex shader code for gradient calculations
     * @returns {string} Vertex shader code
     */
    getVertexShader() {
        return `
            varying vec3 vWorldPosition;
            varying vec2 vUv;
            
            void main() {
                vUv = uv;
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
    }
    
    /**
     * Create fragment shader code for gradient-based transparency
     * @returns {string} Fragment shader code
     */
    getFragmentShader() {
        return `
            uniform vec3 closestPoint;
            uniform vec3 furthestPoint;
            uniform sampler2D map;
            uniform float opacity;
            
            varying vec3 vWorldPosition;
            varying vec2 vUv;
            
            void main() {
                // Calculate gradient value (same as sphere shader)
                float distToClosest = distance(vWorldPosition, closestPoint);
                float distToFurthest = distance(vWorldPosition, furthestPoint);
                
                // Calculate gradient value based on relative distances
                float totalDistance = distToClosest + distToFurthest;
                float gradientValue = distToClosest / totalDistance;
                
                // Calculate blur amount based on gradient (0 = no blur, max blur for distant objects)
                float maxBlur = 0.09; // Maximum blur radius
                float blurAmount = clamp(gradientValue - 0.5, 0.0, 1.0) * maxBlur;
                // Sample texture with blur effect
                vec4 texColor = vec4(0.0);
                float totalWeight = 0.0;
                
                // Simple box blur - sample surrounding pixels with clamped UVs
                for(float x = -2.0; x <= 2.0; x += 1.0) {
                    for(float y = -2.0; y <= 2.0; y += 1.0) {
                        vec2 offset = vec2(x, y) * blurAmount;
                        vec2 sampleUv = vUv + offset;
                        
                        // Clamp UV coordinates to prevent sampling outside texture bounds
                        sampleUv = clamp(sampleUv, 0.0, 1.0);
                        
                        float weight = 1.0;
                        texColor += texture2D(map, sampleUv) * weight;
                        totalWeight += weight;
                    }
                }
                
                // Normalize the color by total weight
                texColor /= totalWeight;
                
                // Apply inverted gradient for transparency (closer to camera = more opaque)
                float transparency = 1.0 - gradientValue + 0.3; // Add base transparency amount
                transparency = clamp(transparency * transparency * transparency, 0.0, 1.0);
                
                // Apply gradient as alpha transparency only
                float finalAlpha = clamp(texColor.a * transparency * opacity, 0.0, 1.0);
                
                gl_FragColor = vec4(texColor.rgb, finalAlpha);
            }
        `;
    }
    
    /**
     * Create a shader material for projected images with gradient transparency
     * @param {THREE.Texture} texture - Image texture
     * @param {Object} options - Additional material options
     * @returns {THREE.ShaderMaterial} Configured shader material
     */
    createProjectedImageMaterial(texture, options = {}) {
        const material = new THREE.ShaderMaterial({
            uniforms: {
                ...this.getSharedUniforms(),
                map: { value: texture },
                opacity: { value: options.opacity || 1.0 }
            },
            vertexShader: this.getVertexShader(),
            fragmentShader: this.getFragmentShader(),
            transparent: true,
            side: options.side || THREE.DoubleSide,
            depthTest: options.depthTest !== false,
            depthWrite: options.depthWrite !== false,
            alphaTest: options.alphaTest || 0.1
        });
        
        // Register this material for uniform updates
        this.registerMaterial(material);
        
        return material;
    }
    
    /**
     * Dispose of the gradient manager and clean up materials
     */
    dispose() {
        this.materials.forEach(material => {
            if (material.dispose) {
                material.dispose();
            }
        });
        this.materials.clear();
    }
}