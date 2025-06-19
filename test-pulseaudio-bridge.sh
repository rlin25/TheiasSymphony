#!/bin/bash
# Test script for PulseAudio bridge setup

echo "=== Theias Symphony PulseAudio Bridge Test ==="
echo ""

# Check Windows host connectivity
WINDOWS_IP=$(ip route show default | awk '/default/ {print $3}')
echo "1. Testing Windows host connectivity..."
echo "   Windows IP: $WINDOWS_IP"

if ping -c 1 -W 3 $WINDOWS_IP > /dev/null 2>&1; then
    echo "   ✓ Windows host reachable"
else
    echo "   ✗ Cannot reach Windows host"
    exit 1
fi

# Check PulseAudio installation
echo ""
echo "2. Checking PulseAudio installation..."
if command -v pulseaudio &> /dev/null; then
    echo "   ✓ PulseAudio installed"
    echo "   Version: $(pulseaudio --version)"
else
    echo "   ✗ PulseAudio not installed"
    echo "   Run: sudo apt install pulseaudio pulseaudio-utils"
    exit 1
fi

# Check PulseAudio client configuration
echo ""
echo "3. Checking PulseAudio client configuration..."
if [ -f ~/.config/pulse/client.conf ]; then
    echo "   ✓ Client configuration found"
    echo "   Server: $(grep default-server ~/.config/pulse/client.conf)"
else
    echo "   ✗ No client configuration found"
    echo "   Run: ./setup-wsl-pulseaudio.sh"
    exit 1
fi

# Test PulseAudio server connection
echo ""
echo "4. Testing PulseAudio server connection..."
echo "   NOTE: Make sure PulseAudio is running on Windows!"

# Kill any existing PulseAudio processes
pulseaudio -k 2>/dev/null || true
sleep 2

# Start PulseAudio client
pulseaudio --start --verbose

if timeout 5 pactl info > /dev/null 2>&1; then
    echo "   ✓ Successfully connected to PulseAudio server"
    
    echo ""
    echo "5. Available audio sinks:"
    pactl list short sinks | while read line; do
        echo "   - $line"
    done
    
    echo ""
    echo "6. Available audio sources:"
    pactl list short sources | while read line; do
        echo "   - $line"
    done
    
else
    echo "   ✗ Cannot connect to PulseAudio server"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Ensure start-pulseaudio-windows.bat is running on Windows"
    echo "2. Check Windows firewall allows port 4713"
    echo "3. Verify PulseAudio configuration on Windows"
    exit 1
fi

echo ""
echo "=== Bridge Test Complete ==="
echo "✓ PulseAudio bridge is working!"
echo ""
echo "Now you can start Theias Symphony:"
echo "   npm start"