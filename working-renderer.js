console.log('=== WORKING RENDERER STARTING ===');

const { ipcRenderer } = require('electron');
let canvas, ctx;
let audioData = new Float32Array(1024);
let isInitialized = false;

// Set up IPC listener immediately
console.log('Setting up audio-data IPC listener...');
ipcRenderer.on('audio-data', (event, data) => {
    console.log('IPC: Received audio data in renderer, length:', data?.length || data?.byteLength);
    try {
        // Convert buffer to Float32Array
        let buffer;
        if (data instanceof ArrayBuffer) {
            buffer = new Float32Array(data);
        } else if (data.buffer instanceof ArrayBuffer) {
            buffer = new Float32Array(data.buffer);
        } else {
            buffer = new Float32Array(data);
        }
        
        // Copy to our audio data array
        audioData.set(buffer.slice(0, Math.min(buffer.length, audioData.length)));
        
        // Apply reasonable amplification for microphone input
        for (let i = 0; i < audioData.length; i++) {
            audioData[i] *= 100; // 100x amplification (normal sensitivity)
        }
        
        // Log some sample values to debug
        const maxVal = Math.max(...audioData.slice(0, 10));
        const minVal = Math.min(...audioData.slice(0, 10));
        console.log(`Audio range: ${minVal.toFixed(6)} to ${maxVal.toFixed(6)}, first few: [${audioData.slice(0, 5).map(v => v.toFixed(6)).join(', ')}]`);
        
        // Always initialize on first audio data received
        if (!isInitialized) {
            isInitialized = true;
            console.log('Audio visualization initialized from IPC');
            // Hide loading screen - wait for DOM if needed
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    const loading = document.getElementById('loading');
                    if (loading) loading.classList.add('hidden');
                });
            } else {
                const loading = document.getElementById('loading');
                if (loading) loading.classList.add('hidden');
            }
        }
        
    } catch (error) {
        console.log('Error processing audio:', error);
    }
});
console.log('Audio IPC listener set up');

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded - initializing canvas');
    
    canvas = document.getElementById('visualizer');
    if (canvas) {
        ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Start animation loop
        animate();
        console.log('Animation started');
        
        // Force hide loading screen after 2 seconds if audio hasn't initialized
        setTimeout(() => {
            if (!isInitialized) {
                console.log('Forcing initialization - hiding loading screen');
                isInitialized = true;
                const loading = document.getElementById('loading');
                if (loading) loading.classList.add('hidden');
            }
        }, 2000);
    }
});


function animate() {
    if (!canvas || !ctx) return;
    
    // Clear with black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (isInitialized && audioData.length > 0) {
        drawWaveform();
    } else {
        drawIdlePattern();
    }
    
    requestAnimationFrame(animate);
}

function drawWaveform() {
    const centerY = canvas.height / 2;
    const time = Date.now() * 0.001;
    
    // Create rainbow gradient
    const hue = (time * 50) % 360;
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, `hsl(${hue}, 100%, 50%)`);
    gradient.addColorStop(0.25, `hsl(${(hue + 60) % 360}, 100%, 50%)`);
    gradient.addColorStop(0.5, `hsl(${(hue + 120) % 360}, 100%, 50%)`);
    gradient.addColorStop(0.75, `hsl(${(hue + 180) % 360}, 100%, 50%)`);
    gradient.addColorStop(1, `hsl(${(hue + 240) % 360}, 100%, 50%)`);
    
    // Calculate energy for beat detection
    let energy = 0;
    for (let i = 0; i < audioData.length; i++) {
        energy += audioData[i] * audioData[i];
    }
    energy = Math.sqrt(energy / audioData.length);
    
    // Beat-reactive scaling
    const beatScale = 1.0 + Math.min(energy * 0.5, 2.0);
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3 * beatScale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Add glow effect
    ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
    ctx.shadowBlur = 20 * beatScale;
    
    ctx.beginPath();
    
    // Draw waveform
    const step = canvas.width / audioData.length;
    for (let i = 0; i < audioData.length; i++) {
        const x = i * step;
        const amplitude = audioData[i];
        const y = centerY + amplitude * canvas.height * 0.3 * beatScale;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    ctx.stroke();
    
    // Second glow pass for intensity
    ctx.shadowBlur = 40 * beatScale;
    ctx.globalAlpha = 0.3;
    ctx.stroke();
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
}

function drawIdlePattern() {
    const centerY = canvas.height / 2;
    const time = Date.now() * 0.002;
    const hue = (time * 50) % 360;
    
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, `hsl(${hue}, 100%, 50%)`);
    gradient.addColorStop(0.5, `hsl(${(hue + 120) % 360}, 100%, 50%)`);
    gradient.addColorStop(1, `hsl(${(hue + 240) % 360}, 100%, 50%)`);
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
    ctx.shadowBlur = 10;
    
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x += 4) {
        const y = centerY + Math.sin(x * 0.01 + time) * 50 * Math.sin(time * 0.5);
        if (x === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
}

// Handle window resize
window.addEventListener('resize', () => {
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
});

console.log('=== WORKING RENDERER SETUP COMPLETE ===');