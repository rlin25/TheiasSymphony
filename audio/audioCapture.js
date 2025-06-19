const { spawn } = require('child_process');
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

class AudioCapture extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            sampleRate: 44100,
            bufferSize: 1024,
            channels: 2,
            bitDepth: 16,
            platform: process.platform,
            ...options
        };
        
        this.isCapturing = false;
        this.captureProcess = null;
        this.audioBuffer = [];
        this.lastError = null;
    }

    async start() {
        if (this.isCapturing) {
            throw new Error('Audio capture already running');
        }

        try {
            await this.checkPermissions();
            await this.initializePlatformCapture();
            this.isCapturing = true;
            this.emit('started');
        } catch (error) {
            this.lastError = error;
            this.emit('error', error);
            throw error;
        }
    }

    stop() {
        if (this.captureProcess) {
            this.captureProcess.kill();
            this.captureProcess = null;
        }
        
        this.isCapturing = false;
        this.emit('stopped');
    }

    async checkPermissions() {
        switch (this.options.platform) {
            case 'darwin':
                return await this.checkMacOSPermissions();
            case 'win32':
                return await this.checkWindowsPermissions();
            case 'linux':
                return await this.checkLinuxPermissions();
            default:
                throw new Error(`Unsupported platform: ${this.options.platform}`);
        }
    }

    async checkMacOSPermissions() {
        // macOS requires microphone permission for system audio capture
        // This is a simplified check - real implementation would use native modules
        return new Promise((resolve, reject) => {
            const checkScript = `
                osascript -e "do shell script \\"echo 'Permission check'\\""
            `;
            
            const child = spawn('sh', ['-c', checkScript]);
            child.on('close', (code) => {
                if (code === 0) {
                    resolve(true);
                } else {
                    reject(new Error('macOS audio permissions not granted'));
                }
            });
        });
    }

    async checkWindowsPermissions() {
        // Windows WASAPI should work without special permissions for loopback
        return Promise.resolve(true);
    }

    async checkLinuxPermissions() {
        // Check if PulseAudio is available
        return new Promise((resolve, reject) => {
            const child = spawn('pulseaudio', ['--check']);
            child.on('close', (code) => {
                if (code === 0) {
                    resolve(true);
                } else {
                    reject(new Error('PulseAudio not available'));
                }
            });
        });
    }

    async initializePlatformCapture() {
        switch (this.options.platform) {
            case 'darwin':
                return await this.initializeMacOSCapture();
            case 'win32':
                return await this.initializeWindowsCapture();
            case 'linux':
                return await this.initializeLinuxCapture();
            default:
                throw new Error(`Unsupported platform: ${this.options.platform}`);
        }
    }

    async initializeMacOSCapture() {
        // macOS Core Audio capture using sox (if available) or ffmpeg
        const captureCommand = this.findMacOSCaptureCommand();
        
        if (!captureCommand) {
            throw new Error('No suitable audio capture command found for macOS');
        }

        const args = this.buildMacOSCaptureArgs(captureCommand);
        this.startCaptureProcess(captureCommand.cmd, args);
    }

    async initializeWindowsCapture() {
        // Windows WASAPI loopback capture using ffmpeg
        const ffmpegPath = this.findWindowsCaptureTool();
        
        if (!ffmpegPath) {
            throw new Error('No suitable audio capture tool found for Windows');
        }

        const args = this.buildWindowsCaptureArgs();
        this.startCaptureProcess(ffmpegPath, args);
    }

    async initializeLinuxCapture() {
        // Linux PulseAudio capture
        const captureCommand = this.findLinuxCaptureCommand();
        
        if (!captureCommand) {
            throw new Error('No suitable audio capture command found for Linux');
        }

        const args = this.buildLinuxCaptureArgs(captureCommand);
        this.startCaptureProcess(captureCommand.cmd, args);
    }

    findMacOSCaptureCommand() {
        // Try to find available capture tools
        const tools = [
            { cmd: 'sox', available: false },
            { cmd: 'ffmpeg', available: false },
            { cmd: 'rec', available: false }
        ];

        // In a real implementation, check if these tools exist
        // For now, assume ffmpeg is available
        return { cmd: 'ffmpeg', available: true };
    }

    findWindowsCaptureTool() {
        // In Windows, we'd typically bundle ffmpeg or use native WASAPI
        return 'ffmpeg'; // Assuming ffmpeg is available
    }

    findLinuxCaptureCommand() {
        // Try PulseAudio, then ALSA
        return { cmd: 'parecord', available: true }; // Assuming PulseAudio
    }

    buildMacOSCaptureArgs(captureCommand) {
        if (captureCommand.cmd === 'ffmpeg') {
            return [
                '-f', 'avfoundation',
                '-i', ':0', // Default audio input
                '-ar', this.options.sampleRate.toString(),
                '-ac', this.options.channels.toString(),
                '-f', 'f32le',
                '-'
            ];
        }
        return [];
    }

    buildWindowsCaptureArgs() {
        return [
            '-f', 'dshow',
            '-i', 'audio="Stereo Mix"', // WASAPI loopback equivalent
            '-ar', this.options.sampleRate.toString(),
            '-ac', this.options.channels.toString(),
            '-f', 'f32le',
            '-'
        ];
    }

    buildLinuxCaptureArgs(captureCommand) {
        if (captureCommand.cmd === 'parecord') {
            return [
                '--format=float32le',
                '--rate=' + this.options.sampleRate,
                '--channels=' + this.options.channels,
                '--raw',
                '--device=@DEFAULT_MONITOR@'  // Capture from default audio output monitor
            ];
        }
        return [];
    }

    startCaptureProcess(command, args) {
        this.captureProcess = spawn(command, args, {
            stdio: ['ignore', 'pipe', 'pipe']
        });

        this.captureProcess.stdout.on('data', (data) => {
            this.processAudioData(data);
        });

        this.captureProcess.stderr.on('data', (data) => {
            console.error(`Audio capture stderr: ${data}`);
        });

        this.captureProcess.on('close', (code) => {
            console.log(`Audio capture process exited with code ${code}`);
            this.isCapturing = false;
            this.emit('stopped');
        });

        this.captureProcess.on('error', (error) => {
            this.lastError = error;
            this.emit('error', error);
        });
    }

    processAudioData(rawData) {
        try {
            // Convert raw audio data to Float32Array
            const samples = new Float32Array(rawData.buffer);
            
            // Add to buffer
            this.audioBuffer.push(...samples);
            
            // Emit data in chunks of the specified buffer size
            while (this.audioBuffer.length >= this.options.bufferSize) {
                const chunk = this.audioBuffer.splice(0, this.options.bufferSize);
                const audioData = new Float32Array(chunk);
                this.emit('audioData', audioData);
            }
            
        } catch (error) {
            console.error('Error processing audio data:', error);
            this.emit('error', error);
        }
    }

    getStatus() {
        return {
            isCapturing: this.isCapturing,
            platform: this.options.platform,
            sampleRate: this.options.sampleRate,
            channels: this.options.channels,
            bufferSize: this.options.bufferSize,
            lastError: this.lastError ? this.lastError.message : null
        };
    }
}

// Subprocess entry point
if (require.main === module) {
    const args = process.argv.slice(2);
    const platform = args.find(arg => arg.startsWith('--platform='))?.split('=')[1] || process.platform;
    
    const capture = new AudioCapture({ platform });
    
    capture.on('audioData', (data) => {
        // Send audio data to parent process via stdout
        process.stdout.write(Buffer.from(data.buffer));
    });
    
    capture.on('error', (error) => {
        console.error('Audio capture error:', error.message);
        process.exit(1);
    });
    
    capture.on('stopped', () => {
        process.exit(0);
    });
    
    // Handle cleanup
    process.on('SIGINT', () => {
        capture.stop();
    });
    
    process.on('SIGTERM', () => {
        capture.stop();
    });
    
    // Start capture
    capture.start().catch((error) => {
        console.error('Failed to start audio capture:', error.message);
        process.exit(1);
    });
}

module.exports = AudioCapture;