# C-Studio - Windows Defender Setup (PowerShell)
# Run this script in PowerShell as Administrator

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   C-Studio - Windows Defender Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "[ERROR] Please run PowerShell as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Adding Windows Defender exclusions..." -ForegroundColor Yellow
Write-Host ""

# Add exclusions for all possible install locations
$paths = @(
    "$env:LOCALAPPDATA\c-studio",
    "$env:APPDATA\c-studio",
    "$env:ProgramFiles\c-studio",
    "$env:USERPROFILE\AppData\Local\Programs\c-studio",
    (Split-Path -Parent $MyInvocation.MyCommand.Path)
)

foreach ($path in $paths) {
    try {
        Add-MpPreference -ExclusionPath $path -ErrorAction SilentlyContinue
        Write-Host "  + Added: $path" -ForegroundColor Green
    } catch {
        Write-Host "  - Skipped: $path" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "[SUCCESS] Windows Defender exclusions added!" -ForegroundColor Green
Write-Host ""
Write-Host "C-Studio compiler (MinGW64) is now trusted by Windows." -ForegroundColor Cyan
Write-Host "You can now run C-Studio without any issues." -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to close"
