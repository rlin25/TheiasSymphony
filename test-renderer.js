console.log('Test renderer starting...');

try {
    const { ipcRenderer } = require('electron');
    console.log('ipcRenderer loaded successfully');
} catch (error) {
    console.error('Failed to load ipcRenderer:', error);
}

// Set up basic IPC to test communication
ipcRenderer.on('audio-data', (event, data) => {
    console.log('Test renderer: received audio data via IPC, data length:', data?.byteLength || 'undefined');
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('Test renderer: DOMContentLoaded fired');
    document.body.innerHTML = '<h1>TEST RENDERER LOADED</h1><p>Check console for audio data logs</p>';
});

console.log('Test renderer script complete');