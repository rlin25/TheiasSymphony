const { app, BrowserWindow, Menu, globalShortcut } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let isFullscreen = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 400,
    minHeight: 300,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false,
      allowRunningInsecureContent: true
    },
    show: false,
    backgroundColor: '#000000',
    titleBarStyle: 'default'
  });

  console.log('Loading index.html...');
  mainWindow.loadFile('index.html');

  mainWindow.webContents.on('dom-ready', () => {
    console.log('DOM ready event fired');
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page finished loading');
  });

  // Enable more debugging
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`RENDERER LOG [${level}]: ${message} (${sourceId}:${line})`);
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.log('Page failed to load:', errorCode, errorDescription);
  });

  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show');
    mainWindow.show();
    // Start audio capture after window is ready
    setTimeout(() => {
      startAudioCapture();
    }, 1000);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle fullscreen toggle
  mainWindow.on('enter-full-screen', () => {
    isFullscreen = true;
  });

  mainWindow.on('leave-full-screen', () => {
    isFullscreen = false;
  });

  // Set up menu
  createMenu();

  // Register global shortcuts
  registerShortcuts();
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Fullscreen',
          accelerator: 'F11',
          click: () => {
            if (mainWindow) {
              mainWindow.setFullScreen(!mainWindow.isFullScreen());
            }
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.toggleDevTools();
            }
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            // TODO: Show about dialog
          }
        }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function registerShortcuts() {
  // F11 for fullscreen toggle
  globalShortcut.register('F11', () => {
    if (mainWindow) {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });

  // ESC to exit fullscreen
  globalShortcut.register('Escape', () => {
    if (mainWindow && mainWindow.isFullScreen()) {
      mainWindow.setFullScreen(false);
    }
  });
}

// Audio capture management - using simulated audio for demo
let audioInterval = null;

function startAudioCapture() {
  console.log('Starting audio capture system...');
  
  // Try real audio capture only - no fallback to simulated
  tryRealAudioCapture().catch((error) => {
    console.log('Real audio capture failed:', error.message);
    console.log('No audio input available - visualization will remain static');
    if (mainWindow) {
      mainWindow.webContents.send('audio-status', { 
        message: 'No audio input - check Windows microphone streamer', 
        type: 'error' 
      });
    }
  });
}

async function tryRealAudioCapture() {
  try {
    // Try network audio capture (for Windows streaming)
    const NetworkAudioCapture = require('./audio/networkAudioCapture.js');
    const networkCapture = new NetworkAudioCapture({ port: 12345 });
    
    networkCapture.on('audioData', (data) => {
      if (mainWindow) {
        console.log('Main process: sending audio data to renderer, length:', data.length);
        mainWindow.webContents.send('audio-data', data.buffer);
      }
    });
    
    networkCapture.on('started', () => {
      console.log('Network audio capture started');
      if (mainWindow) {
        mainWindow.webContents.send('audio-status', { 
          message: 'Network audio active', 
          type: 'active' 
        });
      }
    });
    
    networkCapture.on('error', (error) => {
      console.log('Network audio failed:', error.message);
      throw error;
    });
    
    await networkCapture.start();
    
  } catch (error) {
    // Try native audio capture
    try {
      const AudioCapture = require('./audio/audioCapture.js');
      const audioCapture = new AudioCapture({ platform: process.platform });
      
      audioCapture.on('audioData', (data) => {
        if (mainWindow) {
          mainWindow.webContents.send('audio-data', data.buffer);
        }
      });
      
      await audioCapture.start();
      
    } catch (nativeError) {
      throw new Error('Both network and native audio capture failed');
    }
  }
}

function startSimulatedAudio() {
  console.log('Starting simulated audio for demonstration');
  
  if (mainWindow) {
    mainWindow.webContents.send('audio-status', { message: 'Demo mode - simulated audio', type: 'demo' });
  }
  
  // Generate simulated audio data for visualization
  audioInterval = setInterval(() => {
    if (mainWindow) {
      // Create simulated frequency data
      const simulatedData = new Float32Array(1024);
      const time = Date.now() * 0.001;
      
      for (let i = 0; i < simulatedData.length; i++) {
        // Create a mix of frequencies with some randomness
        const freq1 = Math.sin(time * 2 + i * 0.01) * 0.3;
        const freq2 = Math.sin(time * 5 + i * 0.02) * 0.2;
        const freq3 = Math.sin(time * 8 + i * 0.005) * 0.1;
        const noise = (Math.random() - 0.5) * 0.1;
        
        // Add some beat-like patterns
        const beat = Math.sin(time * 1.5) > 0.7 ? 0.5 : 0;
        
        simulatedData[i] = freq1 + freq2 + freq3 + noise + beat;
      }
      
      mainWindow.webContents.send('audio-data', simulatedData.buffer);
    }
  }, 1000 / 60); // 60 FPS
}

function stopAudioCapture() {
  if (audioInterval) {
    clearInterval(audioInterval);
    audioInterval = null;
  }
}

// App event handlers
app.whenReady().then(() => {
  createWindow();
  // Audio capture now starts after window is ready

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopAudioCapture();
  globalShortcut.unregisterAll();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopAudioCapture();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Export for testing
module.exports = {
  createWindow,
  startAudioCapture,
  stopAudioCapture
};