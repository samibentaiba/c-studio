# C-Studio MinGW Downloader
# Downloads and extracts MinGW compiler to the correct location

param(
    [string]$TargetPath = "$PSScriptRoot\mingw64"
)

# Using SourceForge as GitHub releases have redirect issues
$MinGWUrl = "https://sourceforge.net/projects/winlibs-mingw/files/UCRT%20based/GCC%2014.2.0%20%2B%20LLVM%2019.1.7%20%2B%20MinGW-w64%2012.0.0%20%28release%203%29/winlibs-x86_64-posix-seh-gcc-14.2.0-llvm-19.1.7-mingw-w64ucrt-12.0.0-r3.zip/download"
$TempZip = "$env:TEMP\mingw64-download.zip"
$TempExtract = "$env:TEMP\mingw64-extract"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   C-Studio - MinGW Compiler Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if MinGW already exists
if (Test-Path "$TargetPath\bin\gcc.exe") {
    Write-Host "[OK] MinGW compiler already installed!" -ForegroundColor Green
    Write-Host "     Location: $TargetPath" -ForegroundColor Gray
    exit 0
}

Write-Host "MinGW compiler not found. Downloading..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Download URL: github.com/brechtsanders/winlibs_mingw" -ForegroundColor Gray
Write-Host ""
Write-Host "This will download ~150MB. Please wait..." -ForegroundColor Gray
Write-Host ""

# Remove old temp file if exists
if (Test-Path $TempZip) { Remove-Item -Force $TempZip }

# Download using Invoke-WebRequest (simple and reliable)
try {
    Write-Host "Downloading MinGW..." -ForegroundColor Green
    
    $ProgressPreference = 'SilentlyContinue'  # Faster download without progress bar overhead
    Invoke-WebRequest -Uri $MinGWUrl -OutFile $TempZip -UseBasicParsing
    
    Write-Host "[OK] Download complete!" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Failed to download MinGW!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check your internet connection and try again." -ForegroundColor Yellow
    exit 1
}

# Verify download
if (-not (Test-Path $TempZip)) {
    Write-Host "[ERROR] Downloaded file not found!" -ForegroundColor Red
    exit 1
}

$fileSize = (Get-Item $TempZip).Length
Write-Host "Downloaded: $([math]::Round($fileSize / 1MB, 1)) MB" -ForegroundColor Gray

if ($fileSize -lt 100000000) {
    # Less than 100MB is probably an error
    Write-Host "[ERROR] Download appears incomplete!" -ForegroundColor Red
    exit 1
}

# Extract
Write-Host ""
Write-Host "Extracting MinGW compiler (~500MB uncompressed)..." -ForegroundColor Green
Write-Host "This may take a few minutes, please wait..." -ForegroundColor Gray

try {
    # Clean up any existing temp extraction
    if (Test-Path $TempExtract) {
        Remove-Item -Recurse -Force $TempExtract
    }
    
    # Extract ZIP
    Expand-Archive -Path $TempZip -DestinationPath $TempExtract -Force
    
    # Find the mingw64 folder in the extracted content
    $ExtractedMingw = Get-ChildItem -Path $TempExtract -Directory -Recurse | Where-Object { $_.Name -eq "mingw64" } | Select-Object -First 1
    
    if (-not $ExtractedMingw) {
        # Maybe it's directly in the root
        $ExtractedMingw = Get-ChildItem -Path $TempExtract -Directory | Select-Object -First 1
    }
    
    if (-not $ExtractedMingw) {
        throw "Could not find mingw64 folder in extracted archive"
    }
    
    Write-Host "Found: $($ExtractedMingw.Name)" -ForegroundColor Gray
    
    # Move to target location
    if (Test-Path $TargetPath) {
        Remove-Item -Recurse -Force $TargetPath
    }
    
    Move-Item -Path $ExtractedMingw.FullName -Destination $TargetPath -Force
    
    Write-Host "[OK] Extraction complete!" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Failed to extract MinGW!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    # Clean up temp files
    if (Test-Path $TempZip) { Remove-Item -Force $TempZip -ErrorAction SilentlyContinue }
    if (Test-Path $TempExtract) { Remove-Item -Recurse -Force $TempExtract -ErrorAction SilentlyContinue }
}

# Verify installation
Write-Host ""
Write-Host "Verifying installation..." -ForegroundColor Green

if (Test-Path "$TargetPath\bin\gcc.exe") {
    $GccVersion = & "$TargetPath\bin\gcc.exe" --version 2>&1 | Select-Object -First 1
    Write-Host "[OK] GCC installed successfully!" -ForegroundColor Green
    Write-Host "     Version: $GccVersion" -ForegroundColor Gray
    Write-Host "     Location: $TargetPath" -ForegroundColor Gray
}
else {
    Write-Host "[ERROR] GCC not found after extraction!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   MinGW Setup Complete!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

exit 0
