const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

class PerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.lastFPSUpdate = performance.now();
        this.currentFPS = 0;
        this.frameTimings = [];
        this.maxFrameTimings = 60;
        
        this.memoryUsage = {
            used: 0,
            total: 0,
            percentage: 0
        };
        
        this.cpuUsage = 0;
        this.lastCPUUpdate = performance.now();
    }

    startFrame() {
        this.frameStartTime = performance.now();
    }

    endFrame() {
        if (!this.frameStartTime) return;
        
        const frameTime = performance.now() - this.frameStartTime;
        this.frameTimings.push(frameTime);
        
        if (this.frameTimings.length > this.maxFrameTimings) {
            this.frameTimings.shift();
        }
        
        this.frameCount++;
        
        // Update FPS every second
        const now = performance.now();
        if (now - this.lastFPSUpdate >= 1000) {
            this.currentFPS = Math.round(this.frameCount * 1000 / (now - this.lastFPSUpdate));
            this.frameCount = 0;
            this.lastFPSUpdate = now;
        }
    }

    getFPS() {
        return this.currentFPS;
    }

    getAverageFrameTime() {
        if (this.frameTimings.length === 0) return 0;
        return this.frameTimings.reduce((sum, time) => sum + time, 0) / this.frameTimings.length;
    }

    getFrameTimeStats() {
        if (this.frameTimings.length === 0) {
            return { min: 0, max: 0, avg: 0, p95: 0, p99: 0 };
        }
        
        const sorted = [...this.frameTimings].sort((a, b) => a - b);
        const len = sorted.length;
        
        return {
            min: sorted[0],
            max: sorted[len - 1],
            avg: this.getAverageFrameTime(),
            p95: sorted[Math.floor(len * 0.95)],
            p99: sorted[Math.floor(len * 0.99)]
        };
    }

    updateMemoryUsage() {
        const memInfo = process.memoryUsage();
        this.memoryUsage = {
            used: Math.round(memInfo.heapUsed / 1024 / 1024 * 100) / 100, // MB
            total: Math.round(memInfo.heapTotal / 1024 / 1024 * 100) / 100, // MB
            percentage: Math.round((memInfo.heapUsed / memInfo.heapTotal) * 100)
        };
    }

    getMemoryUsage() {
        this.updateMemoryUsage();
        return this.memoryUsage;
    }

    getPerformanceReport() {
        const frameStats = this.getFrameTimeStats();
        const memory = this.getMemoryUsage();
        
        return {
            fps: this.currentFPS,
            frameTime: {
                current: this.frameTimings[this.frameTimings.length - 1] || 0,
                average: frameStats.avg,
                min: frameStats.min,
                max: frameStats.max,
                p95: frameStats.p95,
                p99: frameStats.p99
            },
            memory: memory,
            timestamp: Date.now()
        };
    }
}

class AudioBufferManager {
    constructor(size = 1024) {
        this.size = size;
        this.buffer = new Float32Array(size);
        this.writeIndex = 0;
        this.readIndex = 0;
        this.filled = false;
    }

    write(data) {
        const dataArray = new Float32Array(data);
        
        for (let i = 0; i < dataArray.length; i++) {
            this.buffer[this.writeIndex] = dataArray[i];
            this.writeIndex = (this.writeIndex + 1) % this.size;
            
            if (this.writeIndex === this.readIndex) {
                this.filled = true;
                this.readIndex = (this.readIndex + 1) % this.size;
            }
        }
    }

    read(length) {
        if (!this.filled && this.writeIndex === this.readIndex) {
            return new Float32Array(length); // Return zeros if no data
        }
        
        const result = new Float32Array(length);
        
        for (let i = 0; i < length; i++) {
            result[i] = this.buffer[this.readIndex];
            this.readIndex = (this.readIndex + 1) % this.size;
            
            if (!this.filled && this.readIndex === this.writeIndex) {
                // No more data available
                break;
            }
        }
        
        return result;
    }

    getAvailableData() {
        if (!this.filled && this.writeIndex === this.readIndex) {
            return 0;
        }
        
        if (this.filled) {
            return this.size;
        }
        
        return this.writeIndex >= this.readIndex 
            ? this.writeIndex - this.readIndex
            : this.size - this.readIndex + this.writeIndex;
    }

    clear() {
        this.writeIndex = 0;
        this.readIndex = 0;
        this.filled = false;
        this.buffer.fill(0);
    }
}

class Logger {
    constructor(level = 'info') {
        this.level = level;
        this.levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };
        
        this.logFile = null;
        this.enableFileLogging = false;
    }

    setLevel(level) {
        this.level = level;
    }

    enableFileOutput(logFilePath) {
        this.logFile = logFilePath;
        this.enableFileLogging = true;
    }

    disableFileOutput() {
        this.enableFileLogging = false;
        this.logFile = null;
    }

    log(level, message, ...args) {
        if (this.levels[level] < this.levels[this.level]) {
            return;
        }
        
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        
        // Console output
        switch (level) {
            case 'debug':
                console.debug(formattedMessage, ...args);
                break;
            case 'info':
                console.info(formattedMessage, ...args);
                break;
            case 'warn':
                console.warn(formattedMessage, ...args);
                break;
            case 'error':
                console.error(formattedMessage, ...args);
                break;
        }
        
        // File output
        if (this.enableFileLogging && this.logFile) {
            try {
                const logEntry = `${formattedMessage} ${args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                ).join(' ')}\n`;
                
                fs.appendFileSync(this.logFile, logEntry, 'utf8');
            } catch (error) {
                console.error('Failed to write to log file:', error);
            }
        }
    }

    debug(message, ...args) {
        this.log('debug', message, ...args);
    }

    info(message, ...args) {
        this.log('info', message, ...args);
    }

    warn(message, ...args) {
        this.log('warn', message, ...args);
    }

    error(message, ...args) {
        this.log('error', message, ...args);
    }
}

// Utility functions
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function lerp(start, end, factor) {
    return start + (end - start) * factor;
}

function map(value, inMin, inMax, outMin, outMax) {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

function smoothstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return t * t * (3.0 - 2.0 * t);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000) % 60;
    const minutes = Math.floor(milliseconds / (1000 * 60)) % 60;
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

function getSystemInfo() {
    const os = require('os');
    
    return {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        cpuCount: os.cpus().length,
        totalMemory: formatBytes(os.totalmem()),
        freeMemory: formatBytes(os.freemem()),
        uptime: formatDuration(os.uptime() * 1000),
        loadAverage: os.loadavg(),
        hostname: os.hostname(),
        userInfo: os.userInfo()
    };
}

function ensureDirectory(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            return true;
        }
        return true;
    } catch (error) {
        console.error(`Failed to create directory ${dirPath}:`, error);
        return false;
    }
}

function fileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch (error) {
        return false;
    }
}

function readJsonFile(filePath, defaultValue = null) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
        return defaultValue;
    } catch (error) {
        console.error(`Failed to read JSON file ${filePath}:`, error);
        return defaultValue;
    }
}

function writeJsonFile(filePath, data) {
    try {
        const jsonData = JSON.stringify(data, null, 2);
        fs.writeFileSync(filePath, jsonData, 'utf8');
        return true;
    } catch (error) {
        console.error(`Failed to write JSON file ${filePath}:`, error);
        return false;
    }
}

function generateId(length = 8) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    
    if (obj instanceof Array) {
        return obj.map(item => deepClone(item));
    }
    
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

function isValidNumber(value, min = -Infinity, max = Infinity) {
    return typeof value === 'number' && 
           !isNaN(value) && 
           isFinite(value) && 
           value >= min && 
           value <= max;
}

function sanitizeFilename(filename) {
    // Remove or replace invalid characters for file names
    return filename
        .replace(/[<>:"/\\|?*]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/^\.+/, '')
        .substring(0, 255);
}

class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }

    off(event, listener) {
        if (!this.events[event]) return;
        
        const index = this.events[event].indexOf(listener);
        if (index > -1) {
            this.events[event].splice(index, 1);
        }
    }

    emit(event, ...args) {
        if (!this.events[event]) return;
        
        this.events[event].forEach(listener => {
            try {
                listener(...args);
            } catch (error) {
                console.error(`Error in event listener for ${event}:`, error);
            }
        });
    }

    removeAllListeners(event) {
        if (event) {
            delete this.events[event];
        } else {
            this.events = {};
        }
    }
}

// Create global instances
const performanceMonitor = new PerformanceMonitor();
const logger = new Logger();

module.exports = {
    PerformanceMonitor,
    AudioBufferManager,
    Logger,
    EventEmitter,
    performanceMonitor,
    logger,
    clamp,
    lerp,
    map,
    smoothstep,
    debounce,
    throttle,
    formatBytes,
    formatDuration,
    getSystemInfo,
    ensureDirectory,
    fileExists,
    readJsonFile,
    writeJsonFile,
    generateId,
    deepClone,
    isValidNumber,
    sanitizeFilename
};