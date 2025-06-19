class BeatAnimations {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.options = {
            enableParticles: true,
            enableShockwaves: true,
            enableFlash: true,
            enableDistortion: false,
            particleCount: 50,
            particleLifetime: 2000, // milliseconds
            shockwaveCount: 3,
            maxScale: 3.0,
            ...options
        };
        
        // Animation systems
        this.particles = [];
        this.shockwaves = [];
        this.flashEffects = [];
        
        // Beat response state
        this.currentScale = 1.0;
        this.targetScale = 1.0;
        this.scaleVelocity = 0;
        
        // Timing
        this.lastBeatTime = 0;
        this.beatDecayRate = 0.02;
        
        // Visual effects
        this.chromaberration = 0;
        this.distortionAmount = 0;
        
        // Performance optimization
        this.lastCleanupTime = 0;
        this.cleanupInterval = 1000; // Cleanup every second
    }

    update(deltaTime, beatInfo, colorInfo) {
        // Update scale animation
        this.updateScale(deltaTime, beatInfo);
        
        // Process beat events
        if (beatInfo && beatInfo.detected) {
            this.onBeatDetected(beatInfo, colorInfo);
        }
        
        // Update animation systems
        this.updateParticles(deltaTime);
        this.updateShockwaves(deltaTime);
        this.updateFlashEffects(deltaTime);
        this.updateDistortionEffects(deltaTime);
        
        // Cleanup old effects
        this.cleanup();
    }

    onBeatDetected(beatInfo, colorInfo) {
        const intensity = Math.min(beatInfo.intensity || 1, 3);
        const currentTime = Date.now();
        
        this.lastBeatTime = currentTime;
        
        // Scale response
        this.targetScale = 1.0 + (intensity * 0.5);
        this.scaleVelocity = intensity * 2;
        
        // Create visual effects based on intensity
        if (intensity > 0.3 && this.options.enableParticles) {
            this.createBeatParticles(beatInfo, colorInfo);
        }
        
        if (intensity > 0.5 && this.options.enableShockwaves) {
            this.createShockwave(beatInfo, colorInfo);
        }
        
        if (intensity > 0.7 && this.options.enableFlash) {
            this.createFlashEffect(beatInfo, colorInfo);
        }
        
        if (intensity > 1.0 && this.options.enableDistortion) {
            this.createDistortionEffect(beatInfo);
        }
    }

    updateScale(deltaTime, beatInfo) {
        // Smooth scale animation with physics-based response
        const springConstant = 15;
        const damping = 5;
        
        const force = springConstant * (this.targetScale - this.currentScale);
        const dampingForce = damping * this.scaleVelocity;
        
        this.scaleVelocity += (force - dampingForce) * deltaTime;
        this.currentScale += this.scaleVelocity * deltaTime;
        
        // Decay target scale back to 1.0
        this.targetScale = Math.max(1.0, this.targetScale * (1 - this.beatDecayRate));
        
        // Clamp scale
        this.currentScale = Math.max(0.5, Math.min(this.options.maxScale, this.currentScale));
    }

    createBeatParticles(beatInfo, colorInfo) {
        const intensity = beatInfo.intensity || 1;
        const particleCount = Math.floor(intensity * this.options.particleCount);
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
            const speed = 100 + Math.random() * 200 * intensity;
            const size = 2 + Math.random() * 4 * intensity;
            
            // Color variations
            const baseHue = colorInfo.hue || 0;
            const hueVariation = 60;
            const particleHue = (baseHue + Math.random() * hueVariation - hueVariation/2 + 360) % 360;
            
            this.particles.push({
                x: centerX + (Math.random() - 0.5) * 100,
                y: centerY + (Math.random() - 0.5) * 100,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                maxSize: size,
                life: 1.0,
                decay: 1 / this.options.particleLifetime,
                color: `hsl(${particleHue}, 100%, 60%)`,
                trail: [],
                maxTrailLength: 10,
                type: this.getRandomParticleType(),
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 10,
                gravity: Math.random() * 50,
                bounce: 0.7,
                createdTime: Date.now()
            });
        }
    }

    createShockwave(beatInfo, colorInfo) {
        const intensity = beatInfo.intensity || 1;
        const shockwaveCount = Math.min(this.options.shockwaveCount, Math.floor(intensity * 2) + 1);
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        for (let i = 0; i < shockwaveCount; i++) {
            const delay = i * 100; // Stagger shockwaves
            
            setTimeout(() => {
                this.shockwaves.push({
                    x: centerX + (Math.random() - 0.5) * 200,
                    y: centerY + (Math.random() - 0.5) * 200,
                    radius: 10,
                    maxRadius: Math.min(this.canvas.width, this.canvas.height) * 0.6,
                    growth: 300 + intensity * 200,
                    life: 1.0,
                    decay: 0.002,
                    color: colorInfo.primary || '#ffffff',
                    lineWidth: 3 + intensity * 2,
                    opacity: 0.8,
                    createdTime: Date.now()
                });
            }, delay);
        }
    }

    createFlashEffect(beatInfo, colorInfo) {
        const intensity = Math.min(beatInfo.intensity || 1, 2);
        
        this.flashEffects.push({
            intensity: intensity,
            life: 1.0,
            decay: 0.05,
            color: colorInfo.primary || '#ffffff',
            type: 'screen', // blend mode
            createdTime: Date.now()
        });
        
        // Add chromatic aberration
        this.chromaberration = intensity * 5;
    }

    createDistortionEffect(beatInfo) {
        const intensity = beatInfo.intensity || 1;
        this.distortionAmount = intensity * 10;
    }

    updateParticles(deltaTime) {
        this.particles = this.particles.filter(particle => {
            // Update physics
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            
            // Apply gravity
            particle.vy += particle.gravity * deltaTime;
            
            // Bounce off canvas edges
            if (particle.x <= 0 || particle.x >= this.canvas.width) {
                particle.vx *= -particle.bounce;
                particle.x = Math.max(0, Math.min(this.canvas.width, particle.x));
            }
            
            if (particle.y <= 0 || particle.y >= this.canvas.height) {
                particle.vy *= -particle.bounce;
                particle.y = Math.max(0, Math.min(this.canvas.height, particle.y));
            }
            
            // Update rotation
            particle.rotation += particle.rotationSpeed * deltaTime;
            
            // Update trail
            particle.trail.push({ x: particle.x, y: particle.y, life: particle.life });
            if (particle.trail.length > particle.maxTrailLength) {
                particle.trail.shift();
            }
            
            // Update life
            particle.life -= particle.decay * deltaTime;
            particle.size = particle.maxSize * particle.life;
            
            // Apply air resistance
            particle.vx *= 0.99;
            particle.vy *= 0.99;
            
            return particle.life > 0;
        });
    }

    updateShockwaves(deltaTime) {
        this.shockwaves = this.shockwaves.filter(wave => {
            wave.radius += wave.growth * deltaTime;
            wave.life -= wave.decay;
            wave.opacity = wave.life * 0.8;
            
            return wave.life > 0 && wave.radius < wave.maxRadius;
        });
    }

    updateFlashEffects(deltaTime) {
        this.flashEffects = this.flashEffects.filter(flash => {
            flash.life -= flash.decay;
            return flash.life > 0;
        });
        
        // Decay chromatic aberration
        this.chromaberration *= 0.9;
    }

    updateDistortionEffects(deltaTime) {
        this.distortionAmount *= 0.95;
    }

    render() {
        // Render shockwaves first (background layer)
        this.renderShockwaves();
        
        // Render particles
        this.renderParticles();
        
        // Render flash effects (overlay)
        this.renderFlashEffects();
        
        // Apply distortion effects
        if (this.distortionAmount > 0.1) {
            this.renderDistortionEffects();
        }
    }

    renderParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            
            // Set particle properties
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            
            // Render trail
            if (particle.trail.length > 1) {
                this.ctx.strokeStyle = particle.color;
                this.ctx.lineWidth = particle.size * 0.5;
                this.ctx.lineCap = 'round';
                
                this.ctx.beginPath();
                particle.trail.forEach((point, index) => {
                    const alpha = (index / particle.trail.length) * particle.life;
                    this.ctx.globalAlpha = alpha;
                    
                    if (index === 0) {
                        this.ctx.moveTo(point.x, point.y);
                    } else {
                        this.ctx.lineTo(point.x, point.y);
                    }
                });
                this.ctx.stroke();
            }
            
            // Render particle based on type
            this.ctx.globalAlpha = particle.life;
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate(particle.rotation);
            
            switch (particle.type) {
                case 'circle':
                    this.renderCircleParticle(particle);
                    break;
                case 'star':
                    this.renderStarParticle(particle);
                    break;
                case 'square':
                    this.renderSquareParticle(particle);
                    break;
                case 'triangle':
                    this.renderTriangleParticle(particle);
                    break;
                default:
                    this.renderCircleParticle(particle);
            }
            
            this.ctx.restore();
        });
    }

    renderCircleParticle(particle) {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add glow effect
        this.ctx.shadowColor = particle.color;
        this.ctx.shadowBlur = particle.size * 2;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }

    renderStarParticle(particle) {
        const spikes = 5;
        const outerRadius = particle.size;
        const innerRadius = particle.size * 0.4;
        
        this.ctx.beginPath();
        
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i * Math.PI) / spikes;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.closePath();
        this.ctx.fill();
    }

    renderSquareParticle(particle) {
        const size = particle.size;
        this.ctx.fillRect(-size, -size, size * 2, size * 2);
    }

    renderTriangleParticle(particle) {
        const size = particle.size;
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, -size);
        this.ctx.lineTo(-size, size);
        this.ctx.lineTo(size, size);
        this.ctx.closePath();
        this.ctx.fill();
    }

    renderShockwaves() {
        this.shockwaves.forEach(wave => {
            this.ctx.save();
            
            this.ctx.globalAlpha = wave.opacity;
            this.ctx.strokeStyle = wave.color;
            this.ctx.lineWidth = wave.lineWidth;
            
            // Create pulsing effect
            const pulseScale = 1 + Math.sin(Date.now() * 0.01) * 0.1;
            const radius = wave.radius * pulseScale;
            
            this.ctx.beginPath();
            this.ctx.arc(wave.x, wave.y, radius, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Add inner glow
            this.ctx.shadowColor = wave.color;
            this.ctx.shadowBlur = wave.lineWidth * 3;
            this.ctx.stroke();
            
            this.ctx.restore();
        });
    }

    renderFlashEffects() {
        this.flashEffects.forEach(flash => {
            this.ctx.save();
            
            this.ctx.globalAlpha = flash.life * flash.intensity * 0.3;
            this.ctx.fillStyle = flash.color;
            this.ctx.globalCompositeOperation = 'screen'; // Additive blending
            
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.restore();
        });
    }

    renderDistortionEffects() {
        // Simple chromatic aberration effect
        if (this.chromaberration > 0.5) {
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            const data = imageData.data;
            const offset = Math.floor(this.chromaberration);
            
            // Shift red channel
            for (let i = 0; i < data.length; i += 4) {
                const targetIndex = i + offset * 4;
                if (targetIndex < data.length) {
                    const temp = data[i];
                    data[i] = data[targetIndex];
                    data[targetIndex] = temp;
                }
            }
            
            this.ctx.putImageData(imageData, 0, 0);
        }
    }

    getRandomParticleType() {
        const types = ['circle', 'star', 'square', 'triangle'];
        return types[Math.floor(Math.random() * types.length)];
    }

    cleanup() {
        const currentTime = Date.now();
        
        if (currentTime - this.lastCleanupTime > this.cleanupInterval) {
            // Remove old particles that might have gotten stuck
            this.particles = this.particles.filter(p => 
                currentTime - p.createdTime < this.options.particleLifetime * 2
            );
            
            // Remove old shockwaves
            this.shockwaves = this.shockwaves.filter(w =>
                currentTime - w.createdTime < 5000 // 5 seconds max
            );
            
            this.lastCleanupTime = currentTime;
        }
    }

    // Public methods
    getCurrentScale() {
        return this.currentScale;
    }

    setMaxScale(scale) {
        this.options.maxScale = Math.max(1.0, Math.min(5.0, scale));
    }

    configure(newOptions) {
        this.options = { ...this.options, ...newOptions };
    }

    reset() {
        this.particles = [];
        this.shockwaves = [];
        this.flashEffects = [];
        this.currentScale = 1.0;
        this.targetScale = 1.0;
        this.scaleVelocity = 0;
        this.chromaberration = 0;
        this.distortionAmount = 0;
    }

    getStatus() {
        return {
            particleCount: this.particles.length,
            shockwaveCount: this.shockwaves.length,
            flashEffectCount: this.flashEffects.length,
            currentScale: this.currentScale,
            targetScale: this.targetScale,
            chromaberration: this.chromaberration,
            distortionAmount: this.distortionAmount
        };
    }
}

module.exports = BeatAnimations;