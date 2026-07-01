@echo off
title AV Device Monitor
cd /d "%~dp0"

:: Check if build exists
if not exist "dist\main\main\index.js" (
    echo Building application...
    call npm run build
)

:: Launch Electron app
start "" "node_modules\electron\dist\electron.exe" .
