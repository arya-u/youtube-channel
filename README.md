# YouTube Channel Globe Visualizer

A modular 3D globe visualization for YouTube channel thumbnails. This project uses Three.js to create an interactive globe that can display YouTube thumbnails on its surface.

## Project Structure

```
├── dist/               # Compiled files
├── src/                # Source files
│   ├── js/             # JavaScript modules
│   │   ├── components/ # Core components
│   │   │   ├── GlobeVisualizer.js   # Core globe functionality
│   │   │   ├── AnimationManager.js  # Animation system
│   │   │   └── ImageProjector.js    # Image projection system
│   │   ├── utils/     # Utility functions
│   │   ├── config.js  # Configuration settings
│   │   └── index.js   # Main entry point
│   └── index.html     # HTML template
├── .babelrc           # Babel configuration
├── package.json       # Project dependencies
├── webpack.config.js  # Webpack configuration
└── README.md          # Project documentation
```

## Installation

```bash
# Navigate to the project directory
cd ModularGlobe

# Install dependencies
npm install
```

## Development

```bash
# Start development server with hot reloading
npm run serve

# Build for development with watch mode
npm run dev
```

## Production Build

```bash
# Create production build
npm run build
```

The compiled files will be in the `dist` directory.

## Configuration

You can customize the globe visualization by modifying the `config.js` file. This includes:

- Globe appearance (radius, color, dot density)
- Lighting settings
- Camera position
- Image projection options
- Animation sequences

## Usage

To use the globe visualizer in your own project:

1. Build the project using `npm run build`
2. Copy the `dist/bundle.js` file to your project
3. Include it in your HTML:

```html
<script src="path/to/bundle.js"></script>
```

## Customization

To customize the images displayed on the globe, modify the `images` array in the `config.js` file:

```javascript
images: [
    'path/to/image1.jpg',
    'path/to/image2.jpg',
    // Add more images as needed
]
```

## License

MIT