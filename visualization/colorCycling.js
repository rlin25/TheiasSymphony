class ColorCycling {
    constructor(options = {}) {
        this.options = {
            speed: 1.0,
            mode: 'rainbow',
            saturation: 100,
            lightness: 50,
            beatResponsive: true,
            smoothTransitions: true,
            ...options
        };
        
        // Color state
        this.currentHue = 0;
        this.targetHue = 0;
        this.hueVelocity = 0;
        
        // Color history for smooth transitions
        this.colorHistory = [];
        this.maxHistorySize = 10;
        
        // Beat-responsive properties
        this.beatColorShift = 0;
        this.beatIntensityMultiplier = 1.0;
        this.lastBeatTime = 0;
        
        // Color palettes
        this.palettes = {
            rainbow: {
                colors: [0, 60, 120, 180, 240, 300], // Hue values
                weights: [1, 1, 1, 1, 1, 1]
            },
            warm: {
                colors: [0, 30, 60, 300, 330], // Reds, oranges, yellows
                weights: [1.2, 1, 0.8, 0.8, 1]
            },
            cool: {
                colors: [180, 210, 240, 270, 300], // Blues, cyans, purples
                weights: [1, 1.2, 1, 0.8, 0.8]
            },
            neon: {
                colors: [120, 180, 240, 300, 60], // Bright greens, blues, magentas
                weights: [1, 1, 1.2, 1, 0.8]
            },
            sunset: {
                colors: [0, 15, 30, 45, 300], // Red to yellow spectrum
                weights: [1.5, 1.2, 1, 0.8, 0.6]
            },
            ocean: {
                colors: [180, 200, 220, 240, 260], // Ocean blues and teals
                weights: [1, 1.2, 1.5, 1.2, 1]
            }
        };
        
        this.currentPalette = this.palettes[this.options.mode] || this.palettes.rainbow;
        
        // Animation timing
        this.lastUpdateTime = performance.now();
        this.animationPhase = 0;
        
        // Advanced color properties
        this.harmonics = [];
        this.colorTemperature = 6500; // Kelvin
        this.gamma = 2.2;
    }

    update(deltaTime, beatInfo = null, audioData = null) {
        const currentTime = performance.now();
        const dt = (currentTime - this.lastUpdateTime) / 1000; // Convert to seconds
        this.lastUpdateTime = currentTime;
        
        // Update animation phase
        this.animationPhase += dt * this.options.speed;
        
        // Handle beat response
        if (beatInfo && this.options.beatResponsive) {
            this.processBeatResponse(beatInfo);
        }
        
        // Update color based on mode
        switch (this.options.mode) {
            case 'rainbow':
                this.updateRainbowCycle(dt);
                break;
            case 'pulse':
                this.updatePulseCycle(dt, beatInfo);
                break;
            case 'audio-reactive':
                this.updateAudioReactiveCycle(dt, audioData);
                break;
            case 'harmonic':
                this.updateHarmonicCycle(dt, audioData);
                break;
            default:
                this.updatePaletteCycle(dt);
                break;
        }
        
        // Apply smoothing
        if (this.options.smoothTransitions) {
            this.applySmoothTransitions(dt);
        }
        
        // Update color history
        this.updateColorHistory();
    }

    updateRainbowCycle(deltaTime) {
        // Simple linear hue progression
        this.currentHue += this.options.speed * 60 * deltaTime; // 60 degrees per second at speed 1.0
        
        // Apply beat response
        this.currentHue += this.beatColorShift;
        
        // Wrap around 360 degrees
        while (this.currentHue >= 360) {
            this.currentHue -= 360;
        }
        while (this.currentHue < 0) {
            this.currentHue += 360;
        }
    }

    updatePulseCycle(deltaTime, beatInfo) {
        // Pulse between colors on beats
        const baseHue = Math.sin(this.animationPhase) * 180 + 180;
        
        if (beatInfo && beatInfo.detected) {
            // Jump to complementary color on beat
            this.targetHue = (baseHue + 180) % 360;
            this.hueVelocity = 1000; // Fast transition
        } else {
            this.targetHue = baseHue;
            this.hueVelocity = 100; // Slower return
        }
        
        // Move towards target hue
        const hueDistance = this.getHueDistance(this.currentHue, this.targetHue);
        const hueStep = this.hueVelocity * deltaTime;
        
        if (Math.abs(hueDistance) > hueStep) {
            this.currentHue += Math.sign(hueDistance) * hueStep;
        } else {
            this.currentHue = this.targetHue;
        }
        
        // Normalize hue
        this.currentHue = (this.currentHue + 360) % 360;
    }

    updateAudioReactiveCycle(deltaTime, audioData) {
        if (!audioData || audioData.length === 0) {
            this.updateRainbowCycle(deltaTime);
            return;
        }
        
        // Map audio frequency content to hue
        const frequencyBands = this.analyzeFrequencyBands(audioData);
        
        // Calculate dominant frequency band
        let dominantBand = 0;
        let maxEnergy = 0;
        
        frequencyBands.forEach((energy, index) => {
            if (energy > maxEnergy) {
                maxEnergy = energy;
                dominantBand = index;
            }
        });
        
        // Map frequency bands to color ranges
        const colorMappings = [
            { hue: 0, name: 'bass' },      // Red for bass
            { hue: 60, name: 'lowMid' },   // Yellow for low-mid
            { hue: 120, name: 'mid' },     // Green for mid
            { hue: 180, name: 'highMid' }, // Cyan for high-mid
            { hue: 240, name: 'treble' }   // Blue for treble
        ];
        
        const targetMapping = colorMappings[Math.min(dominantBand, colorMappings.length - 1)];
        this.targetHue = targetMapping.hue;
        
        // Smooth transition to target hue
        const hueDistance = this.getHueDistance(this.currentHue, this.targetHue);
        const transitionSpeed = 180 * deltaTime; // 180 degrees per second max
        
        if (Math.abs(hueDistance) > transitionSpeed) {
            this.currentHue += Math.sign(hueDistance) * transitionSpeed;
        } else {
            this.currentHue = this.targetHue;
        }
        
        this.currentHue = (this.currentHue + 360) % 360;
    }

    updateHarmonicCycle(deltaTime, audioData) {
        // Create harmonic color relationships based on musical theory
        const fundamentalHue = (this.animationPhase * 30) % 360;
        
        // Generate harmonic colors (musical intervals mapped to color intervals)
        this.harmonics = [
            fundamentalHue,                    // Fundamental (unison)
            (fundamentalHue + 180) % 360,      // Octave (complementary)
            (fundamentalHue + 120) % 360,      // Perfect fifth (triadic)
            (fundamentalHue + 90) % 360,       // Perfect fourth (tetradic)
            (fundamentalHue + 60) % 360        // Major third (split-complementary)
        ];
        
        // Select harmonic based on audio content or cycle through them
        const harmonicIndex = Math.floor(this.animationPhase) % this.harmonics.length;
        this.currentHue = this.harmonics[harmonicIndex];
    }

    updatePaletteCycle(deltaTime) {
        const palette = this.currentPalette;
        const palettePosition = (this.animationPhase * 0.5) % palette.colors.length;
        const baseIndex = Math.floor(palettePosition);
        const nextIndex = (baseIndex + 1) % palette.colors.length;
        const blend = palettePosition - baseIndex;
        
        // Interpolate between palette colors
        const baseHue = palette.colors[baseIndex];
        const nextHue = palette.colors[nextIndex];
        
        this.currentHue = this.interpolateHue(baseHue, nextHue, blend);
    }

    processBeatResponse(beatInfo) {
        if (beatInfo.detected) {
            const intensity = Math.min(beatInfo.intensity || 1, 3);
            
            // Create color shift based on beat intensity
            this.beatColorShift = intensity * 30 * Math.sin(Date.now() * 0.01);
            
            // Temporarily boost saturation and lightness
            this.beatIntensityMultiplier = 1.0 + (intensity * 0.3);
            
            this.lastBeatTime = Date.now();
        } else {
            // Decay beat effects
            this.beatColorShift *= 0.9;
            this.beatIntensityMultiplier = Math.max(1.0, this.beatIntensityMultiplier * 0.95);
        }
    }

    applySmoothTransitions(deltaTime) {
        // Apply momentum-based smoothing
        const smoothingFactor = Math.exp(-5 * deltaTime); // Exponential decay
        
        if (this.colorHistory.length > 1) {
            const previousColor = this.colorHistory[this.colorHistory.length - 2];
            const currentColor = { h: this.currentHue, s: this.options.saturation, l: this.options.lightness };
            
            // Smooth hue transitions
            const hueDistance = this.getHueDistance(previousColor.h, currentColor.h);
            this.currentHue = previousColor.h + hueDistance * (1 - smoothingFactor);
            this.currentHue = (this.currentHue + 360) % 360;
        }
    }

    updateColorHistory() {
        const currentColor = {
            h: this.currentHue,
            s: this.options.saturation * this.beatIntensityMultiplier,
            l: this.options.lightness,
            timestamp: Date.now()
        };
        
        this.colorHistory.push(currentColor);
        
        if (this.colorHistory.length > this.maxHistorySize) {
            this.colorHistory.shift();
        }
    }

    analyzeFrequencyBands(audioData) {
        // Divide frequency spectrum into bands
        const bandCount = 5;
        const bandSize = Math.floor(audioData.length / bandCount);
        const bands = [];
        
        for (let i = 0; i < bandCount; i++) {
            let energy = 0;
            const start = i * bandSize;
            const end = Math.min(start + bandSize, audioData.length);
            
            for (let j = start; j < end; j++) {
                energy += audioData[j] * audioData[j];
            }
            
            bands.push(Math.sqrt(energy / (end - start)));
        }
        
        return bands;
    }

    getHueDistance(from, to) {
        // Calculate shortest distance between two hues on color wheel
        let distance = to - from;
        
        if (distance > 180) {
            distance -= 360;
        } else if (distance < -180) {
            distance += 360;
        }
        
        return distance;
    }

    interpolateHue(hue1, hue2, factor) {
        const distance = this.getHueDistance(hue1, hue2);
        const result = hue1 + distance * factor;
        return (result + 360) % 360;
    }

    // Public methods for getting current color information
    getCurrentColor() {
        const adjustedSaturation = Math.min(100, this.options.saturation * this.beatIntensityMultiplier);
        const adjustedLightness = Math.min(100, this.options.lightness);
        
        return {
            h: this.currentHue,
            s: adjustedSaturation,
            l: adjustedLightness,
            hsl: `hsl(${Math.round(this.currentHue)}, ${Math.round(adjustedSaturation)}%, ${Math.round(adjustedLightness)}%)`,
            hex: this.hslToHex(this.currentHue, adjustedSaturation, adjustedLightness)
        };
    }

    getColorPalette(count = 5) {
        const colors = [];
        const step = 360 / count;
        
        for (let i = 0; i < count; i++) {
            const hue = (this.currentHue + i * step) % 360;
            colors.push({
                h: hue,
                s: this.options.saturation,
                l: this.options.lightness,
                hsl: `hsl(${Math.round(hue)}, ${this.options.saturation}%, ${this.options.lightness}%)`,
                hex: this.hslToHex(hue, this.options.saturation, this.options.lightness)
            });
        }
        
        return colors;
    }

    getVisualizationColors() {
        // Return colors optimized for visualization
        const baseColor = this.getCurrentColor();
        
        return {
            primary: baseColor.hsl,
            secondary: `hsl(${(baseColor.h + 120) % 360}, ${baseColor.s}%, ${baseColor.l}%)`,
            accent: `hsl(${(baseColor.h + 240) % 360}, ${baseColor.s}%, ${baseColor.l}%)`,
            background: `hsla(${baseColor.h}, ${Math.max(20, baseColor.s - 40)}%, 5%, 0.1)`,
            hue: baseColor.h,
            rainbow: true // Flag for rainbow gradient mode
        };
    }

    hslToHex(h, s, l) {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    }

    // Configuration methods
    setMode(mode) {
        this.options.mode = mode;
        if (this.palettes[mode]) {
            this.currentPalette = this.palettes[mode];
        }
    }

    setSpeed(speed) {
        this.options.speed = Math.max(0.1, Math.min(5.0, speed));
    }

    setSaturation(saturation) {
        this.options.saturation = Math.max(0, Math.min(100, saturation));
    }

    setLightness(lightness) {
        this.options.lightness = Math.max(0, Math.min(100, lightness));
    }

    configure(newOptions) {
        this.options = { ...this.options, ...newOptions };
        
        if (newOptions.mode && this.palettes[newOptions.mode]) {
            this.currentPalette = this.palettes[newOptions.mode];
        }
    }

    // Get status information
    getStatus() {
        return {
            mode: this.options.mode,
            currentHue: this.currentHue,
            speed: this.options.speed,
            beatIntensityMultiplier: this.beatIntensityMultiplier,
            colorHistorySize: this.colorHistory.length,
            animationPhase: this.animationPhase,
            lastBeatTime: this.lastBeatTime
        };
    }

    reset() {
        this.currentHue = 0;
        this.targetHue = 0;
        this.hueVelocity = 0;
        this.colorHistory = [];
        this.beatColorShift = 0;
        this.beatIntensityMultiplier = 1.0;
        this.animationPhase = 0;
    }
}

module.exports = ColorCycling;