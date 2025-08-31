# Keyframe Timing System Guide

The responsive animation system now uses a centralized keyframe timing configuration that ensures consistent animation timing across all breakpoints (mobile, tablet, desktop, widescreen).

## How It Works

### 1. Shared Timing Configuration

Instead of defining `duration`, `delay`, and `easing` individually for each animation step in each breakpoint, all breakpoints now reference shared timing phases defined in `config.js`:

```javascript
keyframeTiming: {
    // Phase 1: Initial appearance
    phase1: {
        duration: 0,
        delay: 0,
        easing: 'Linear.None'
    },
    // Phase 2: Scale up and position
    phase2: {
        duration: 2000,
        delay: 0,
        easing: 'Quadratic.InOut'
    },
    // Phase 3: Rotation burst
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
}
```

### 2. Animation Sequence Usage

Each animation step in the responsive sequences now uses `useKeyframe` instead of individual timing properties:

```javascript
// Before (individual timing)
{
    target: {
        scale: { x: 2.5, y: 2.5, z: 2.5 },
        position: { x: 0, y: 1, z: 0 },
        rotationSpeed: 0.002
    },
    duration: 2000,
    easing: 'Quadratic.InOut'
}

// After (shared keyframe timing)
{
    target: {
        scale: { x: 2.5, y: 2.5, z: 2.5 },
        position: { x: 0, y: 1, z: 0 },
        rotationSpeed: 0.002
    },
    useKeyframe: 'phase2'
}
```

## Benefits

1. **Consistent Timing**: All breakpoints use the same timing phases, ensuring synchronized animations
2. **Easy Adjustments**: Change timing once in `keyframeTiming` and it applies to all breakpoints
3. **Maintainability**: No need to update timing in multiple places
4. **Flexibility**: Each breakpoint can still have different target values while sharing timing

## Making Timing Changes

To adjust animation timing for all breakpoints:

1. Open `config.js`
2. Locate the `responsive.keyframeTiming` section
3. Modify the desired phase timing:

```javascript
// Example: Make phase2 faster
phase2: {
    duration: 1500,  // Changed from 2000
    delay: 0,
    easing: 'Quadratic.InOut'
}
```

4. The change will automatically apply to all breakpoints using `useKeyframe: 'phase2'`

## Testing Timing Changes

1. Open the browser developer tools
2. Resize the window to test different breakpoints
3. Use the console commands:
   ```javascript
   // Force animation restart
   window.GlobeAPI.getResponsiveVisualizer().startAnimations();
   
   // Check current breakpoint
   window.GlobeAPI.getCurrentBreakpoint();
   ```

## Animation Phases Explained

- **Phase 1**: Initial state (instant, no animation)
- **Phase 2**: Main entrance animation (scale up, move to position)
- **Phase 3**: Rotation burst effect (with delay for dramatic effect)
- **Phase 4**: Final positioning and scaling adjustments
- **Phase 5**: Settle into final rotation speed

This system ensures that regardless of screen size, all animations follow the same rhythm and timing, creating a cohesive user experience across all devices.