; C-Studio Installer Script
; Built with Inno Setup 6.x

#define MyAppName "C-Studio"
#define MyAppVersion "1.4.2"
#define MyAppPublisher "Sami Bentaiba"
#define MyAppURL "https://github.com/samibentaiba/c-studio"
#define MyAppExeName "c-studio.exe"

; Download URLs
#define AppZipURL "https://github.com/samibentaiba/c-studio/releases/download/v1.4.2/c-studio-win32-x64-1.4.2.zip"
#define MinGWZipURL "https://github.com/brechtsanders/winlibs_mingw/releases/download/13.2.0posix-18.1.5-11.0.1-ucrt-r8/winlibs-x86_64-posix-seh-gcc-13.2.0-llvm-18.1.5-mingw-w64ucrt-11.0.1-r8.zip"

[Setup]
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
; Allow reinstall even if folder exists
UsePreviousAppDir=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "french"; MessagesFile: "compiler:Languages\French.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "windowsdefender"; Description: "Add Windows Defender exclusions"; GroupDescription: "Security:"

[Files]
Source: "..\LICENSE"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\installer\extract-app.ps1"; DestDir: "{tmp}"; Flags: deleteafterinstall
Source: "..\installer\extract-mingw.ps1"; DestDir: "{tmp}"; Flags: deleteafterinstall

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\{#MyAppExeName}"; IconIndex: 0
Name: "{group}\Uninstall {#MyAppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\{#MyAppExeName}"; IconIndex: 0; Tasks: desktopicon

[Run]
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{tmp}\extract-app.ps1"" -ZipPath ""{tmp}\c-studio-app.zip"" -DestPath ""{app}"""; StatusMsg: "Extracting C-Studio..."; Flags: runhidden waituntilterminated
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{tmp}\extract-mingw.ps1"" -ZipPath ""{tmp}\mingw64.zip"" -DestPath ""{app}\resources"""; StatusMsg: "Extracting MinGW compiler..."; Flags: runhidden waituntilterminated
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -Command ""Add-MpPreference -ExclusionPath '{app}'"""; Flags: runhidden; Tasks: windowsdefender
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -Command ""Remove-MpPreference -ExclusionPath '{app}'"""; Flags: runhidden; RunOnceId: "RemoveDefenderExclusion"
; Force remove the entire folder if files remain
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -Command ""Remove-Item -Recurse -Force '{app}' -ErrorAction SilentlyContinue"""; Flags: runhidden; RunOnceId: "RemoveAppFolder"

[UninstallDelete]
Type: filesandordirs; Name: "{app}"
Type: filesandordirs; Name: "{app}\*"
Type: dirifempty; Name: "{app}"

[Code]
var
  DownloadPage: TDownloadWizardPage;

function OnDownloadProgress(const Url, FileName: String; const Progress, ProgressMax: Int64): Boolean;
begin
  Result := True;
end;

procedure InitializeWizard;
begin
  DownloadPage := CreateDownloadPage(SetupMessage(msgWizardPreparing), SetupMessage(msgPreparingDesc), @OnDownloadProgress);
end;

// Clean up any existing installation BEFORE Inno Setup tries to create directories
function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  AppDir: String;
  ResultCode: Integer;
begin
  Result := '';  // Empty string means continue with install
  AppDir := ExpandConstant('{app}');
  
  // If the app directory exists, remove it to prevent Error 183
  if DirExists(AppDir) then begin
    Log('Removing existing directory: ' + AppDir);
    // Use PowerShell to force remove the directory
    if not Exec('powershell.exe', '-ExecutionPolicy Bypass -Command "Remove-Item -Recurse -Force ''' + AppDir + '''"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) then begin
      // If PowerShell fails, try cmd
      Exec('cmd.exe', '/c rmdir /s /q "' + AppDir + '"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    end;
  end;
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;
  
  if CurPageID = wpReady then begin
    DownloadPage.Clear;
    DownloadPage.Add('{#AppZipURL}', 'c-studio-app.zip', '');
    DownloadPage.Add('{#MinGWZipURL}', 'mingw64.zip', '');
    
    DownloadPage.Show;
    try
      try
        DownloadPage.Download;
        Result := True;
      except
        if DownloadPage.AbortedByUser then
          Log('Download aborted.')
        else
          SuppressibleMsgBox(AddPeriod(GetExceptionMessage), mbCriticalError, MB_OK, IDOK);
        Result := False;
      end;
    finally
      DownloadPage.Hide;
    end;
  end;
end;

function UpdateReadyMemo(Space, NewLine, MemoUserInfoInfo, MemoDirInfo, MemoTypeInfo, MemoComponentsInfo, MemoGroupInfo, MemoTasksInfo: String): String;
begin
  Result := 'C-Studio will be installed to:' + NewLine +
            Space + ExpandConstant('{app}') + NewLine + NewLine +
            'The installer will download:' + NewLine +
            Space + '• C-Studio application (~150 MB)' + NewLine +
            Space + '• MinGW C compiler (~350 MB)' + NewLine + NewLine +
            'Total download: ~500 MB';
end;
