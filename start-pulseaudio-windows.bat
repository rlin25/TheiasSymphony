@echo off
echo Starting PulseAudio for WSL Audio Bridge...

REM Change to PulseAudio directory (adjust path as needed)
cd /d "C:\pulseaudio"

REM Kill any existing PulseAudio processes
taskkill /f /im pulseaudio.exe 2>nul

REM Start PulseAudio with our configuration
echo Starting PulseAudio server...
bin\pulseaudio.exe --use-pid-file=false --exit-idle-time=-1 --system=false --disallow-exit --disallow-module-loading=false

echo PulseAudio started. You can now connect from WSL.
echo Press Ctrl+C to stop PulseAudio.
pause