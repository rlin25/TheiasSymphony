const FFT = require('fftjs');

class FrequencyAnalyzer {
    constructor(options = {}) {
        this.options = {
            sampleRate: 44100,
            fftSize: 1024,
            windowFunction: 'hanning',
            smoothingFactor: 0.8,
            minDecibels: -100,
            maxDecibels: -30,
            ...options
        };

        // Initialize FFT
        this.fftSize = this.options.fftSize;
        this.fft = new FFT(this.fftSize);
        
        // Frequency analysis arrays
        this.frequencyBins = new Float32Array(this.fftSize / 2);
        this.magnitudeSpectrum = new Float32Array(this.fftSize / 2);
        this.phaseSpectrum = new Float32Array(this.fftSize / 2);
        this.powerSpectrum = new Float32Array(this.fftSize / 2);
        
        // Smoothed output for visualization
        this.smoothedSpectrum = new Float32Array(this.fftSize / 2);
        this.previousSpectrum = new Float32Array(this.fftSize / 2);
        
        // Window function for reducing spectral leakage
        this.windowFunction = this.createWindowFunction(this.options.windowFunction);
        
        // Frequency bin mapping
        this.frequencyResolution = this.options.sampleRate / this.fftSize;
        this.initializeFrequencyBins();
        
        // Mel scale mapping for perceptual frequency analysis
        this.melFilters = this.createMelFilters();
        this.melSpectrum = new Float32Array(this.melFilters.length);
    }

    // Main analysis function
    analyze(audioBuffer) {
        if (audioBuffer.length < this.fftSize) {
            console.warn('Audio buffer too small for FFT size');
            return this.getEmptyResult();
        }

        // Prepare input data
        const inputData = this.prepareInputData(audioBuffer);
        
        // Apply window function
        this.applyWindow(inputData);
        
        // Perform FFT
        const fftResult = this.fft.createComplexArray();
        this.fft.realTransform(fftResult, inputData);
        
        // Calculate magnitude and phase spectra
        this.calculateSpectra(fftResult);
        
        // Apply smoothing
        this.applySmoothing();
        
        // Convert to decibels
        const decibelSpectrum = this.convertToDecibels(this.smoothedSpectrum);
        
        // Calculate mel spectrum
        this.calculateMelSpectrum(this.smoothedSpectrum);
        
        // Analyze frequency content
        const analysis = this.analyzeFrequencyContent(decibelSpectrum);
        
        return {
            frequencyData: decibelSpectrum,
            magnitudeSpectrum: Array.from(this.magnitudeSpectrum),
            phaseSpectrum: Array.from(this.phaseSpectrum),
            powerSpectrum: Array.from(this.powerSpectrum),
            melSpectrum: Array.from(this.melSpectrum),
            frequencyBins: Array.from(this.frequencyBins),
            analysis: analysis,
            timestamp: Date.now()
        };
    }

    prepareInputData(audioBuffer) {
        const inputData = new Float32Array(this.fftSize);
        
        // Copy audio data to input buffer
        const copyLength = Math.min(audioBuffer.length, this.fftSize);
        for (let i = 0; i < copyLength; i++) {
            inputData[i] = audioBuffer[i];
        }
        
        // Zero padding if needed
        for (let i = copyLength; i < this.fftSize; i++) {
            inputData[i] = 0;
        }
        
        return inputData;
    }

    createWindowFunction(type) {
        const window = new Float32Array(this.fftSize);
        
        switch (type.toLowerCase()) {
            case 'hanning':
            case 'hann':
                for (let i = 0; i < this.fftSize; i++) {
                    window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (this.fftSize - 1)));
                }
                break;
                
            case 'hamming':
                for (let i = 0; i < this.fftSize; i++) {
                    window[i] = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (this.fftSize - 1));
                }
                break;
                
            case 'blackman':
                for (let i = 0; i < this.fftSize; i++) {
                    const alpha = 2 * Math.PI * i / (this.fftSize - 1);
                    window[i] = 0.42 - 0.5 * Math.cos(alpha) + 0.08 * Math.cos(2 * alpha);
                }
                break;
                
            case 'rectangular':
            default:
                window.fill(1.0);
                break;
        }
        
        return window;
    }

    applyWindow(inputData) {
        for (let i = 0; i < this.fftSize; i++) {
            inputData[i] *= this.windowFunction[i];
        }
    }

    calculateSpectra(fftResult) {
        const binCount = this.fftSize / 2;
        
        for (let i = 0; i < binCount; i++) {
            const real = fftResult[i * 2];
            const imag = fftResult[i * 2 + 1];
            
            // Magnitude spectrum
            this.magnitudeSpectrum[i] = Math.sqrt(real * real + imag * imag);
            
            // Phase spectrum
            this.phaseSpectrum[i] = Math.atan2(imag, real);
            
            // Power spectrum
            this.powerSpectrum[i] = this.magnitudeSpectrum[i] * this.magnitudeSpectrum[i];
        }
    }

    applySmoothing() {
        const smoothing = this.options.smoothingFactor;
        
        for (let i = 0; i < this.magnitudeSpectrum.length; i++) {
            this.smoothedSpectrum[i] = 
                smoothing * this.previousSpectrum[i] + 
                (1 - smoothing) * this.magnitudeSpectrum[i];
                
            this.previousSpectrum[i] = this.smoothedSpectrum[i];
        }
    }

    convertToDecibels(spectrum) {
        const decibelSpectrum = new Float32Array(spectrum.length);
        const minDb = this.options.minDecibels;
        const maxDb = this.options.maxDecibels;
        
        for (let i = 0; i < spectrum.length; i++) {
            // Convert to decibels
            let db = spectrum[i] > 0 ? 20 * Math.log10(spectrum[i]) : minDb;
            
            // Clamp to range
            db = Math.max(minDb, Math.min(maxDb, db));
            
            // Normalize to 0-255 range for visualization
            decibelSpectrum[i] = ((db - minDb) / (maxDb - minDb)) * 255;
        }
        
        return decibelSpectrum;
    }

    initializeFrequencyBins() {
        for (let i = 0; i < this.frequencyBins.length; i++) {
            this.frequencyBins[i] = i * this.frequencyResolution;
        }
    }

    createMelFilters(numFilters = 26) {
        const filters = [];
        const sampleRate = this.options.sampleRate;
        const fftSize = this.fftSize;
        
        // Convert frequency to mel scale
        const hzToMel = (hz) => 2595 * Math.log10(1 + hz / 700);
        const melToHz = (mel) => 700 * (Math.pow(10, mel / 2595) - 1);
        
        // Create mel filter bank
        const minMel = hzToMel(0);
        const maxMel = hzToMel(sampleRate / 2);
        const melStep = (maxMel - minMel) / (numFilters + 1);
        
        for (let i = 0; i < numFilters; i++) {
            const centerMel = minMel + (i + 1) * melStep;
            const leftMel = minMel + i * melStep;
            const rightMel = minMel + (i + 2) * melStep;
            
            const centerHz = melToHz(centerMel);
            const leftHz = melToHz(leftMel);
            const rightHz = melToHz(rightMel);
            
            // Convert to bin indices
            const centerBin = Math.round(centerHz * fftSize / sampleRate);
            const leftBin = Math.round(leftHz * fftSize / sampleRate);
            const rightBin = Math.round(rightHz * fftSize / sampleRate);
            
            filters.push({
                centerBin,
                leftBin,
                rightBin,
                centerHz,
                leftHz,
                rightHz
            });
        }
        
        return filters;
    }

    calculateMelSpectrum(spectrum) {
        for (let i = 0; i < this.melFilters.length; i++) {
            const filter = this.melFilters[i];
            let energy = 0;
            
            // Apply triangular filter
            for (let bin = filter.leftBin; bin <= filter.rightBin; bin++) {
                if (bin >= 0 && bin < spectrum.length) {
                    let weight = 0;
                    
                    if (bin <= filter.centerBin) {
                        // Rising edge
                        weight = (bin - filter.leftBin) / (filter.centerBin - filter.leftBin);
                    } else {
                        // Falling edge
                        weight = (filter.rightBin - bin) / (filter.rightBin - filter.centerBin);
                    }
                    
                    energy += spectrum[bin] * weight;
                }
            }
            
            this.melSpectrum[i] = energy;
        }
    }

    analyzeFrequencyContent(spectrum) {
        const analysis = {
            dominantFrequency: this.findDominantFrequency(spectrum),
            spectralCentroid: this.calculateSpectralCentroid(spectrum),
            spectralRolloff: this.calculateSpectralRolloff(spectrum),
            spectralSpread: this.calculateSpectralSpread(spectrum),
            bandEnergies: this.calculateBandEnergies(spectrum),
            totalEnergy: this.calculateTotalEnergy(spectrum),
            zeroCrossingRate: 0 // Would need time-domain data
        };
        
        return analysis;
    }

    findDominantFrequency(spectrum) {
        let maxValue = 0;
        let maxIndex = 0;
        
        for (let i = 1; i < spectrum.length; i++) { // Skip DC component
            if (spectrum[i] > maxValue) {
                maxValue = spectrum[i];
                maxIndex = i;
            }
        }
        
        return {
            frequency: this.frequencyBins[maxIndex],
            magnitude: maxValue,
            bin: maxIndex
        };
    }

    calculateSpectralCentroid(spectrum) {
        let weightedSum = 0;
        let magnitudeSum = 0;
        
        for (let i = 0; i < spectrum.length; i++) {
            weightedSum += this.frequencyBins[i] * spectrum[i];
            magnitudeSum += spectrum[i];
        }
        
        return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
    }

    calculateSpectralRolloff(spectrum, rolloffPoint = 0.85) {
        const totalEnergy = spectrum.reduce((sum, val) => sum + val, 0);
        const rolloffEnergy = totalEnergy * rolloffPoint;
        
        let cumulativeEnergy = 0;
        
        for (let i = 0; i < spectrum.length; i++) {
            cumulativeEnergy += spectrum[i];
            if (cumulativeEnergy >= rolloffEnergy) {
                return this.frequencyBins[i];
            }
        }
        
        return this.frequencyBins[spectrum.length - 1];
    }

    calculateSpectralSpread(spectrum) {
        const centroid = this.calculateSpectralCentroid(spectrum);
        let weightedVariance = 0;
        let magnitudeSum = 0;
        
        for (let i = 0; i < spectrum.length; i++) {
            const deviation = this.frequencyBins[i] - centroid;
            weightedVariance += deviation * deviation * spectrum[i];
            magnitudeSum += spectrum[i];
        }
        
        return magnitudeSum > 0 ? Math.sqrt(weightedVariance / magnitudeSum) : 0;
    }

    calculateBandEnergies(spectrum) {
        const bands = {
            subBass: { min: 0, max: 60 },        // 0-60 Hz
            bass: { min: 60, max: 250 },         // 60-250 Hz
            lowMid: { min: 250, max: 500 },      // 250-500 Hz
            mid: { min: 500, max: 2000 },        // 500-2000 Hz
            highMid: { min: 2000, max: 4000 },   // 2-4 kHz
            presence: { min: 4000, max: 6000 },  // 4-6 kHz
            brilliance: { min: 6000, max: 20000 } // 6-20 kHz
        };
        
        const bandEnergies = {};
        
        for (const [bandName, band] of Object.entries(bands)) {
            const startBin = Math.round(band.min / this.frequencyResolution);
            const endBin = Math.round(band.max / this.frequencyResolution);
            
            let energy = 0;
            let count = 0;
            
            for (let i = startBin; i <= endBin && i < spectrum.length; i++) {
                energy += spectrum[i];
                count++;
            }
            
            bandEnergies[bandName] = count > 0 ? energy / count : 0;
        }
        
        return bandEnergies;
    }

    calculateTotalEnergy(spectrum) {
        return spectrum.reduce((sum, val) => sum + val, 0);
    }

    getEmptyResult() {
        return {
            frequencyData: new Float32Array(this.fftSize / 2),
            magnitudeSpectrum: new Array(this.fftSize / 2).fill(0),
            phaseSpectrum: new Array(this.fftSize / 2).fill(0),
            powerSpectrum: new Array(this.fftSize / 2).fill(0),
            melSpectrum: new Array(this.melFilters.length).fill(0),
            frequencyBins: Array.from(this.frequencyBins),
            analysis: {
                dominantFrequency: { frequency: 0, magnitude: 0, bin: 0 },
                spectralCentroid: 0,
                spectralRolloff: 0,
                spectralSpread: 0,
                bandEnergies: {},
                totalEnergy: 0,
                zeroCrossingRate: 0
            },
            timestamp: Date.now()
        };
    }

    // Configure analyzer parameters
    configure(newOptions) {
        this.options = { ...this.options, ...newOptions };
        
        // Recreate window function if changed
        if (newOptions.windowFunction) {
            this.windowFunction = this.createWindowFunction(newOptions.windowFunction);
        }
    }

    // Get analyzer status
    getStatus() {
        return {
            fftSize: this.fftSize,
            sampleRate: this.options.sampleRate,
            frequencyResolution: this.frequencyResolution,
            windowFunction: this.options.windowFunction,
            smoothingFactor: this.options.smoothingFactor
        };
    }
}

module.exports = FrequencyAnalyzer;