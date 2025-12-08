@echo off
:: C-Studio Installation Script
:: Creates desktop shortcut and Start Menu entry

echo ============================================
echo    C-Studio - Installation Setup
echo ============================================
echo.

:: Get the directory where the script is located (root folder)
set "SCRIPT_DIR=%~dp0"
:: Remove trailing backslash if present
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
set "INSTALL_DIR=%SCRIPT_DIR%"

:: The actual exe is in the runtime subfolder
set "EXE_PATH=%INSTALL_DIR%\runtime\c-studio.exe"

:: Check if c-studio.exe exists
if not exist "%EXE_PATH%" (
    echo [ERROR] c-studio.exe not found!
    echo.
    echo Expected location: %EXE_PATH%
    echo.
    echo Make sure you extracted the full ZIP file and
    echo run this script from the c-studio root folder.
    echo.
    pause
    exit /b 1
)

echo Found C-Studio at: %INSTALL_DIR%
echo.
echo Installing C-Studio...
echo.

:: Create Desktop Shortcut (pointing to the actual runtime exe)
echo Creating Desktop shortcut...
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\C-Studio.lnk'); $Shortcut.TargetPath = '%EXE_PATH%'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%\runtime'; $Shortcut.Description = 'C-Studio IDE - Zero-setup C programming'; $Shortcut.Save()"
if %errorlevel% equ 0 (
    echo   [OK] Desktop shortcut created
) else (
    echo   [FAILED] Could not create desktop shortcut
)

:: Create Start Menu Shortcut
echo Creating Start Menu entry...
set "START_MENU=%APPDATA%\Microsoft\Windows\Start Menu\Programs"
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%START_MENU%\C-Studio.lnk'); $Shortcut.TargetPath = '%EXE_PATH%'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%\runtime'; $Shortcut.Description = 'C-Studio IDE - Zero-setup C programming'; $Shortcut.Save()"
if %errorlevel% equ 0 (
    echo   [OK] Start Menu entry created
) else (
    echo   [FAILED] Could not create Start Menu entry
)

echo.
echo ============================================
echo    Installation Complete!
echo ============================================
echo.
echo C-Studio is now installed:
echo   - Desktop shortcut created
echo   - Start Menu entry created (searchable)
echo.
echo You can now search "C-Studio" in Windows!
echo.
echo ----------------------------------------
echo IMPORTANT: If the compiler gets blocked,
echo run setup-windows-defender.bat as Admin
echo ----------------------------------------
echo.
pause
