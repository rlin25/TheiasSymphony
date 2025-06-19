#!/usr/bin/env python3
"""
Simple Windows System Audio Streamer for Theias Symphony
Reliable system audio capture that works with speakers and headphones
"""

import pyaudio
import socket
import numpy as np
import time

class SimpleSystemStreamer:
    def __init__(self):
        # Use the WSL IP we know works: 172.28.51.71
        self.wsl_ip = "172.28.51.71"
        self.wsl_port = 12345
        self.sample_rate = 44100
        self.chunk_size = 1024
        self.format = pyaudio.paFloat32
        
        self.audio = pyaudio.PyAudio()
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        
    def list_devices(self):
        """List all input devices clearly"""
        print("Available audio input devices:")
        print("-" * 50)
        
        device_count = self.audio.get_device_count()
        stereo_mix_devices = []
        other_devices = []
        
        for i in range(device_count):
            try:
                info = self.audio.get_device_info_by_index(i)
                if info['maxInputChannels'] > 0:
                    name = info['name']
                    channels = info['maxInputChannels']
                    
                    if 'stereo mix' in name.lower():
                        stereo_mix_devices.append((i, name, channels))
                    else:
                        other_devices.append((i, name, channels))
                        
            except Exception:
                continue
        
        # Show Stereo Mix devices first (these are what we want)
        if stereo_mix_devices:
            print("🎯 SYSTEM AUDIO devices (recommended):")
            for dev_id, name, channels in stereo_mix_devices:
                print(f"   {dev_id}: {name} ({channels} channels)")
        
        print("\n📝 Other input devices:")
        for dev_id, name, channels in other_devices[:10]:  # Limit to 10 to avoid clutter
            print(f"   {dev_id}: {name} ({channels} channels)")
            
        return stereo_mix_devices, other_devices
    
    def start_streaming(self):
        """Start streaming with user device selection"""
        print("Simple Windows System Audio Streamer")
        print("=" * 45)
        print(f"Target: {self.wsl_ip}:{self.wsl_port}")
        print()
        
        stereo_devices, other_devices = self.list_devices()
        
        # Try to use Stereo Mix automatically first
        device_id = None
        device_name = None
        
        if stereo_devices:
            device_id, device_name, channels = stereo_devices[0]
            print(f"✅ Auto-selected: {device_name} (Device {device_id})")
        else:
            print("❌ No Stereo Mix found!")
            print("\nTo capture system audio, you need to enable Stereo Mix:")
            print("1. Right-click speaker icon → 'Sounds'")
            print("2. Go to 'Recording' tab")
            print("3. Right-click empty area → 'Show Disabled Devices'")
            print("4. Right-click 'Stereo Mix' → 'Enable'")
            print("5. Set it as default recording device")
            print("\nAlternatively, select a device manually:")
            
            all_devices = other_devices
            for i, (dev_id, name, channels) in enumerate(all_devices[:5]):
                print(f"  {i+1}: {name}")
            
            try:
                choice = input(f"\nSelect device (1-{min(5, len(all_devices))}) or Enter to exit: ").strip()
                if choice and choice.isdigit():
                    idx = int(choice) - 1
                    if 0 <= idx < len(all_devices):
                        device_id, device_name, channels = all_devices[idx]
                        print(f"Selected: {device_name}")
                    else:
                        print("Invalid choice")
                        return
                else:
                    return
            except KeyboardInterrupt:
                return
        
        if device_id is None:
            print("No device selected")
            return
            
        # Test the device first
        print(f"\n🔧 Testing device: {device_name}")
        
        try:
            # Determine channels (prefer stereo, fall back to mono)
            device_info = self.audio.get_device_info_by_index(device_id)
            max_channels = int(device_info['maxInputChannels'])
            use_channels = min(2, max_channels) if max_channels > 0 else 1
            
            print(f"📊 Using {use_channels} channel(s)")
            
            stream = self.audio.open(
                format=self.format,
                channels=use_channels,
                rate=self.sample_rate,
                input=True,
                input_device_index=device_id,
                frames_per_buffer=self.chunk_size
            )
            
            print(f"🎵 Streaming started!")
            print(f"🎧 Play music on Windows (any app, speakers or headphones)")
            print(f"📡 Audio will be sent to WSL visualizer")
            print(f"⏹️  Press Ctrl+C to stop")
            print()
            
            silence_count = 0
            
            while True:
                try:
                    # Read audio data
                    data = stream.read(self.chunk_size, exception_on_overflow=False)
                    
                    # Convert to numpy array
                    audio_data = np.frombuffer(data, dtype=np.float32)
                    
                    # Handle stereo to mono conversion
                    if use_channels == 2:
                        audio_data = audio_data.reshape(-1, 2)
                        audio_data = np.mean(audio_data, axis=1)
                    
                    # Ensure correct length
                    if len(audio_data) < self.chunk_size:
                        audio_data = np.pad(audio_data, (0, self.chunk_size - len(audio_data)))
                    elif len(audio_data) > self.chunk_size:
                        audio_data = audio_data[:self.chunk_size]
                    
                    # Check audio level
                    max_level = np.max(np.abs(audio_data))
                    
                    # Apply amplification
                    audio_data = audio_data * 2.0
                    
                    # Send to WSL
                    self.socket.sendto(audio_data.astype(np.float32).tobytes(), 
                                     (self.wsl_ip, self.wsl_port))
                    
                    # Show status
                    if max_level > 0.001:
                        silence_count = 0
                        level_bars = "█" * min(int(max_level * 40), 20)
                        print(f"🎵 {level_bars:<20} Level: {max_level:.4f}", end='\r')
                    else:
                        silence_count += 1
                        if silence_count > 100:  # About 2 seconds of silence
                            print("⏸️  No audio detected - play music to see activity", end='\r')
                    
                except Exception as e:
                    print(f"\nStream error: {e}")
                    continue
                    
        except Exception as e:
            print(f"❌ Error opening audio device: {e}")
            print(f"\nPossible solutions:")
            print(f"- Make sure the device is not being used by another application")
            print(f"- Try a different device from the list")
            print(f"- Check Windows audio settings")
            
        finally:
            if 'stream' in locals():
                stream.stop_stream()
                stream.close()
            self.audio.terminate()
            self.socket.close()
            print(f"\n👋 Streaming stopped")

if __name__ == "__main__":
    streamer = SimpleSystemStreamer()
    streamer.start_streaming()