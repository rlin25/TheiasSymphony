#!/usr/bin/env python3
"""
Windows System Audio Streamer for Theias Symphony
Captures system audio (what's playing on speakers/headphones)
"""

import pyaudio
import socket
import numpy as np
import time

class WindowsSystemAudioStreamer:
    def __init__(self, wsl_ip="127.0.0.1", wsl_port=12345):
        self.wsl_ip = wsl_ip
        self.wsl_port = wsl_port
        self.sample_rate = 44100
        self.chunk_size = 1024
        self.format = pyaudio.paFloat32
        self.channels = 2  # Stereo for system audio
        
        self.audio = pyaudio.PyAudio()
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        
    def list_audio_devices(self):
        """List all available audio devices to find system audio"""
        print("\nAvailable audio devices:")
        device_count = self.audio.get_device_count()
        
        for i in range(device_count):
            info = self.audio.get_device_info_by_index(i)
            if info['maxInputChannels'] > 0:
                print(f"Device {i}: {info['name']} (inputs: {info['maxInputChannels']})")
                
    def find_system_audio_device(self):
        """Try to find system audio/stereo mix device"""
        device_count = self.audio.get_device_count()
        
        # Look for common system audio device names
        system_audio_names = [
            'stereo mix', 'what u hear', 'wave out mix', 'speakers', 
            'headphones', 'realtek', 'system audio', 'loopback'
        ]
        
        for i in range(device_count):
            info = self.audio.get_device_info_by_index(i)
            device_name = info['name'].lower()
            
            # Check if it's a system audio device and has input capability
            if info['maxInputChannels'] > 0:
                for name in system_audio_names:
                    if name in device_name:
                        print(f"Found potential system audio device: {info['name']} (Device {i})")
                        return i
        
        return None
        
    def start_streaming(self, device_index=None):
        """Start capturing and streaming system audio"""
        print("Starting Windows system audio capture...")
        
        # List devices first
        self.list_audio_devices()
        
        if device_index is None:
            device_index = self.find_system_audio_device()
            
        if device_index is None:
            print("\nNo system audio device found automatically.")
            print("Please enable 'Stereo Mix' in Windows Sound settings:")
            print("1. Right-click speaker icon in system tray")
            print("2. Select 'Sounds' -> 'Recording' tab")
            print("3. Right-click empty area -> 'Show Disabled Devices'")
            print("4. Right-click 'Stereo Mix' -> 'Enable'")
            print("5. Set it as default recording device")
            print("\nOr manually specify device index:")
            try:
                device_index = int(input("Enter device index: "))
            except (ValueError, KeyboardInterrupt):
                print("Exiting...")
                return
        
        try:
            device_info = self.audio.get_device_info_by_index(device_index)
            print(f"\nUsing audio device: {device_info['name']}")
            
            # Determine channels (prefer stereo, fall back to mono)
            max_channels = int(device_info['maxInputChannels'])
            channels = min(self.channels, max_channels) if max_channels > 0 else 1
            
            print(f"Using {channels} channel(s)")
            
            stream = self.audio.open(
                format=self.format,
                channels=channels,
                rate=self.sample_rate,
                input=True,
                input_device_index=device_index,
                frames_per_buffer=self.chunk_size
            )
            
            print(f"Streaming system audio to WSL at {self.wsl_ip}:{self.wsl_port}")
            print("Play some music to see visualization!")
            print("Press Ctrl+C to stop...")
            
            while True:
                try:
                    # Read audio data
                    data = stream.read(self.chunk_size, exception_on_overflow=False)
                    
                    # Convert to numpy array
                    audio_data = np.frombuffer(data, dtype=np.float32)
                    
                    # If stereo, convert to mono by averaging channels
                    if channels == 2:
                        audio_data = audio_data.reshape(-1, 2)
                        audio_data = np.mean(audio_data, axis=1)
                    
                    # Amplify system audio (usually needs less amplification than mic)
                    audio_data = audio_data * 2.0
                    
                    # Ensure we have the right amount of data
                    if len(audio_data) < self.chunk_size:
                        # Pad with zeros if needed
                        audio_data = np.pad(audio_data, (0, self.chunk_size - len(audio_data)))
                    elif len(audio_data) > self.chunk_size:
                        # Trim if too long
                        audio_data = audio_data[:self.chunk_size]
                    
                    # Send to WSL
                    self.socket.sendto(audio_data.astype(np.float32).tobytes(), (self.wsl_ip, self.wsl_port))
                    
                except Exception as e:
                    print(f"Stream error: {e}")
                    continue
                    
        except Exception as e:
            print(f"Error: {e}")
            print("\nTroubleshooting:")
            print("- Make sure 'Stereo Mix' is enabled in Windows Sound settings")
            print("- Try a different device index from the list above")
            print("- Check if the device supports input")
            
        finally:
            if 'stream' in locals():
                stream.stop_stream()
                stream.close()
            self.audio.terminate()
            self.socket.close()

if __name__ == "__main__":
    print("Windows System Audio Streamer for Theias Symphony")
    print("=" * 50)
    
    # You can specify a device index directly if you know it
    # streamer = WindowsSystemAudioStreamer("127.0.0.1")
    # streamer.start_streaming(device_index=2)  # Replace 2 with your device index
    
    streamer = WindowsSystemAudioStreamer("127.0.0.1")
    streamer.start_streaming()