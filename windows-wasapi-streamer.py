#!/usr/bin/env python3
"""
Windows WASAPI Loopback Audio Streamer for Theias Symphony
Uses Windows Audio Session API (WASAPI) to capture system audio
Works with ANY output device (speakers, headphones, USB, Bluetooth, etc.)
"""

try:
    import pyaudiowpatch as pyaudio  # Enhanced PyAudio with WASAPI support
    WASAPI_AVAILABLE = True
except ImportError:
    import pyaudio
    WASAPI_AVAILABLE = False

import socket
import numpy as np
import subprocess
import time

class WASAPIStreamer:
    def __init__(self, wsl_port=12345):
        self.wsl_ip = self.detect_wsl_ip()
        self.wsl_port = wsl_port
        self.sample_rate = 44100
        self.chunk_size = 1024
        self.format = pyaudio.paFloat32
        
        self.audio = pyaudio.PyAudio()
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        
        print(f"🌐 Target WSL IP: {self.wsl_ip}")
        if WASAPI_AVAILABLE:
            print("✅ WASAPI loopback support available")
        else:
            print("⚠️  WASAPI not available, using standard PyAudio")
            print("💡 For better system audio capture, install: pip install PyAudioWPatch")
        
    def detect_wsl_ip(self):
        """Auto-detect WSL IP address"""
        try:
            result = subprocess.run(['wsl', 'hostname', '-I'], 
                                  capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                ip = result.stdout.strip().split()[0]
                if '.' in ip:
                    return ip
        except:
            pass
        return "127.0.0.1"
        
    def get_default_output_device(self):
        """Get the default output device (what Windows is currently using)"""
        if not WASAPI_AVAILABLE:
            return None
            
        try:
            # Get Windows default output device
            default_output = self.audio.get_default_output_device_info()
            print(f"🔊 Default output device: {default_output['name']}")
            return default_output
        except:
            return None
            
    def get_loopback_device(self, output_device):
        """Get the loopback device for the given output device"""
        if not WASAPI_AVAILABLE:
            return None
            
        try:
            # Try to get the loopback device for the output
            device_count = self.audio.get_device_count()
            
            for i in range(device_count):
                device_info = self.audio.get_device_info_by_index(i)
                # Look for loopback version of the output device
                if (device_info.get('name') == output_device['name'] and 
                    device_info.get('maxInputChannels', 0) > 0):
                    return device_info
                    
        except Exception as e:
            print(f"Error finding loopback device: {e}")
            
        return None
        
    def find_system_audio_source(self):
        """Find the best available system audio source"""
        
        # Try WASAPI loopback first (best method)
        if WASAPI_AVAILABLE:
            default_output = self.get_default_output_device()
            if default_output:
                loopback = self.get_loopback_device(default_output)
                if loopback:
                    print(f"✅ Using WASAPI loopback: {loopback['name']}")
                    return loopback['index'], loopback['name'], int(loopback['maxInputChannels'])
        
        # Fallback to traditional methods
        print("🔄 Searching for traditional system audio devices...")
        
        device_count = self.audio.get_device_count()
        candidates = []
        
        for i in range(device_count):
            try:
                info = self.audio.get_device_info_by_index(i)
                if info['maxInputChannels'] > 0:
                    name_lower = info['name'].lower()
                    
                    # Score devices by how likely they are to be system audio
                    score = 0
                    if 'stereo mix' in name_lower: score = 100
                    elif 'what u hear' in name_lower: score = 90
                    elif 'loopback' in name_lower: score = 85
                    elif 'wave out mix' in name_lower: score = 80
                    elif 'speakers' in name_lower and 'input' in name_lower: score = 70
                    elif 'realtek' in name_lower and ('stereo' in name_lower or 'mix' in name_lower): score = 60
                    elif 'sound mapper' in name_lower: score = 50
                    
                    if score > 0:
                        candidates.append((score, i, info['name'], info['maxInputChannels']))
                        
            except:
                continue
        
        if candidates:
            # Sort by score (highest first)
            candidates.sort(reverse=True)
            score, device_id, name, channels = candidates[0]
            print(f"✅ Found system audio: {name} (Device {device_id})")
            return device_id, name, channels
        
        return None, None, None
        
    def start_streaming(self):
        """Start capturing and streaming system audio"""
        print("\n🎵 Windows WASAPI System Audio Streamer")
        print("=" * 60)
        print("🎯 Captures audio from ANY Windows output device")
        print("🔄 Works with speakers, headphones, USB, Bluetooth, etc.")
        print("=" * 60)
        
        device_id, device_name, channels = self.find_system_audio_source()
        
        if device_id is None:
            print("\n❌ No system audio capture device found!")
            print("\n🛠️  Setup Instructions:")
            print("1. Right-click the speaker icon in system tray")
            print("2. Click 'Sounds' → 'Recording' tab")
            print("3. Right-click empty area → 'Show Disabled Devices'")
            print("4. Look for 'Stereo Mix' and right-click → 'Enable'")
            print("5. Right-click 'Stereo Mix' → 'Set as Default Device'")
            print("\n💡 Alternative: Install PyAudioWPatch for automatic WASAPI support:")
            print("   pip install PyAudioWPatch")
            return
        
        try:
            # Determine optimal channel configuration
            use_channels = min(2, channels)
            
            print(f"\n🎧 Audio Source: {device_name}")
            print(f"📊 Channels: {use_channels}")
            print(f"🌐 Streaming to: {self.wsl_ip}:{self.wsl_port}")
            print(f"📡 Sample Rate: {self.sample_rate} Hz")
            
            # Open audio stream
            stream = self.audio.open(
                format=self.format,
                channels=use_channels,
                rate=self.sample_rate,
                input=True,
                input_device_index=device_id,
                frames_per_buffer=self.chunk_size
            )
            
            print(f"\n🎶 Streaming active! This captures ALL Windows audio:")
            print(f"   • Music (Spotify, YouTube, etc.)")
            print(f"   • Videos & movies") 
            print(f"   • Games")
            print(f"   • System sounds")
            print(f"   • Any audio playing on Windows")
            print(f"\n🎮 Switch between speakers/headphones - capture continues!")
            print(f"⏹️  Press Ctrl+C to stop")
            print(f"\n{'Audio Level':<15} {'Device Activity'}")
            print("-" * 50)
            
            while True:
                try:
                    # Read audio data
                    data = stream.read(self.chunk_size, exception_on_overflow=False)
                    
                    # Convert to numpy array
                    audio_data = np.frombuffer(data, dtype=np.float32)
                    
                    # Handle multi-channel audio
                    if use_channels == 2 and len(audio_data) >= self.chunk_size * 2:
                        # Convert stereo to mono
                        audio_data = audio_data.reshape(-1, 2)
                        audio_data = np.mean(audio_data, axis=1)
                    
                    # Ensure correct buffer size
                    if len(audio_data) < self.chunk_size:
                        audio_data = np.pad(audio_data, (0, self.chunk_size - len(audio_data)))
                    elif len(audio_data) > self.chunk_size:
                        audio_data = audio_data[:self.chunk_size]
                    
                    # Calculate audio level
                    max_amplitude = np.max(np.abs(audio_data))
                    rms_level = np.sqrt(np.mean(audio_data ** 2))
                    
                    # Apply amplification for system audio
                    audio_data = audio_data * 2.5
                    
                    # Send to WSL visualizer
                    self.socket.sendto(audio_data.astype(np.float32).tobytes(), 
                                     (self.wsl_ip, self.wsl_port))
                    
                    # Visual feedback
                    if max_amplitude > 0.0001:
                        # Active audio
                        level_percent = min(int(max_amplitude * 100), 100)
                        bar_length = min(int(max_amplitude * 30), 30)
                        level_bar = "█" * bar_length + "░" * (30 - bar_length)
                        
                        print(f"🎵 {level_percent:3d}%        {level_bar} {max_amplitude:.4f}", end='\r')
                    else:
                        # Silence - still streaming
                        print("⏸️  Silent          " + "░" * 30 + " 0.0000", end='\r')
                    
                except Exception as e:
                    print(f"\n⚠️  Stream error: {e}")
                    time.sleep(0.1)
                    continue
                    
        except Exception as e:
            print(f"\n❌ Failed to start audio capture: {e}")
            print(f"\n🔧 Troubleshooting:")
            print(f"- Make sure audio is playing on Windows")
            print(f"- Try enabling Stereo Mix in Windows Sound settings")
            print(f"- Check that the selected device supports input")
            
        finally:
            if 'stream' in locals():
                stream.stop_stream()
                stream.close()
            self.audio.terminate()
            self.socket.close()
            print(f"\n\n👋 Audio streaming stopped")

if __name__ == "__main__":
    streamer = WASAPIStreamer()
    streamer.start_streaming()