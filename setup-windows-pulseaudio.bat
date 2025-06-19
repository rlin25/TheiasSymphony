@echo off
echo Setting up PulseAudio for Windows...

REM Create necessary directories
mkdir "C:\Program Files (x86)\PulseAudio\etc\pulse" 2>nul
mkdir "C:\Program Files (x86)\PulseAudio\etc\pulse\daemon.conf.d" 2>nul

REM Copy our configuration
copy "%~dp0windows-pulseaudio-config.pa" "C:\Program Files (x86)\PulseAudio\etc\pulse\default.pa"

REM Create daemon configuration
echo ; PulseAudio daemon configuration > "C:\Program Files (x86)\PulseAudio\etc\pulse\daemon.conf"
echo exit-idle-time = -1 >> "C:\Program Files (x86)\PulseAudio\etc\pulse\daemon.conf"
echo system-instance = false >> "C:\Program Files (x86)\PulseAudio\etc\pulse\daemon.conf"

echo Configuration files created.
echo.
echo Now starting PulseAudio server...

cd /d "C:\Program Files (x86)\PulseAudio\bin"

REM Kill any existing processes
taskkill /f /im pulseaudio.exe 2>nul

REM Start PulseAudio with proper configuration
pulseaudio.exe --use-pid-file=false --exit-idle-time=-1 --system=false --disallow-exit --disallow-module-loading=false

pause