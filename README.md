# YouTube Channel Globe Visualizer

A simple 3D globe visualization that displays images (like YouTube thumbnails) on an interactive globe using Three.js.

## Quick Start

### 1. Include the Script

Add the compiled script to your HTML:

```html
<script src="./dist/globe-visualizer.js"></script>
```

### 2. Create a Container

Add a container element where the globe will be rendered:

```html
<div id="globe-container"></div>
```

### 3. Initialize the Globe

Call the `initiateGlobe` function with your parameters:

```javascript
const globeAPI = initiateGlobe(
    channelName,             // String: Display name for the channel
    imageUrls,               // Array: URLs of images to display
    configOverrides,         // Object: Custom configuration (optional)
    callbackFunction,        // Function: Called when animation completes (optional)
    targetElement            // HTMLElement: Container to render the globe
);
```

## Function Parameters

### `channelName` (String, required)
The name or title to display for the channel. This appears in the globe visualization.
- **Example**: `'@MarkRober'`, `'My YouTube Channel'`, `'Travel Vlogs'`

### `imageUrls` (Array, required)
An array of image URLs that will be displayed on the globe surface. Images should be publicly accessible.
- **Format**: Array of strings
- **Example**: `['https://example.com/thumb1.jpg', 'https://example.com/thumb2.jpg']`
- **Requirements**: 
  - URLs must be accessible (consider CORS policies)
  - Recommended: 400x300 pixel images
  - Supported formats: JPG, PNG, WebP

### `configOverrides` (Object, optional)
Custom configuration to override default globe settings. Pass an empty object `{}` if no customization needed.
- **Example**: 
```javascript
{
    // Custom settings go here
    // Refer to source config.js for available options
}
```

### `callbackFunction` (Function, optional)
A function that gets called when the globe animation sequence completes. Useful for triggering other actions.
- **Example**: 
```javascript
function() {
    console.log('Globe animation finished!');
    // Your custom code here
}
```
- **Alternative**: `null` if no callback needed

### `targetElement` (HTMLElement, required)
The DOM element where the globe will be rendered. Must be a valid HTML element.
- **Example**: `document.getElementById('globe-container')`
- **Requirements**: 
  - Element should have defined dimensions
  - Recommended: Full viewport or fixed size container

## Complete Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>Globe Visualizer</title>
    <style>
        #globe-container {
            position: fixed;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            background-color: black;
        }
    </style>
</head>
<body>
    <div id="globe-container"></div>
    
    <script src="./dist/globe-visualizer.js"></script>
    <script>
        // Your image URLs
        const images = [
            'https://example.com/image1.jpg',
            'https://example.com/image2.jpg',
            // Add more images...
        ];
        
        // Initialize the globe
        const globe = initiateGlobe(
            '@YourChannel',
            images,
            {}, // config overrides (optional)
            function() {
                console.log('Globe animation completed!');
            },
            document.getElementById('globe-container')
        );
    </script>
</body>
</html>
```

## Destroying the Globe

The `initiateGlobe` function returns an API object that includes a `destroy` method for proper cleanup:

```javascript
const globeAPI = initiateGlobe(
    '@YourChannel',
    images,
    {},
    null,
    document.getElementById('globe-container')
);

// Later, when you want to clean up the globe:
globeAPI.destroy();
```

### What the Destroy Function Does

The `destroy` method performs comprehensive cleanup:
- Stops all running animations and transitions
- Disposes of Three.js resources (geometries, materials, textures)
- Removes event listeners
- Clears the container DOM element
- Cleans up any remaining timeouts or intervals

### Error Handling

The destroy function includes robust error handling with try-catch blocks around each cleanup operation. If any individual cleanup step fails, it will:
- Log a warning to the console
- Continue with the remaining cleanup steps
- Always complete successfully

### When to Use Destroy

- **Single Page Applications**: When navigating between routes
- **Dynamic Content**: When switching between different globe instances
- **Memory Management**: To prevent memory leaks in long-running applications
- **Component Unmounting**: In React, Vue, or other framework component cleanup

### Example with Cleanup

```javascript
let currentGlobe = null;

function showGlobe(channelName, images) {
    // Clean up existing globe if any
    if (currentGlobe) {
        currentGlobe.destroy();
    }
    
    // Create new globe
    currentGlobe = initiateGlobe(
        channelName,
        images,
        {},
        null,
        document.getElementById('globe-container')
    );
}

// Clean up when page unloads
window.addEventListener('beforeunload', () => {
    if (currentGlobe) {
        currentGlobe.destroy();
    }
});
```

## Configuration Options

You can customize the globe by passing configuration overrides:

```javascript
const configOverrides = {
    // Add your custom configuration here
    // (refer to the source config.js for available options)
};
```

## Image Requirements

- Images should be accessible via CORS (use `crossOrigin: 'anonymous'` if needed)
- Recommended size: 400x300 pixels
- Supported formats: JPG, PNG, WebP
- For best performance, preload images before initializing the globe

## Development Setup

If you want to modify the globe visualizer:

```bash
# Install dependencies
npm install

# Build the project
npm run build

# The compiled file will be in dist/globe-visualizer.js
```

## How It Works

1. **Initialization**: The globe creates a 3D sphere using Three.js
2. **Image Loading**: Images are loaded and projected onto the globe surface
3. **Animation**: The globe rotates and displays images in sequence
4. **Interaction**: Users can interact with the globe (rotation, zoom)

## Browser Support

- Modern browsers with WebGL support
- Chrome, Firefox, Safari, Edge (latest versions)

## License

MIT