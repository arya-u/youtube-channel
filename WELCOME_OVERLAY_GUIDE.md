# Welcome Overlay Animation Guide

This guide explains how to use the CSS-based welcome overlay animation system that displays a three-step animated sequence.

## Overview

The welcome overlay system provides a simple, CSS-driven animation that displays:
1. "Welcome" text
2. A custom name (passed via JavaScript)
3. "Let's go global" text

The animation uses Inter font and is completely independent of the main globe animation system.

## Usage

### Method 1: Using initializeGlobe() function

```javascript
// Initialize with custom name and images
window.initializeGlobe({
    name: "John Doe",
    images: [...] // optional custom images array
});
```

### Method 2: Using GlobeAPI after initialization

```javascript
// Show welcome overlay with custom name anytime
window.GlobeAPI.showWelcomeOverlay("Jane Smith");
```

## Animation Sequence

- **0-2s**: "Welcome" text appears and disappears
- **3-5s**: Custom name appears and disappears  
- **6-8s**: "Let's go global" appears and disappears
- **9s**: Overlay fades out completely

## Customization

You can customize the animation by modifying the CSS in `index.html`:

### Text Styling
```css
.welcome-text {
    font-size: clamp(4rem, 12vw, 12rem); /* Responsive font size */
    font-weight: 900;                    /* Font weight */
    color: #333;                         /* Text color */
}
```

### Animation Timing
```css
.welcome-text.welcome {
    animation: textAppear 2s ease-out forwards; /* Welcome timing */
}

.welcome-text.name {
    animation: textAppear 2s ease-out 3s forwards; /* Name timing (3s delay) */
}

.welcome-text.lets-go {
    animation: textAppear 2s ease-out 6s forwards; /* Final text timing (6s delay) */
}
```

### Animation Effects
Modify the `@keyframes textAppear` rule to change the animation effects:

```css
@keyframes textAppear {
    0% {
        opacity: 0;
        transform: scale(0.8) translateY(50px); /* Start state */
    }
    20% {
        opacity: 1;
        transform: scale(1.05) translateY(0);   /* Peak state */
    }
    80% {
        opacity: 1;
        transform: scale(1) translateY(0);      /* Hold state */
    }
    100% {
        opacity: 0;
        transform: scale(0.9) translateY(-30px); /* End state */
    }
}
```

## Technical Details

- **Font**: Inter (loaded from Google Fonts)
- **Z-index**: 10000 (above all other content)
- **Responsive**: Uses `clamp()` for responsive font sizing
- **Performance**: Pure CSS animations, no JavaScript animation loops
- **Independence**: Does not interfere with globe animations

## Browser Compatibility

- Modern browsers supporting CSS Grid, Flexbox, and CSS animations
- Inter font fallback to system fonts if Google Fonts fails to load
- Responsive design works on mobile, tablet, and desktop

## Example Integration

```html
<!DOCTYPE html>
<html>
<head>
    <!-- Your existing head content -->
</head>
<body>
    <!-- Globe canvas will be added here -->
    
    <script>
        // Initialize with welcome overlay
        window.initializeGlobe({
            name: "Welcome User",
            images: [
                // Your image array
            ]
        });
    </script>
</body>
</html>
```