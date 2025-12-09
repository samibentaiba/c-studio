; C-Studio Installer Script
; Built with Inno Setup 6.x
; Creates a professional Windows installer with wizard UI

#define MyAppName "C-Studio"
#define MyAppVersion "1.4.0"
#define MyAppPublisher "Sami Bentaiba"
#define MyAppURL "https://github.com/samibentaiba/c-studio"
#define MyAppExeName "c-studio.exe"

; Download URLs
#define AppZipURL "https://github.com/samibentaiba/c-studio/releases/download/v1.4.0/c-studio-win32-x64-1.4.0.zip"
#define MinGWZipURL "https://github.com/brechtsanders/winlibs_mingw/releases/download/13.2.0posix-18.1.5-11.0.1-ucrt-r8/winlibs-x86_64-posix-seh-gcc-13.2.0-llvm-18.1.5-mingw-w64ucrt-11.0.1-r8.zip"

[Setup]
; Basic Info
AppId={{C-STUDIO-IDE}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}/releases
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
LicenseFile=..\LICENSE
OutputDir=..\out\installer
OutputBaseFilename=C-Studio-Setup-{#MyAppVersion}
SetupIconFile=..\public\icon.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

; Appearance - using default Inno Setup images

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "french"; MessagesFile: "compiler:Languages\French.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "windowsdefender"; Description: "Add Windows Defender exclusions (recommended for compiler)"; GroupDescription: "Security:"

[Files]
; The app files will be downloaded during install
; This section is for bundled files only
Source: "..\LICENSE"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\Uninstall {#MyAppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
; Run Windows Defender setup if selected
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -Command ""Add-MpPreference -ExclusionPath '{app}'"""; Flags: runhidden; Tasks: windowsdefender
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -Command ""Add-MpPreference -ExclusionPath '{app}\resources\mingw64'"""; Flags: runhidden; Tasks: windowsdefender
; Launch app after install
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
; Remove Windows Defender exclusions on uninstall
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -Command ""Remove-MpPreference -ExclusionPath '{app}'"""; Flags: runhidden

[UninstallDelete]
Type: filesandordirs; Name: "{app}"

[Code]
var
  DownloadPage: TDownloadWizardPage;

// Initialize download page
function OnDownloadProgress(const Url, FileName: String; const Progress, ProgressMax: Int64): Boolean;
begin
  if Progress = ProgressMax then
    Log(Format('Downloaded: %s', [FileName]))
  else if ProgressMax <> 0 then
    Log(Format('Progress: %d of %d bytes', [Progress, ProgressMax]));
  Result := True;
end;

procedure InitializeWizard;
begin
  DownloadPage := CreateDownloadPage(SetupMessage(msgWizardPreparing), SetupMessage(msgPreparingDesc), @OnDownloadProgress);
end;

// Helper function to extract ZIP using PowerShell
function ExtractZip(ZipPath, DestPath: String): Boolean;
var
  ResultCode: Integer;
  Cmd: String;
begin
  // Simple PowerShell extraction command
  Cmd := 'Expand-Archive -Path "' + ZipPath + '" -DestinationPath "' + DestPath + '" -Force';
  Result := Exec('powershell.exe', '-ExecutionPolicy Bypass -Command "' + Cmd + '"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Result := Result and (ResultCode = 0);
end;

// Helper function to copy folder contents
function CopyFolderContents(SrcPath, DestPath: String): Boolean;
var
  ResultCode: Integer;
  Cmd: String;
begin
  Cmd := 'Copy-Item -Path "' + SrcPath + '\*" -Destination "' + DestPath + '" -Recurse -Force';
  Result := Exec('powershell.exe', '-ExecutionPolicy Bypass -Command "' + Cmd + '"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Result := Result and (ResultCode = 0);
end;

function NextButtonClick(CurPageID: Integer): Boolean;
var
  AppZipPath, MinGWZipPath, TempExtract, AppDir: String;
begin
  Result := True;
  
  if CurPageID = wpReady then begin
    DownloadPage.Clear;
    
    // Add downloads
    DownloadPage.Add('{#AppZipURL}', 'c-studio-app.zip', '');
    DownloadPage.Add('{#MinGWZipURL}', 'mingw64.zip', '');
    
    DownloadPage.Show;
    try
      try
        DownloadPage.Download;
        
        AppDir := ExpandConstant('{app}');
        TempExtract := ExpandConstant('{tmp}\extract');
        
        // Extract app ZIP
        AppZipPath := ExpandConstant('{tmp}\c-studio-app.zip');
        if FileExists(AppZipPath) then begin
          DownloadPage.SetText('Extracting C-Studio...', '');
          if not ExtractZip(AppZipPath, TempExtract) then
            Log('Failed to extract app ZIP');
          
          // Copy from extracted folder (ZIP contains a folder)
          if not CopyFolderContents(TempExtract + '\c-studio-win32-x64', AppDir) then
            // Try direct copy if folder structure is different
            CopyFolderContents(TempExtract, AppDir);
        end;
        
        // Extract MinGW ZIP
        MinGWZipPath := ExpandConstant('{tmp}\mingw64.zip');
        if FileExists(MinGWZipPath) then begin
          DownloadPage.SetText('Extracting MinGW compiler...', '');
          ForceDirectories(AppDir + '\resources');
          if not ExtractZip(MinGWZipPath, AppDir + '\resources') then
            Log('Failed to extract MinGW ZIP');
        end;
        
        Result := True;
      except
        if DownloadPage.AbortedByUser then
          Log('Download aborted by user.')
        else
          SuppressibleMsgBox(AddPeriod(GetExceptionMessage), mbCriticalError, MB_OK, IDOK);
        Result := False;
      end;
    finally
      DownloadPage.Hide;
    end;
  end;
end;

// Custom welcome message
function UpdateReadyMemo(Space, NewLine, MemoUserInfoInfo, MemoDirInfo, MemoTypeInfo, MemoComponentsInfo, MemoGroupInfo, MemoTasksInfo: String): String;
begin
  Result := 'C-Studio will be installed to:' + NewLine +
            Space + ExpandConstant('{app}') + NewLine + NewLine +
            'The installer will download:' + NewLine +
            Space + '• C-Studio application (~150 MB)' + NewLine +
            Space + '• MinGW C compiler (~500 MB)' + NewLine + NewLine +
            'Total download size: ~650 MB';
            
  if MemoTasksInfo <> '' then
    Result := Result + NewLine + NewLine + MemoTasksInfo;
end;
