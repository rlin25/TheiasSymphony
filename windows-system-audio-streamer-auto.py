#!/usr/bin/env python3
"""
Windows System Audio Streamer for Theias Symphony - Auto IP Detection
Captures system audio and auto-detects WSL IP
"""

import pyaudio
import socket
import numpy as np
import subprocess
import re

class WindowsSystemAudioStreamer:
    def __init__(self, wsl_port=12345):
        self.wsl_ip = self.detect_wsl_ip()
        self.wsl_port = wsl_port
        self.sample_rate = 44100
        self.chunk_size = 1024
        self.format = pyaudio.paFloat32
        self.channels = 2  # Stereo for system audio
        
        self.audio = pyaudio.PyAudio()
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        
        print(f"Auto-detected WSL IP: {self.wsl_ip}")
        
    def detect_wsl_ip(self):
        """Auto-detect WSL IP address"""
        try:
            # Try to get WSL IP from Windows networking
            result = subprocess.run(['wsl', 'hostname', '-I'], 
                                  capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                ip = result.stdout.strip().split()[0]
                if self.validate_ip(ip):
                    return ip
        except:
            pass
            
        try:
            # Alternative: ping common WSL IP ranges
            for base in ['172.28.', '172.29.', '172.30.']:
                for i in range(48, 80):  # Common WSL IP range
                    ip = f"{base}{i}.71"
                    if self.test_connection(ip):
                        return ip
        except:
            pass
            
        # Fallback to localhost
        print("Could not auto-detect WSL IP, using localhost")
        return "127.0.0.1"
        
    def validate_ip(self, ip):
        """Validate IP address format"""
        pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
        return re.match(pattern, ip) is not None
        
    def test_connection(self, ip):
        """Test if we can connect to the IP"""
        try:
            test_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            test_socket.settimeout(0.1)
            test_socket.sendto(b'test', (ip, self.wsl_port))
            test_socket.close()
            return True
        except:
            return False
        
    def find_system_audio_device(self):
        """Try to find system audio/stereo mix device"""
        device_count = self.audio.get_device_count()
        
        # Look for Stereo Mix first
        for i in range(device_count):
            info = self.audio.get_device_info_by_index(i)
            if info['maxInputChannels'] > 0:
                device_name = info['name'].lower()
                if 'stereo mix' in device_name:
                    print(f"Found Stereo Mix: {info['name']} (Device {i})")
                    return i
        
        return None
        
    def start_streaming(self):
        """Start capturing and streaming system audio"""
        print("Starting Windows system audio capture...")
        
        device_index = self.find_system_audio_device()
        
        if device_index is None:
            print("ERROR: Stereo Mix not found!")
            print("Please enable Stereo Mix in Windows Sound settings")
            return
        
        try:
            device_info = self.audio.get_device_info_by_index(device_index)
            print(f"Using: {device_info['name']}")
            
            stream = self.audio.open(
                format=self.format,
                channels=2,  # Force stereo
                rate=self.sample_rate,
                input=True,
                input_device_index=device_index,
                frames_per_buffer=self.chunk_size
            )
            
            print(f"Streaming to WSL at {self.wsl_ip}:{self.wsl_port}")
            print("Play music to see visualization!")
            print("Press Ctrl+C to stop...")
            
            while True:
                try:
                    # Read audio data
                    data = stream.read(self.chunk_size, exception_on_overflow=False)
                    
                    # Convert to numpy array
                    audio_data = np.frombuffer(data, dtype=np.float32)
                    
                    # Convert stereo to mono (average channels)
                    audio_data = audio_data.reshape(-1, 2)
                    audio_data = np.mean(audio_data, axis=1)
                    
                    # Check if we have actual audio (not silence)
                    max_amplitude = np.max(np.abs(audio_data))
                    if max_amplitude > 0.001:  # Only send if there's actual audio
                        # Amplify system audio 
                        audio_data = audio_data * 2.0
                        
                        # Send to WSL
                        self.socket.sendto(audio_data.astype(np.float32).tobytes(), 
                                         (self.wsl_ip, self.wsl_port))
                        
                        # Show activity indicator
                        print(f"♪ Streaming... (level: {max_amplitude:.4f})", end='\r')
                    
                except Exception as e:
                    print(f"Stream error: {e}")
                    continue
                    
        except Exception as e:
            print(f"Error: {e}")
            
        finally:
            if 'stream' in locals():
                stream.stop_stream()
                stream.close()
            self.audio.terminate()
            self.socket.close()

if __name__ == "__main__":
    print("Windows System Audio Streamer for Theias Symphony")
    print("=" * 50)
    
    streamer = WindowsSystemAudioStreamer()
    streamer.start_streaming()