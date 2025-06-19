console.log('Renderer.js starting to load...');
const { ipcRenderer } = require('electron');
console.log('ipcRenderer loaded successfully');

// Import visualization modules - with error handling
let WaveformRenderer, ColorCycling, BeatAnimations, BeatDetector, FrequencyAnalyzer, performanceMonitor, logger;

try {
    WaveformRenderer = require('./visualization/waveform.js');
    ColorCycling = require('./visualization/colorCycling.js');
    BeatAnimations = require('./visualization/animations.js');
    BeatDetector = require('./audio/beatDetection.js');
    FrequencyAnalyzer = require('./audio/frequencyAnalysis.js');
    const helpers = require('./utils/helpers.js');
    performanceMonitor = helpers.performanceMonitor;
    logger = helpers.logger;
    console.log('All modules loaded successfully');
} catch (error) {
    console.error('Error loading modules:', error);
    // Create fallback logger
    logger = {
        info: console.log,
        error: console.error,
        warn: console.warn,
        debug: console.log
    };
    // Create fallback performance monitor
    performanceMonitor = {
        startFrame: () => {},
        endFrame: () => {},
        getFPS: () => 60
    };
}

// Application state
let isAudioInitialized = false;
let canvas, ctx;
let animationId;

// Visualization components
let waveformRenderer;
let colorCycling;
let beatAnimations;
let beatDetector;
let frequencyAnalyzer;

// Audio data
let audioData = new Float32Array(1024);
let frequencyData = new Uint8Array(1024);
let isPlaying = false;

// Beat detection state
let lastBeatInfo = { detected: false, intensity: 0 };
let lastAudioAnalysis = null;

// Performance tracking
let lastFrameTime = 0;

// DOM elements
let elements = {};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    console.log('Renderer: DOMContentLoaded event fired - initializing app');
    initializeElements();
    initializeCanvas();
    initializeComponents();
    setupEventListeners();
    console.log('Renderer: About to setup IPC...');
    setupIPC();
    console.log('Renderer: IPC setup complete');
    startVisualization();
    updateStatus('Waiting for audio...', 'waiting');
    
    // Wait for real audio input only - no fallback
    setTimeout(() => {
        if (!isAudioInitialized) {
            console.log('Still waiting for real audio input...');
            updateStatus('Waiting for microphone input from Windows', 'waiting');
        }
    }, 3000);
    
    logger.info('Application initialized successfully');
});

function initializeElements() {
    elements = {
        canvas: document.getElementById('visualizer'),
        controls: document.getElementById('controls'),
        status: document.getElementById('status'),
        loading: document.getElementById('loading'),
        error: document.getElementById('error'),
        help: document.getElementById('help'),
        audioStatus: document.getElementById('audioStatus'),
        fpsCounter: document.getElementById('fpsCounter'),
        errorMessage: document.getElementById('errorMessage'),
        
        // Controls
        sensitivity: document.getElementById('sensitivity'),
        colorSpeed: document.getElementById('colorSpeed'),
        smoothing: document.getElementById('smoothing'),
        sensitivityValue: document.getElementById('sensitivity-value'),
        colorSpeedValue: document.getElementById('colorSpeed-value'),
        smoothingValue: document.getElementById('smoothing-value'),
        
        // Buttons
        fullscreenBtn: document.getElementById('fullscreenBtn'),
        hideControlsBtn: document.getElementById('hideControlsBtn'),
        retryBtn: document.getElementById('retryBtn'),
        settingsBtn: document.getElementById('settingsBtn')
    };
}

function initializeCanvas() {
    canvas = elements.canvas;
    ctx = canvas.getContext('2d');
    
    // Set canvas size to window size
    resizeCanvas();
    
    // Handle window resize
    window.addEventListener('resize', resizeCanvas);
}

function initializeComponents() {
    try {
        // Initialize visualization components
        if (WaveformRenderer) {
            waveformRenderer = new WaveformRenderer(canvas, {
                style: 'minimalist',
                lineWidth: 2,
                glowEffect: true,
                amplitude: 0.3
            });
        }
        
        if (ColorCycling) {
            colorCycling = new ColorCycling({
                speed: 1.0,
                mode: 'rainbow',
                saturation: 100,
                lightness: 50,
                beatResponsive: true
            });
        }
        
        if (BeatAnimations) {
            beatAnimations = new BeatAnimations(canvas, {
                enableParticles: true,
                enableShockwaves: true,
                enableFlash: true,
                particleCount: 50,
                maxScale: 3.0
            });
        }
        
        // Initialize audio processing components
        if (BeatDetector) {
            beatDetector = new BeatDetector({
                sampleRate: 44100,
                bufferSize: 1024,
                energyThreshold: 1.3,
                minTimeBetweenBeats: 100
            });
        }
        
        if (FrequencyAnalyzer) {
            frequencyAnalyzer = new FrequencyAnalyzer({
                sampleRate: 44100,
                fftSize: 1024,
                windowFunction: 'hanning',
                smoothingFactor: 0.8
            });
        }
        
        logger.info('All components initialized');
    } catch (error) {
        console.error('Error initializing components:', error);
        logger.error('Component initialization failed, using fallbacks');
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    
    // Notify waveform renderer of resize
    if (waveformRenderer) {
        waveformRenderer.resize();
    }
}

function setupEventListeners() {
    // Control sliders
    elements.sensitivity.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        elements.sensitivityValue.textContent = e.target.value;
        
        if (beatDetector) {
            beatDetector.configure({ energyThreshold: value });
        }
    });
    
    elements.colorSpeed.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        elements.colorSpeedValue.textContent = e.target.value;
        
        if (colorCycling) {
            colorCycling.setSpeed(value);
        }
    });
    
    elements.smoothing.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        elements.smoothingValue.textContent = e.target.value;
        
        if (frequencyAnalyzer) {
            frequencyAnalyzer.configure({ smoothingFactor: value });
        }
        if (waveformRenderer) {
            waveformRenderer.configure({ smoothing: value });
        }
    });
    
    // Buttons
    elements.fullscreenBtn.addEventListener('click', toggleFullscreen);
    elements.hideControlsBtn.addEventListener('click', hideControls);
    elements.retryBtn.addEventListener('click', retryAudioCapture);
    elements.settingsBtn.addEventListener('click', openAudioSettings);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeydown);
    
    // Click to show/hide controls
    canvas.addEventListener('click', toggleControls);
}

function setupIPC() {
    console.log('Renderer: Setting up IPC listeners...');
    // Listen for audio data from main process
    ipcRenderer.on('audio-data', (event, data) => {
        console.log('Renderer: received audio data via IPC, type:', typeof data, 'constructor:', data?.constructor?.name);
        handleAudioData(data);
    });
    
    // Listen for audio status updates
    ipcRenderer.on('audio-status', (event, status) => {
        handleAudioStatus(status);
    });
    
    // Listen for errors
    ipcRenderer.on('audio-error', (event, error) => {
        handleAudioError(error);
    });
}

function handleAudioData(data) {
    console.log('Renderer: handleAudioData called, data type:', typeof data, 'length:', data?.length || data?.byteLength);
    if (!isAudioInitialized) {
        console.log('Renderer: Initializing audio for first time');
        isAudioInitialized = true;
        hideLoading();
        updateStatus('Audio active', 'active');
    }
    
    // Convert buffer to audio data array
    try {
        let buffer;
        
        // Handle different data formats
        if (data instanceof ArrayBuffer) {
            buffer = new Float32Array(data);
        } else if (data.buffer instanceof ArrayBuffer) {
            buffer = new Float32Array(data.buffer);
        } else if (Array.isArray(data) || data instanceof Float32Array) {
            buffer = new Float32Array(data);
        } else {
            // Fallback: try to convert
            buffer = new Float32Array(data);
        }
        
        audioData.set(buffer.slice(0, Math.min(buffer.length, audioData.length)));
        
        // Amplify very small audio signals (microphone input is often very quiet)
        let maxValue = 0;
        for (let i = 0; i < audioData.length; i++) {
            audioData[i] = audioData[i] * 10000; // Amplify by 10000x for microphone input
            maxValue = Math.max(maxValue, Math.abs(audioData[i]));
        }
        
        console.log(`Audio processing: max value after amplification: ${maxValue}, isAudioInitialized: ${isAudioInitialized}`);
        
        // Force initialization if we have any audio data
        if (!isAudioInitialized) {
            console.log('Audio data received - initializing visualization');
            isAudioInitialized = true;
            isPlaying = true;
            hideLoading();
            updateStatus('Real audio input active', 'active');
        }
        
        // Perform frequency analysis
        lastAudioAnalysis = frequencyAnalyzer.analyze(audioData);
        frequencyData.set(lastAudioAnalysis.frequencyData);
        
        // Detect beats
        lastBeatInfo = beatDetector.detectBeat(frequencyData);
        
        isPlaying = true;
        
    } catch (error) {
        logger.error('Error processing audio data:', error);
        console.log('Data type:', typeof data, 'Data:', data);
        
        // No fallback - wait for real audio data
        console.log('Invalid audio data - waiting for real input');
    }
}

function generateFallbackAudioData() {
    // Generate dynamic test audio data for visualization
    const time = Date.now() * 0.001;
    
    for (let i = 0; i < audioData.length; i++) {
        // Create multiple frequency components for rich waveform
        const freq1 = Math.sin(time * 3 + i * 0.02) * 0.4;           // Low frequency
        const freq2 = Math.sin(time * 7 + i * 0.05) * 0.3;           // Mid frequency  
        const freq3 = Math.sin(time * 12 + i * 0.08) * 0.2;          // High frequency
        const freq4 = Math.sin(time * 0.5 + i * 0.001) * 0.5;        // Very low (bass)
        
        // Add some rhythmic patterns
        const beat = Math.sin(time * 2.5) > 0.6 ? Math.sin(time * 20) * 0.6 : 0;
        
        // Create varying amplitude across the spectrum
        const envelope = Math.sin(i * 0.02) * 0.5 + 0.5;
        
        // Add controlled randomness
        const noise = (Math.random() - 0.5) * 0.15;
        
        // Combine all components
        audioData[i] = (freq1 + freq2 + freq3 + freq4 + beat + noise) * envelope;
    }
    
    // Create frequency data manually for visualization
    for (let i = 0; i < frequencyData.length; i++) {
        // Map audio data to frequency bins with variation
        const audioIndex = Math.floor((i / frequencyData.length) * audioData.length);
        const amplitude = Math.abs(audioData[audioIndex] || 0);
        
        // Add frequency-dependent scaling
        const freqScale = 1.0 - (i / frequencyData.length) * 0.7; // Higher frequencies lower
        
        // Convert to 0-255 range for frequency data
        frequencyData[i] = Math.min(255, amplitude * 255 * freqScale);
    }
    
    // Simulate beat detection
    const currentTime = Date.now();
    const energy = audioData.reduce((sum, val) => sum + val * val, 0) / audioData.length;
    const beatThreshold = 0.1;
    
    lastBeatInfo = {
        detected: energy > beatThreshold,
        intensity: Math.min(energy * 5, 3),
        normalizedIntensity: Math.min(energy * 2, 1),
        timestamp: currentTime,
        energy: energy
    };
    
    isPlaying = true;
}

function handleAudioStatus(status) {
    updateStatus(status.message, status.type);
}

function handleAudioError(error) {
    showError(error.message || 'Unknown audio error');
    updateStatus('Audio error', 'error');
}


function startVisualization() {
    function animate(currentTime) {
        animationId = requestAnimationFrame(animate);
        
        // Performance monitoring
        performanceMonitor.startFrame();
        
        const deltaTime = currentTime - lastFrameTime;
        lastFrameTime = currentTime;
        
        // Update components
        if (colorCycling) {
            colorCycling.update(deltaTime, lastBeatInfo, lastAudioAnalysis?.frequencyData);
        }
        if (beatAnimations) {
            beatAnimations.update(deltaTime, lastBeatInfo, colorCycling ? colorCycling.getVisualizationColors() : getBasicColors());
        }
        
        // Get current visualization data
        const colors = colorCycling ? colorCycling.getVisualizationColors() : getBasicColors();
        const scale = beatAnimations ? beatAnimations.getCurrentScale() : 1.0;
        
        // Clear canvas with pure black background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Render waveform
        if (waveformRenderer && frequencyData.length > 0) {
            // Scale the waveform data for visualization
            const scaledData = Array.from(frequencyData).map(val => (val / 255) * scale);
            waveformRenderer.render(scaledData, colors, lastBeatInfo);
        } else if (isPlaying && audioData.length > 0) {
            // Draw basic waveform with available data
            drawBasicWaveform();
        } else {
            // Draw idle animation when no audio
            drawIdleAnimation(colors);
        }
        
        // Disable particle effects for cleaner look
        // if (beatAnimations) {
        //     beatAnimations.render();
        // }
        
        // Update performance metrics
        performanceMonitor.endFrame();
        updateFPS();
    }
    
    animate(performance.now());
}


function drawIdleAnimation(colors) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const time = Date.now() * 0.002;
    
    // Fallback colors if colors object is not available
    const safeColors = colors || {
        primary: '#ff0080',
        secondary: '#00ff80', 
        accent: '#8000ff'
    };
    
    // Draw animated sine wave using color cycling colors
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, safeColors.primary);
    gradient.addColorStop(0.5, safeColors.secondary);
    gradient.addColorStop(1, safeColors.accent);
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    // Add glow effect
    ctx.shadowColor = safeColors.primary;
    ctx.shadowBlur = 10;
    
    ctx.beginPath();
    
    for (let x = 0; x < canvas.width; x += 4) {
        const y = centerY + Math.sin(x * 0.01 + time) * 50 * Math.sin(time * 0.5);
        
        if (x === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function startBasicVisualization() {
    console.log('Basic visualization disabled - waiting for real audio');
    // No fallback visualization - only real audio input
}

function getBasicColors() {
    const time = Date.now() * 0.001;
    const hue = (time * 50) % 360;
    
    return {
        primary: `hsl(${hue}, 100%, 50%)`,
        secondary: `hsl(${(hue + 120) % 360}, 100%, 50%)`,
        accent: `hsl(${(hue + 240) % 360}, 100%, 50%)`,
        background: '#000000',
        hue: hue,
        rainbow: true
    };
}

function drawBasicWaveform() {
    const centerY = canvas.height / 2;
    const time = Date.now() * 0.001;
    
    // Create rainbow gradient
    const hue = (time * 50) % 360;
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, `hsl(${hue}, 100%, 50%)`);
    gradient.addColorStop(0.25, `hsl(${(hue + 60) % 360}, 100%, 50%)`);
    gradient.addColorStop(0.5, `hsl(${(hue + 120) % 360}, 100%, 50%)`);
    gradient.addColorStop(0.75, `hsl(${(hue + 180) % 360}, 100%, 50%)`);
    gradient.addColorStop(1, `hsl(${(hue + 240) % 360}, 100%, 50%)`);
    
    // Calculate beat scale
    const beatScale = lastBeatInfo ? (1.0 + lastBeatInfo.intensity * 0.5) : 1.0;
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3 * beatScale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Add glow effect
    ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
    ctx.shadowBlur = 20 * beatScale;
    
    ctx.beginPath();
    
    // Draw waveform based on actual audio data
    const step = canvas.width / Math.max(audioData.length, 256);
    let smoothedY = centerY;
    
    for (let i = 0; i < Math.max(audioData.length, 256); i++) {
        const x = i * step;
        let amplitude = 0;
        
        if (i < audioData.length && audioData[i] !== undefined) {
            amplitude = audioData[i];
        } else {
            // Fallback pattern if no data
            amplitude = Math.sin(i * 0.05 + time * 3) * 0.3 * Math.sin(time * 0.7);
        }
        
        const y = centerY + amplitude * canvas.height * 0.3 * beatScale;
        
        // Apply smoothing
        smoothedY = smoothedY * 0.7 + y * 0.3;
        
        if (i === 0) {
            ctx.moveTo(x, smoothedY);
        } else {
            ctx.lineTo(x, smoothedY);
        }
    }
    
    ctx.stroke();
    
    // Add second glow pass for more intensity
    ctx.shadowBlur = 40 * beatScale;
    ctx.globalAlpha = 0.3;
    ctx.stroke();
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
}

function updateFPS() {
    const fps = performanceMonitor.getFPS();
    elements.fpsCounter.textContent = fps;
    
    // Update performance status based on FPS
    if (fps < 30) {
        elements.fpsCounter.style.color = '#ff4444';
    } else if (fps < 50) {
        elements.fpsCounter.style.color = '#ffaa44';
    } else {
        elements.fpsCounter.style.color = '#44ff44';
    }
}

function updateStatus(message, type) {
    elements.audioStatus.textContent = message;
    elements.audioStatus.className = `status-value ${type}`;
}

function hideLoading() {
    elements.loading.classList.add('hidden');
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.error.classList.remove('hidden');
}

function hideError() {
    elements.error.classList.add('hidden');
}

function toggleFullscreen() {
    ipcRenderer.send('toggle-fullscreen');
}

function toggleControls() {
    elements.controls.classList.toggle('hidden');
}

function hideControls() {
    elements.controls.classList.add('hidden');
}

function showControls() {
    elements.controls.classList.remove('hidden');
}

function toggleHelp() {
    elements.help.classList.toggle('hidden');
}

function retryAudioCapture() {
    hideError();
    updateStatus('Retrying...', 'waiting');
    ipcRenderer.send('retry-audio-capture');
}

function openAudioSettings() {
    ipcRenderer.send('open-audio-settings');
}

function handleKeydown(event) {
    switch (event.key.toLowerCase()) {
        case 'h':
            event.preventDefault();
            toggleControls();
            break;
        case '?':
            event.preventDefault();
            toggleHelp();
            break;
        case 'r':
            event.preventDefault();
            resetSettings();
            break;
        case 'escape':
            if (!elements.controls.classList.contains('hidden')) {
                hideControls();
                event.preventDefault();
            }
            break;
    }
}

function resetSettings() {
    const defaultSettings = {
        beatSensitivity: 0.7,
        colorCycleSpeed: 1.0,
        waveformSmoothing: 0.8,
        maxBeatScale: 3.0,
        frameRate: 60
    };
    
    // Update UI controls
    elements.sensitivity.value = defaultSettings.beatSensitivity;
    elements.colorSpeed.value = defaultSettings.colorCycleSpeed;
    elements.smoothing.value = defaultSettings.waveformSmoothing;
    elements.sensitivityValue.textContent = defaultSettings.beatSensitivity;
    elements.colorSpeedValue.textContent = defaultSettings.colorCycleSpeed;
    elements.smoothingValue.textContent = defaultSettings.waveformSmoothing;
    
    // Update components
    if (beatDetector) {
        beatDetector.configure({ energyThreshold: defaultSettings.beatSensitivity });
    }
    if (colorCycling) {
        colorCycling.setSpeed(defaultSettings.colorCycleSpeed);
    }
    if (frequencyAnalyzer) {
        frequencyAnalyzer.configure({ smoothingFactor: defaultSettings.waveformSmoothing });
    }
    if (waveformRenderer) {
        waveformRenderer.configure({ smoothing: defaultSettings.waveformSmoothing });
    }
    if (beatAnimations) {
        beatAnimations.setMaxScale(defaultSettings.maxBeatScale);
    }
    
    logger.info('Settings reset to defaults');
}

// Cleanup on unload
window.addEventListener('beforeunload', () => {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    // Reset components
    if (beatAnimations) {
        beatAnimations.reset();
    }
    if (colorCycling) {
        colorCycling.reset();
    }
    if (beatDetector) {
        beatDetector.reset();
    }
    
    logger.info('Application cleanup completed');
});