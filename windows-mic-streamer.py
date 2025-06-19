#!/usr/bin/env python3
"""
Windows Microphone Streamer for Theias Symphony
Uses microphone input instead of Stereo Mix
"""

import pyaudio
import socket
import numpy as np
import time

class WindowsMicStreamer:
    def __init__(self, wsl_ip="127.0.0.1", wsl_port=12345):
        self.wsl_ip = wsl_ip
        self.wsl_port = wsl_port
        self.sample_rate = 44100
        self.chunk_size = 1024
        self.format = pyaudio.paFloat32
        self.channels = 1
        
        self.audio = pyaudio.PyAudio()
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        
    def start_streaming(self):
        """Start capturing and streaming audio from microphone"""
        print("Starting Windows microphone capture...")
        
        try:
            # Use device 1 (Microphone Avantree C171) which has 4 inputs
            device_index = 1
            device_info = self.audio.get_device_info_by_index(device_index)
            print(f"Using audio device: {device_info['name']}")
            
            stream = self.audio.open(
                format=self.format,
                channels=self.channels,
                rate=self.sample_rate,
                input=True,
                input_device_index=device_index,
                frames_per_buffer=self.chunk_size
            )
            
            print(f"Streaming microphone to WSL at {self.wsl_ip}:{self.wsl_port}")
            print("Speak into your microphone to see visualization!")
            
            while True:
                # Read audio data
                data = stream.read(self.chunk_size, exception_on_overflow=False)
                
                # Convert to numpy array and amplify
                audio_data = np.frombuffer(data, dtype=np.float32)
                audio_data = audio_data * 3.0  # Amplify microphone signal
                
                # Send to WSL
                self.socket.sendto(audio_data.tobytes(), (self.wsl_ip, self.wsl_port))
                
        except Exception as e:
            print(f"Error: {e}")
            
        finally:
            if 'stream' in locals():
                stream.stop_stream()
                stream.close()
            self.audio.terminate()
            self.socket.close()

if __name__ == "__main__":
    streamer = WindowsMicStreamer("127.0.0.1")
    streamer.start_streaming()