@echo off
:: C-Studio Uninstall Script
:: Removes desktop shortcut, Start Menu entry, and optionally the app folder

echo ============================================
echo    C-Studio - Uninstall
echo ============================================
echo.

:: Get the directory where the script is located (resources folder)
set "SCRIPT_DIR=%~dp0"
:: Go up one level to find c-studio.exe (parent folder)
set "INSTALL_DIR=%SCRIPT_DIR%.."
:: Get absolute path
pushd "%INSTALL_DIR%"
set "INSTALL_DIR=%CD%"
popd

echo Removing C-Studio...
echo.

:: Remove Desktop Shortcut
echo Removing Desktop shortcut...
set "DESKTOP_SHORTCUT=%USERPROFILE%\Desktop\C-Studio.lnk"
if exist "%DESKTOP_SHORTCUT%" (
    del "%DESKTOP_SHORTCUT%"
    echo   [OK] Desktop shortcut removed
) else (
    echo   [SKIP] Desktop shortcut not found
)

:: Remove Start Menu Shortcut
echo Removing Start Menu entry...
set "START_MENU_SHORTCUT=%APPDATA%\Microsoft\Windows\Start Menu\Programs\C-Studio.lnk"
if exist "%START_MENU_SHORTCUT%" (
    del "%START_MENU_SHORTCUT%"
    echo   [OK] Start Menu entry removed
) else (
    echo   [SKIP] Start Menu entry not found
)

echo.
echo ============================================
echo    Shortcuts Removed!
echo ============================================
echo.
echo The C-Studio shortcuts have been removed.
echo.
echo To completely remove C-Studio, delete this folder:
echo   %INSTALL_DIR%
echo.
pause
