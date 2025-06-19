# Spectrum Visualizer - Project Masterplan

## Project Overview
A cross-platform desktop music visualizer built with Electron that captures system audio and displays minimalist, beat-reactive waveform visualizations with dynamic rainbow color cycling.

## Technical Specifications

### Core Requirements
- **Platform**: Windows, macOS, Linux (Electron-based)
- **Audio Capture**: System audio at 44.1kHz sample rate
- **Launch Method**: Manual launch only (no auto-start)
- **Distribution**: Installer packages for each platform
- **Window Modes**: Both fullscreen and windowed support

### Visual Design
- **Style**: Minimalist waveform design
- **Colors**: Rainbow color cycling (smooth transitions through spectrum)
- **Responsiveness**: Dramatic size changes on beat detection
- **Frequency Display**: Single unified waveform (all frequencies combined)
- **Beat Response**: Reactive visuals with different intensity levels

## Project Structure

```
spectrum-visualizer/
├── package.json              # Project dependencies and build config
├── main.js                   # Electron main process
├── index.html                # Main application window
├── renderer.js               # Audio processing and visualization logic
├── style.css                 # UI styling
├── audio/
│   ├── audioCapture.js       # System audio capture implementation
│   ├── beatDetection.js      # Beat detection algorithm
│   └── frequencyAnalysis.js  # FFT and frequency analysis
├── visualization/
│   ├── waveform.js           # Waveform rendering logic
│   ├── colorCycling.js       # Rainbow color management
│   └── animations.js         # Beat-reactive animations
├── utils/
│   ├── config.js             # Application configuration
│   └── helpers.js            # Utility functions
├── assets/
│   ├── icon.ico              # Windows icon
│   ├── icon.icns             # macOS icon
│   └── icon.png              # Linux icon
└── build/                    # Build output directory
```

## Implementation Phases

### Phase 1: Foundation Setup
**Goal**: Establish basic Electron application structure

**Tasks**:
1. Initialize npm project with package.json
2. Set up Electron main process (main.js)
3. Create basic HTML structure (index.html)
4. Configure build system with electron-builder
5. Set up cross-platform icon assets

**Deliverables**:
- Functional Electron app that opens and closes
- Build configuration for all three platforms
- Basic window management

### Phase 2: Audio Capture Implementation
**Goal**: Implement system audio capture across all platforms

**Tasks**:
1. Research and implement platform-specific audio capture:
   - Windows: WASAPI loopback
   - macOS: Core Audio / AVAudioEngine
   - Linux: PulseAudio/ALSA
2. Create unified audio capture interface
3. Implement 44.1kHz sample rate handling
4. Add error handling for audio permission issues

**Deliverables**:
- Cross-platform system audio capture
- Real-time audio data streaming
- Audio permission handling

### Phase 3: Audio Analysis Engine
**Goal**: Process audio data for visualization

**Tasks**:
1. Implement FFT (Fast Fourier Transform) for frequency analysis
2. Create beat detection algorithm:
   - Energy-based beat detection
   - Adaptive threshold adjustment
   - Multiple intensity levels
3. Develop frequency range combination logic
4. Add audio smoothing and normalization

**Deliverables**:
- Real-time frequency analysis
- Beat detection with intensity levels
- Normalized audio data for visualization

### Phase 4: Visualization Engine
**Goal**: Create the core visual rendering system

**Tasks**:
1. Set up HTML5 Canvas for rendering
2. Implement waveform visualization:
   - Minimalist single-wave design
   - Responsive to all frequency ranges
   - Smooth animation between frames
3. Create rainbow color cycling system:
   - HSL color space utilization
   - Smooth color transitions
   - Configurable cycle speed
4. Implement beat-reactive animations:
   - Dramatic size scaling
   - Different effects for different intensities

**Deliverables**:
- Real-time waveform rendering
- Rainbow color cycling
- Beat-reactive visual effects

### Phase 5: User Interface & Controls
**Goal**: Implement window management and basic controls

**Tasks**:
1. Create fullscreen toggle functionality
2. Implement window resizing and responsive design
3. Add basic menu system:
   - File menu (Exit)
   - View menu (Fullscreen toggle)
   - Help menu (About)
4. Handle window focus and background behavior
5. Add keyboard shortcuts (F11 for fullscreen, ESC to exit)

**Deliverables**:
- Fullscreen/windowed mode switching
- Basic application menus
- Keyboard shortcuts

### Phase 6: Performance Optimization
**Goal**: Ensure smooth performance across all platforms

**Tasks**:
1. Optimize audio processing pipeline
2. Implement efficient Canvas rendering
3. Add frame rate limiting (60 FPS target)
4. Memory leak prevention
5. CPU usage optimization
6. Test performance on different hardware configurations

**Deliverables**:
- Smooth 60 FPS visualization
- Low CPU/memory usage
- Stable long-term operation

### Phase 7: Build & Distribution
**Goal**: Create installer packages for all platforms

**Tasks**:
1. Configure electron-builder for each platform:
   - Windows: NSIS installer
   - macOS: DMG package
   - Linux: AppImage
2. Set up code signing (for distribution)
3. Create application icons and metadata
4. Test installation process on each platform
5. Document installation instructions

**Deliverables**:
- Windows installer (.exe)
- macOS package (.dmg)
- Linux AppImage
- Installation documentation

## Key Technologies & Libraries

### Core Technologies
- **Electron**: Cross-platform desktop framework
- **Node.js**: Backend runtime
- **HTML5 Canvas**: 2D graphics rendering
- **Web Audio API**: Audio processing (where applicable)

### Audio Processing
- **Platform-specific audio APIs**:
  - Windows: WASAPI (Windows Audio Session API)
  - macOS: AVAudioEngine / Core Audio
  - Linux: PulseAudio/ALSA
- **FFT Library**: For frequency analysis (consider fftw3 or similar)
- **Beat Detection**: Custom algorithm implementation

### Build & Distribution
- **electron-builder**: Application packaging
- **electron-packager**: Alternative packaging option
- **NSIS**: Windows installer creation
- **DMG creation tools**: macOS packaging

## Configuration Parameters

### Audio Settings
```javascript
const audioConfig = {
  sampleRate: 44100,
  bufferSize: 1024,
  channels: 2,
  bitDepth: 16
};
```

### Visualization Settings
```javascript
const visualConfig = {
  frameRate: 60,
  colorCycleSpeed: 1.0,
  beatSensitivity: 0.7,
  waveformSmoothing: 0.8,
  maxBeatScale: 3.0
};
```

## Testing Strategy

### Unit Testing
- Audio capture functionality
- Beat detection accuracy
- Color cycling algorithms
- Mathematical calculations (FFT, normalization)

### Integration Testing
- Audio pipeline end-to-end
- Window management
- Cross-platform compatibility

### Performance Testing
- Long-term stability (24+ hour runs)
- Memory leak detection
- CPU usage profiling
- Frame rate consistency

### User Acceptance Testing
- Installation process on fresh systems
- Various audio sources (music, games, system sounds)
- Different hardware configurations
- Edge cases (no audio, very loud/quiet audio)

## Risk Mitigation

### Technical Risks
1. **Audio Permissions**: Modern OS security restrictions
   - Mitigation: Clear user instructions, graceful error handling

2. **Cross-platform Audio Capture**: Different APIs per platform
   - Mitigation: Abstraction layer, extensive testing

3. **Performance Issues**: Real-time audio processing demands
   - Mitigation: Profiling, optimization, configurable quality settings

### Distribution Risks
1. **Code Signing**: Required for some platforms
   - Mitigation: Research certificate requirements early

2. **Platform-specific Issues**: OS updates breaking functionality
   - Mitigation: Continuous testing, version compatibility matrix

## Success Metrics

### Functional Requirements
- ✓ Captures system audio on all three platforms
- ✓ Displays smooth waveform visualization
- ✓ Beat detection with dramatic visual response
- ✓ Rainbow color cycling
- ✓ Fullscreen and windowed modes
- ✓ Successful installer creation

### Performance Requirements
- CPU usage < 15% on modern hardware
- Memory usage < 200MB
- Consistent 60 FPS rendering
- < 50ms audio latency
- Stable operation for 8+ hours

### User Experience
- Installation completes in < 2 minutes
- Application launches in < 5 seconds
- Intuitive controls (minimal learning curve)
- Visually appealing and responsive to music

## Timeline Estimate

- **Phase 1**: 2-3 days
- **Phase 2**: 5-7 days
- **Phase 3**: 4-5 days
- **Phase 4**: 6-8 days
- **Phase 5**: 3-4 days
- **Phase 6**: 4-6 days
- **Phase 7**: 3-5 days

**Total Estimated Time**: 4-6 weeks

## Next Steps

1. **Environment Setup**: Install Node.js, Electron, and development tools
2. **Phase 1 Execution**: Create basic Electron application structure
3. **Platform Research**: Investigate audio capture methods for each OS
4. **Prototype Development**: Build minimal viable version for testing
5. **Iterative Development**: Follow phases while testing continuously

## Notes

- Consider using TypeScript for better code maintainability
- Implement comprehensive logging for debugging audio issues
- Plan for future features (equalizer, multiple visualization modes)
- Document audio capture setup for end users
- Consider creating a simple website for project distribution
