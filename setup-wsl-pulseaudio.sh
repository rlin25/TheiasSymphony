#!/bin/bash
# WSL PulseAudio Client Setup for Theias Symphony
# Run this script in WSL to configure PulseAudio client

echo "Setting up WSL PulseAudio client..."

# Install PulseAudio client if not already installed
if ! command -v pulseaudio &> /dev/null; then
    echo "Installing PulseAudio..."
    sudo apt update
    sudo apt install -y pulseaudio pulseaudio-utils
fi

# Get Windows host IP
WINDOWS_IP=$(ip route show default | awk '/default/ {print $3}')
echo "Windows host IP detected: $WINDOWS_IP"

# Create PulseAudio client configuration
mkdir -p ~/.config/pulse
cat > ~/.config/pulse/client.conf << EOF
# Connect to Windows PulseAudio server
default-server = tcp:$WINDOWS_IP:4713
autospawn = no
EOF

echo "PulseAudio client configured to connect to Windows at $WINDOWS_IP:4713"

# Kill any existing PulseAudio processes
pulseaudio -k 2>/dev/null || true

echo "Setup complete!"
echo ""
echo "To test the connection:"
echo "1. Start PulseAudio on Windows using start-pulseaudio-windows.bat"
echo "2. In WSL, run: pulseaudio --start"
echo "3. Test with: pactl info"
echo "4. List sinks with: pactl list short sinks"
echo ""
echo "Then start Theias Symphony with: npm start"