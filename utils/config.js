const fs = require('fs');
const path = require('path');
const os = require('os');

class ConfigManager {
    constructor() {
        this.configDir = this.getConfigDirectory();
        this.configFile = path.join(this.configDir, 'config.json');
        this.defaultConfig = this.getDefaultConfig();
        this.currentConfig = { ...this.defaultConfig };
        
        // Ensure config directory exists
        this.ensureConfigDirectory();
        
        // Load existing configuration
        this.load();
    }

    getConfigDirectory() {
        const platform = process.platform;
        const homeDir = os.homedir();
        
        switch (platform) {
            case 'win32':
                return path.join(homeDir, 'AppData', 'Roaming', 'TheiasSymphony');
            case 'darwin':
                return path.join(homeDir, 'Library', 'Application Support', 'TheiasSymphony');
            case 'linux':
                return path.join(homeDir, '.config', 'theias-symphony');
            default:
                return path.join(homeDir, '.theias-symphony');
        }
    }

    getDefaultConfig() {
        return {
            // Audio settings
            audio: {
                sampleRate: 44100,
                bufferSize: 1024,
                channels: 2,
                bitDepth: 16,
                smoothingFactor: 0.8,
                gainMultiplier: 1.0,
                inputDevice: 'default'
            },
            
            // Visualization settings
            visualization: {
                style: 'minimalist', // minimalist, filled, circular, bars
                frameRate: 60,
                amplitude: 0.3,
                lineWidth: 2,
                glowEffect: true,
                glowIntensity: 1.0,
                smoothing: 0.8,
                responsive: true,
                centerline: true
            },
            
            // Color settings
            colors: {
                mode: 'rainbow', // rainbow, warm, cool, neon, sunset, ocean, pulse, audio-reactive
                speed: 1.0,
                saturation: 100,
                lightness: 50,
                beatResponsive: true,
                smoothTransitions: true
            },
            
            // Beat detection settings
            beatDetection: {
                enabled: true,
                sensitivity: 0.7,
                energyThreshold: 1.3,
                adaptiveRate: 0.001,
                minTimeBetweenBeats: 100,
                algorithm: 'energy' // energy, spectral-flux, onset
            },
            
            // Animation settings
            animations: {
                enableParticles: true,
                enableShockwaves: true,
                enableFlash: true,
                enableDistortion: false,
                particleCount: 50,
                particleLifetime: 2000,
                shockwaveCount: 3,
                maxBeatScale: 3.0
            },
            
            // Window settings
            window: {
                width: 1200,
                height: 800,
                minWidth: 400,
                minHeight: 300,
                fullscreen: false,
                alwaysOnTop: false,
                frame: true,
                transparent: false,
                backgroundColor: '#000000'
            },
            
            // Performance settings
            performance: {
                targetFPS: 60,
                enableVSync: true,
                enableGPUAcceleration: true,
                lowPowerMode: false,
                adaptiveQuality: true,
                maxParticles: 1000,
                enableOptimizations: true
            },
            
            // Keyboard shortcuts
            shortcuts: {
                toggleFullscreen: 'F11',
                toggleControls: 'H',
                toggleHelp: '?',
                resetSettings: 'R',
                exitFullscreen: 'Escape',
                quit: 'Alt+F4'
            },
            
            // Debug settings
            debug: {
                showFPS: true,
                showAudioStatus: true,
                enableLogging: false,
                logLevel: 'info', // debug, info, warn, error
                enableDevTools: false
            },
            
            // Application settings
            app: {
                version: '1.0.0',
                firstRun: true,
                autoStart: false,
                minimizeToTray: false,
                checkForUpdates: true,
                analyticsEnabled: false
            }
        };
    }

    ensureConfigDirectory() {
        try {
            if (!fs.existsSync(this.configDir)) {
                fs.mkdirSync(this.configDir, { recursive: true });
            }
        } catch (error) {
            console.error('Failed to create config directory:', error);
        }
    }

    load() {
        try {
            if (fs.existsSync(this.configFile)) {
                const configData = fs.readFileSync(this.configFile, 'utf8');
                const loadedConfig = JSON.parse(configData);
                
                // Merge with defaults to ensure all properties exist
                this.currentConfig = this.deepMerge(this.defaultConfig, loadedConfig);
                
                // Validate configuration
                this.validate();
                
                console.log('Configuration loaded successfully');
            } else {
                // First run - create default config file
                this.save();
                console.log('Created default configuration file');
            }
        } catch (error) {
            console.error('Failed to load configuration, using defaults:', error);
            this.currentConfig = { ...this.defaultConfig };
        }
    }

    save() {
        try {
            const configData = JSON.stringify(this.currentConfig, null, 2);
            fs.writeFileSync(this.configFile, configData, 'utf8');
            console.log('Configuration saved successfully');
            return true;
        } catch (error) {
            console.error('Failed to save configuration:', error);
            return false;
        }
    }

    get(path, defaultValue = null) {
        return this.getNestedValue(this.currentConfig, path, defaultValue);
    }

    set(path, value) {
        this.setNestedValue(this.currentConfig, path, value);
        return this.save();
    }

    update(updates) {
        this.currentConfig = this.deepMerge(this.currentConfig, updates);
        this.validate();
        return this.save();
    }

    reset(section = null) {
        if (section) {
            if (this.defaultConfig[section]) {
                this.currentConfig[section] = { ...this.defaultConfig[section] };
            }
        } else {
            this.currentConfig = { ...this.defaultConfig };
        }
        
        return this.save();
    }

    getAll() {
        return { ...this.currentConfig };
    }

    validate() {
        // Validate audio settings
        this.validateRange('audio.sampleRate', 8000, 192000);
        this.validateRange('audio.bufferSize', 64, 8192);
        this.validateRange('audio.channels', 1, 8);
        this.validateRange('audio.smoothingFactor', 0, 1);
        this.validateRange('audio.gainMultiplier', 0.1, 10);
        
        // Validate visualization settings
        this.validateRange('visualization.frameRate', 15, 120);
        this.validateRange('visualization.amplitude', 0.1, 2.0);
        this.validateRange('visualization.lineWidth', 0.5, 20);
        this.validateRange('visualization.glowIntensity', 0, 5);
        this.validateRange('visualization.smoothing', 0, 1);
        
        // Validate color settings
        this.validateRange('colors.speed', 0.1, 5.0);
        this.validateRange('colors.saturation', 0, 100);
        this.validateRange('colors.lightness', 10, 90);
        
        // Validate beat detection settings
        this.validateRange('beatDetection.sensitivity', 0.1, 3.0);
        this.validateRange('beatDetection.energyThreshold', 0.5, 5.0);
        this.validateRange('beatDetection.minTimeBetweenBeats', 50, 1000);
        
        // Validate animation settings
        this.validateRange('animations.particleCount', 0, 200);
        this.validateRange('animations.particleLifetime', 500, 10000);
        this.validateRange('animations.maxBeatScale', 1.0, 10.0);
        
        // Validate window settings
        this.validateRange('window.width', 400, 8000);
        this.validateRange('window.height', 300, 6000);
        this.validateRange('window.minWidth', 200, 1000);
        this.validateRange('window.minHeight', 150, 800);
        
        // Validate performance settings
        this.validateRange('performance.targetFPS', 15, 120);
        this.validateRange('performance.maxParticles', 100, 5000);
    }

    validateRange(path, min, max) {
        const value = this.get(path);
        if (typeof value === 'number') {
            if (value < min || value > max) {
                console.warn(`Config value ${path} (${value}) out of range [${min}, ${max}], clamping`);
                this.set(path, Math.max(min, Math.min(max, value)));
            }
        }
    }

    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (this.isObject(source[key]) && this.isObject(target[key])) {
                    result[key] = this.deepMerge(target[key], source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        
        return result;
    }

    isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    getNestedValue(obj, path, defaultValue = null) {
        const keys = path.split('.');
        let current = obj;
        
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return defaultValue;
            }
        }
        
        return current;
    }

    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            
            if (!(key in current) || !this.isObject(current[key])) {
                current[key] = {};
            }
            
            current = current[key];
        }
        
        current[keys[keys.length - 1]] = value;
    }

    // Preset management
    savePreset(name, config = null) {
        const presetConfig = config || this.currentConfig;
        const presetFile = path.join(this.configDir, `preset-${name}.json`);
        
        try {
            const presetData = JSON.stringify(presetConfig, null, 2);
            fs.writeFileSync(presetFile, presetData, 'utf8');
            console.log(`Preset '${name}' saved successfully`);
            return true;
        } catch (error) {
            console.error(`Failed to save preset '${name}':`, error);
            return false;
        }
    }

    loadPreset(name) {
        const presetFile = path.join(this.configDir, `preset-${name}.json`);
        
        try {
            if (fs.existsSync(presetFile)) {
                const presetData = fs.readFileSync(presetFile, 'utf8');
                const presetConfig = JSON.parse(presetData);
                
                this.currentConfig = this.deepMerge(this.defaultConfig, presetConfig);
                this.validate();
                this.save();
                
                console.log(`Preset '${name}' loaded successfully`);
                return true;
            } else {
                console.warn(`Preset '${name}' not found`);
                return false;
            }
        } catch (error) {
            console.error(`Failed to load preset '${name}':`, error);
            return false;
        }
    }

    listPresets() {
        try {
            const files = fs.readdirSync(this.configDir);
            const presets = files
                .filter(file => file.startsWith('preset-') && file.endsWith('.json'))
                .map(file => file.replace('preset-', '').replace('.json', ''));
            
            return presets;
        } catch (error) {
            console.error('Failed to list presets:', error);
            return [];
        }
    }

    deletePreset(name) {
        const presetFile = path.join(this.configDir, `preset-${name}.json`);
        
        try {
            if (fs.existsSync(presetFile)) {
                fs.unlinkSync(presetFile);
                console.log(`Preset '${name}' deleted successfully`);
                return true;
            } else {
                console.warn(`Preset '${name}' not found`);
                return false;
            }
        } catch (error) {
            console.error(`Failed to delete preset '${name}':`, error);
            return false;
        }
    }

    // Export/Import functionality
    exportConfig(filePath) {
        try {
            const configData = JSON.stringify(this.currentConfig, null, 2);
            fs.writeFileSync(filePath, configData, 'utf8');
            return true;
        } catch (error) {
            console.error('Failed to export configuration:', error);
            return false;
        }
    }

    importConfig(filePath) {
        try {
            const configData = fs.readFileSync(filePath, 'utf8');
            const importedConfig = JSON.parse(configData);
            
            this.currentConfig = this.deepMerge(this.defaultConfig, importedConfig);
            this.validate();
            this.save();
            
            return true;
        } catch (error) {
            console.error('Failed to import configuration:', error);
            return false;
        }
    }

    getConfigPath() {
        return this.configFile;
    }

    getVersion() {
        return this.get('app.version', '1.0.0');
    }

    isFirstRun() {
        return this.get('app.firstRun', true);
    }

    setFirstRunComplete() {
        this.set('app.firstRun', false);
    }
}

// Singleton instance
let configManager = null;

function getConfigManager() {
    if (!configManager) {
        configManager = new ConfigManager();
    }
    return configManager;
}

module.exports = {
    ConfigManager,
    getConfigManager
};