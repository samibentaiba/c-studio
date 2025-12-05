@echo off
:: C-Studio Setup Script
:: Run this as Administrator to allow Windows Defender to trust the compiler

echo ============================================
echo    C-Studio - Windows Defender Setup
echo ============================================
echo.

:: Check for admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Please run this script as Administrator!
    echo Right-click the file and select "Run as administrator"
    pause
    exit /b 1
)

echo Adding Windows Defender exclusions...
echo.

:: Add exclusions for common install locations
powershell -Command "Add-MpPreference -ExclusionPath '%LOCALAPPDATA%\c-studio'"
powershell -Command "Add-MpPreference -ExclusionPath '%APPDATA%\c-studio'"
powershell -Command "Add-MpPreference -ExclusionPath '%ProgramFiles%\c-studio'"
powershell -Command "Add-MpPreference -ExclusionPath '%USERPROFILE%\AppData\Local\Programs\c-studio'"

:: Also exclude the current folder if running from extracted ZIP
powershell -Command "Add-MpPreference -ExclusionPath '%~dp0'"

echo.
echo [SUCCESS] Windows Defender exclusions added!
echo.
echo C-Studio compiler (MinGW64) is now trusted.
echo You can now run C-Studio without Windows blocking the compiler.
echo.
pause
