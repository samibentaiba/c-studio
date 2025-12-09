# Extract MinGW ZIP
param(
    [string]$ZipPath,
    [string]$DestPath
)

try {
    Write-Host "Extracting MinGW from: $ZipPath"
    Write-Host "Destination: $DestPath"
    
    # Ensure destination exists
    if (-not (Test-Path $DestPath)) {
        New-Item -ItemType Directory -Path $DestPath -Force | Out-Null
    }
    
    # Extract directly to destination
    Expand-Archive -Path $ZipPath -DestinationPath $DestPath -Force
    
    Write-Host "MinGW extraction complete!"
    exit 0
} catch {
    Write-Error "MinGW extraction failed: $_"
    exit 1
}
