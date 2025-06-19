const dgram = require('dgram');
const EventEmitter = require('events');

class NetworkAudioCapture extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            port: 12345,
            sampleRate: 44100,
            bufferSize: 1024,
            ...options
        };
        
        this.socket = null;
        this.isListening = false;
    }

    start() {
        return new Promise((resolve, reject) => {
            this.socket = dgram.createSocket('udp4');
            
            this.socket.on('message', (msg, rinfo) => {
                try {
                    console.log(`Received audio data: ${msg.length} bytes from ${rinfo.address}:${rinfo.port}`);
                    // Parse audio data from network
                    const audioData = new Float32Array(msg.buffer);
                    console.log(`Audio data length: ${audioData.length}, first value: ${audioData[0]}`);
                    this.emit('audioData', audioData);
                } catch (error) {
                    console.error('Error parsing network audio:', error);
                }
            });
            
            this.socket.on('error', (error) => {
                console.error('Network audio error:', error);
                this.emit('error', error);
                reject(error);
            });
            
            this.socket.bind(this.options.port, () => {
                console.log(`Network audio listening on port ${this.options.port}`);
                this.isListening = true;
                this.emit('started');
                resolve();
            });
        });
    }

    stop() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.isListening = false;
        this.emit('stopped');
    }
}

module.exports = NetworkAudioCapture;