# Post-Package Script for C-Studio
# This script reorganizes the Electron output into a cleaner structure

$OutputDir = "out"
$SourceFolder = "$OutputDir\c-studio-win32-x64"
$TargetFolder = "$OutputDir\c-studio"

Write-Host "Reorganizing build output for cleaner distribution..." -ForegroundColor Cyan

# Check if source folder exists
if (-Not (Test-Path $SourceFolder)) {
    Write-Host "Error: Source folder '$SourceFolder' not found. Run 'npm run package' first." -ForegroundColor Red
    exit 1
}

# Remove existing target folder if it exists
if (Test-Path $TargetFolder) {
    Write-Host "Removing existing target folder..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $TargetFolder
}

# Create the new structure
Write-Host "Creating clean folder structure..." -ForegroundColor Green

# Create target folder and runtime subfolder
New-Item -ItemType Directory -Path "$TargetFolder\runtime" -Force | Out-Null

# Move all files from source to runtime folder
Write-Host "Moving Electron runtime files to runtime/ subfolder..." -ForegroundColor Green
Get-ChildItem -Path $SourceFolder | ForEach-Object {
    Move-Item -Path $_.FullName -Destination "$TargetFolder\runtime\" -Force
}

# Copy helper scripts from project root to distribution root
$ScriptsToMove = @("install.bat", "uninstall.bat", "setup-windows-defender.bat")

Write-Host "Copying helper scripts to root..." -ForegroundColor Green
foreach ($script in $ScriptsToMove) {
    $scriptPath = ".\$script"
    if (Test-Path $scriptPath) {
        Copy-Item -Path $scriptPath -Destination $TargetFolder -Force
        Write-Host "   OK: $script" -ForegroundColor DarkGreen
    }
    else {
        Write-Host "   WARN: $script not found in project root" -ForegroundColor Yellow
    }
}

# Create launcher batch file at root
Write-Host "Creating launcher..." -ForegroundColor Green

$LauncherLines = @(
    "@echo off",
    "REM C-Studio Launcher",
    "REM This script launches the C-Studio IDE",
    "",
    "cd /d `"%~dp0runtime`"",
    "start `"`" `"c-studio.exe`" %*"
)
$LauncherContent = $LauncherLines -join "`r`n"
Set-Content -Path "$TargetFolder\c-studio.bat" -Value $LauncherContent -Encoding ASCII

# Also create a VBS wrapper for silent launch (no cmd window)
$VBSLines = @(
    'Set WshShell = CreateObject("WScript.Shell")',
    'WshShell.CurrentDirectory = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & "\runtime"',
    'WshShell.Run "c-studio.exe", 1, False'
)
$VBSContent = $VBSLines -join "`r`n"
Set-Content -Path "$TargetFolder\c-studio.vbs" -Value $VBSContent -Encoding ASCII

# Remove the original source folder (now empty)
if (Test-Path $SourceFolder) {
    Remove-Item -Recurse -Force $SourceFolder
}

Write-Host ""
Write-Host "Build reorganization complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Clean distribution created at: $TargetFolder" -ForegroundColor Cyan
Write-Host ""
Write-Host "Structure:" -ForegroundColor White
Write-Host "  c-studio/" -ForegroundColor Yellow
Write-Host "  +-- c-studio.bat            (launcher - with console)" -ForegroundColor Gray
Write-Host "  +-- c-studio.vbs            (launcher - silent)" -ForegroundColor Gray
Write-Host "  +-- install.bat" -ForegroundColor Gray
Write-Host "  +-- uninstall.bat" -ForegroundColor Gray
Write-Host "  +-- setup-windows-defender.bat" -ForegroundColor Gray
Write-Host "  +-- runtime/                (Electron files)" -ForegroundColor Gray
Write-Host ""
