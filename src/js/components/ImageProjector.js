/**
 * ImageProjector.js
 * Handles projecting images onto the globe surface
 */

import * as THREE from 'three';
import { Config } from '../config.js';
import { GradientManager } from './GradientManager.js';

export class ImageProjector {
    /**
     * Create a new ImageProjector
     * @param {THREE.Mesh} sphere - The sphere mesh to project images onto
     * @param {THREE.Camera} camera - The camera for depth calculations
     * @param {GradientManager} gradientManager - Shared gradient manager for transparency
     */
    constructor(sphere, camera = null, gradientManager = null) {
        this.sphere = sphere;
        this.camera = camera;
        this.projectedMeshes = []; // Track all projected meshes
        this.sizeMultiplier = 1.0; // Multiplier for targetSize
        this.projectionData = []; // Store mesh references with metadata: { mesh, originalTargetSize, position, alignment, rotation, imageUrl, aspect, originalVertices }
        this.gradientManager = gradientManager || new GradientManager();
    }

    /**
     * Projects an image onto the sphere at specified coordinates
     * @param {string} imageUrl - URL of the image to project
     * @param {number} targetSize - Size in radians of the projection on the sphere (0 to Math.PI)
     * @param {Object} position - {lat: number, lng: number} in degrees
     * @param {Object} alignment - {x: number, y: number} from -1 to 1, controls alignment of image
     * @param {Object} rotation - {x: number, y: number, z: number} rotation in radians
     * @returns {Promise} - Resolves when the image is loaded and applied
     */

    projectImage(imageUrl, targetSize, position, alignment, rotation = { x: 0, y: 0, z: 0 }) {
        return new Promise((resolve) => {
            
            // Load and process the image
            const loader = new THREE.TextureLoader();
            loader.load(imageUrl, (texture) => {
                // Process the image with rounded corners
                const processedCanvas = this.processImageWithRoundedCorners(texture.image, 40, 10);
                // Create new texture from processed image
                const processedTexture = new THREE.CanvasTexture(processedCanvas);
                
                processedTexture.needsUpdate = true;
                processedTexture.colorSpace = THREE.SRGBColorSpace;
                // Get dimensions from processed canvas
                const width = processedCanvas.width;
                const height = processedCanvas.height;
                const aspect = width / height;

                // Convert lat/lng to spherical coordinates (phi/theta)
                const phi = (90 - position.lat) * (Math.PI / 180);
                const theta = (position.lng + 180) * (Math.PI / 180);

                // Calculate the size of our projection plane with multiplier
                const effectiveTargetSize = targetSize * this.sizeMultiplier;
                const projWidth = effectiveTargetSize * aspect;
                const projHeight = effectiveTargetSize;

                // Create a curved plane geometry that follows the sphere's surface
                const segments = 16;
                const geometry = new THREE.PlaneGeometry(
                    projWidth, projHeight,
                    segments, segments
                );

                // Store original vertex positions before curving for later morphing
                const positionAttribute = geometry.attributes.position;
                const originalVertices = [];
                for (let i = 0; i < positionAttribute.count; i++) {
                    originalVertices.push({
                        x: positionAttribute.getX(i),
                        y: positionAttribute.getY(i)
                    });
                }

                // Curve the geometry to match the sphere's surface
                const radius = this.sphere.geometry.parameters.radius;

                for (let i = 0; i < positionAttribute.count; i++) {
                    const x = positionAttribute.getX(i);
                    const y = positionAttribute.getY(i);

                    // Calculate alignment offsets
                    // alignment of -1 puts the center at the end of the image
                    // alignment of 0 centers the image
                    // alignment of 1 puts the center at the start of the image
                    const alignmentOffsetX = -alignment.x * projWidth * 0.5;
                    const alignmentOffsetY = -alignment.y * projHeight * 0.5;

                    // Apply alignment to local coordinates before projection
                    const alignedX = x + alignmentOffsetX;
                    const alignedY = y + alignmentOffsetY;

                    // Project onto sphere surface
                    const sphericalPhi = phi + (alignedY / radius);
                    const sphericalTheta = theta + (alignedX / (radius * Math.sin(sphericalPhi)));

                    // Convert back to Cartesian coordinates
                    const px = radius * Math.sin(sphericalPhi) * Math.cos(sphericalTheta);
                    const py = radius * Math.cos(sphericalPhi);
                    const pz = radius * Math.sin(sphericalPhi) * Math.sin(sphericalTheta);
                    
                    // Calculate deterministic z-shift based on lat/lng and imageUrl to prevent z-fighting
                    // Create a more robust hash from lat/lng coordinates and image URL
                    const latInt = Math.floor(position.lat * 100); // Convert to integer for better hashing
                    const lngInt = Math.floor(position.lng * 100);
                    // Add imageUrl hash for unique per-image offset
                    let imageHash = 0;
                    for (let j = 0; j < imageUrl.length; j++) {
                        imageHash = ((imageHash << 5) - imageHash + imageUrl.charCodeAt(j)) & 0xffffffff;
                    }
                    const hash = Math.abs((latInt * 73856093) ^ (lngInt * 19349663) ^ (imageHash * 83492791)); // Combined hash
                    const normalizedHash = (hash % 1000) / 1000; // Normalize to 0-1
                    const zShift = normalizedHash * 0.01; // Offset range (0-0.01 units)
                    
                    // Calculate surface normal and apply z-shift
                    const normal = new THREE.Vector3(px, py, pz).normalize();
                    const shiftedPosition = new THREE.Vector3(px, py, pz).add(normal.multiplyScalar(zShift));
                    
                    positionAttribute.setXYZ(i, shiftedPosition.x, shiftedPosition.y, shiftedPosition.z);
                }

                positionAttribute.needsUpdate = true;
                geometry.computeVertexNormals();

                // Get material configuration from config
                const materialConfig = Config.projectionMaterial;
                const textureConfig = materialConfig.texture;
                const matConfig = materialConfig.material;
                
                // Create gradient-based shader material for transparency
                const material = this.gradientManager.createProjectedImageMaterial(processedTexture, {
                    opacity: textureConfig.brightness,
                    side: matConfig.side === 'DoubleSide' ? THREE.DoubleSide : 
                          matConfig.side === 'BackSide' ? THREE.BackSide : THREE.FrontSide,
                    depthTest: matConfig.depthTest,
                    depthWrite: matConfig.depthWrite,
                    alphaTest: matConfig.alphaTest
                });
                


                // Create and add the mesh
                const mesh = new THREE.Mesh(geometry, material);

                // Disable frustum culling to prevent disappearing when partially off-screen
                mesh.frustumCulled = false;

                // Apply rotation
                mesh.rotation.set(rotation.x, rotation.y, rotation.z);

                // Store mesh metadata for efficient morphing
                mesh.userData = {
                    originalVertices,
                    originalWidth: projWidth,
                    originalHeight: projHeight,
                    aspect: aspect
                };

                // Store projection data with mesh reference for re-projection
                const projectionInfo = {
                    mesh,
                    imageUrl,
                    originalTargetSize: targetSize,
                    position,
                    alignment,
                    rotation,
                    aspect,
                    originalVertices
                };
                this.projectionData.push(projectionInfo);

                this.sphere.add(mesh);
                this.projectedMeshes.push(mesh);

                resolve(mesh);
            });
        });
    }

    /**
     * Processes an image to add rounded corners
     * @param {HTMLImageElement} image - The original image
     * @param {number} cornerRadius - Radius of the rounded corners in pixels
     * @param {number} padding - Optional padding around the image in pixels
     * @returns {HTMLCanvasElement} - Canvas with the processed image
     */
    processImageWithRoundedCorners(image, cornerRadius = 20, padding = 0) {
        const canvas = document.createElement('canvas');
        const width = image.width + (padding * 2);
        const height = image.height + (padding * 2);
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        
        // Clear canvas with transparent background
        ctx.clearRect(0, 0, width, height);

        // Calculate the image size after padding (making it smaller)
        const imageWidth = image.width - (padding * 2);
        const imageHeight = image.height - (padding * 2);
        
        // Calculate position to center the smaller image
        const imageX = padding + padding;
        const imageY = padding + padding;

        // Create rounded rectangle path for the smaller image area
        ctx.beginPath();
        ctx.moveTo(imageX + cornerRadius, imageY);
        ctx.lineTo(imageX + imageWidth - cornerRadius, imageY);
        ctx.quadraticCurveTo(imageX + imageWidth, imageY, imageX + imageWidth, imageY + cornerRadius);
        ctx.lineTo(imageX + imageWidth, imageY + imageHeight - cornerRadius);
        ctx.quadraticCurveTo(imageX + imageWidth, imageY + imageHeight, imageX + imageWidth - cornerRadius, imageY + imageHeight);
        ctx.lineTo(imageX + cornerRadius, imageY + imageHeight);
        ctx.quadraticCurveTo(imageX, imageY + imageHeight, imageX, imageY + imageHeight - cornerRadius);
        ctx.lineTo(imageX, imageY + cornerRadius);
        ctx.quadraticCurveTo(imageX, imageY, imageX + cornerRadius, imageY);
        ctx.closePath();

        // Clip to the rounded rectangle
        ctx.clip();

        // Draw the image scaled down to fit within the padded area
        ctx.drawImage(image, 0, 0, image.width, image.height, imageX, imageY, imageWidth, imageHeight);

        return canvas;
    }

    /**
     * Projects multiple images onto the sphere
     * @param {Array<Object>} imageConfigs - Array of image configurations
     * @param {string} imageConfigs[].imageUrl - URL of the image to project
     * @param {number} imageConfigs[].targetSize - Size in radians (0 to Math.PI)
     * @param {Object} imageConfigs[].position - {lat, lng} in degrees
     * @param {Object} imageConfigs[].alignment - {x, y} from -1 to 1
     * @param {Object} imageConfigs[].rotation - {x, y, z} in radians
     * @returns {Promise} - Resolves when all images are loaded and applied
     */
    projectImages(imageConfigs) {
        // Map each config to a promise
        const promises = imageConfigs.map(config => {
            return this.projectImage(
                config.imageUrl,
                config.targetSize,
                config.position,
                config.alignment,
                config.rotation
            );
        });

        // Return a promise that resolves when all images are loaded
        return Promise.all(promises);
    }

    /**
     * Generates a spherical grid distribution for images
     * @param {Array<string>} imageUrls - Array of image URLs to distribute
     * @param {Object} options - Configuration options
     * @param {number} options.targetSize - Size in radians for all images (default: Math.PI/4)
     * @param {number} options.cornerRadius - Corner radius for all images (optional)
     * @param {number} options.padding - Padding for all images (optional)
     * @returns {Promise} - Resolves when all images are loaded and applied
     */
    projectImagesSpherically(imageUrls, options = {}) {
        const configs = this.generateSphericalDistribution(imageUrls, options);
        return this.projectImages(configs);
    }

    /**
     * Generates a spherical grid distribution for images
     * @param {Array<string>} imageUrls - Array of image URLs to distribute
     * @param {Object} options - Configuration options
     * @param {number} options.targetSize - Size in radians for all images (default: Math.PI/4)
     * @returns {Array<Object>} Array of image configurations for projectImages
     */
    generateSphericalDistribution(imageUrls, options = {}) {
        const configs = [];
        const defaultSize = options.targetSize || Math.PI / 4;

        // Define parallel sections (latitude bands)
        // More parallels for more images, but keep it reasonable
        const numParallels = Math.min(Math.ceil(Math.sqrt(imageUrls.length)), 7);
        const parallelSpacing = 180 / (numParallels + 1); // Spacing between parallels in degrees

        // Calculate how many images we'll place in each parallel
        const imagesPerParallel = [];
        let remainingImages = imageUrls.length;
        let currentParallel = 0;

        // Distribute images to parallels, starting from the middle (equator)
        // and moving outward alternately up and down
        const parallelOrder = [];
        for (let i = 0; i < numParallels; i++) {
            if (i % 2 === 0) {
                parallelOrder.push(Math.floor(numParallels / 2) + Math.floor((i + 1) / 2));
            } else {
                parallelOrder.push(Math.floor(numParallels / 2) - Math.floor((i + 1) / 2));
            }
        }

        // Calculate images per parallel
        // Constants for geographical calculations
        const MIN_LATITUDE = -90;
        const DEGREES_TO_RADIANS = Math.PI / 180;
        const MIN_IMAGES_PER_PARALLEL = 2;
        const BASE_IMAGES_PER_PARALLEL = 15;

        while (remainingImages > 0 && currentParallel < numParallels) {
            const parallel = parallelOrder[currentParallel % numParallels];
            const latitude = MIN_LATITUDE + parallelSpacing * (parallel + 1);

            // Calculate max images that can fit in this parallel based on circumference
            const circumferenceRatio = Math.cos(latitude * DEGREES_TO_RADIANS);
            const maxImagesInParallel = Math.max(
                MIN_IMAGES_PER_PARALLEL, 
                Math.floor(BASE_IMAGES_PER_PARALLEL * circumferenceRatio)
            );

            // Calculate remaining parallels to distribute images to
            const remainingParallels = numParallels - currentParallel;
            const imagesForThisParallel = Math.min(
                maxImagesInParallel,
                Math.ceil(remainingImages / remainingParallels)
            );

            imagesPerParallel[parallel] = imagesForThisParallel;
            remainingImages -= imagesForThisParallel;
            currentParallel++;
        }

        // If there are still remaining images after all parallels are filled,
        // distribute them to the parallels that can accommodate more
        if (remainingImages > 0) {
            const MIN_LATITUDE = -90;
            const DEGREES_TO_RADIANS = Math.PI / 180;
            const MIN_IMAGES_PER_PARALLEL = 2;
            const BASE_PARALLEL_MULTIPLIER = 12;

            for (let i = 0; i < numParallels && remainingImages > 0; i++) {
                const parallel = parallelOrder[i];
                const latitude = MIN_LATITUDE + parallelSpacing * (parallel + 1);
                const circumferenceRatio = Math.cos(latitude * DEGREES_TO_RADIANS);
                const maxImagesInParallel = Math.max(
                    MIN_IMAGES_PER_PARALLEL, 
                    Math.floor(BASE_PARALLEL_MULTIPLIER * circumferenceRatio)
                );
                
                const currentImages = imagesPerParallel[parallel] || 0;
                const additionalImages = Math.min(
                    remainingImages,
                    maxImagesInParallel - currentImages
                );
                
                if (additionalImages > 0) {
                    imagesPerParallel[parallel] = currentImages + additionalImages;
                    remainingImages -= additionalImages;
                }
            }
        }

        // Place images in each parallel
        let imageIndex = 0;
        for (let p = 0; p < numParallels; p++) {
            const numImages = imagesPerParallel[p] || 0;
            if (numImages === 0) continue;

            // Calculate latitude based on parallel index with slight random offset
            const baseLatitude = -90 + parallelSpacing * (p + 1);
            const latitudeJitter = (Math.sin(p * 13.37) * parallelSpacing * 0.8); // Deterministic jitter
            const latitude = baseLatitude + latitudeJitter;

            // Calculate angle step with slight variation based on position
            const baseAngleStep = 360 / numImages;
            const angleJitter = Math.cos(p * 7.853) * baseAngleStep * 0.05; // Deterministic jitter
            const angleStep = baseAngleStep + angleJitter;

            for (let i = 0; i < numImages && imageIndex < imageUrls.length; i++) {
                const longitude = i * angleStep;

                configs.push({
                    imageUrl: imageUrls[imageIndex],
                    targetSize: defaultSize,
                    position: {
                        lat: latitude,
                        lng: longitude
                    },
                    alignment: { x: 0, y: 0 },
                    rotation: { x: 0, y: 0, z: Math.PI },
                    cornerRadius: options.cornerRadius,
                    padding: options.padding
                });

                imageIndex++;
            }
        }

        return configs;
    }



    /**
     * Sets the camera reference for depth calculations
     * @param {THREE.Camera} camera - The camera to use for depth calculations
     */
    setCamera(camera) {
        this.camera = camera;
    }

    /**
     * Set the size multiplier for all projections
     * @param {number} multiplier - The multiplier to apply to targetSize
     */
    setSizeMultiplier(multiplier) {
        // Only update if the multiplier has actually changed
        if (this.sizeMultiplier !== multiplier) {
            this.sizeMultiplier = multiplier;
            this.reprojectAllImages();
        }
    }

    /**
     * Get the current size multiplier
     * @returns {number} The current size multiplier
     */
    getSizeMultiplier() {
        return this.sizeMultiplier;
    }

    /**
     * Update geometry for a specific mesh with new size multiplier
     * @param {THREE.Mesh} mesh - The mesh to update
     * @param {number} originalTargetSize - Original target size in radians
     * @param {Object} position - {lat: number, lng: number} in degrees
     * @param {Object} alignment - {x: number, y: number} alignment values
     * @param {number} sizeMultiplier - Size multiplier to apply
     * @param {string} imageUrl - Image URL for unique hash calculation
     */
    updateGeometryForSize(mesh, originalTargetSize, position, alignment, sizeMultiplier, imageUrl) {
        const geometry = mesh.geometry;
        const positionAttribute = geometry.attributes.position;
        const radius = this.sphere.geometry.parameters.radius;
        
        // Get stored metadata
        const { originalVertices, aspect } = mesh.userData;
        
        // Recalculate effective size
        const effectiveTargetSize = originalTargetSize * sizeMultiplier;
        const projWidth = effectiveTargetSize * aspect;
        const projHeight = effectiveTargetSize;
        
        // Convert lat/lng to spherical coordinates
        const phi = (90 - position.lat) * (Math.PI / 180);
        const theta = (position.lng + 180) * (Math.PI / 180);
        
        // Update each vertex position
        for (let i = 0; i < positionAttribute.count; i++) {
            // Get original local coordinates
            const localX = originalVertices[i].x;
            const localY = originalVertices[i].y;
            
            // Recalculate alignment offsets with new size
            const alignmentOffsetX = -alignment.x * projWidth * 0.5;
            const alignmentOffsetY = -alignment.y * projHeight * 0.5;
            
            // Apply alignment and scale
            const alignedX = localX * (projWidth / mesh.userData.originalWidth) + alignmentOffsetX;
            const alignedY = localY * (projHeight / mesh.userData.originalHeight) + alignmentOffsetY;
            
            // Project onto sphere surface
            const sphericalPhi = phi + (alignedY / radius);
            const sphericalTheta = theta + (alignedX / (radius * Math.sin(sphericalPhi)));
            
            // Convert to Cartesian coordinates
            const px = radius * Math.sin(sphericalPhi) * Math.cos(sphericalTheta);
            const py = radius * Math.cos(sphericalPhi);
            const pz = radius * Math.sin(sphericalPhi) * Math.sin(sphericalTheta);
            
            // Calculate deterministic z-shift based on lat/lng and imageUrl to prevent z-fighting
            // Create a more robust hash from lat/lng coordinates and image URL
            const latInt = Math.floor(position.lat * 100); // Convert to integer for better hashing
            const lngInt = Math.floor(position.lng * 100);
            // Add imageUrl hash for unique per-image offset
            let imageHash = 0;
            for (let j = 0; j < imageUrl.length; j++) {
                imageHash = ((imageHash << 5) - imageHash + imageUrl.charCodeAt(j)) & 0xffffffff;
            }
            const hash = Math.abs((latInt * 73856093) ^ (lngInt * 19349663) ^ (imageHash * 83492791)); // Combined hash
            const normalizedHash = (hash % 1000) / 1000; // Normalize to 0-1
            const zShift = normalizedHash * 0.01; // Offset range (0-0.01 units)
            
            // Calculate surface normal and apply z-shift
            const normal = new THREE.Vector3(px, py, pz).normalize();
            const shiftedPosition = new THREE.Vector3(px, py, pz).add(normal.multiplyScalar(zShift));
            
            positionAttribute.setXYZ(i, shiftedPosition.x, shiftedPosition.y, shiftedPosition.z);
        }
        
        positionAttribute.needsUpdate = true;
        geometry.computeVertexNormals();
    }

    /**
     * Re-project all images with current size multiplier using geometry morphing
     */
    reprojectAllImages() {
        // Update existing meshes using geometry morphing instead of recreation
        if (this.projectionData && Array.isArray(this.projectionData)) {
            this.projectionData.forEach(data => {
            if (data.mesh && data.mesh.geometry) {
                this.updateGeometryForSize(
                    data.mesh,
                    data.originalTargetSize,
                    data.position,
                    data.alignment,
                    this.sizeMultiplier,
                    data.imageUrl
                );
            }
        });
        }
    }

    /**
     * Dispose of all projected images and clean up resources
     */
    dispose() {
        console.log('ImageProjector: Disposing of all projected images...');
        
        // Clean up all projection data (with safety check)
        if (this.projectionData && Array.isArray(this.projectionData)) {
            this.projectionData.forEach(data => {
                if (data.mesh) {
                    // Remove mesh from sphere
                    if (this.sphere && data.mesh.parent) {
                        data.mesh.parent.remove(data.mesh);
                    }
                    
                    // Dispose of geometry and material
                    if (data.mesh.geometry) {
                        data.mesh.geometry.dispose();
                    }
                    if (data.mesh.material) {
                        if (data.mesh.material.map) {
                            data.mesh.material.map.dispose();
                        }
                        data.mesh.material.dispose();
                    }
                }
            });
        }
        
        // Clear projection data array
        this.projectionData = [];
        
        // Clear references
        this.sphere = null;
        this.camera = null;
        this.gradientManager = null;
        
        console.log('ImageProjector: Disposal complete.');
    }
}