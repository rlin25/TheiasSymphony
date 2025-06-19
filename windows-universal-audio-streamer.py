#!/usr/bin/env python3
"""
Universal Windows Audio Streamer for Theias Symphony
Captures system audio from any output device (speakers, headphones, etc.)
Uses WASAPI loopback when available, falls back to Stereo Mix
"""

import pyaudio
import socket
import numpy as np
import subprocess
import re
import time

class UniversalAudioStreamer:
    def __init__(self, wsl_port=12345):
        self.wsl_ip = self.detect_wsl_ip()
        self.wsl_port = wsl_port
        self.sample_rate = 44100
        self.chunk_size = 1024
        self.format = pyaudio.paFloat32
        
        self.audio = pyaudio.PyAudio()
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        
        print(f"Target WSL IP: {self.wsl_ip}")
        
    def detect_wsl_ip(self):
        """Auto-detect WSL IP address"""
        try:
            result = subprocess.run(['wsl', 'hostname', '-I'], 
                                  capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                ip = result.stdout.strip().split()[0]
                if self.validate_ip(ip):
                    return ip
        except:
            pass
            
        # Fallback to localhost
        return "127.0.0.1"
        
    def validate_ip(self, ip):
        """Validate IP address format"""
        pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
        return re.match(pattern, ip) is not None
        
    def list_audio_devices(self):
        """List all available audio devices"""
        print("\n🔊 Available Audio Devices:")
        print("-" * 60)
        
        device_count = self.audio.get_device_count()
        input_devices = []
        output_devices = []
        
        for i in range(device_count):
            try:
                info = self.audio.get_device_info_by_index(i)
                name = info['name']
                
                if info['maxInputChannels'] > 0:
                    input_devices.append((i, name, info['maxInputChannels']))
                if info['maxOutputChannels'] > 0:
                    output_devices.append((i, name, info['maxOutputChannels']))
                    
            except Exception as e:
                continue
        
        print("📥 INPUT devices (for capturing):")
        for dev_id, name, channels in input_devices:
            marker = "🎯" if any(keyword in name.lower() 
                              for keyword in ['stereo mix', 'what u hear', 'loopback']) else "  "
            print(f"  {marker} Device {dev_id}: {name} ({channels} channels)")
            
        print("\n📤 OUTPUT devices (what you hear):")
        for dev_id, name, channels in output_devices:
            marker = "🔊" if any(keyword in name.lower() 
                              for keyword in ['speakers', 'headphones', 'default']) else "  "
            print(f"  {marker} Device {dev_id}: {name} ({channels} channels)")
        
        return input_devices, output_devices
        
    def find_best_audio_device(self):
        """Find the best device for system audio capture"""
        input_devices, output_devices = self.list_audio_devices()
        
        # Priority order for system audio capture
        priority_keywords = [
            'stereo mix',           # Traditional system audio
            'what u hear',          # Some audio drivers
            'loopback',            # WASAPI loopback
            'wave out mix',        # Older systems
            'speakers',            # Sometimes has loopback
            'realtek',             # Common audio chipset
            'sound mapper'         # Windows default
        ]
        
        print(f"\n🔍 Searching for system audio capture device...")
        
        # Look for the best match
        for keyword in priority_keywords:
            for dev_id, name, channels in input_devices:
                if keyword in name.lower():
                    print(f"✅ Found: {name} (Device {dev_id})")
                    return dev_id, name, channels
        
        # If no ideal device found, show options
        if input_devices:
            print(f"\n⚠️  No ideal system audio device found automatically.")
            print(f"📋 Available input devices:")
            for i, (dev_id, name, channels) in enumerate(input_devices):
                print(f"  {i+1}. {name} (Device {dev_id})")
            
            try:
                choice = input(f"\nSelect device (1-{len(input_devices)}) or Enter for auto: ").strip()
                if choice and choice.isdigit():
                    idx = int(choice) - 1
                    if 0 <= idx < len(input_devices):
                        dev_id, name, channels = input_devices[idx]
                        print(f"✅ Selected: {name}")
                        return dev_id, name, channels
            except (ValueError, KeyboardInterrupt):
                pass
                
            # Default to first available
            dev_id, name, channels = input_devices[0]
            print(f"🔄 Using first available: {name}")
            return dev_id, name, channels
        
        return None, None, None
        
    def start_streaming(self):
        """Start capturing and streaming system audio"""
        print("\n🎵 Universal Windows Audio Streamer")
        print("=" * 50)
        
        device_id, device_name, channels = self.find_best_audio_device()
        
        if device_id is None:
            print("❌ No suitable audio input device found!")
            print("\n💡 To enable system audio capture:")
            print("1. Right-click speaker icon → Sounds → Recording tab")
            print("2. Right-click empty area → Show Disabled Devices")
            print("3. Enable 'Stereo Mix' or similar device")
            return
        
        try:
            # Use up to 2 channels, but adapt to device capabilities
            use_channels = min(2, channels)
            
            print(f"\n🎧 Starting capture from: {device_name}")
            print(f"📊 Using {use_channels} channel(s)")
            print(f"🌐 Streaming to: {self.wsl_ip}:{self.wsl_port}")
            
            stream = self.audio.open(
                format=self.format,
                channels=use_channels,
                rate=self.sample_rate,
                input=True,
                input_device_index=device_id,
                frames_per_buffer=self.chunk_size
            )
            
            print(f"\n🎶 Ready! Play music on Windows to see visualization")
            print(f"🔄 Works with speakers, headphones, or any audio output")
            print(f"⏹️  Press Ctrl+C to stop\n")
            
            last_activity_time = time.time()
            
            while True:
                try:
                    # Read audio data
                    data = stream.read(self.chunk_size, exception_on_overflow=False)
                    
                    # Convert to numpy array
                    audio_data = np.frombuffer(data, dtype=np.float32)
                    
                    # Handle stereo to mono conversion if needed
                    if use_channels == 2:
                        audio_data = audio_data.reshape(-1, 2)
                        audio_data = np.mean(audio_data, axis=1)
                    
                    # Ensure correct length
                    if len(audio_data) != self.chunk_size:
                        if len(audio_data) < self.chunk_size:
                            audio_data = np.pad(audio_data, (0, self.chunk_size - len(audio_data)))
                        else:
                            audio_data = audio_data[:self.chunk_size]
                    
                    # Check audio level
                    max_amplitude = np.max(np.abs(audio_data))
                    
                    # Always send data (visualizer handles silence)
                    # Apply moderate amplification for system audio
                    audio_data = audio_data * 3.0
                    
                    # Send to WSL
                    self.socket.sendto(audio_data.astype(np.float32).tobytes(), 
                                     (self.wsl_ip, self.wsl_port))
                    
                    # Show activity
                    if max_amplitude > 0.001:
                        last_activity_time = time.time()
                        level_bars = "█" * min(int(max_amplitude * 50), 20)
                        print(f"🎵 {level_bars:<20} {max_amplitude:.4f}", end='\r')
                    else:
                        # Show "waiting" if no audio for more than 2 seconds
                        if time.time() - last_activity_time > 2:
                            print("⏸️  Waiting for audio... (play music/video)        ", end='\r')
                    
                except Exception as e:
                    print(f"\n⚠️  Stream error: {e}")
                    continue
                    
        except Exception as e:
            print(f"\n❌ Error: {e}")
            print("\n🔧 Troubleshooting:")
            print("- Try a different audio device from the list above")
            print("- Make sure the selected device is enabled in Windows")
            print("- Check that audio is actually playing on Windows")
            
        finally:
            if 'stream' in locals():
                stream.stop_stream()
                stream.close()
            self.audio.terminate()
            self.socket.close()
            print(f"\n👋 Streaming stopped")

if __name__ == "__main__":
    streamer = UniversalAudioStreamer()
    streamer.start_streaming()