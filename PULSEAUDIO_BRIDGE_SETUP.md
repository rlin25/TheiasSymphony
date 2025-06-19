# PulseAudio Bridge Setup Guide

This guide explains how to set up audio streaming from Windows to WSL for Theias Symphony using PulseAudio.

## Prerequisites
- Windows 10/11 with WSL2
- PulseAudio for Windows ([download here](https://www.freedesktop.org/wiki/Software/PulseAudio/Ports/Windows/Support/))
- Theias Symphony running in WSL

## Setup Steps

### Step 1: Install PulseAudio on Windows
1. Download PulseAudio for Windows
2. Extract to `C:\pulseaudio\`
3. Copy `windows-pulseaudio-config.pa` to `C:\pulseaudio\etc\pulse\default.pa`

### Step 2: Start PulseAudio Server on Windows
1. Run `start-pulseaudio-windows.bat` as Administrator
2. This will start PulseAudio with network access enabled
3. Keep this window open while using Theias Symphony

### Step 3: Configure WSL PulseAudio Client
```bash
# Run the setup script
./setup-wsl-pulseaudio.sh

# Start PulseAudio client
pulseaudio --start

# Verify connection
pactl info
```

### Step 4: Start Theias Symphony
```bash
npm start
```

## Troubleshooting

### No Audio Connection
- Ensure Windows firewall allows PulseAudio (port 4713)
- Check that PulseAudio server is running on Windows
- Verify WSL can reach Windows IP: `ping $(ip route show default | awk '/default/ {print $3}')`

### Audio Stuttering
- Increase latency in `windows-pulseaudio-config.pa` (change `latency_msec=50` to higher value)
- Close other audio applications

### No System Audio Capture
- Ensure virtual sink is set as default in Windows Sound settings
- Check that audio is playing through the combined sink

### Testing Audio Flow
```bash
# In WSL, test PulseAudio connection
pactl list short sinks

# Should show sinks from Windows including 'virtual_sink' and 'combined'
```

## How It Works

1. **Windows Side**: PulseAudio creates a virtual sink that captures all system audio
2. **Network**: Audio data streams over TCP port 4713 to WSL
3. **WSL Side**: PulseAudio client receives audio and makes it available to Theias Symphony
4. **Visualization**: Theias Symphony captures the audio stream and renders visualizations

## Alternative: Network Streaming
If PulseAudio bridge doesn't work, you can use the Python network streamer:
1. Install Python dependencies: `pip install pyaudio numpy`
2. Enable "Stereo Mix" in Windows sound settings
3. Run `python windows-audio-streamer.py` on Windows
4. Theias Symphony will automatically detect the network audio stream