class WaveformRenderer {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.options = {
            style: 'minimalist',
            lineWidth: 2,
            glowEffect: true,
            glowIntensity: 1.0,
            amplitude: 0.3,
            smoothing: 0.8,
            responsive: true,
            centerline: true,
            ...options
        };
        
        // Rendering state
        this.lastFrameTime = 0;
        this.smoothedData = [];
        this.previousData = [];
        
        // Animation properties
        this.animationSpeed = 1.0;
        this.pulseEffect = 0;
        this.beatScale = 1.0;
        
        // Visual effects
        this.trailEffect = [];
        this.particleSystem = [];
        
        this.initialize();
    }

    initialize() {
        // Set up canvas for high DPI displays
        this.setupHighDPI();
        
        // Initialize smoothed data arrays
        this.resizeDataArrays();
        
        // Set up rendering context
        this.setupRenderingContext();
    }

    setupHighDPI() {
        const devicePixelRatio = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * devicePixelRatio;
        this.canvas.height = rect.height * devicePixelRatio;
        
        this.ctx.scale(devicePixelRatio, devicePixelRatio);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }

    setupRenderingContext() {
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    resizeDataArrays() {
        const targetLength = 256; // Standard size for visualization
        
        if (this.smoothedData.length !== targetLength) {
            this.smoothedData = new Array(targetLength).fill(0);
            this.previousData = new Array(targetLength).fill(0);
        }
    }

    // Main rendering function
    render(audioData, colorInfo, beatInfo) {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        // Clear canvas
        this.clearCanvas();
        
        // Process audio data
        const processedData = this.processAudioData(audioData);
        
        // Apply smoothing
        this.applySmoothingFilter(processedData);
        
        // Update beat effects
        this.updateBeatEffects(beatInfo, deltaTime);
        
        // Render waveform based on style
        switch (this.options.style) {
            case 'minimalist':
                this.renderMinimalistWaveform(colorInfo);
                break;
            case 'filled':
                this.renderFilledWaveform(colorInfo);
                break;
            case 'circular':
                this.renderCircularWaveform(colorInfo);
                break;
            case 'bars':
                this.renderBarWaveform(colorInfo);
                break;
            default:
                this.renderMinimalistWaveform(colorInfo);
        }
        
        // Apply post-processing effects
        this.applyPostProcessing(colorInfo, beatInfo);
    }

    clearCanvas() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.02)'; // Slight trail effect
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    processAudioData(audioData) {
        if (!audioData || audioData.length === 0) {
            return new Array(this.smoothedData.length).fill(0);
        }
        
        const processed = [];
        const targetLength = this.smoothedData.length;
        const sourceLength = audioData.length;
        
        // Resample audio data to target length
        for (let i = 0; i < targetLength; i++) {
            const sourceIndex = Math.floor((i / targetLength) * sourceLength);
            const value = Math.abs(audioData[sourceIndex] || 0);
            processed.push(value);
        }
        
        return processed;
    }

    applySmoothingFilter(data) {
        const smoothing = this.options.smoothing;
        
        for (let i = 0; i < data.length; i++) {
            this.smoothedData[i] = 
                smoothing * this.smoothedData[i] + 
                (1 - smoothing) * data[i];
        }
    }

    updateBeatEffects(beatInfo, deltaTime) {
        if (beatInfo && beatInfo.detected) {
            this.beatScale = Math.max(this.beatScale, 1.0 + beatInfo.intensity * 0.5);
            this.pulseEffect = 1.0;
        }
        
        // Decay effects
        this.beatScale = Math.max(1.0, this.beatScale * 0.95);
        this.pulseEffect *= 0.9;
    }

    renderMinimalistWaveform(colorInfo) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerY = height / 2;
        const amplitude = height * this.options.amplitude * this.beatScale;
        
        // Create gradient
        const gradient = this.createGradient(colorInfo, width);
        
        // Set up line properties
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = this.options.lineWidth * this.beatScale;
        
        // Apply glow effect
        if (this.options.glowEffect) {
            this.ctx.shadowColor = colorInfo.primary || '#ffffff';
            this.ctx.shadowBlur = 20 * this.options.glowIntensity * this.beatScale;
        }
        
        // Draw waveform
        this.ctx.beginPath();
        
        const step = width / (this.smoothedData.length - 1);
        
        for (let i = 0; i < this.smoothedData.length; i++) {
            const x = i * step;
            const y = centerY + (this.smoothedData[i] * amplitude * (Math.random() * 0.1 + 0.95));
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.stroke();
        
        // Draw reflection (optional)
        if (this.options.centerline) {
            this.drawReflection(centerY, amplitude, gradient);
        }
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
    }

    renderFilledWaveform(colorInfo) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerY = height / 2;
        const amplitude = height * this.options.amplitude * this.beatScale;
        
        // Create gradient
        const gradient = this.createVerticalGradient(colorInfo, height);
        
        // Fill the waveform area
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        
        const step = width / (this.smoothedData.length - 1);
        
        // Top part of waveform
        this.ctx.moveTo(0, centerY);
        for (let i = 0; i < this.smoothedData.length; i++) {
            const x = i * step;
            const y = centerY - (this.smoothedData[i] * amplitude);
            this.ctx.lineTo(x, y);
        }
        
        // Bottom part of waveform (mirrored)
        for (let i = this.smoothedData.length - 1; i >= 0; i--) {
            const x = i * step;
            const y = centerY + (this.smoothedData[i] * amplitude);
            this.ctx.lineTo(x, y);
        }
        
        this.ctx.closePath();
        this.ctx.fill();
    }

    renderCircularWaveform(colorInfo) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const baseRadius = Math.min(centerX, centerY) * 0.3;
        const maxRadius = Math.min(centerX, centerY) * 0.8;
        
        const gradient = this.createRadialGradient(colorInfo, centerX, centerY, maxRadius);
        
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = this.options.lineWidth * this.beatScale;
        
        if (this.options.glowEffect) {
            this.ctx.shadowColor = colorInfo.primary || '#ffffff';
            this.ctx.shadowBlur = 15 * this.options.glowIntensity * this.beatScale;
        }
        
        this.ctx.beginPath();
        
        const angleStep = (Math.PI * 2) / this.smoothedData.length;
        
        for (let i = 0; i < this.smoothedData.length; i++) {
            const angle = i * angleStep;
            const radius = baseRadius + (this.smoothedData[i] * (maxRadius - baseRadius) * this.beatScale);
            
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }

    renderBarWaveform(colorInfo) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerY = height / 2;
        const barWidth = width / this.smoothedData.length;
        const maxBarHeight = height * this.options.amplitude;
        
        for (let i = 0; i < this.smoothedData.length; i++) {
            const x = i * barWidth;
            const barHeight = this.smoothedData[i] * maxBarHeight * this.beatScale;
            
            // Create individual bar gradient
            const barGradient = this.ctx.createLinearGradient(x, centerY - barHeight, x, centerY + barHeight);
            const hue = (colorInfo.hue + (i / this.smoothedData.length) * 60) % 360;
            
            barGradient.addColorStop(0, `hsla(${hue}, 100%, 60%, 0.8)`);
            barGradient.addColorStop(0.5, `hsla(${hue}, 100%, 50%, 1.0)`);
            barGradient.addColorStop(1, `hsla(${hue}, 100%, 60%, 0.8)`);
            
            this.ctx.fillStyle = barGradient;
            
            // Draw bar (both up and down from center)
            this.ctx.fillRect(x + 1, centerY - barHeight, barWidth - 2, barHeight);
            this.ctx.fillRect(x + 1, centerY, barWidth - 2, barHeight);
        }
    }

    drawReflection(centerY, amplitude, gradient) {
        this.ctx.globalAlpha = 0.3;
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = this.options.lineWidth * 0.5;
        
        this.ctx.beginPath();
        const step = this.canvas.width / (this.smoothedData.length - 1);
        
        for (let i = 0; i < this.smoothedData.length; i++) {
            const x = i * step;
            const y = centerY - (this.smoothedData[i] * amplitude * 0.5);
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.stroke();
        this.ctx.globalAlpha = 1.0;
    }

    createGradient(colorInfo, width) {
        const gradient = this.ctx.createLinearGradient(0, 0, width, 0);
        
        if (colorInfo.rainbow) {
            // Rainbow gradient
            gradient.addColorStop(0, `hsl(${colorInfo.hue}, 100%, 50%)`);
            gradient.addColorStop(0.2, `hsl(${(colorInfo.hue + 60) % 360}, 100%, 50%)`);
            gradient.addColorStop(0.4, `hsl(${(colorInfo.hue + 120) % 360}, 100%, 50%)`);
            gradient.addColorStop(0.6, `hsl(${(colorInfo.hue + 180) % 360}, 100%, 50%)`);
            gradient.addColorStop(0.8, `hsl(${(colorInfo.hue + 240) % 360}, 100%, 50%)`);
            gradient.addColorStop(1, `hsl(${(colorInfo.hue + 300) % 360}, 100%, 50%)`);
        } else {
            // Single color gradient
            const color = colorInfo.primary || '#ffffff';
            gradient.addColorStop(0, color);
            gradient.addColorStop(0.5, this.adjustBrightness(color, 1.2));
            gradient.addColorStop(1, color);
        }
        
        return gradient;
    }

    createVerticalGradient(colorInfo, height) {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
        
        const color = colorInfo.primary || '#ffffff';
        gradient.addColorStop(0, this.adjustOpacity(color, 0.8));
        gradient.addColorStop(0.5, this.adjustOpacity(color, 0.4));
        gradient.addColorStop(1, this.adjustOpacity(color, 0.8));
        
        return gradient;
    }

    createRadialGradient(colorInfo, centerX, centerY, radius) {
        const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        
        const color = colorInfo.primary || '#ffffff';
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.7, this.adjustOpacity(color, 0.8));
        gradient.addColorStop(1, this.adjustOpacity(color, 0.2));
        
        return gradient;
    }

    applyPostProcessing(colorInfo, beatInfo) {
        // Add particle effects for beats
        if (beatInfo && beatInfo.detected && beatInfo.intensity > 0.5) {
            this.addBeatParticles(colorInfo, beatInfo);
        }
        
        // Update and render particles
        this.updateParticles();
        this.renderParticles();
    }

    addBeatParticles(colorInfo, beatInfo) {
        const particleCount = Math.floor(beatInfo.intensity * 10);
        
        for (let i = 0; i < particleCount; i++) {
            this.particleSystem.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1.0,
                decay: 0.02,
                color: colorInfo.primary || '#ffffff',
                size: Math.random() * 3 + 1
            });
        }
    }

    updateParticles() {
        this.particleSystem = this.particleSystem.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            particle.size *= 0.99;
            
            return particle.life > 0 && particle.size > 0.1;
        });
    }

    renderParticles() {
        this.particleSystem.forEach(particle => {
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.globalAlpha = 1.0;
    }

    adjustBrightness(color, factor) {
        // Simple brightness adjustment (would need proper color parsing in real implementation)
        return color;
    }

    adjustOpacity(color, opacity) {
        // Simple opacity adjustment (would need proper color parsing in real implementation)
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        return color;
    }

    // Configuration methods
    setStyle(style) {
        this.options.style = style;
    }

    configure(newOptions) {
        this.options = { ...this.options, ...newOptions };
    }

    resize() {
        this.setupHighDPI();
        this.resizeDataArrays();
    }

    getStatus() {
        return {
            style: this.options.style,
            particleCount: this.particleSystem.length,
            beatScale: this.beatScale,
            pulseEffect: this.pulseEffect,
            canvasSize: {
                width: this.canvas.width,
                height: this.canvas.height
            }
        };
    }
}

module.exports = WaveformRenderer;