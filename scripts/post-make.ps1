# Post-Make Script for C-Studio
# This script reorganizes the make output zip into a cleaner structure

$Version = (Get-Content "package.json" | ConvertFrom-Json).version
$ZipDir = "out\make\zip\win32\x64"
$OriginalZip = "$ZipDir\c-studio-win32-x64-$Version.zip"
$TempDir = "$ZipDir\temp-extract"
$CleanDir = "$ZipDir\c-studio"

Write-Host "Reorganizing make output for cleaner distribution..." -ForegroundColor Cyan
Write-Host "Version: $Version" -ForegroundColor Gray

# Check if original zip exists
if (-Not (Test-Path $OriginalZip)) {
    Write-Host "Error: Zip file '$OriginalZip' not found. Run 'npm run make' first." -ForegroundColor Red
    exit 1
}

# Clean up any existing temp/clean directories
if (Test-Path $TempDir) { Remove-Item -Recurse -Force $TempDir }
if (Test-Path $CleanDir) { Remove-Item -Recurse -Force $CleanDir }

# Extract the original zip
Write-Host "Extracting original zip..." -ForegroundColor Green
Expand-Archive -Path $OriginalZip -DestinationPath $TempDir -Force

# The extracted content is in a subfolder (e.g., c-studio-win32-x64)
$ExtractedFolder = Get-ChildItem -Path $TempDir -Directory | Select-Object -First 1

if (-Not $ExtractedFolder) {
    Write-Host "Error: Could not find extracted folder in $TempDir" -ForegroundColor Red
    exit 1
}

Write-Host "Found extracted folder: $($ExtractedFolder.Name)" -ForegroundColor Gray

# Create clean structure
Write-Host "Creating clean folder structure..." -ForegroundColor Green
New-Item -ItemType Directory -Path $CleanDir -Force | Out-Null

# Create runtime folder and move ALL contents from extracted folder (preserving structure)
Write-Host "Moving Electron runtime files to runtime/ subfolder..." -ForegroundColor Green
# Use robocopy to preserve folder structure
$source = $ExtractedFolder.FullName
$dest = "$CleanDir\runtime"
robocopy $source $dest /E /MOVE /NFL /NDL /NJH /NJS /NC /NS | Out-Null

# Copy helper scripts from project root
$ScriptsToMove = @("install.bat", "uninstall.bat", "setup-windows-defender.bat")

Write-Host "Copying helper scripts to root..." -ForegroundColor Green
foreach ($script in $ScriptsToMove) {
    $scriptPath = ".\$script"
    if (Test-Path $scriptPath) {
        Copy-Item -Path $scriptPath -Destination $CleanDir -Force
        Write-Host "   OK: $script" -ForegroundColor DarkGreen
    }
    else {
        Write-Host "   WARN: $script not found" -ForegroundColor Yellow
    }
}

# Create launcher batch file
Write-Host "Creating launchers..." -ForegroundColor Green

$LauncherLines = @(
    "@echo off",
    "REM C-Studio Launcher",
    "cd /d `"%~dp0runtime`"",
    "start `"`" `"c-studio.exe`" %*"
)
$LauncherContent = $LauncherLines -join "`r`n"
Set-Content -Path "$CleanDir\c-studio.bat" -Value $LauncherContent -Encoding ASCII

# Create VBS silent launcher
$VBSLines = @(
    'Set WshShell = CreateObject("WScript.Shell")',
    'WshShell.CurrentDirectory = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & "\runtime"',
    'WshShell.Run "c-studio.exe", 1, False'
)
$VBSContent = $VBSLines -join "`r`n"
Set-Content -Path "$CleanDir\c-studio.vbs" -Value $VBSContent -Encoding ASCII

# Remove original zip and temp folder
Write-Host "Cleaning up and creating new zip..." -ForegroundColor Green
Remove-Item -Force $OriginalZip
Remove-Item -Recurse -Force $TempDir -ErrorAction SilentlyContinue

# Create new zip with clean structure
# Use -CompressionLevel Optimal for better compression
Compress-Archive -Path "$CleanDir\*" -DestinationPath $OriginalZip -Force -CompressionLevel Optimal

# Cleanup temporary clean folder
Remove-Item -Recurse -Force $CleanDir

Write-Host ""
Write-Host "Make reorganization complete!" -ForegroundColor Green
Write-Host "Clean zip created at: $OriginalZip" -ForegroundColor Cyan
Write-Host ""
Write-Host "Zip contents:" -ForegroundColor White
Write-Host "  c-studio.bat" -ForegroundColor Gray
Write-Host "  c-studio.vbs" -ForegroundColor Gray
Write-Host "  install.bat" -ForegroundColor Gray
Write-Host "  uninstall.bat" -ForegroundColor Gray
Write-Host "  setup-windows-defender.bat" -ForegroundColor Gray
Write-Host "  runtime/" -ForegroundColor Gray
Write-Host "    +-- c-studio.exe" -ForegroundColor Gray
Write-Host "    +-- resources/" -ForegroundColor Gray
Write-Host "    +-- locales/" -ForegroundColor Gray
Write-Host "    +-- *.dll" -ForegroundColor Gray
Write-Host ""
