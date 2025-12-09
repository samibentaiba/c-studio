# Extract C-Studio app ZIP
param(
    [string]$ZipPath,
    [string]$DestPath
)

try {
    Write-Host "Extracting app from: $ZipPath"
    Write-Host "Destination: $DestPath"
    
    # Ensure destination exists
    if (-not (Test-Path $DestPath)) {
        New-Item -ItemType Directory -Path $DestPath -Force | Out-Null
    }
    
    # Extract to temp folder first
    $TempExtract = "$env:TEMP\c-studio-extract-$(Get-Random)"
    Write-Host "Temp folder: $TempExtract"
    
    if (Test-Path $TempExtract) { 
        Remove-Item -Recurse -Force $TempExtract -ErrorAction SilentlyContinue
    }
    
    Write-Host "Extracting ZIP..."
    Expand-Archive -Path $ZipPath -DestinationPath $TempExtract -Force
    
    # Find the folder containing c-studio.exe
    $ExeFile = Get-ChildItem -Path $TempExtract -Recurse -Filter "c-studio.exe" | Select-Object -First 1
    
    if ($ExeFile) {
        $SourceFolder = $ExeFile.DirectoryName
        Write-Host "Found c-studio.exe in: $SourceFolder"
        
        # Copy all contents from that folder
        $Items = Get-ChildItem -Path $SourceFolder
        foreach ($Item in $Items) {
            Write-Host "Copying: $($Item.Name)"
            Copy-Item -Path $Item.FullName -Destination $DestPath -Recurse -Force
        }
        Write-Host "Copied $($Items.Count) items"
    } else {
        # Fallback: just copy everything from temp
        Write-Host "c-studio.exe not found, copying all contents..."
        Copy-Item -Path "$TempExtract\*" -Destination $DestPath -Recurse -Force
    }
    
    # Verify c-studio.exe exists in destination
    $FinalExe = Join-Path $DestPath "c-studio.exe"
    if (Test-Path $FinalExe) {
        Write-Host "SUCCESS: c-studio.exe is in $DestPath"
    } else {
        Write-Host "WARNING: c-studio.exe NOT found in $DestPath"
        # List what's in the destination
        Get-ChildItem -Path $DestPath | ForEach-Object { Write-Host "  - $($_.Name)" }
    }
    
    # Cleanup temp folder
    Remove-Item -Recurse -Force $TempExtract -ErrorAction SilentlyContinue
    
    Write-Host "Extraction complete!"
    exit 0
} catch {
    Write-Error "Extraction failed: $_"
    exit 1
}
