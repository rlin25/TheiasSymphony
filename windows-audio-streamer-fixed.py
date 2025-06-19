#!/usr/bin/env python3
"""
Windows Audio Streamer for Theias Symphony - Fixed Version
Captures Windows system audio and streams to WSL
"""

import pyaudio
import socket
import struct
import numpy as np
import time

class WindowsAudioStreamer:
    def __init__(self, wsl_ip="127.0.0.1", wsl_port=12345):
        self.wsl_ip = wsl_ip
        self.wsl_port = wsl_port
        self.sample_rate = 44100
        self.chunk_size = 1024
        self.format = pyaudio.paFloat32
        self.channels = 1  # Changed to mono to avoid issues
        
        self.audio = pyaudio.PyAudio()
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        
    def find_system_audio_device(self):
        """Find Windows system audio output (for loopback capture)"""
        print("Available audio devices:")
        stereo_mix_index = None
        
        for i in range(self.audio.get_device_count()):
            info = self.audio.get_device_info_by_index(i)
            print(f"  {i}: {info['name']} - Inputs: {info['maxInputChannels']}")
            
            # Look for "Stereo Mix" or similar loopback device
            if "stereo mix" in info['name'].lower() and info['maxInputChannels'] > 0:
                stereo_mix_index = i
        
        if stereo_mix_index is not None:
            return stereo_mix_index
        
        # Fallback to default input
        try:
            return self.audio.get_default_input_device_info()['index']
        except:
            # Last resort - use device 0
            return 0
    
    def start_streaming(self):
        """Start capturing and streaming audio"""
        print("Starting Windows audio capture...")
        
        try:
            device_index = self.find_system_audio_device()
            device_info = self.audio.get_device_info_by_index(device_index)
            print(f"Using audio device: {device_info['name']}")
            
            # Try different sample rates if default fails
            sample_rates = [44100, 48000, 22050, 16000]
            stream = None
            
            for rate in sample_rates:
                try:
                    print(f"Trying sample rate: {rate}")
                    stream = self.audio.open(
                        format=self.format,
                        channels=self.channels,
                        rate=rate,
                        input=True,
                        input_device_index=device_index,
                        frames_per_buffer=self.chunk_size
                    )
                    self.sample_rate = rate
                    print(f"Success! Using sample rate: {rate}")
                    break
                except Exception as e:
                    print(f"Sample rate {rate} failed: {e}")
                    if stream:
                        stream.close()
                        stream = None
            
            if not stream:
                raise Exception("Could not open audio stream with any sample rate")
            
            print(f"Streaming to WSL at {self.wsl_ip}:{self.wsl_port}")
            
            while True:
                # Read audio data
                data = stream.read(self.chunk_size, exception_on_overflow=False)
                
                # Convert to numpy array
                audio_data = np.frombuffer(data, dtype=np.float32)
                
                # Send to WSL
                self.socket.sendto(audio_data.tobytes(), (self.wsl_ip, self.wsl_port))
                
        except Exception as e:
            print(f"Error: {e}")
            print("\nTroubleshooting:")
            print("1. Make sure 'Stereo Mix' is enabled in Windows sound settings")
            print("2. Set 'Stereo Mix' as default recording device")
            print("3. Try running as Administrator")
            print("4. Close other audio applications")
            
        finally:
            if 'stream' in locals() and stream:
                stream.stop_stream()
                stream.close()
            self.audio.terminate()
            self.socket.close()

if __name__ == "__main__":
    streamer = WindowsAudioStreamer("127.0.0.1")
    streamer.start_streaming()