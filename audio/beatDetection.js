class BeatDetector {
    constructor(options = {}) {
        this.options = {
            sampleRate: 44100,
            bufferSize: 1024,
            energyThreshold: 1.3,
            adaptiveRate: 0.001,
            minTimeBetweenBeats: 100, // milliseconds
            frequencyBands: {
                low: { min: 0, max: 64 },      // Bass frequencies
                mid: { min: 64, max: 256 },    // Mid frequencies  
                high: { min: 256, max: 512 }   // High frequencies
            },
            ...options
        };

        // Energy history for adaptive threshold
        this.energyHistory = [];
        this.maxHistorySize = 100;
        
        // Beat detection state
        this.lastBeatTime = 0;
        this.averageEnergy = 0;
        this.variance = 0;
        
        // Frequency band energies
        this.bandEnergies = {
            low: { current: 0, average: 0, variance: 0 },
            mid: { current: 0, average: 0, variance: 0 },
            high: { current: 0, average: 0, variance: 0 }
        };
        
        // Beat intensity levels
        this.beatIntensity = 0;
        this.maxBeatIntensity = 0;
    }

    detectBeat(frequencyData, timestamp = Date.now()) {
        // Calculate energy for each frequency band
        this.calculateBandEnergies(frequencyData);
        
        // Calculate total energy
        const totalEnergy = this.calculateTotalEnergy(frequencyData);
        
        // Update energy history and statistics
        this.updateEnergyStatistics(totalEnergy);
        
        // Check for beat based on energy threshold
        const beatDetected = this.checkBeatConditions(totalEnergy, timestamp);
        
        if (beatDetected) {
            this.lastBeatTime = timestamp;
            this.beatIntensity = this.calculateBeatIntensity(totalEnergy);
            this.maxBeatIntensity = Math.max(this.maxBeatIntensity, this.beatIntensity);
            
            return {
                detected: true,
                intensity: this.beatIntensity,
                normalizedIntensity: this.maxBeatIntensity > 0 ? this.beatIntensity / this.maxBeatIntensity : 0,
                bands: { ...this.bandEnergies },
                timestamp: timestamp,
                energy: totalEnergy
            };
        }
        
        // Decay beat intensity
        this.beatIntensity *= 0.95;
        
        return {
            detected: false,
            intensity: this.beatIntensity,
            normalizedIntensity: this.maxBeatIntensity > 0 ? this.beatIntensity / this.maxBeatIntensity : 0,
            bands: { ...this.bandEnergies },
            timestamp: timestamp,
            energy: totalEnergy
        };
    }

    calculateBandEnergies(frequencyData) {
        const bands = this.options.frequencyBands;
        
        // Calculate energy for each band
        for (const [bandName, band] of Object.entries(bands)) {
            let energy = 0;
            const startIndex = Math.max(0, band.min);
            const endIndex = Math.min(frequencyData.length - 1, band.max);
            
            for (let i = startIndex; i <= endIndex; i++) {
                const amplitude = frequencyData[i] / 255.0; // Normalize to 0-1
                energy += amplitude * amplitude;
            }
            
            // Average energy over the band
            const bandSize = endIndex - startIndex + 1;
            energy = bandSize > 0 ? energy / bandSize : 0;
            
            // Update band energy statistics
            this.updateBandStatistics(bandName, energy);
        }
    }

    calculateTotalEnergy(frequencyData) {
        let totalEnergy = 0;
        
        // Focus on lower frequencies for beat detection (0-256)
        const endIndex = Math.min(256, frequencyData.length);
        
        for (let i = 0; i < endIndex; i++) {
            const amplitude = frequencyData[i] / 255.0;
            totalEnergy += amplitude * amplitude;
        }
        
        return totalEnergy / endIndex;
    }

    updateEnergyStatistics(energy) {
        // Add to history
        this.energyHistory.push(energy);
        
        // Maintain history size
        if (this.energyHistory.length > this.maxHistorySize) {
            this.energyHistory.shift();
        }
        
        // Calculate average energy
        this.averageEnergy = this.energyHistory.reduce((sum, e) => sum + e, 0) / this.energyHistory.length;
        
        // Calculate variance
        const squaredDiffs = this.energyHistory.map(e => Math.pow(e - this.averageEnergy, 2));
        this.variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / this.energyHistory.length;
    }

    updateBandStatistics(bandName, energy) {
        const band = this.bandEnergies[bandName];
        
        // Simple moving average
        band.current = energy;
        band.average = band.average * 0.95 + energy * 0.05;
        
        // Simple variance calculation
        const diff = energy - band.average;
        band.variance = band.variance * 0.95 + (diff * diff) * 0.05;
    }

    checkBeatConditions(energy, timestamp) {
        // Check minimum time between beats
        if (timestamp - this.lastBeatTime < this.options.minTimeBetweenBeats) {
            return false;
        }
        
        // Need sufficient history for reliable detection
        if (this.energyHistory.length < 10) {
            return false;
        }
        
        // Adaptive threshold based on energy variance
        const threshold = this.averageEnergy + (Math.sqrt(this.variance) * this.options.energyThreshold);
        
        // Beat detected if current energy exceeds adaptive threshold
        return energy > threshold;
    }

    calculateBeatIntensity(energy) {
        if (this.averageEnergy === 0) return 0;
        
        // Intensity based on how much energy exceeds the average
        const ratio = energy / this.averageEnergy;
        
        // Clamp and normalize intensity
        return Math.min(Math.max(ratio - 1, 0), 5); // 0-5 range
    }

    // Advanced beat detection using spectral flux
    detectBeatSpectralFlux(currentSpectrum, previousSpectrum) {
        if (!previousSpectrum || currentSpectrum.length !== previousSpectrum.length) {
            return { detected: false, flux: 0 };
        }
        
        let spectralFlux = 0;
        
        // Calculate spectral flux (sum of positive differences)
        for (let i = 0; i < currentSpectrum.length; i++) {
            const diff = currentSpectrum[i] - previousSpectrum[i];
            if (diff > 0) {
                spectralFlux += diff;
            }
        }
        
        // Normalize flux
        spectralFlux /= currentSpectrum.length;
        
        // Simple threshold-based detection
        const fluxThreshold = 0.1; // Adjust based on testing
        const beatDetected = spectralFlux > fluxThreshold;
        
        return {
            detected: beatDetected,
            flux: spectralFlux,
            intensity: beatDetected ? Math.min(spectralFlux * 10, 5) : 0
        };
    }

    // Onset detection using high-frequency content
    detectOnset(frequencyData) {
        let hfc = 0; // High Frequency Content
        
        for (let i = 0; i < frequencyData.length; i++) {
            const amplitude = frequencyData[i] / 255.0;
            hfc += amplitude * amplitude * i; // Weight by frequency bin
        }
        
        hfc /= frequencyData.length;
        
        // Update HFC statistics
        if (!this.hfcHistory) {
            this.hfcHistory = [];
            this.averageHFC = 0;
        }
        
        this.hfcHistory.push(hfc);
        if (this.hfcHistory.length > 50) {
            this.hfcHistory.shift();
        }
        
        this.averageHFC = this.hfcHistory.reduce((sum, h) => sum + h, 0) / this.hfcHistory.length;
        
        // Onset detection
        const onsetThreshold = this.averageHFC * 1.5;
        const onsetDetected = hfc > onsetThreshold;
        
        return {
            detected: onsetDetected,
            hfc: hfc,
            intensity: onsetDetected ? Math.min((hfc / this.averageHFC) - 1, 3) : 0
        };
    }

    // Get current beat detection status
    getStatus() {
        return {
            averageEnergy: this.averageEnergy,
            variance: this.variance,
            energyHistorySize: this.energyHistory.length,
            lastBeatTime: this.lastBeatTime,
            beatIntensity: this.beatIntensity,
            maxBeatIntensity: this.maxBeatIntensity,
            bandEnergies: { ...this.bandEnergies }
        };
    }

    // Reset detection state
    reset() {
        this.energyHistory = [];
        this.lastBeatTime = 0;
        this.averageEnergy = 0;
        this.variance = 0;
        this.beatIntensity = 0;
        this.maxBeatIntensity = 0;
        
        // Reset band energies
        for (const band of Object.values(this.bandEnergies)) {
            band.current = 0;
            band.average = 0;
            band.variance = 0;
        }
    }

    // Configure detection parameters
    configure(newOptions) {
        this.options = { ...this.options, ...newOptions };
    }
}

module.exports = BeatDetector;