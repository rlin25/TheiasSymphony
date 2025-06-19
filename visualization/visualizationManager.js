class VisualizationManager {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.options = {
            transitionDuration: 300,
            showVisualizationName: true,
            ...options
        };
        
        // Current visualization state
        this.currentIndex = 0;
        this.transitionProgress = 0;
        this.isTransitioning = false;
        this.transitionStart = 0;
        
        // Visualization name display
        this.showNameUntil = 0;
        this.nameDisplayDuration = 2000; // 2 seconds
        
        // Amplitude scaling
        this.amplitudeScale = 1.0;
        
        // Initialize all visualizations
        this.visualizations = this.createVisualizationVariants();
        this.currentVisualization = this.visualizations[0];
        
        // Bind methods
        this.handleKeyPress = this.handleKeyPress.bind(this);
        
        // Set up keyboard listeners
        this.setupKeyboardListeners();
    }
    
    createVisualizationVariants() {
        return [
            // Classic waveforms
            {
                name: "Classic Waveform",
                type: "waveform",
                style: "minimalist",
                options: {
                    lineWidth: 2,
                    glowEffect: true,
                    amplitude: 0.3,
                    centerline: true,
                    smoothing: 0.8
                }
            },
            {
                name: "Filled Wave",
                type: "waveform", 
                style: "filled",
                options: {
                    amplitude: 0.4,
                    smoothing: 0.7
                }
            },
            {
                name: "DNA Helix",
                type: "helix",
                style: "dna",
                options: {
                    strands: 2,
                    radius: 100,
                    height: 400,
                    twist: 0.02
                }
            },
            {
                name: "Audio Prism",
                type: "prism",
                style: "triangle",
                options: {
                    sides: 3,
                    layers: 5,
                    size: 150
                }
            },
            
            // Particle visualizations
            {
                name: "Particle Fountain",
                type: "particles",
                style: "fountain",
                options: {
                    particleCount: 150,
                    gravity: 200,
                    velocity: 300,
                    lifespan: 3000
                }
            },
            {
                name: "Galaxy Spiral",
                type: "galaxy",
                style: "spiral",
                options: {
                    arms: 4,
                    stars: 200,
                    rotation: 0.5
                }
            },
            {
                name: "Aurora Wave",
                type: "aurora",
                style: "northern",
                options: {
                    layers: 5,
                    flow: 2.0,
                    brightness: 0.8
                }
            },
            
            // Geometric patterns
            {
                name: "Void Portal",
                type: "portal",
                style: "dimensional",
                options: {
                    rings: 8,
                    depth: 12,
                    rotation: 2.0
                }
            },
            {
                name: "Vortex Storm",
                type: "vortex",
                style: "storm",
                options: {
                    spirals: 3,
                    intensity: 0.8,
                    speed: 1.5
                }
            },
            {
                name: "Electric Storm",
                type: "electric",
                style: "storm",
                options: {
                    branches: 12,
                    intensity: 0.9,
                    chaos: 0.6
                }
            },
            
            // 3D-style effects
            {
                name: "Waveform Ring",
                type: "ring",
                style: "waveform",
                options: {
                    rings: 3,
                    radius: 120,
                    spacing: 60
                }
            },
            {
                name: "Energy Web",
                type: "web",
                style: "energy",
                options: {
                    strands: 15,
                    nodes: 30,
                    tension: 0.8
                }
            },
            
            // Abstract patterns
            {
                name: "Frequency Ripples",
                type: "ripples",
                style: "water",
                options: {
                    rippleCount: 5,
                    maxRadius: 300,
                    speed: 2
                }
            },
            {
                name: "Quantum Field",
                type: "quantum",
                style: "field",
                options: {
                    particles: 150,
                    quantum: true,
                    uncertainty: 0.3
                }
            },
            {
                name: "Fiber Optics",
                type: "fiber",
                style: "optic",
                options: {
                    fibers: 20,
                    length: 300,
                    segments: 30,
                    glow: true
                }
            }
        ];
    }
    
    setupKeyboardListeners() {
        document.addEventListener('keydown', this.handleKeyPress);
    }
    
    handleKeyPress(event) {
        const key = event.key.toLowerCase();
        
        switch (key) {
            case 'n':
            case 'arrowright':
                event.preventDefault();
                this.nextVisualization();
                break;
            case 'p':
            case 'arrowleft':
                event.preventDefault();
                this.previousVisualization();
                break;
            case 'r':
                event.preventDefault();
                this.randomVisualization();
                break;
        }
    }
    
    nextVisualization() {
        if (this.isTransitioning) return;
        
        this.currentIndex = (this.currentIndex + 1) % this.visualizations.length;
        this.startTransition();
    }
    
    previousVisualization() {
        if (this.isTransitioning) return;
        
        this.currentIndex = (this.currentIndex - 1 + this.visualizations.length) % this.visualizations.length;
        this.startTransition();
    }
    
    randomVisualization() {
        if (this.isTransitioning) return;
        
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * this.visualizations.length);
        } while (newIndex === this.currentIndex && this.visualizations.length > 1);
        
        this.currentIndex = newIndex;
        this.startTransition();
    }
    
    startTransition() {
        this.isTransitioning = true;
        this.transitionStart = performance.now();
        this.transitionProgress = 0;
        
        // Show visualization name
        this.showNameUntil = performance.now() + this.nameDisplayDuration;
        
        // Switch to new visualization immediately
        this.currentVisualization = this.visualizations[this.currentIndex];
    }
    
    update(deltaTime) {
        // Update transition
        if (this.isTransitioning) {
            const elapsed = performance.now() - this.transitionStart;
            this.transitionProgress = Math.min(elapsed / this.options.transitionDuration, 1);
            
            if (this.transitionProgress >= 1) {
                this.isTransitioning = false;
            }
        }
    }
    
    render(audioData, frequencyData, colorInfo, beatInfo) {
        // Debug audio and beat info occasionally
        if (Math.random() < 0.005) { // 0.5% of frames
            console.log(`VisualizationManager: audioData=${audioData?.length}, freqData=${frequencyData?.length}, beat=${beatInfo?.detected}, beatIntensity=${beatInfo?.intensity}`);
        }
        
        // Apply amplitude scaling to audio data
        let scaledAudioData = null;
        let scaledFrequencyData = null;
        let scaledBeatInfo = beatInfo;
        
        if (audioData && this.amplitudeScale !== 1.0) {
            scaledAudioData = new Float32Array(audioData.length);
            for (let i = 0; i < audioData.length; i++) {
                scaledAudioData[i] = audioData[i] * this.amplitudeScale;
            }
        } else {
            scaledAudioData = audioData;
        }
        
        if (frequencyData && this.amplitudeScale !== 1.0) {
            scaledFrequencyData = new Uint8Array(frequencyData.length);
            for (let i = 0; i < frequencyData.length; i++) {
                scaledFrequencyData[i] = Math.min(255, frequencyData[i] * this.amplitudeScale);
            }
        } else {
            scaledFrequencyData = frequencyData;
        }
        
        // Scale beat intensity
        if (beatInfo && this.amplitudeScale !== 1.0) {
            scaledBeatInfo = {
                ...beatInfo,
                intensity: beatInfo.intensity * this.amplitudeScale,
                energy: beatInfo.energy ? beatInfo.energy * this.amplitudeScale : beatInfo.energy
            };
        }
        
        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply transition effect if transitioning
        if (this.isTransitioning) {
            const alpha = this.easeInOutCubic(this.transitionProgress);
            this.ctx.globalAlpha = alpha;
        }
        
        // Render current visualization
        this.renderVisualization(this.currentVisualization, scaledAudioData, scaledFrequencyData, colorInfo, scaledBeatInfo);
        
        // Reset alpha
        this.ctx.globalAlpha = 1.0;
        
        // Show visualization name if needed
        if (performance.now() < this.showNameUntil && this.options.showVisualizationName) {
            this.renderVisualizationName();
        }
    }
    
    renderVisualization(viz, audioData, frequencyData, colorInfo, beatInfo) {
        switch (viz.type) {
            case 'waveform':
                this.renderWaveformVisualization(viz, audioData, frequencyData, colorInfo, beatInfo);
                break;
            case 'helix':
                this.renderHelixVisualization(viz, audioData, frequencyData, colorInfo, beatInfo);
                break;
            case 'prism':
                this.renderPrismVisualization(viz, audioData, frequencyData, colorInfo, beatInfo);
                break;
            case 'particles':
                this.renderParticleVisualization(viz, audioData, frequencyData, colorInfo, beatInfo);
                break;
            case 'lightning':
                this.renderLightningVisualization(viz, audioData, frequencyData, colorInfo, beatInfo);
                break;
            case 'geometric':
                this.renderGeometricVisualization(viz, audioData, frequencyData, colorInfo, beatInfo);
                break;
            case 'ring':
                this.renderRingVisualization(viz, audioData, frequencyData, colorInfo, beatInfo);
                break;
            case 'matrix':
                this.renderMatrixVisualization(viz, audioData, frequencyData, colorInfo, beatInfo);
                break;
            case 'ripples':
                this.renderRipplesVisualization(viz, audioData, frequencyData, colorInfo, beatInfo);
                break;
            case 'scope':
                this.renderScopeVisualization(viz, audioData, frequencyData, colorInfo, beatInfo);
                break;
            case 'fiber':
                this.renderFiberVisualization(viz, audioData, frequencyData, colorInfo, beatInfo);
                break;
            case 'vortex':
                this.renderVortexVisualization(viz, audioData, frequencyData, colorInfo, beatInfo);
                break;
            case 'crystal':
                this.renderCrystalVisualization(viz, audioData, frequencyData, colorInfo, beatInfo);
                break;
            case 'neural':
                this.renderNeuralVisualization(viz, audioData, frequencyData, colorInfo, beatInfo);
                break;
            case 'quantum':
                this.renderQuantumVisualization(viz, audioData, frequencyData, colorInfo, beatInfo);
                break;
            case 'galaxy':
                this.renderGalaxyVisualization(viz, audioData, frequencyData, colorInfo, beatInfo);
                break;
            case 'aurora':
                this.renderAuroraVisualization(viz, audioData, frequencyData, colorInfo, beatInfo);
                break;
            case 'portal':
                this.renderPortalVisualization(viz, audioData, frequencyData, colorInfo, beatInfo);
                break;
            case 'electric':
                this.renderElectricVisualization(viz, audioData, frequencyData, colorInfo, beatInfo);
                break;
            case 'web':
                this.renderWebVisualization(viz, audioData, frequencyData, colorInfo, beatInfo);
                break;
            default:
                this.renderWaveformVisualization(viz, audioData, frequencyData, colorInfo, beatInfo);
        }
    }
    
    renderWaveformVisualization(viz, audioData, frequencyData, colorInfo, beatInfo) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerY = height / 2;
        const centerX = width / 2;
        
        // Calculate beat scale
        const beatScale = beatInfo?.detected ? (1.0 + (beatInfo.intensity || 0) * 0.5) : 1.0;
        
        switch (viz.style) {
            case 'minimalist':
                this.renderMinimalistWave(audioData, colorInfo, beatScale, viz.options);
                break;
            case 'filled':
                this.renderFilledWave(audioData, colorInfo, beatScale, viz.options);
                break;
            case 'circular':
                this.renderCircularWave(frequencyData, colorInfo, beatScale, viz.options);
                break;
            case 'bars':
                this.renderBarWave(frequencyData, colorInfo, beatScale, viz.options);
                break;
        }
    }
    
    renderMinimalistWave(audioData, colorInfo, beatScale, options) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerY = height / 2;
        const amplitude = height * (options.amplitude || 0.3) * beatScale;
        
        // Create gradient
        const gradient = this.ctx.createLinearGradient(0, 0, width, 0);
        if (colorInfo?.rainbow) {
            gradient.addColorStop(0, `hsl(${colorInfo.hue}, 100%, 50%)`);
            gradient.addColorStop(0.25, `hsl(${(colorInfo.hue + 60) % 360}, 100%, 50%)`);
            gradient.addColorStop(0.5, `hsl(${(colorInfo.hue + 120) % 360}, 100%, 50%)`);
            gradient.addColorStop(0.75, `hsl(${(colorInfo.hue + 180) % 360}, 100%, 50%)`);
            gradient.addColorStop(1, `hsl(${(colorInfo.hue + 240) % 360}, 100%, 50%)`);
        } else {
            gradient.addColorStop(0, colorInfo?.primary || '#ff0080');
            gradient.addColorStop(1, colorInfo?.secondary || '#00ff80');
        }
        
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = (options.lineWidth || 2) * beatScale;
        this.ctx.lineCap = 'round';
        
        if (options.glowEffect) {
            this.ctx.shadowColor = colorInfo?.primary || '#ff0080';
            this.ctx.shadowBlur = 20 * beatScale;
        }
        
        this.ctx.beginPath();
        
        // Simple approach: use audio data if available, exactly like working renderer
        if (audioData && audioData.length > 0) {
            const step = width / audioData.length;
            
            for (let i = 0; i < audioData.length; i++) {
                const x = i * step;
                const amplitude = audioData[i];
                const y = centerY + amplitude * height * 0.3 * beatScale;
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
        } else {
            // Idle animation when no audio
            const points = 256;
            const step = width / points;
            const time = performance.now() * 0.001;
            
            for (let i = 0; i < points; i++) {
                const x = i * step;
                const value = Math.sin(i * 0.05 + time * 3) * 0.2 * Math.sin(time * 0.7);
                const y = centerY + value * amplitude;
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
        }
        
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }
    
    renderFilledWave(audioData, colorInfo, beatScale, options) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerY = height / 2;
        const amplitude = height * (options.amplitude || 0.4) * beatScale;
        
        const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
        const color = colorInfo?.primary || '#ff0080';
        gradient.addColorStop(0, this.adjustOpacity(color, 0.8));
        gradient.addColorStop(0.5, this.adjustOpacity(color, 0.4));
        gradient.addColorStop(1, this.adjustOpacity(color, 0.8));
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        
        if (audioData && audioData.length > 0) {
            const step = width / audioData.length;
            
            this.ctx.moveTo(0, centerY);
            for (let i = 0; i < audioData.length; i++) {
                const x = i * step;
                const amplitude = audioData[i];
                const y = centerY - amplitude * height * 0.3 * beatScale;
                this.ctx.lineTo(x, y);
            }
            
            for (let i = audioData.length - 1; i >= 0; i--) {
                const x = i * step;
                const amplitude = audioData[i];
                const y = centerY + amplitude * height * 0.3 * beatScale;
                this.ctx.lineTo(x, y);
            }
        } else {
            // Idle animation
            const points = 256;
            const step = width / points;
            const time = performance.now() * 0.001;
            
            this.ctx.moveTo(0, centerY);
            for (let i = 0; i < points; i++) {
                const x = i * step;
                const value = Math.sin(i * 0.05 + time * 3) * 0.2 * Math.sin(time * 0.7);
                const y = centerY - value * amplitude;
                this.ctx.lineTo(x, y);
            }
            
            for (let i = points - 1; i >= 0; i--) {
                const x = i * step;
                const value = Math.sin(i * 0.05 + time * 3) * 0.2 * Math.sin(time * 0.7);
                const y = centerY + value * amplitude;
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    renderHelixVisualization(viz, audioData, frequencyData, colorInfo, beatInfo) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const time = performance.now() * 0.001;
        
        // Calculate energy from audio data
        let energy = 0.1;
        if (audioData && audioData.length > 0) {
            for (let i = 0; i < audioData.length; i++) {
                energy += audioData[i] * audioData[i];
            }
            energy = Math.sqrt(energy / audioData.length);
        }
        
        const beatScale = beatInfo?.detected ? (1.0 + (beatInfo.intensity || 0) * 0.5) : 1.0;
        const strands = viz.options.strands || 2;
        const radius = (viz.options.radius || 100) * (0.8 + energy * 0.4) * beatScale;
        const height = viz.options.height || 400;
        const twist = viz.options.twist || 0.02;
        
        const startY = centerY - height / 2;
        const endY = centerY + height / 2;
        const points = 100;
        
        for (let strand = 0; strand < strands; strand++) {
            const strandOffset = (strand / strands) * Math.PI * 2;
            const hue = (colorInfo?.hue || 0) + strand * 120 + time * 30;
            
            this.ctx.strokeStyle = `hsl(${hue % 360}, 100%, 50%)`;
            this.ctx.lineWidth = 3 * beatScale;
            this.ctx.shadowColor = `hsl(${hue % 360}, 100%, 50%)`;
            this.ctx.shadowBlur = 15 * beatScale;
            
            this.ctx.beginPath();
            
            for (let i = 0; i <= points; i++) {
                const t = i / points;
                const y = startY + t * height;
                const angle = t * height * twist + time + strandOffset;
                
                // Add audio reactivity to the helix radius
                let audioRadius = radius;
                if (audioData && audioData.length > 0) {
                    const audioIndex = Math.floor((i / points) * audioData.length);
                    const amplitude = audioData[audioIndex] || 0;
                    audioRadius += amplitude * 50 * beatScale;
                }
                
                const x = centerX + Math.cos(angle) * audioRadius;
                const z = Math.sin(angle) * audioRadius;
                
                // Simple 3D to 2D projection
                const perspective = 1 + z * 0.001;
                const projectedX = x / perspective;
                const projectedY = y / perspective;
                
                if (i === 0) {
                    this.ctx.moveTo(projectedX, projectedY);
                } else {
                    this.ctx.lineTo(projectedX, projectedY);
                }
            }
            
            this.ctx.stroke();
            
            // Draw connecting bases
            if (strand === 0 && strands > 1) {
                this.ctx.lineWidth = 1 * beatScale;
                this.ctx.shadowBlur = 5 * beatScale;
                
                for (let i = 0; i < points; i += 5) {
                    const t = i / points;
                    const y = startY + t * height;
                    const angle = t * height * twist + time;
                    
                    let audioRadius1 = radius;
                    let audioRadius2 = radius;
                    if (audioData && audioData.length > 0) {
                        const audioIndex = Math.floor((i / points) * audioData.length);
                        const amplitude = audioData[audioIndex] || 0;
                        audioRadius1 += amplitude * 50 * beatScale;
                        audioRadius2 += amplitude * 50 * beatScale;
                    }
                    
                    const x1 = centerX + Math.cos(angle) * audioRadius1;
                    const x2 = centerX + Math.cos(angle + Math.PI) * audioRadius2;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(x1, y);
                    this.ctx.lineTo(x2, y);
                    this.ctx.stroke();
                }
            }
        }
        
        this.ctx.shadowBlur = 0;
    }
    
    renderCircularWave(frequencyData, colorInfo, beatScale, options) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const baseRadius = Math.min(centerX, centerY) * 0.3;
        const maxRadius = Math.min(centerX, centerY) * 0.8;
        
        this.ctx.strokeStyle = colorInfo?.primary || '#ff0080';
        this.ctx.lineWidth = (options.lineWidth || 3) * beatScale;
        
        if (options.glowEffect) {
            this.ctx.shadowColor = colorInfo?.primary || '#ff0080';
            this.ctx.shadowBlur = 15 * beatScale;
        }
        
        this.ctx.beginPath();
        
        if (frequencyData && frequencyData.length > 0) {
            const angleStep = (Math.PI * 2) / frequencyData.length;
            
            for (let i = 0; i < frequencyData.length; i++) {
                const angle = i * angleStep;
                const normalizedValue = frequencyData[i] / 255;
                const radius = baseRadius + normalizedValue * (maxRadius - baseRadius) * beatScale;
                
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
        } else {
            // Idle animation
            const points = 256;
            const angleStep = (Math.PI * 2) / points;
            const time = performance.now() * 0.002;
            
            for (let i = 0; i < points; i++) {
                const angle = i * angleStep;
                const value = Math.sin(i * 0.1 + time) * 0.5 + 0.5;
                const radius = baseRadius + value * (maxRadius - baseRadius) * 0.3;
                
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
        }
        
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }
    
    renderBarWave(frequencyData, colorInfo, beatScale, options) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerY = height / 2;
        const maxBarHeight = height * (options.amplitude || 0.6);
        
        if (frequencyData && frequencyData.length > 0) {
            const barCount = Math.min(frequencyData.length, 64);
            const barWidth = width / barCount;
            
            for (let i = 0; i < barCount; i++) {
                const x = i * barWidth;
                const normalizedValue = frequencyData[i] / 255;
                const barHeight = normalizedValue * maxBarHeight * beatScale;
                
                const hue = (colorInfo?.hue || 0) + (i / barCount) * 60;
                const barGradient = this.ctx.createLinearGradient(x, centerY - barHeight, x, centerY + barHeight);
                barGradient.addColorStop(0, `hsla(${hue % 360}, 100%, 60%, 0.8)`);
                barGradient.addColorStop(0.5, `hsla(${hue % 360}, 100%, 50%, 1.0)`);
                barGradient.addColorStop(1, `hsla(${hue % 360}, 100%, 60%, 0.8)`);
                
                this.ctx.fillStyle = barGradient;
                this.ctx.fillRect(x + 1, centerY - barHeight, barWidth - 2, barHeight);
                this.ctx.fillRect(x + 1, centerY, barWidth - 2, barHeight);
            }
        } else {
            // Idle animation
            const barCount = 64;
            const barWidth = width / barCount;
            const time = performance.now() * 0.003;
            
            for (let i = 0; i < barCount; i++) {
                const x = i * barWidth;
                const value = Math.sin(i * 0.2 + time) * 0.5 + 0.5;
                const barHeight = value * maxBarHeight * 0.3;
                
                const hue = (colorInfo?.hue || 0) + (i / barCount) * 60;
                const barGradient = this.ctx.createLinearGradient(x, centerY - barHeight, x, centerY + barHeight);
                barGradient.addColorStop(0, `hsla(${hue % 360}, 100%, 60%, 0.8)`);
                barGradient.addColorStop(0.5, `hsla(${hue % 360}, 100%, 50%, 1.0)`);
                barGradient.addColorStop(1, `hsla(${hue % 360}, 100%, 60%, 0.8)`);
                
                this.ctx.fillStyle = barGradient;
                this.ctx.fillRect(x + 1, centerY - barHeight, barWidth - 2, barHeight);
                this.ctx.fillRect(x + 1, centerY, barWidth - 2, barHeight);
            }
        }
    }
    
    renderParticleVisualization(viz, audioData, frequencyData, colorInfo, beatInfo) {
        // Initialize particle system if not exists
        if (!this.particleSystems) {
            this.particleSystems = new Map();
        }
        
        let system = this.particleSystems.get(viz.name);
        if (!system) {
            system = this.createParticleSystem(viz);
            this.particleSystems.set(viz.name, system);
        }
        
        this.updateAndRenderParticles(system, viz, audioData, frequencyData, colorInfo, beatInfo);
    }
    
    createParticleSystem(viz) {
        return {
            particles: [],
            lastSpawn: 0,
            spawnRate: 16, // particles per second
            options: viz.options
        };
    }
    
    updateAndRenderParticles(system, viz, audioData, frequencyData, colorInfo, beatInfo) {
        const currentTime = performance.now();
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Calculate average audio energy
        let energy = 0.1;
        if (audioData && audioData.length > 0) {
            for (let i = 0; i < audioData.length; i++) {
                energy += audioData[i] * audioData[i];
            }
            energy = Math.sqrt(energy / audioData.length);
        }
        
        const beatScale = beatInfo?.detected ? (1.0 + (beatInfo.intensity || 0)) : 1.0;
        
        // Spawn new particles based on audio energy
        const spawnCount = Math.floor(energy * system.options.particleCount * 0.05) + 1;
        if (currentTime - system.lastSpawn > (1000 / system.spawnRate)) {
            for (let i = 0; i < spawnCount; i++) {
                this.spawnParticle(system, viz, centerX, centerY, colorInfo, energy);
            }
            system.lastSpawn = currentTime;
        }
        
        // Update and render particles
        system.particles = system.particles.filter(particle => {
            this.updateParticle(particle, viz);
            this.renderParticle(particle, colorInfo);
            return particle.life > 0;
        });
    }
    
    spawnParticle(system, viz, centerX, centerY, colorInfo, energy) {
        const particle = {
            x: centerX + (Math.random() - 0.5) * 100,
            y: centerY + (Math.random() - 0.5) * 100,
            vx: (Math.random() - 0.5) * system.options.velocity * energy,
            vy: (Math.random() - 0.5) * system.options.velocity * energy,
            life: 1.0,
            maxLife: system.options.lifespan || 3000,
            size: 2 + Math.random() * 4,
            color: colorInfo?.primary || '#ff0080',
            createdTime: performance.now()
        };
        
        switch (viz.style) {
            case 'fountain':
                particle.vy = -Math.abs(particle.vy);
                particle.y = this.canvas.height - 50;
                break;
            case 'fireworks':
                if (Math.random() < 0.1) {
                    particle.type = 'explosive';
                    particle.life = 0.8;
                }
                break;
        }
        
        system.particles.push(particle);
    }
    
    updateParticle(particle, viz) {
        const deltaTime = 1/60; // Approximate delta time
        
        particle.x += particle.vx * deltaTime;
        particle.y += particle.vy * deltaTime;
        
        if (viz.options.gravity) {
            particle.vy += viz.options.gravity * deltaTime;
        }
        
        particle.life -= deltaTime * 1000 / particle.maxLife;
        particle.size *= 0.99;
        
        // Boundary checks
        if (particle.x < 0 || particle.x > this.canvas.width ||
            particle.y < 0 || particle.y > this.canvas.height) {
            particle.life = 0;
        }
    }
    
    renderParticle(particle, colorInfo) {
        this.ctx.globalAlpha = particle.life;
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1.0;
    }
    
    renderGeometricVisualization(viz, audioData, frequencyData, colorInfo, beatInfo) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const time = performance.now() * 0.001;
        
        // Calculate energy from audio data
        let energy = 0.1;
        if (audioData && audioData.length > 0) {
            for (let i = 0; i < audioData.length; i++) {
                energy += audioData[i] * audioData[i];
            }
            energy = Math.sqrt(energy / audioData.length);
        }
        
        const beatScale = beatInfo?.detected ? (1.0 + (beatInfo.intensity || 0) * 0.5) : 1.0;
        
        switch (viz.style) {
            case 'kaleidoscope':
                this.renderKaleidoscope(centerX, centerY, time, energy, beatScale, viz.options, colorInfo);
                break;
            case 'spiral':
                this.renderSpiral(centerX, centerY, time, energy, beatScale, viz.options, colorInfo);
                break;
            case 'mandala':
                this.renderMandala(centerX, centerY, time, energy, beatScale, viz.options, colorInfo);
                break;
        }
    }
    
    renderKaleidoscope(centerX, centerY, time, energy, beatScale, options, colorInfo) {
        const segments = options.segments || 8;
        const radius = (options.radius || 200) * beatScale;
        
        for (let segment = 0; segment < segments; segment++) {
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate((Math.PI * 2 * segment) / segments);
            
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
            const hue = (colorInfo?.hue || 0) + segment * 30 + time * 50;
            gradient.addColorStop(0, `hsla(${hue % 360}, 100%, 50%, 0.8)`);
            gradient.addColorStop(1, `hsla(${(hue + 120) % 360}, 100%, 50%, 0.2)`);
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            
            for (let i = 0; i < 10; i++) {
                const angle = (i / 10) * Math.PI / segments;
                const r = radius * (0.3 + energy * 0.7) * Math.sin(time + i);
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            
            this.ctx.fill();
            this.ctx.restore();
        }
    }
    
    renderSpiral(centerX, centerY, time, energy, beatScale, options, colorInfo) {
        const turns = options.turns || 5;
        const maxRadius = (options.radius || 150) * beatScale;
        const segments = options.segments || 64;
        
        this.ctx.strokeStyle = colorInfo?.primary || '#ff0080';
        this.ctx.lineWidth = 2 * beatScale;
        this.ctx.shadowColor = colorInfo?.primary || '#ff0080';
        this.ctx.shadowBlur = 10 * beatScale;
        
        this.ctx.beginPath();
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const angle = t * turns * Math.PI * 2 + time;
            const radius = t * maxRadius * (0.5 + energy * 0.5);
            
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }
    
    renderMandala(centerX, centerY, time, energy, beatScale, options, colorInfo) {
        const layers = options.layers || 4;
        const petals = options.petals || 12;
        const radius = (options.radius || 180) * beatScale;
        
        for (let layer = 0; layer < layers; layer++) {
            const layerRadius = radius * (layer + 1) / layers;
            const hue = (colorInfo?.hue || 0) + layer * 60 + time * 30;
            
            this.ctx.strokeStyle = `hsla(${hue % 360}, 100%, 50%, ${0.8 - layer * 0.2})`;
            this.ctx.lineWidth = (layers - layer) * beatScale;
            
            this.ctx.beginPath();
            
            for (let petal = 0; petal < petals; petal++) {
                const angle = (petal / petals) * Math.PI * 2;
                const petalRadius = layerRadius * (0.7 + energy * 0.3) * Math.sin(time * 2 + layer);
                
                const x = centerX + Math.cos(angle) * petalRadius;
                const y = centerY + Math.sin(angle) * petalRadius;
                
                if (petal === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            
            this.ctx.closePath();
            this.ctx.stroke();
        }
    }
    
    renderRingVisualization(viz, audioData, frequencyData, colorInfo, beatInfo) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const time = performance.now() * 0.001;
        
        // Calculate energy from audio data
        let energy = 0.1;
        if (audioData && audioData.length > 0) {
            for (let i = 0; i < audioData.length; i++) {
                energy += audioData[i] * audioData[i];
            }
            energy = Math.sqrt(energy / audioData.length);
        }
        
        const beatScale = beatInfo?.detected ? (1.0 + (beatInfo.intensity || 0) * 0.5) : 1.0;
        const rings = viz.options.rings || 3;
        const baseRadius = viz.options.radius || 120;
        const spacing = viz.options.spacing || 60;
        
        for (let ring = 0; ring < rings; ring++) {
            const radius = baseRadius + ring * spacing + energy * 50;
            const hue = (colorInfo?.hue || 0) + ring * 40 + time * 30;
            
            this.ctx.strokeStyle = `hsl(${hue % 360}, 100%, 50%)`;
            this.ctx.lineWidth = 3 * beatScale;
            this.ctx.shadowColor = `hsl(${hue % 360}, 100%, 50%)`;
            this.ctx.shadowBlur = 10 * beatScale;
            
            if (audioData && audioData.length > 0) {
                // Draw waveform around the ring
                this.ctx.beginPath();
                const angleStep = (Math.PI * 2) / audioData.length;
                
                for (let i = 0; i < audioData.length; i++) {
                    const angle = i * angleStep + time + ring * 0.5;
                    const amplitude = audioData[i];
                    const waveRadius = radius + amplitude * 30 * beatScale;
                    
                    const x = centerX + Math.cos(angle) * waveRadius;
                    const y = centerY + Math.sin(angle) * waveRadius;
                    
                    if (i === 0) {
                        this.ctx.moveTo(x, y);
                    } else {
                        this.ctx.lineTo(x, y);
                    }
                }
                
                this.ctx.closePath();
                this.ctx.stroke();
            } else {
                // Idle ring
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        }
        
        this.ctx.shadowBlur = 0;
    }
    
    renderMatrixVisualization(viz, audioData, frequencyData, colorInfo, beatInfo) {
        if (!this.matrixColumns) {
            this.initializeMatrix(viz);
        }
        
        const energy = this.calculateAudioEnergy(frequencyData);
        const beatScale = beatInfo?.detected ? (1.0 + (beatInfo.intensity || 0)) : 1.0;
        
        // Clear with slight fade
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const columnWidth = this.canvas.width / this.matrixColumns.length;
        const fontSize = 16;
        this.ctx.font = `${fontSize}px monospace`;
        
        for (let i = 0; i < this.matrixColumns.length; i++) {
            const column = this.matrixColumns[i];
            const x = i * columnWidth;
            
            // Update column based on audio
            const freqIndex = Math.floor((i / this.matrixColumns.length) * (frequencyData?.length || 64));
            const freqValue = frequencyData?.[freqIndex] || 0;
            column.speed = 1 + (freqValue / 255) * 3 * beatScale;
            
            // Move characters down
            column.y += column.speed;
            
            // Reset column if it's gone too far
            if (column.y > this.canvas.height + 100) {
                column.y = -Math.random() * 500;
                column.text = this.generateMatrixText(20 + Math.floor(energy * 20));
            }
            
            // Draw the character trail
            const chars = column.text.split('');
            for (let j = 0; j < chars.length; j++) {
                const charY = column.y - j * fontSize;
                if (charY > -fontSize && charY < this.canvas.height + fontSize) {
                    const alpha = Math.max(0, 1 - j / chars.length);
                    const hue = (colorInfo?.hue || 120) + j * 5;
                    
                    if (j === 0) {
                        // Bright head
                        this.ctx.fillStyle = `hsla(${hue % 360}, 100%, 80%, ${alpha})`;
                        this.ctx.shadowColor = `hsla(${hue % 360}, 100%, 50%, 1)`;
                        this.ctx.shadowBlur = 10 * beatScale;
                    } else {
                        // Fading trail
                        this.ctx.fillStyle = `hsla(${hue % 360}, 100%, 50%, ${alpha * 0.7})`;
                        this.ctx.shadowBlur = 0;
                    }
                    
                    this.ctx.fillText(chars[j], x, charY);
                }
            }
        }
        
        this.ctx.shadowBlur = 0;
    }
    
    initializeMatrix(viz) {
        const columns = viz.options.columns || 50;
        this.matrixColumns = [];
        
        for (let i = 0; i < columns; i++) {
            this.matrixColumns.push({
                y: -Math.random() * this.canvas.height,
                speed: 1 + Math.random() * 3,
                text: this.generateMatrixText(10 + Math.floor(Math.random() * 20))
            });
        }
    }
    
    generateMatrixText(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
        let text = '';
        for (let i = 0; i < length; i++) {
            text += chars[Math.floor(Math.random() * chars.length)];
        }
        return text;
    }
    
    renderRipplesVisualization(viz, audioData, frequencyData, colorInfo, beatInfo) {
        if (!this.ripples) {
            this.ripples = [];
        }
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const time = performance.now() * 0.001;
        
        // Calculate energy from audio data
        let energy = 0.1;
        if (audioData && audioData.length > 0) {
            for (let i = 0; i < audioData.length; i++) {
                energy += audioData[i] * audioData[i];
            }
            energy = Math.sqrt(energy / audioData.length);
        }
        
        const beatScale = beatInfo?.detected ? (1.0 + (beatInfo.intensity || 0) * 0.5) : 1.0;
        
        // Create new ripples on beats or high energy
        if (beatInfo?.detected || energy > 0.3) {
            this.ripples.push({
                x: centerX + (Math.random() - 0.5) * 200,
                y: centerY + (Math.random() - 0.5) * 200,
                radius: 10,
                maxRadius: viz.options.maxRadius || 300,
                speed: (viz.options.speed || 2) * (energy + 0.5),
                life: 1.0,
                decay: 0.005,
                hue: (colorInfo?.hue || 0) + Math.random() * 60,
                intensity: energy
            });
        }
        
        // Update and render ripples
        this.ripples = this.ripples.filter(ripple => {
            ripple.radius += ripple.speed;
            ripple.life -= ripple.decay;
            
            if (ripple.life > 0 && ripple.radius < ripple.maxRadius) {
                const alpha = ripple.life * 0.8;
                const lineWidth = Math.max(1, ripple.intensity * 5 * beatScale);
                
                this.ctx.strokeStyle = `hsla(${ripple.hue % 360}, 100%, 50%, ${alpha})`;
                this.ctx.lineWidth = lineWidth;
                this.ctx.shadowColor = `hsla(${ripple.hue % 360}, 100%, 50%, 1)`;
                this.ctx.shadowBlur = 15 * ripple.intensity * beatScale;
                
                this.ctx.beginPath();
                this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
                this.ctx.stroke();
                
                return true;
            }
            return false;
        });
        
        this.ctx.shadowBlur = 0;
        
        // Limit ripple count for performance
        const maxRipples = viz.options.rippleCount || 10;
        if (this.ripples.length > maxRipples) {
            this.ripples = this.ripples.slice(-maxRipples);
        }
    }
    
    renderScopeVisualization(viz, audioData, frequencyData, colorInfo, beatInfo) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerY = height / 2;
        const time = performance.now() * 0.001;
        const beatScale = beatInfo?.detected ? (1.0 + (beatInfo.intensity || 0) * 0.3) : 1.0;
        
        // Clear with phosphor fade
        this.ctx.fillStyle = 'rgba(0, 20, 0, 0.1)';
        this.ctx.fillRect(0, 0, width, height);
        
        // Draw grid if enabled
        if (viz.options.gridlines) {
            this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
            this.ctx.lineWidth = 1;
            
            // Horizontal lines
            for (let y = 0; y < height; y += 40) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, y);
                this.ctx.lineTo(width, y);
                this.ctx.stroke();
            }
            
            // Vertical lines
            for (let x = 0; x < width; x += 40) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, height);
                this.ctx.stroke();
            }
        }
        
        // Draw oscilloscope traces
        const channels = viz.options.channels || 2;
        const traceHeight = height / channels;
        
        for (let channel = 0; channel < channels; channel++) {
            const channelCenterY = traceHeight * channel + traceHeight / 2;
            const hue = (colorInfo?.hue || 120) + channel * 60;
            
            // Phosphor glow effect
            this.ctx.strokeStyle = `hsl(${hue % 360}, 100%, 70%)`;
            this.ctx.lineWidth = 2 * beatScale;
            this.ctx.shadowColor = `hsl(${hue % 360}, 100%, 50%)`;
            this.ctx.shadowBlur = 10 * beatScale;
            
            this.ctx.beginPath();
            
            const step = width / Math.max(audioData?.length || 256, 256);
            const amplitude = traceHeight * 0.15; // Reduced from 0.4 to 0.15 for lower sensitivity
            
            for (let i = 0; i < (audioData?.length || 256); i++) {
                const x = i * step;
                let value;
                
                if (channel === 0) {
                    // Left channel (or mono)
                    value = audioData?.[i] || Math.sin(i * 0.05 + time * 5) * 0.3;
                } else {
                    // Right channel (phase shifted for stereo effect)
                    value = audioData?.[i] || Math.sin(i * 0.05 + time * 5 + Math.PI/4) * 0.3;
                }
                
                // Apply additional scaling to reduce sensitivity
                const scaledValue = value * 0.3; // Additional 30% scaling
                const y = channelCenterY + scaledValue * amplitude * beatScale;
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            
            this.ctx.stroke();
        }
        
        this.ctx.shadowBlur = 0;
    }
    
    renderCascadeVisualization(viz, audioData, frequencyData, colorInfo, beatInfo) {
        if (!this.cascadeHistory) {
            this.cascadeHistory = [];
        }
        
        const energy = this.calculateAudioEnergy(frequencyData);
        const beatScale = beatInfo?.detected ? (1.0 + (beatInfo.intensity || 0) * 0.5) : 1.0;
        
        // Add current frequency data to history
        const currentLine = [];
        const binCount = 128;
        
        for (let i = 0; i < binCount; i++) {
            const freqIndex = Math.floor((i / binCount) * (frequencyData?.length || 64));
            const value = frequencyData?.[freqIndex] || Math.sin(i * 0.1 + performance.now() * 0.002) * 127 + 127;
            currentLine.push(value * beatScale);
        }
        
        this.cascadeHistory.push(currentLine);
        
        // Limit history size
        const maxHistory = viz.options.height || 100;
        if (this.cascadeHistory.length > maxHistory) {
            this.cascadeHistory.shift();
        }
        
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw the cascade
        const barWidth = this.canvas.width / binCount;
        const lineHeight = this.canvas.height / Math.max(this.cascadeHistory.length, 1);
        
        for (let historyIndex = 0; historyIndex < this.cascadeHistory.length; historyIndex++) {
            const line = this.cascadeHistory[historyIndex];
            const y = this.canvas.height - (historyIndex + 1) * lineHeight;
            const age = historyIndex / this.cascadeHistory.length;
            
            for (let i = 0; i < line.length; i++) {
                const x = i * barWidth;
                const intensity = line[i] / 255;
                const alpha = (1 - age) * viz.options.persistence || 0.95;
                
                // Color based on frequency and intensity
                const hue = (colorInfo?.hue || 0) + (i / line.length) * 120 + historyIndex * 2;
                const saturation = 100;
                const lightness = intensity * 70 + 10;
                
                this.ctx.fillStyle = `hsla(${hue % 360}, ${saturation}%, ${lightness}%, ${alpha})`;
                this.ctx.fillRect(x, y, barWidth - 1, lineHeight);
            }
        }
    }
    
    renderPrismVisualization(viz, audioData, frequencyData, colorInfo, beatInfo) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const time = performance.now() * 0.001;
        
        // Calculate energy from audio data
        let energy = 0.1;
        if (audioData && audioData.length > 0) {
            for (let i = 0; i < audioData.length; i++) {
                energy += audioData[i] * audioData[i];
            }
            energy = Math.sqrt(energy / audioData.length);
        }
        
        const beatScale = beatInfo?.detected ? (1.0 + (beatInfo.intensity || 0) * 0.7) : 1.0;
        const sides = viz.options.sides || 3;
        const layers = viz.options.layers || 5;
        const size = (viz.options.size || 150) * (0.7 + energy * 0.6) * beatScale;
        
        for (let layer = 0; layer < layers; layer++) {
            const layerSize = size * (layer + 1) / layers;
            const rotation = time * (layer + 1) * 0.3 + layer;
            const hue = (colorInfo?.hue || 0) + layer * 30 + time * 40;
            
            // Create prism face with audio-reactive spectrum colors
            for (let face = 0; face < sides; face++) {
                const faceHue = hue + face * (360 / sides);
                
                this.ctx.save();
                this.ctx.translate(centerX, centerY);
                this.ctx.rotate(rotation + (face * Math.PI * 2 / sides));
                
                // Audio-reactive face brightness
                const audioIndex = Math.floor((face / sides) * (audioData?.length || 64));
                const amplitude = audioData?.[audioIndex] || 0;
                const brightness = 40 + Math.abs(amplitude) * 40 + energy * 20;
                
                this.ctx.strokeStyle = `hsl(${faceHue % 360}, 100%, ${brightness}%)`;
                this.ctx.fillStyle = `hsla(${faceHue % 360}, 100%, ${brightness}%, 0.2)`;
                this.ctx.lineWidth = 2 + layer * 0.5;
                this.ctx.shadowColor = `hsl(${faceHue % 360}, 100%, 60%)`;
                this.ctx.shadowBlur = 15 * beatScale;
                
                // Draw triangular prism face
                this.ctx.beginPath();
                for (let vertex = 0; vertex <= sides; vertex++) {
                    const angle = (vertex / sides) * Math.PI * 2;
                    const radius = layerSize + amplitude * 30 * beatScale;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    
                    if (vertex === 0) {
                        this.ctx.moveTo(x, y);
                    } else {
                        this.ctx.lineTo(x, y);
                    }
                }
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
                
                this.ctx.restore();
            }
        }
        
        this.ctx.shadowBlur = 0;
    }
    
    renderLightningVisualization(viz, audioData, frequencyData, colorInfo, beatInfo) {
        if (!this.lightningBolts) {
            this.lightningBolts = [];
        }
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        const time = performance.now() * 0.001;
        
        // Calculate energy from audio data
        let energy = 0.1;
        if (audioData && audioData.length > 0) {
            for (let i = 0; i < audioData.length; i++) {
                energy += audioData[i] * audioData[i];
            }
            energy = Math.sqrt(energy / audioData.length);
        }
        
        const beatScale = beatInfo?.detected ? (1.0 + (beatInfo.intensity || 0)) : 1.0;
        
        // Create new lightning bolts on beats or high energy
        if (beatInfo?.detected || energy > 0.4 || Math.random() < energy * 0.1) {
            const startX = Math.random() * width;
            const startY = Math.random() * height * 0.3;
            const endX = startX + (Math.random() - 0.5) * width * 0.8;
            const endY = height * 0.7 + Math.random() * height * 0.3;
            
            this.lightningBolts.push({
                segments: this.generateLightningPath(startX, startY, endX, endY, energy),
                life: 1.0,
                maxLife: 300 + energy * 500,
                intensity: energy,
                hue: (colorInfo?.hue || 240) + Math.random() * 60,
                createdAt: Date.now()
            });
        }
        
        // Update and render lightning bolts
        this.lightningBolts = this.lightningBolts.filter(bolt => {
            bolt.life -= 1.0 / bolt.maxLife;
            
            if (bolt.life > 0) {
                const alpha = bolt.life;
                const thickness = 1 + bolt.intensity * 3 * beatScale;
                
                // Main bolt
                this.ctx.strokeStyle = `hsla(${bolt.hue % 360}, 100%, 80%, ${alpha})`;
                this.ctx.lineWidth = thickness;
                this.ctx.shadowColor = `hsl(${bolt.hue % 360}, 100%, 60%)`;
                this.ctx.shadowBlur = 20 * bolt.intensity * beatScale;
                
                this.ctx.beginPath();
                for (let i = 0; i < bolt.segments.length; i++) {
                    const segment = bolt.segments[i];
                    if (i === 0) {
                        this.ctx.moveTo(segment.x, segment.y);
                    } else {
                        this.ctx.lineTo(segment.x, segment.y);
                    }
                }
                this.ctx.stroke();
                
                // Lightning glow effect
                this.ctx.strokeStyle = `hsla(${bolt.hue % 360}, 100%, 95%, ${alpha * 0.3})`;
                this.ctx.lineWidth = thickness * 3;
                this.ctx.shadowBlur = 40 * bolt.intensity * beatScale;
                this.ctx.stroke();
                
                return true;
            }
            return false;
        });
        
        this.ctx.shadowBlur = 0;
        
        // Limit bolt count for performance
        if (this.lightningBolts.length > 8) {
            this.lightningBolts = this.lightningBolts.slice(-8);
        }
    }
    
    generateLightningPath(startX, startY, endX, endY, intensity) {
        const segments = [];
        const segmentCount = Math.floor(5 + intensity * 15);
        
        for (let i = 0; i <= segmentCount; i++) {
            const t = i / segmentCount;
            let x = startX + (endX - startX) * t;
            let y = startY + (endY - startY) * t;
            
            // Add random jaggedness
            if (i > 0 && i < segmentCount) {
                const jaggedness = 20 + intensity * 40;
                x += (Math.random() - 0.5) * jaggedness;
                y += (Math.random() - 0.5) * jaggedness * 0.5;
            }
            
            segments.push({ x, y });
        }
        
        return segments;
    }
    
    renderFiberVisualization(viz, audioData, frequencyData, colorInfo, beatInfo) {
        if (!this.fiberStrands) {
            this.initializeFibers(viz);
        }
        
        const time = performance.now() * 0.001;
        
        // Calculate energy from audio data
        let energy = 0.1;
        if (audioData && audioData.length > 0) {
            for (let i = 0; i < audioData.length; i++) {
                energy += audioData[i] * audioData[i];
            }
            energy = Math.sqrt(energy / audioData.length);
        }
        
        const beatScale = beatInfo?.detected ? (1.0 + (beatInfo.intensity || 0) * 0.5) : 1.0;
        
        // Clear with slight fade for trail effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and render fiber strands
        for (let i = 0; i < this.fiberStrands.length; i++) {
            const fiber = this.fiberStrands[i];
            
            // Update fiber properties based on audio
            const audioIndex = Math.floor((i / this.fiberStrands.length) * (audioData?.length || 64));
            const amplitude = audioData?.[audioIndex] || 0;
            
            fiber.intensity = 0.3 + Math.abs(amplitude) * 0.7 + energy * 0.5;
            fiber.thickness = 1 + fiber.intensity * 3 * beatScale;
            fiber.glow = 5 + fiber.intensity * 15 * beatScale;
            
            // Animate fiber path
            const waveOffset = time * fiber.speed + i * 0.5;
            const points = [];
            
            for (let j = 0; j <= fiber.segments; j++) {
                const t = j / fiber.segments;
                let x = fiber.startX + (fiber.endX - fiber.startX) * t;
                let y = fiber.startY + (fiber.endY - fiber.startY) * t;
                
                // Add wave motion with audio reactivity
                const waveAmplitude = fiber.amplitude * (1 + amplitude * 2) * beatScale;
                x += Math.sin(waveOffset + t * fiber.frequency) * waveAmplitude;
                y += Math.cos(waveOffset * 0.7 + t * fiber.frequency * 1.3) * waveAmplitude * 0.5;
                
                points.push({ x, y });
            }
            
            // Draw fiber strand with gradient
            const hue = (colorInfo?.hue || 180) + fiber.hueOffset + time * 20;
            const gradient = this.ctx.createLinearGradient(
                points[0].x, points[0].y,
                points[points.length - 1].x, points[points.length - 1].y
            );
            
            gradient.addColorStop(0, `hsla(${hue % 360}, 100%, 60%, 0.1)`);
            gradient.addColorStop(0.5, `hsla(${(hue + 30) % 360}, 100%, 70%, ${fiber.intensity})`);
            gradient.addColorStop(1, `hsla(${(hue + 60) % 360}, 100%, 60%, 0.1)`);
            
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = fiber.thickness;
            this.ctx.shadowColor = `hsl(${(hue + 30) % 360}, 100%, 70%)`;
            this.ctx.shadowBlur = fiber.glow;
            this.ctx.lineCap = 'round';
            
            // Draw the fiber
            this.ctx.beginPath();
            for (let j = 0; j < points.length; j++) {
                if (j === 0) {
                    this.ctx.moveTo(points[j].x, points[j].y);
                } else {
                    this.ctx.lineTo(points[j].x, points[j].y);
                }
            }
            this.ctx.stroke();
        }
        
        this.ctx.shadowBlur = 0;
    }
    
    initializeFibers(viz) {
        const fiberCount = viz.options.fiberCount || 12;
        this.fiberStrands = [];
        
        for (let i = 0; i < fiberCount; i++) {
            const angle = (i / fiberCount) * Math.PI * 2;
            const radius = Math.min(this.canvas.width, this.canvas.height) * 0.4;
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            
            this.fiberStrands.push({
                startX: centerX + Math.cos(angle) * radius,
                startY: centerY + Math.sin(angle) * radius,
                endX: centerX + Math.cos(angle + Math.PI) * radius * 0.8,
                endY: centerY + Math.sin(angle + Math.PI) * radius * 0.8,
                segments: 20 + Math.floor(Math.random() * 10),
                amplitude: 20 + Math.random() * 40,
                frequency: 2 + Math.random() * 4,
                speed: 0.5 + Math.random() * 1.5,
                hueOffset: i * (360 / fiberCount),
                intensity: 0.5,
                thickness: 2,
                glow: 10
            });
        }
    }
    
    renderVortexVisualization(viz, audioData, frequencyData, colorInfo, beatInfo) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const time = performance.now() * 0.001;
        
        // Calculate energy from audio data
        let energy = 0.1;
        if (audioData && audioData.length > 0) {
            for (let i = 0; i < audioData.length; i++) {
                energy += audioData[i] * audioData[i];
            }
            energy = Math.sqrt(energy / audioData.length);
        }
        
        const beatScale = beatInfo?.detected ? (1.0 + (beatInfo.intensity || 0) * 1.2) : 1.0;
        const spirals = viz.options.spirals || 3;
        const intensity = (viz.options.intensity || 0.8) * (0.5 + energy * 0.5);
        const speed = (viz.options.speed || 1.5) * beatScale;
        
        // Clear with slight fade for trail effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let spiral = 0; spiral < spirals; spiral++) {
            const spiralOffset = (spiral / spirals) * Math.PI * 2;
            const hue = (colorInfo?.hue || 0) + spiral * 120 + time * 40;
            
            // Audio-reactive spiral parameters
            const maxRadius = Math.min(this.canvas.width, this.canvas.height) * 0.4 * (0.8 + energy * 0.4);
            const turns = 3 + energy * 2;
            const particleCount = Math.floor(50 + energy * 100);
            
            this.ctx.strokeStyle = `hsl(${hue % 360}, 100%, 60%)`;
            this.ctx.shadowColor = `hsl(${hue % 360}, 100%, 50%)`;
            this.ctx.shadowBlur = 15 * intensity * beatScale;
            this.ctx.lineWidth = 2 * beatScale;
            
            // Draw vortex spiral
            this.ctx.beginPath();
            for (let i = 0; i <= particleCount; i++) {
                const t = i / particleCount;
                const angle = t * turns * Math.PI * 2 + time * speed + spiralOffset;
                const radius = t * maxRadius;
                
                // Audio-reactive distortion
                let audioDistortion = 0;
                if (audioData && audioData.length > 0) {
                    const audioIndex = Math.floor(t * audioData.length);
                    const amplitude = audioData[audioIndex] || 0;
                    audioDistortion = amplitude * 50 * intensity;
                }
                
                const finalRadius = radius + audioDistortion;
                const x = centerX + Math.cos(angle) * finalRadius;
                const y = centerY + Math.sin(angle) * finalRadius;
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
                
                // Add energy particles at key points
                if (i % 10 === 0 && energy > 0.3) {
                    this.ctx.save();
                    this.ctx.fillStyle = `hsla(${(hue + 60) % 360}, 100%, 80%, ${intensity})`;
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, 3 * beatScale, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.restore();
                }
            }
            this.ctx.stroke();
        }
        
        this.ctx.shadowBlur = 0;
    }
    
    renderCrystalVisualization(viz, audioData, frequencyData, colorInfo, beatInfo) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const time = performance.now() * 0.001;
        
        // Calculate energy from audio data
        let energy = 0.1;
        if (audioData && audioData.length > 0) {
            for (let i = 0; i < audioData.length; i++) {
                energy += audioData[i] * audioData[i];
            }
            energy = Math.sqrt(energy / audioData.length);
        }
        
        const beatScale = beatInfo?.detected ? (1.0 + (beatInfo.intensity || 0) * 0.8) : 1.0;
        const crystals = viz.options.crystals || 8;
        const facets = viz.options.facets || 6;
        const depth = viz.options.depth || 3;
        
        for (let crystal = 0; crystal < crystals; crystal++) {
            const angle = (crystal / crystals) * Math.PI * 2;
            const distance = 100 + crystal * 30;
            const crystalX = centerX + Math.cos(angle + time * 0.3) * distance;
            const crystalY = centerY + Math.sin(angle + time * 0.3) * distance;
            
            for (let layer = 0; layer < depth; layer++) {
                const layerSize = (50 + layer * 20) * (0.7 + energy * 0.6) * beatScale;
                const rotation = time * (layer + 1) * 0.5 + crystal * 0.5;
                const hue = (colorInfo?.hue || 0) + crystal * 45 + layer * 20 + time * 30;
                
                // Audio-reactive brightness
                let brightness = 50 + layer * 15;
                if (audioData && audioData.length > 0) {
                    const audioIndex = Math.floor((crystal / crystals) * audioData.length);
                    const amplitude = audioData[audioIndex] || 0;
                    brightness += Math.abs(amplitude) * 30;
                }
                
                this.ctx.save();
                this.ctx.translate(crystalX, crystalY);
                this.ctx.rotate(rotation);
                
                // Draw crystal facets
                for (let facet = 0; facet < facets; facet++) {
                    const facetAngle = (facet / facets) * Math.PI * 2;
                    const nextFacetAngle = ((facet + 1) / facets) * Math.PI * 2;
                    
                    const facetHue = (hue + facet * 15) % 360;
                    this.ctx.strokeStyle = `hsl(${facetHue}, 100%, ${brightness}%)`;
                    this.ctx.fillStyle = `hsla(${facetHue}, 100%, ${brightness}%, 0.3)`;
                    this.ctx.lineWidth = 2 * beatScale;
                    this.ctx.shadowColor = `hsl(${facetHue}, 100%, 70%)`;
                    this.ctx.shadowBlur = 10 * beatScale;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, 0);
                    this.ctx.lineTo(
                        Math.cos(facetAngle) * layerSize,
                        Math.sin(facetAngle) * layerSize
                    );
                    this.ctx.lineTo(
                        Math.cos(nextFacetAngle) * layerSize,
                        Math.sin(nextFacetAngle) * layerSize
                    );
                    this.ctx.closePath();
                    this.ctx.fill();
                    this.ctx.stroke();
                }
                
                this.ctx.restore();
            }
        }
        
        this.ctx.shadowBlur = 0;
    }
    
    renderNeuralVisualization(viz, audioData, frequencyData, colorInfo, beatInfo) {
        if (!this.neuralNodes) {
            this.initializeNeuralNetwork(viz);
        }
        
        const time = performance.now() * 0.001;
        
        // Calculate energy from audio data
        let energy = 0.1;
        if (audioData && audioData.length > 0) {
            for (let i = 0; i < audioData.length; i++) {
                energy += audioData[i] * audioData[i];
            }
            energy = Math.sqrt(energy / audioData.length);
        }
        
        const beatScale = beatInfo?.detected ? (1.0 + (beatInfo.intensity || 0) * 0.7) : 1.0;
        const pulseSpeed = (viz.options.pulseSpeed || 2) * (0.8 + energy * 0.4);
        
        // Clear with fade
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update node activities based on audio
        for (let i = 0; i < this.neuralNodes.length; i++) {
            const node = this.neuralNodes[i];
            if (audioData && audioData.length > 0) {
                const audioIndex = Math.floor((i / this.neuralNodes.length) * audioData.length);
                const amplitude = audioData[audioIndex] || 0;
                node.activity = 0.3 + Math.abs(amplitude) * 0.7 + energy * 0.5;
            } else {
                node.activity = 0.3 + Math.sin(time * pulseSpeed + i) * 0.4;
            }
        }
        
        // Draw connections
        for (const connection of this.neuralConnections) {
            const nodeA = this.neuralNodes[connection.from];
            const nodeB = this.neuralNodes[connection.to];
            
            const activity = (nodeA.activity + nodeB.activity) / 2;
            const alpha = activity * beatScale * 0.6;
            const hue = (colorInfo?.hue || 180) + connection.hueOffset + time * 20;
            
            // Animate pulse along connection
            const pulsePos = (time * pulseSpeed + connection.phase) % 1;
            const pulseX = nodeA.x + (nodeB.x - nodeA.x) * pulsePos;
            const pulseY = nodeA.y + (nodeB.y - nodeA.y) * pulsePos;
            
            // Draw connection line
            this.ctx.strokeStyle = `hsla(${hue % 360}, 100%, 60%, ${alpha * 0.5})`;
            this.ctx.lineWidth = 1 + activity * 2 * beatScale;
            this.ctx.beginPath();
            this.ctx.moveTo(nodeA.x, nodeA.y);
            this.ctx.lineTo(nodeB.x, nodeB.y);
            this.ctx.stroke();
            
            // Draw pulse
            this.ctx.fillStyle = `hsla(${(hue + 60) % 360}, 100%, 80%, ${activity})`;
            this.ctx.shadowColor = `hsl(${(hue + 60) % 360}, 100%, 60%)`;
            this.ctx.shadowBlur = 10 * activity * beatScale;
            this.ctx.beginPath();
            this.ctx.arc(pulseX, pulseY, 2 + activity * 3 * beatScale, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw nodes
        for (let i = 0; i < this.neuralNodes.length; i++) {
            const node = this.neuralNodes[i];
            const hue = (colorInfo?.hue || 180) + i * 15 + time * 30;
            const size = 4 + node.activity * 8 * beatScale;
            
            this.ctx.fillStyle = `hsl(${hue % 360}, 100%, 70%)`;
            this.ctx.shadowColor = `hsl(${hue % 360}, 100%, 50%)`;
            this.ctx.shadowBlur = 15 * node.activity * beatScale;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.shadowBlur = 0;
    }
    
    initializeNeuralNetwork(viz) {
        const nodeCount = viz.options.nodes || 25;
        const connectionCount = viz.options.connections || 40;
        
        this.neuralNodes = [];
        this.neuralConnections = [];
        
        // Create nodes in a distributed pattern
        for (let i = 0; i < nodeCount; i++) {
            this.neuralNodes.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                activity: Math.random()
            });
        }
        
        // Create connections between nearby nodes
        for (let i = 0; i < connectionCount; i++) {
            const fromIndex = Math.floor(Math.random() * nodeCount);
            let toIndex = Math.floor(Math.random() * nodeCount);
            
            // Avoid self-connections
            while (toIndex === fromIndex) {
                toIndex = Math.floor(Math.random() * nodeCount);
            }
            
            this.neuralConnections.push({
                from: fromIndex,
                to: toIndex,
                phase: Math.random() * Math.PI * 2,
                hueOffset: Math.random() * 60
            });
        }
    }
    
    renderQuantumVisualization(viz, audioData, frequencyData, colorInfo, beatInfo) {
        if (!this.quantumParticles) {
            this.initializeQuantumField(viz);
        }
        
        const time = performance.now() * 0.001;
        
        // Calculate energy from audio data
        let energy = 0.1;
        if (audioData && audioData.length > 0) {
            for (let i = 0; i < audioData.length; i++) {
                energy += audioData[i] * audioData[i];
            }
            energy = Math.sqrt(energy / audioData.length);
        }
        
        const beatScale = beatInfo?.detected ? (1.0 + (beatInfo.intensity || 0) * 0.9) : 1.0;
        const uncertainty = viz.options.uncertainty || 0.3;
        
        // Clear with quantum fade
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update quantum particles
        for (let i = 0; i < this.quantumParticles.length; i++) {
            const particle = this.quantumParticles[i];
            
            // Audio-reactive quantum behavior
            let audioInfluence = 0;
            if (audioData && audioData.length > 0) {
                const audioIndex = Math.floor((i / this.quantumParticles.length) * audioData.length);
                const amplitude = audioData[audioIndex] || 0;
                audioInfluence = amplitude * 2;
            }
            
            // Quantum uncertainty principle - position/momentum trade-off
            const uncertaintyFactor = uncertainty * (1 + energy + audioInfluence);
            particle.x += particle.vx + (Math.random() - 0.5) * uncertaintyFactor * 10;
            particle.y += particle.vy + (Math.random() - 0.5) * uncertaintyFactor * 10;
            
            // Wave-particle duality
            particle.phase += time * particle.frequency + audioInfluence;
            particle.probability = Math.abs(Math.sin(particle.phase)) * (0.5 + energy * 0.5);
            
            // Quantum tunneling - particles can appear elsewhere
            if (Math.random() < 0.001 * energy) {
                particle.x = Math.random() * this.canvas.width;
                particle.y = Math.random() * this.canvas.height;
            }
            
            // Boundary conditions with quantum effects
            if (particle.x < 0 || particle.x > this.canvas.width) {
                particle.vx *= -1;
                particle.x = Math.max(0, Math.min(this.canvas.width, particle.x));
            }
            if (particle.y < 0 || particle.y > this.canvas.height) {
                particle.vy *= -1;
                particle.y = Math.max(0, Math.min(this.canvas.height, particle.y));
            }
            
            // Render quantum particle with probability cloud
            const hue = (colorInfo?.hue || 240) + particle.hueOffset + time * 20;
            const alpha = particle.probability * beatScale;
            const size = 2 + particle.probability * 6 * beatScale;
            
            // Probability cloud (uncertain position)
            this.ctx.fillStyle = `hsla(${hue % 360}, 100%, 70%, ${alpha * 0.3})`;
            this.ctx.shadowColor = `hsl(${hue % 360}, 100%, 60%)`;
            this.ctx.shadowBlur = uncertaintyFactor * 20 * beatScale;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, size * 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Core particle
            this.ctx.fillStyle = `hsla(${hue % 360}, 100%, 90%, ${alpha})`;
            this.ctx.shadowBlur = 5 * beatScale;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, size * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Quantum entanglement connections
        for (let i = 0; i < this.quantumParticles.length; i++) {
            const particle1 = this.quantumParticles[i];
            for (let j = i + 1; j < this.quantumParticles.length; j++) {
                const particle2 = this.quantumParticles[j];
                const distance = Math.sqrt(
                    (particle1.x - particle2.x) ** 2 + (particle1.y - particle2.y) ** 2
                );
                
                // Entangle nearby particles
                if (distance < 100 && Math.random() < 0.1 * energy) {
                    const entanglementStrength = (1 - distance / 100) * particle1.probability * particle2.probability;
                    const hue = (colorInfo?.hue || 240) + time * 40;
                    
                    this.ctx.strokeStyle = `hsla(${hue % 360}, 100%, 80%, ${entanglementStrength * 0.5})`;
                    this.ctx.lineWidth = entanglementStrength * 3 * beatScale;
                    this.ctx.beginPath();
                    this.ctx.moveTo(particle1.x, particle1.y);
                    this.ctx.lineTo(particle2.x, particle2.y);
                    this.ctx.stroke();
                }
            }
        }
        
        this.ctx.shadowBlur = 0;
    }
    
    initializeQuantumField(viz) {
        const particleCount = viz.options.particles || 150;
        this.quantumParticles = [];
        
        for (let i = 0; i < particleCount; i++) {
            this.quantumParticles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                phase: Math.random() * Math.PI * 2,
                frequency: 1 + Math.random() * 3,
                probability: Math.random(),
                hueOffset: Math.random() * 60
            });
        }
    }
    
    renderGalaxyVisualization(viz, audioData, frequencyData, colorInfo, beatInfo) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const time = performance.now() * 0.001;
        
        // Calculate energy from audio data
        let energy = 0.1;
        if (audioData && audioData.length > 0) {
            for (let i = 0; i < audioData.length; i++) {
                energy += audioData[i] * audioData[i];
            }
            energy = Math.sqrt(energy / audioData.length);
        }
        
        const beatScale = beatInfo?.detected ? (1.0 + (beatInfo.intensity || 0) * 0.8) : 1.0;
        const arms = viz.options.arms || 4;
        const stars = viz.options.stars || 200;
        const rotation = (viz.options.rotation || 0.5) * time * (0.8 + energy * 0.4);
        
        // Clear with space-like fade
        this.ctx.fillStyle = 'rgba(0, 0, 10, 0.02)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw galactic core
        const coreSize = 20 + energy * 30 * beatScale;
        const coreGradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreSize);
        const coreHue = (colorInfo?.hue || 45) + time * 20;
        coreGradient.addColorStop(0, `hsla(${coreHue % 360}, 100%, 90%, 0.8)`);
        coreGradient.addColorStop(0.3, `hsla(${(coreHue + 30) % 360}, 100%, 70%, 0.6)`);
        coreGradient.addColorStop(1, `hsla(${(coreHue + 60) % 360}, 100%, 40%, 0)`);
        
        this.ctx.fillStyle = coreGradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, coreSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw spiral arms with stars
        for (let arm = 0; arm < arms; arm++) {
            const armOffset = (arm / arms) * Math.PI * 2;
            const armHue = (colorInfo?.hue || 45) + arm * 60 + time * 30;
            
            // Draw arm structure
            this.ctx.strokeStyle = `hsla(${armHue % 360}, 100%, 60%, 0.4)`;
            this.ctx.lineWidth = 3 * beatScale;
            this.ctx.shadowColor = `hsl(${armHue % 360}, 100%, 70%)`;
            this.ctx.shadowBlur = 10 * beatScale;
            
            this.ctx.beginPath();
            
            const starsPerArm = Math.floor(stars / arms);
            for (let i = 0; i < starsPerArm; i++) {
                const t = i / starsPerArm;
                const angle = armOffset + rotation + t * Math.PI * 4; // Spiral shape
                const radius = t * Math.min(this.canvas.width, this.canvas.height) * 0.4;
                
                // Audio-reactive spiral distortion
                let audioDistortion = 0;
                if (audioData && audioData.length > 0) {
                    const audioIndex = Math.floor(t * audioData.length);
                    const amplitude = audioData[audioIndex] || 0;
                    audioDistortion = amplitude * 20 * energy;
                }
                
                const finalRadius = radius + audioDistortion;
                const x = centerX + Math.cos(angle) * finalRadius;
                const y = centerY + Math.sin(angle) * finalRadius;
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
                
                // Draw individual stars
                if (i % 3 === 0) {
                    const starBrightness = 0.3 + Math.random() * 0.7 + energy * 0.5;
                    const starSize = 1 + starBrightness * 3 * beatScale;
                    const starHue = armHue + Math.random() * 40;
                    
                    this.ctx.save();
                    this.ctx.fillStyle = `hsla(${starHue % 360}, 100%, 80%, ${starBrightness})`;
                    this.ctx.shadowColor = `hsl(${starHue % 360}, 100%, 60%)`;
                    this.ctx.shadowBlur = starSize * 3;
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, starSize, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.restore();
                }
            }
            
            this.ctx.stroke();
        }
        
        this.ctx.shadowBlur = 0;
    }
    
    renderAuroraVisualization(viz, audioData, frequencyData, colorInfo, beatInfo) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const time = performance.now() * 0.001;
        
        // Calculate energy from audio data
        let energy = 0.1;
        if (audioData && audioData.length > 0) {
            for (let i = 0; i < audioData.length; i++) {
                energy += audioData[i] * audioData[i];
            }
            energy = Math.sqrt(energy / audioData.length);
        }
        
        const beatScale = beatInfo?.detected ? (1.0 + (beatInfo.intensity || 0) * 0.9) : 1.0;
        const layers = viz.options.layers || 5;
        const flow = (viz.options.flow || 2.0) * beatScale;
        const brightness = (viz.options.brightness || 0.8) * (0.6 + energy * 0.6);
        
        // Clear with dark sky background
        this.ctx.fillStyle = 'rgba(0, 5, 15, 0.05)';
        this.ctx.fillRect(0, 0, width, height);
        
        // Create aurora layers
        for (let layer = 0; layer < layers; layer++) {
            const layerOffset = layer * 0.3;
            const layerHeight = height * (0.3 + layer * 0.15);
            const baseY = height * 0.7 - layer * 50;
            
            // Audio-reactive wave properties
            let waveAmplitude = 30 + layer * 20;
            let waveFrequency = 0.02 + layer * 0.005;
            
            if (audioData && audioData.length > 0) {
                const audioIndex = Math.floor((layer / layers) * audioData.length);
                const amplitude = audioData[audioIndex] || 0;
                waveAmplitude += Math.abs(amplitude) * 50 * energy;
                waveFrequency += Math.abs(amplitude) * 0.01;
            }
            
            // Create aurora wave gradient
            const gradient = this.ctx.createLinearGradient(0, baseY - layerHeight, 0, baseY);
            const auroraHue = (colorInfo?.hue || 120) + layer * 30 + time * 20;
            const layerAlpha = brightness * (1 - layer * 0.15) * beatScale;
            
            gradient.addColorStop(0, `hsla(${auroraHue % 360}, 100%, 70%, 0)`);
            gradient.addColorStop(0.3, `hsla(${(auroraHue + 20) % 360}, 90%, 60%, ${layerAlpha * 0.6})`);
            gradient.addColorStop(0.7, `hsla(${(auroraHue + 40) % 360}, 80%, 50%, ${layerAlpha * 0.8})`);
            gradient.addColorStop(1, `hsla(${(auroraHue + 60) % 360}, 70%, 40%, ${layerAlpha * 0.4})`);
            
            this.ctx.fillStyle = gradient;
            this.ctx.globalCompositeOperation = 'screen';
            
            // Draw aurora wave
            this.ctx.beginPath();
            this.ctx.moveTo(0, baseY);
            
            // Create flowing wave pattern
            for (let x = 0; x <= width; x += 5) {
                const waveY = baseY + Math.sin(x * waveFrequency + time * flow + layerOffset) * waveAmplitude;
                const waveY2 = waveY + Math.sin(x * waveFrequency * 1.5 + time * flow * 1.3) * waveAmplitude * 0.5;
                this.ctx.lineTo(x, waveY2);
            }
            
            // Complete the aurora shape
            for (let x = width; x >= 0; x -= 5) {
                const waveY = baseY + Math.sin(x * waveFrequency + time * flow + layerOffset) * waveAmplitude;
                const waveY2 = waveY - layerHeight + Math.sin(x * waveFrequency * 0.7 + time * flow * 0.8) * waveAmplitude * 0.3;
                this.ctx.lineTo(x, waveY2);
            }
            
            this.ctx.closePath();
            this.ctx.fill();
            
            // Add shimmer effect
            if (energy > 0.3) {
                this.ctx.strokeStyle = `hsla(${(auroraHue + 80) % 360}, 100%, 80%, ${energy * 0.5})`;
                this.ctx.lineWidth = 2 * beatScale;
                this.ctx.shadowColor = `hsl(${(auroraHue + 80) % 360}, 100%, 60%)`;
                this.ctx.shadowBlur = 15 * beatScale;
                
                this.ctx.beginPath();
                for (let x = 0; x <= width; x += 3) {
                    const shimmerY = baseY + Math.sin(x * waveFrequency + time * flow * 2 + layerOffset) * waveAmplitude * 0.8;
                    if (x === 0) {
                        this.ctx.moveTo(x, shimmerY);
                    } else {
                        this.ctx.lineTo(x, shimmerY);
                    }
                }
                this.ctx.stroke();
            }
        }
        
        this.ctx.globalCompositeOperation = 'source-over';
        
        // Add dancing light particles
        if (!this.auroraParticles) {
            this.auroraParticles = [];
            for (let i = 0; i < 50; i++) {
                this.auroraParticles.push({
                    x: Math.random() * width,
                    y: height * 0.3 + Math.random() * height * 0.4,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 1,
                    life: Math.random(),
                    hueOffset: Math.random() * 60,
                    size: 1 + Math.random() * 3
                });
            }
        }
        
        // Update and render aurora particles
        for (const particle of this.auroraParticles) {
            // Audio-reactive movement
            let audioBoost = 1;
            if (audioData && audioData.length > 0) {
                const audioIndex = Math.floor((particle.x / width) * audioData.length);
                const amplitude = audioData[audioIndex] || 0;
                audioBoost = 1 + Math.abs(amplitude) * 2;
            }
            
            particle.x += particle.vx * audioBoost;
            particle.y += particle.vy * audioBoost;
            particle.life = (particle.life + 0.01) % 1;
            
            // Wrap around edges
            if (particle.x < 0) particle.x = width;
            if (particle.x > width) particle.x = 0;
            if (particle.y < height * 0.2) particle.y = height * 0.8;
            if (particle.y > height * 0.8) particle.y = height * 0.2;
            
            // Render particle
            const particleHue = (colorInfo?.hue || 120) + particle.hueOffset + time * 40;
            const alpha = Math.sin(particle.life * Math.PI) * brightness * beatScale;
            const size = particle.size * (0.5 + alpha * 0.5);
            
            this.ctx.fillStyle = `hsla(${particleHue % 360}, 100%, 80%, ${alpha})`;
            this.ctx.shadowColor = `hsl(${particleHue % 360}, 100%, 60%)`;
            this.ctx.shadowBlur = size * 3;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.shadowBlur = 0;
    }
    
    renderPortalVisualization(viz, audioData, frequencyData, colorInfo, beatInfo) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const time = performance.now() * 0.001;
        
        // Calculate energy from audio data
        let energy = 0.1;
        if (audioData && audioData.length > 0) {
            for (let i = 0; i < audioData.length; i++) {
                energy += audioData[i] * audioData[i];
            }
            energy = Math.sqrt(energy / audioData.length);
        }
        
        const beatScale = beatInfo?.detected ? (1.0 + (beatInfo.intensity || 0) * 1.0) : 1.0;
        const rings = viz.options.rings || 8;
        const depth = viz.options.depth || 12;
        const rotation = (viz.options.rotation || 2.0) * time * beatScale;
        
        // Clear with void background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw portal core with intense energy
        const coreSize = 15 + energy * 25 * beatScale;
        const coreGradient = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, coreSize
        );
        
        const coreHue = (colorInfo?.hue || 280) + time * 100;
        coreGradient.addColorStop(0, `hsla(${coreHue % 360}, 100%, 100%, 1.0)`);
        coreGradient.addColorStop(0.3, `hsla(${(coreHue + 60) % 360}, 100%, 90%, 0.8)`);
        coreGradient.addColorStop(1, `hsla(${(coreHue + 120) % 360}, 100%, 70%, 0)`);
        
        this.ctx.fillStyle = coreGradient;
        this.ctx.shadowColor = `hsl(${coreHue % 360}, 100%, 80%)`;
        this.ctx.shadowBlur = 30 * beatScale;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, coreSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw dimensional portal rings
        for (let ring = 0; ring < rings; ring++) {
            const ringProgress = ring / rings;
            const baseRadius = 30 + ring * 40;
            
            // Audio-reactive ring distortion
            let audioDistortion = 0;
            if (audioData && audioData.length > 0) {
                const audioIndex = Math.floor(ringProgress * audioData.length);
                const amplitude = audioData[audioIndex] || 0;
                audioDistortion = amplitude * 20 * energy;
            }
            
            const ringRadius = baseRadius + audioDistortion;
            const ringRotation = rotation * (1 + ring * 0.2);
            const hue = (colorInfo?.hue || 280) + ring * 30 + time * 40;
            
            // Draw ring segments for dimensional effect
            const segments = 6 + ring;
            const segmentAngle = (Math.PI * 2) / segments;
            
            for (let segment = 0; segment < segments; segment++) {
                const startAngle = segment * segmentAngle + ringRotation;
                const endAngle = (segment + 0.8) * segmentAngle + ringRotation; // Gap between segments
                
                // Calculate segment opacity based on position and audio
                const segmentIntensity = 0.3 + Math.sin(startAngle + time * 2) * 0.2 + energy * 0.5;
                const alpha = segmentIntensity * (1 - ringProgress * 0.7) * beatScale;
                
                // Depth effect - rings further away are thinner and dimmer
                const depthFactor = 1 - ringProgress * 0.8;
                const lineWidth = (3 + ring * 0.5) * depthFactor * beatScale;
                
                this.ctx.strokeStyle = `hsla(${hue % 360}, 100%, ${60 + ring * 5}%, ${alpha})`;
                this.ctx.lineWidth = lineWidth;
                this.ctx.shadowColor = `hsl(${hue % 360}, 100%, 70%)`;
                this.ctx.shadowBlur = 15 * segmentIntensity * beatScale;
                
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, ringRadius, startAngle, endAngle);
                this.ctx.stroke();
                
                // Add dimensional energy sparks
                if (Math.random() < energy * 0.1) {
                    const sparkAngle = startAngle + Math.random() * (endAngle - startAngle);
                    const sparkX = centerX + Math.cos(sparkAngle) * ringRadius;
                    const sparkY = centerY + Math.sin(sparkAngle) * ringRadius;
                    const sparkSize = 2 + energy * 4 * beatScale;
                    
                    this.ctx.fillStyle = `hsla(${(hue + 180) % 360}, 100%, 90%, ${segmentIntensity})`;
                    this.ctx.shadowBlur = 20 * beatScale;
                    this.ctx.beginPath();
                    this.ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }
        
        // Draw energy vortex in the center
        const vortexSegments = 32;
        for (let i = 0; i < vortexSegments; i++) {
            const t = i / vortexSegments;
            const angle = t * Math.PI * 4 + rotation * 3; // Double spiral
            const radius = t * 25 * (1 + energy * 0.5);
            
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            const vortexHue = (colorInfo?.hue || 280) + t * 120 + time * 80;
            const vortexAlpha = (1 - t) * 0.8 * beatScale;
            
            this.ctx.fillStyle = `hsla(${vortexHue % 360}, 100%, 80%, ${vortexAlpha})`;
            this.ctx.shadowColor = `hsl(${vortexHue % 360}, 100%, 60%)`;
            this.ctx.shadowBlur = 10 * beatScale;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 2 + (1 - t) * 3 * beatScale, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Add dimensional distortion waves
        if (beatInfo?.detected || energy > 0.4) {
            const waveCount = 3;
            for (let wave = 0; wave < waveCount; wave++) {
                const waveRadius = 50 + wave * 80 + energy * 100;
                const waveHue = (colorInfo?.hue || 280) + wave * 60;
                const waveAlpha = (0.5 - wave * 0.1) * energy * beatScale;
                
                this.ctx.strokeStyle = `hsla(${waveHue % 360}, 100%, 70%, ${waveAlpha})`;
                this.ctx.lineWidth = 2 * beatScale;
                this.ctx.shadowBlur = 25 * beatScale;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        }
        
        this.ctx.shadowBlur = 0;
    }
    
    renderElectricVisualization(viz, audioData, frequencyData, colorInfo, beatInfo) {
        if (!this.electricBolts) {
            this.electricBolts = [];
        }
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        const time = performance.now() * 0.001;
        
        // Calculate energy from audio data
        let energy = 0.1;
        if (audioData && audioData.length > 0) {
            for (let i = 0; i < audioData.length; i++) {
                energy += audioData[i] * audioData[i];
            }
            energy = Math.sqrt(energy / audioData.length);
        }
        
        const beatScale = beatInfo?.detected ? (1.0 + (beatInfo.intensity || 0) * 1.5) : 1.0;
        const branches = viz.options.branches || 12;
        const intensity = (viz.options.intensity || 0.9) * (0.5 + energy * 0.8);
        const chaos = (viz.options.chaos || 0.6) * beatScale;
        
        // Clear with electric fade
        this.ctx.fillStyle = 'rgba(0, 0, 10, 0.08)';
        this.ctx.fillRect(0, 0, width, height);
        
        // Create new electric bolts on high energy or beats
        if (beatInfo?.detected || energy > 0.3 || Math.random() < energy * 0.2) {
            const newBolt = this.generateElectricBolt(width, height, energy, chaos);
            this.electricBolts.push(newBolt);
        }
        
        // Update and render electric bolts
        this.electricBolts = this.electricBolts.filter(bolt => {
            bolt.life -= bolt.decay;
            
            if (bolt.life > 0) {
                // Main bolt
                const alpha = bolt.life * intensity;
                const thickness = 1 + bolt.intensity * 4 * beatScale;
                const hue = (colorInfo?.hue || 200) + bolt.hueOffset + time * 60;
                
                this.ctx.strokeStyle = `hsla(${hue % 360}, 100%, 90%, ${alpha})`;
                this.ctx.lineWidth = thickness;
                this.ctx.shadowColor = `hsl(${hue % 360}, 100%, 70%)`;
                this.ctx.shadowBlur = 25 * bolt.intensity * beatScale;
                
                this.ctx.beginPath();
                for (let i = 0; i < bolt.segments.length; i++) {
                    const segment = bolt.segments[i];
                    if (i === 0) {
                        this.ctx.moveTo(segment.x, segment.y);
                    } else {
                        this.ctx.lineTo(segment.x, segment.y);
                    }
                }
                this.ctx.stroke();
                
                // Secondary glow
                this.ctx.strokeStyle = `hsla(${(hue + 60) % 360}, 100%, 95%, ${alpha * 0.6})`;
                this.ctx.lineWidth = thickness * 2;
                this.ctx.shadowBlur = 40 * bolt.intensity * beatScale;
                this.ctx.stroke();
                
                // Draw electric branches
                for (const branch of bolt.branches) {
                    const branchAlpha = alpha * 0.7;
                    const branchThickness = Math.max(1, thickness * 0.6);
                    
                    this.ctx.strokeStyle = `hsla(${(hue + 30) % 360}, 100%, 85%, ${branchAlpha})`;
                    this.ctx.lineWidth = branchThickness;
                    this.ctx.shadowBlur = 20 * bolt.intensity * beatScale;
                    
                    this.ctx.beginPath();
                    for (let i = 0; i < branch.segments.length; i++) {
                        const segment = branch.segments[i];
                        if (i === 0) {
                            this.ctx.moveTo(segment.x, segment.y);
                        } else {
                            this.ctx.lineTo(segment.x, segment.y);
                        }
                    }
                    this.ctx.stroke();
                }
                
                // Electric sparks at endpoints
                for (const endpoint of bolt.endpoints) {
                    const sparkSize = 2 + bolt.intensity * 6 * beatScale;
                    const sparkHue = (hue + 120) % 360;
                    
                    this.ctx.fillStyle = `hsla(${sparkHue}, 100%, 95%, ${alpha})`;
                    this.ctx.shadowColor = `hsl(${sparkHue}, 100%, 80%)`;
                    this.ctx.shadowBlur = 30 * beatScale;
                    this.ctx.beginPath();
                    this.ctx.arc(endpoint.x, endpoint.y, sparkSize, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                return true;
            }
            return false;
        });
        
        // Add electric field distortion effect
        if (energy > 0.4) {
            const fieldLines = 8;
            for (let i = 0; i < fieldLines; i++) {
                const startX = (i / fieldLines) * width;
                const startY = Math.random() * height;
                const endX = startX + (Math.random() - 0.5) * 100;
                const endY = startY + (Math.random() - 0.5) * 100;
                
                const fieldHue = (colorInfo?.hue || 200) + i * 20 + time * 80;
                const fieldAlpha = energy * 0.3;
                
                this.ctx.strokeStyle = `hsla(${fieldHue % 360}, 100%, 70%, ${fieldAlpha})`;
                this.ctx.lineWidth = 1;
                this.ctx.shadowBlur = 10 * beatScale;
                
                this.ctx.beginPath();
                this.ctx.moveTo(startX, startY);
                this.ctx.lineTo(endX, endY);
                this.ctx.stroke();
            }
        }
        
        this.ctx.shadowBlur = 0;
        
        // Limit bolt count for performance
        if (this.electricBolts.length > 15) {
            this.electricBolts = this.electricBolts.slice(-10);
        }
    }
    
    generateElectricBolt(width, height, energy, chaos) {
        const startX = Math.random() * width;
        const startY = Math.random() * height * 0.5;
        const endX = startX + (Math.random() - 0.5) * width * 0.8;
        const endY = startY + height * 0.3 + Math.random() * height * 0.4;
        
        const bolt = {
            segments: this.generateBoltPath(startX, startY, endX, endY, energy, chaos),
            branches: [],
            endpoints: [],
            life: 1.0,
            decay: 0.02 + Math.random() * 0.03,
            intensity: 0.5 + energy * 0.8,
            hueOffset: Math.random() * 80
        };
        
        // Generate branches
        const branchCount = 2 + Math.floor(energy * 4);
        for (let i = 0; i < branchCount; i++) {
            const branchStart = bolt.segments[Math.floor(bolt.segments.length * Math.random() * 0.7)];
            const branchEndX = branchStart.x + (Math.random() - 0.5) * 150;
            const branchEndY = branchStart.y + (Math.random() - 0.5) * 150;
            
            bolt.branches.push({
                segments: this.generateBoltPath(
                    branchStart.x, branchStart.y,
                    branchEndX, branchEndY,
                    energy * 0.6, chaos * 1.2
                )
            });
        }
        
        // Add endpoints for sparks
        bolt.endpoints.push({ x: startX, y: startY });
        bolt.endpoints.push({ x: endX, y: endY });
        for (const branch of bolt.branches) {
            const lastSegment = branch.segments[branch.segments.length - 1];
            bolt.endpoints.push({ x: lastSegment.x, y: lastSegment.y });
        }
        
        return bolt;
    }
    
    generateBoltPath(startX, startY, endX, endY, energy, chaos) {
        const segments = [];
        const segmentCount = Math.floor(8 + energy * 12);
        
        for (let i = 0; i <= segmentCount; i++) {
            const t = i / segmentCount;
            let x = startX + (endX - startX) * t;
            let y = startY + (endY - startY) * t;
            
            // Add electric jaggedness
            if (i > 0 && i < segmentCount) {
                const jaggedness = 15 + chaos * 40;
                x += (Math.random() - 0.5) * jaggedness;
                y += (Math.random() - 0.5) * jaggedness * 0.7;
                
                // Add fractal-like sub-jaggedness
                const subJag = jaggedness * 0.3;
                x += (Math.random() - 0.5) * subJag;
                y += (Math.random() - 0.5) * subJag;
            }
            
            segments.push({ x, y });
        }
        
        return segments;
    }
    
    renderWebVisualization(viz, audioData, frequencyData, colorInfo, beatInfo) {
        if (!this.webNodes) {
            this.initializeWeb(viz);
        }
        
        const time = performance.now() * 0.001;
        
        // Calculate energy from audio data
        let energy = 0.1;
        if (audioData && audioData.length > 0) {
            for (let i = 0; i < audioData.length; i++) {
                energy += audioData[i] * audioData[i];
            }
            energy = Math.sqrt(energy / audioData.length);
        }
        
        const beatScale = beatInfo?.detected ? (1.0 + (beatInfo.intensity || 0) * 0.8) : 1.0;
        const tension = (viz.options.tension || 0.8) * (0.7 + energy * 0.6);
        
        // Clear with energy fade
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update web physics
        this.updateWebPhysics(tension, energy, audioData, beatScale);
        
        // Draw energy strands
        for (const strand of this.webStrands) {
            const nodeA = this.webNodes[strand.from];
            const nodeB = this.webNodes[strand.to];
            
            // Calculate strand energy based on node states
            const strandEnergy = (nodeA.energy + nodeB.energy) / 2;
            const thickness = 1 + strandEnergy * 3 * beatScale;
            const alpha = 0.3 + strandEnergy * 0.7;
            
            const hue = (colorInfo?.hue || 300) + strand.hueOffset + time * 30;
            
            // Draw energy flow along strand
            const flowPos = (time * 2 + strand.phase) % 1;
            const flowX = nodeA.x + (nodeB.x - nodeA.x) * flowPos;
            const flowY = nodeA.y + (nodeB.y - nodeA.y) * flowPos;
            
            // Main strand
            this.ctx.strokeStyle = `hsla(${hue % 360}, 100%, 60%, ${alpha * 0.6})`;
            this.ctx.lineWidth = thickness;
            this.ctx.shadowColor = `hsl(${hue % 360}, 100%, 70%)`;
            this.ctx.shadowBlur = 8 * strandEnergy * beatScale;
            
            this.ctx.beginPath();
            this.ctx.moveTo(nodeA.x, nodeA.y);
            this.ctx.lineTo(nodeB.x, nodeB.y);
            this.ctx.stroke();
            
            // Energy pulse
            this.ctx.fillStyle = `hsla(${(hue + 60) % 360}, 100%, 80%, ${strandEnergy})`;
            this.ctx.shadowBlur = 15 * strandEnergy * beatScale;
            this.ctx.beginPath();
            this.ctx.arc(flowX, flowY, 2 + strandEnergy * 4 * beatScale, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw web nodes
        for (let i = 0; i < this.webNodes.length; i++) {
            const node = this.webNodes[i];
            const hue = (colorInfo?.hue || 300) + i * 12 + time * 40;
            const size = 4 + node.energy * 8 * beatScale;
            
            this.ctx.fillStyle = `hsl(${hue % 360}, 100%, 70%)`;
            this.ctx.shadowColor = `hsl(${hue % 360}, 100%, 50%)`;
            this.ctx.shadowBlur = 12 * node.energy * beatScale;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.shadowBlur = 0;
    }
    
    initializeWeb(viz) {
        const nodeCount = viz.options.nodes || 30;
        const strandCount = viz.options.strands || 15;
        
        this.webNodes = [];
        this.webStrands = [];
        
        // Create nodes in organic pattern
        for (let i = 0; i < nodeCount; i++) {
            this.webNodes.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                energy: Math.random(),
                originalX: 0,
                originalY: 0
            });
        }
        
        // Set original positions for spring physics
        for (let i = 0; i < this.webNodes.length; i++) {
            this.webNodes[i].originalX = this.webNodes[i].x;
            this.webNodes[i].originalY = this.webNodes[i].y;
        }
        
        // Create connecting strands
        for (let i = 0; i < strandCount; i++) {
            const fromIndex = Math.floor(Math.random() * nodeCount);
            let toIndex = Math.floor(Math.random() * nodeCount);
            
            while (toIndex === fromIndex) {
                toIndex = Math.floor(Math.random() * nodeCount);
            }
            
            this.webStrands.push({
                from: fromIndex,
                to: toIndex,
                phase: Math.random() * Math.PI * 2,
                hueOffset: Math.random() * 120
            });
        }
    }
    
    updateWebPhysics(tension, energy, audioData, beatScale) {
        // Update node energies based on audio
        for (let i = 0; i < this.webNodes.length; i++) {
            const node = this.webNodes[i];
            
            if (audioData && audioData.length > 0) {
                const audioIndex = Math.floor((i / this.webNodes.length) * audioData.length);
                const amplitude = audioData[audioIndex] || 0;
                node.energy = 0.2 + Math.abs(amplitude) * 0.8 + energy * 0.5;
            } else {
                node.energy = 0.2 + Math.sin(performance.now() * 0.002 + i) * 0.4;
            }
            
            // Apply spring forces to return to original position
            const springForceX = (node.originalX - node.x) * tension * 0.01;
            const springForceY = (node.originalY - node.y) * tension * 0.01;
            
            node.vx += springForceX;
            node.vy += springForceY;
            
            // Add audio-reactive movement
            node.vx += (Math.random() - 0.5) * node.energy * 2;
            node.vy += (Math.random() - 0.5) * node.energy * 2;
            
            // Apply damping
            node.vx *= 0.95;
            node.vy *= 0.95;
            
            // Update position
            node.x += node.vx;
            node.y += node.vy;
            
            // Keep within bounds
            if (node.x < 0 || node.x > this.canvas.width) node.vx *= -0.5;
            if (node.y < 0 || node.y > this.canvas.height) node.vy *= -0.5;
            node.x = Math.max(0, Math.min(this.canvas.width, node.x));
            node.y = Math.max(0, Math.min(this.canvas.height, node.y));
        }
    }
    
    renderPlasmaVisualization(viz, audioData, frequencyData, colorInfo, beatInfo) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const time = performance.now() * 0.001;
        
        // Calculate energy from audio data
        let energy = 0.1;
        if (audioData && audioData.length > 0) {
            for (let i = 0; i < audioData.length; i++) {
                energy += audioData[i] * audioData[i];
            }
            energy = Math.sqrt(energy / audioData.length);
        }
        
        const beatScale = beatInfo?.detected ? (1.0 + (beatInfo.intensity || 0) * 0.8) : 1.0;
        const complexity = viz.options.complexity || 3;
        const speed = (viz.options.speed || 2) * (0.8 + energy * 0.4);
        const colorShift = viz.options.colorShift || 60;
        
        // Create ImageData for pixel manipulation
        const imageData = this.ctx.createImageData(width, height);
        const data = imageData.data;
        
        // Generate plasma field with audio reactivity
        for (let y = 0; y < height; y += 2) { // Sample every 2 pixels for performance
            for (let x = 0; x < width; x += 2) {
                // Multiple sine wave patterns for plasma effect
                let plasma = 0;
                plasma += Math.sin(x * 0.01 + time * speed);
                plasma += Math.sin(y * 0.01 + time * speed * 1.3);
                plasma += Math.sin((x + y) * 0.008 + time * speed * 0.7);
                plasma += Math.sin(Math.sqrt(x*x + y*y) * 0.005 + time * speed * 2);
                
                // Audio-reactive modulation
                if (audioData && audioData.length > 0) {
                    const audioIndex = Math.floor((x / width) * audioData.length);
                    const amplitude = audioData[audioIndex] || 0;
                    plasma += Math.sin(amplitude * 20 + time * speed * 3) * energy * 2;
                }
                
                // Normalize and add beat scaling
                plasma = (plasma / (4 + complexity)) * beatScale;
                
                // Convert to color
                const hue = (colorInfo?.hue || 0) + plasma * colorShift + time * 30;
                const saturation = 80 + Math.abs(plasma) * 20;
                const lightness = 30 + Math.abs(plasma) * 50 + energy * 20;
                
                const rgb = this.hslToRgb(hue % 360, saturation, lightness);
                
                // Fill 2x2 pixel block for performance
                for (let dy = 0; dy < 2 && y + dy < height; dy++) {
                    for (let dx = 0; dx < 2 && x + dx < width; dx++) {
                        const index = ((y + dy) * width + (x + dx)) * 4;
                        data[index] = rgb.r;     // Red
                        data[index + 1] = rgb.g; // Green
                        data[index + 2] = rgb.b; // Blue
                        data[index + 3] = 255;   // Alpha
                    }
                }
            }
        }
        
        // Apply the plasma field to canvas
        this.ctx.putImageData(imageData, 0, 0);
        
        // Add glow overlay for enhanced effect
        if (energy > 0.3 || beatInfo?.detected) {
            this.ctx.globalCompositeOperation = 'screen';
            this.ctx.globalAlpha = energy * 0.3;
            
            const gradient = this.ctx.createRadialGradient(
                width / 2, height / 2, 0,
                width / 2, height / 2, Math.min(width, height) / 2
            );
            
            const glowHue = (colorInfo?.hue || 0) + time * 50;
            gradient.addColorStop(0, `hsla(${glowHue % 360}, 100%, 70%, 0.8)`);
            gradient.addColorStop(0.5, `hsla(${(glowHue + 60) % 360}, 100%, 50%, 0.4)`);
            gradient.addColorStop(1, `hsla(${(glowHue + 120) % 360}, 100%, 30%, 0)`);
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, width, height);
            
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.globalAlpha = 1.0;
        }
    }
    
    // Utility method for HSL to RGB conversion
    hslToRgb(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;
        
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h * 6) % 2 - 1));
        const m = l - c / 2;
        
        let r, g, b;
        
        if (0 <= h && h < 1/6) {
            r = c; g = x; b = 0;
        } else if (1/6 <= h && h < 2/6) {
            r = x; g = c; b = 0;
        } else if (2/6 <= h && h < 3/6) {
            r = 0; g = c; b = x;
        } else if (3/6 <= h && h < 4/6) {
            r = 0; g = x; b = c;
        } else if (4/6 <= h && h < 5/6) {
            r = x; g = 0; b = c;
        } else {
            r = c; g = 0; b = x;
        }
        
        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
    }
    
    renderVisualizationName() {
        const currentViz = this.visualizations[this.currentIndex];
        const fadeTime = 500; // 500ms fade
        const currentTime = performance.now();
        const timeLeft = this.showNameUntil - currentTime;
        
        let alpha = 1.0;
        if (timeLeft < fadeTime) {
            alpha = timeLeft / fadeTime;
        }
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#000000';
        this.ctx.shadowBlur = 5;
        
        const text = `${this.currentIndex + 1}/${this.visualizations.length}: ${currentViz.name}`;
        this.ctx.fillText(text, this.canvas.width / 2, 50);
        
        this.ctx.restore();
    }
    
    // Utility methods
    calculateAudioEnergy(frequencyData) {
        if (!frequencyData || frequencyData.length === 0) return 0.1;
        
        let energy = 0;
        for (let i = 0; i < frequencyData.length; i++) {
            energy += (frequencyData[i] / 255) * (frequencyData[i] / 255);
        }
        return Math.min(energy / frequencyData.length, 1.0);
    }
    
    adjustOpacity(color, opacity) {
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        return color;
    }
    
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }
    
    // Public methods
    getCurrentVisualization() {
        return this.visualizations[this.currentIndex];
    }
    
    getVisualizationList() {
        return this.visualizations.map((viz, index) => ({
            index,
            name: viz.name,
            type: viz.type,
            style: viz.style,
            current: index === this.currentIndex
        }));
    }
    
    setVisualization(index) {
        if (index >= 0 && index < this.visualizations.length && index !== this.currentIndex) {
            this.currentIndex = index;
            this.startTransition();
        }
    }
    
    setAmplitudeScale(scale) {
        if (typeof scale === 'number' && scale > 0) {
            this.amplitudeScale = Math.max(0.1, Math.min(5.0, scale));
        }
    }
    
    cleanup() {
        document.removeEventListener('keydown', this.handleKeyPress);
        if (this.particleSystems) {
            this.particleSystems.clear();
        }
    }
}

module.exports = VisualizationManager;