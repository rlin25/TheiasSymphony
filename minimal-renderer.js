console.log('=== MINIMAL RENDERER STARTING ===');

// Test if we can access Electron APIs
try {
    const { ipcRenderer } = require('electron');
    console.log('✓ Electron ipcRenderer loaded');
    
    // Set up audio data listener
    ipcRenderer.on('audio-data', (event, data) => {
        console.log('✓ RECEIVED AUDIO DATA - Length:', data?.length || data?.byteLength || 'unknown');
        
        // Try to access the canvas and draw something basic
        const canvas = document.getElementById('visualizer');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(0, 0, 100, 100); // Draw a red square to test
            console.log('✓ Drew test square on canvas');
        } else {
            console.log('✗ Canvas not found');
        }
    });
    
    console.log('✓ IPC listener set up');
    
} catch (error) {
    console.log('✗ Failed to load Electron:', error);
}

// Test DOM interaction
document.addEventListener('DOMContentLoaded', () => {
    console.log('✓ DOM loaded');
    
    const canvas = document.getElementById('visualizer');
    if (canvas) {
        console.log('✓ Canvas found');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw a test pattern
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(50, 50, 200, 100);
        console.log('✓ Drew test pattern');
    } else {
        console.log('✗ Canvas not found in DOM');
    }
});

console.log('=== MINIMAL RENDERER SETUP COMPLETE ===');